import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  ActivityType,
  ClientSource,
  DealStage,
  PrismaClient,
  Role,
  TaskStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/setup-app';

const PASSWORD = 'E2ePassword123!';
const suffix = `analytics${Date.now()}`;
const adminEmail = `admin-${suffix}@test.dev`;
const managerEmail = `manager-${suffix}@test.dev`;

// A window far in the past so seed data can never leak into it; combined with
// the ownerId filter every aggregate below is exact and deterministic.
const FROM = '2024-01-01T00:00:00.000Z';
const TO = '2024-07-01T00:00:00.000Z';
const RANGE = `from=${FROM}&to=${TO}`;

const prisma = new PrismaClient();

interface TokenBody {
  accessToken: string;
}

interface Metric {
  value: number;
  deltaPct: number | null;
}

interface SummaryBody {
  period: { from: string; to: string };
  revenue: Metric;
  newDeals: Metric;
  conversionRate: Metric;
  avgWonAmount: Metric;
  activeDeals: Metric;
  overdueTasks: Metric;
}

interface MonthPoint {
  month: string;
  revenue: number;
  dealsWon: number;
}

interface FunnelRow {
  stage: DealStage;
  count: number;
  amount: number;
}

interface ManagerRow {
  id: string;
  name: string;
  revenue: number;
  dealsWon: number;
  newDeals: number;
  conversionRate: number | null;
}

interface LostReasonRow {
  reason: string;
  count: number;
}

interface ActivityRow {
  id: string;
  type: ActivityType;
  createdAt: string;
  user: { id: string; passwordHash?: string };
  deal: { id: string; title: string } | null;
  client: { id: string; companyName: string } | null;
}

/** Typed view of an untyped supertest response body. */
function body<T>(res: request.Response): T {
  return res.body as T;
}

describe('Analytics (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let adminToken: string;
  let managerToken: string;
  let managerId: string;
  let clientId: string;
  let dealIds: string[] = [];

  const owned = () => `${RANGE}&ownerId=${managerId}`;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    await prisma.user.createMany({
      data: [
        {
          email: adminEmail,
          passwordHash,
          name: 'Analytics Admin',
          role: Role.ADMIN,
          avatarColor: '#6366f1',
        },
        {
          email: managerEmail,
          passwordHash,
          name: 'Analytics Manager',
          role: Role.MANAGER,
          avatarColor: '#0ea5e9',
        },
      ],
    });
    managerId = (await prisma.user.findUniqueOrThrow({ where: { email: managerEmail } })).id;

    const client = await prisma.client.create({
      data: {
        companyName: `ООО «Аналитика ${suffix}»`,
        contactName: 'Иван Петров',
        email: `client-${suffix}@test.dev`,
        phone: '+7 999 123-45-67',
        source: ClientSource.WEBSITE,
        ownerId: managerId,
        createdAt: new Date('2023-07-01T00:00:00.000Z'),
      },
    });
    clientId = client.id;

    // Fixed history: 1 WON in the previous window (2023-H2), then inside the
    // current window 2 WON, 2 LOST (same reason) and 1 still-open LEAD.
    const deal = (
      stage: DealStage,
      amount: number,
      createdAt: string,
      closedAt: string | null,
      lostReason: string | null = null,
    ) => ({
      title: `Сделка ${suffix}`,
      amount,
      stage,
      clientId,
      ownerId: managerId,
      expectedCloseDate: new Date('2024-08-01T00:00:00.000Z'),
      createdAt: new Date(createdAt),
      closedAt: closedAt ? new Date(closedAt) : null,
      lostReason,
    });
    const created = await prisma.deal.createManyAndReturn({
      data: [
        deal(DealStage.WON, 50_000, '2023-08-01T00:00:00.000Z', '2023-09-01T00:00:00.000Z'),
        deal(DealStage.WON, 100_000, '2024-02-10T00:00:00.000Z', '2024-03-15T00:00:00.000Z'),
        deal(DealStage.WON, 200_000, '2024-02-20T00:00:00.000Z', '2024-05-10T00:00:00.000Z'),
        deal(
          DealStage.LOST,
          300_000,
          '2024-03-01T00:00:00.000Z',
          '2024-04-01T00:00:00.000Z',
          'Дорого',
        ),
        deal(
          DealStage.LOST,
          300_000,
          '2024-03-05T00:00:00.000Z',
          '2024-04-05T00:00:00.000Z',
          'Дорого',
        ),
        deal(DealStage.LEAD, 42_000, '2024-06-01T00:00:00.000Z', null),
      ],
      select: { id: true },
    });
    dealIds = created.map((d) => d.id);

    // One task that became overdue inside the window and never got done.
    await prisma.task.create({
      data: {
        title: `Задача ${suffix}`,
        status: TaskStatus.TODO,
        dueDate: new Date('2024-04-01T00:00:00.000Z'),
        dealId: dealIds[1],
        assigneeId: managerId,
        createdAt: new Date('2024-03-01T00:00:00.000Z'),
      },
    });

    // A second task, also due inside the window, but completed — must never count as overdue.
    await prisma.task.create({
      data: {
        title: `Выполненная задача ${suffix}`,
        status: TaskStatus.DONE,
        dueDate: new Date('2024-04-02T00:00:00.000Z'),
        dealId: dealIds[1],
        assigneeId: managerId,
        createdAt: new Date('2024-03-01T00:00:00.000Z'),
      },
    });

    await prisma.activity.createMany({
      data: [
        {
          type: ActivityType.DEAL_CREATED,
          payload: {},
          dealId: dealIds[1],
          clientId,
          userId: managerId,
          createdAt: new Date('2024-02-10T00:00:00.000Z'),
        },
        {
          type: ActivityType.STAGE_CHANGED,
          payload: { from: DealStage.DELIVERY, to: DealStage.WON },
          dealId: dealIds[1],
          clientId,
          userId: managerId,
          createdAt: new Date('2024-03-15T00:00:00.000Z'),
        },
      ],
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    server = app.getHttpServer();

    adminToken = await login(adminEmail);
    managerToken = await login(managerEmail);
  });

  afterAll(async () => {
    await prisma.activity.deleteMany({ where: { userId: managerId } });
    await prisma.task.deleteMany({ where: { assigneeId: managerId } });
    await prisma.deal.deleteMany({ where: { ownerId: managerId } });
    await prisma.client.deleteMany({ where: { ownerId: managerId } });
    await prisma.user.deleteMany({ where: { email: { contains: suffix } } });
    await prisma.$disconnect();
    await app.close();
  });

  async function login(email: string): Promise<string> {
    const res = await request(server).post('/api/auth/login').send({ email, password: PASSWORD });
    return body<TokenBody>(res).accessToken;
  }

  function get(path: string, token: string): request.Test {
    return request(server).get(path).set('Authorization', `Bearer ${token}`);
  }

  describe('access control and validation', () => {
    it('requires authentication', async () => {
      await request(server).get('/api/analytics/summary').expect(401);
    });

    it('rejects ownerId for a MANAGER', async () => {
      await get(`/api/analytics/summary?ownerId=${managerId}`, managerToken).expect(403);
    });

    it('allows a MANAGER to read studio-wide analytics', async () => {
      await get(`/api/analytics/summary?${RANGE}`, managerToken).expect(200);
    });

    it('rejects an inverted date range', async () => {
      await get(`/api/analytics/summary?from=${TO}&to=${FROM}`, adminToken).expect(400);
    });

    it('rejects a malformed date', async () => {
      await get('/api/analytics/summary?from=yesterday', adminToken).expect(400);
    });
  });

  describe('GET /api/analytics/summary', () => {
    it('computes every metric and its delta vs the previous period', async () => {
      const res = await get(`/api/analytics/summary?${owned()}`, adminToken).expect(200);
      const summary = body<SummaryBody>(res);

      // Current window: WON 100k + 200k, 5 deals created, 2 of 4 closed WON.
      // Previous window: one 50k WON deal.
      expect(summary.revenue).toEqual({ value: 300_000, deltaPct: 500 });
      expect(summary.newDeals).toEqual({ value: 5, deltaPct: 400 });
      expect(summary.conversionRate).toEqual({ value: 50, deltaPct: -50 });
      expect(summary.avgWonAmount).toEqual({ value: 150_000, deltaPct: 200 });
      // One open LEAD at the window end; nothing open a period earlier -> null delta.
      expect(summary.activeDeals).toEqual({ value: 1, deltaPct: null });
      expect(summary.overdueTasks).toEqual({ value: 1, deltaPct: null });
    });
  });

  describe('summary is consistent with the other read models', () => {
    // Seed-like realistic fixture (WON/LOST/open across months), read through every endpoint over
    // the same window. We assert the numbers agree with each other rather than hard-code them, so
    // this survives data changes. The window is scoped to this test's owner, which no other e2e
    // touches, so a concurrently-running suite can't shift the totals between calls.
    it('cross-checks revenue, won counts, conversion and averages across endpoints', async () => {
      const [summaryRes, monthsRes, managersRes, lostRes, funnelRes] = await Promise.all([
        get(`/api/analytics/summary?${owned()}`, adminToken).expect(200),
        get(`/api/analytics/revenue-by-month?${owned()}`, adminToken).expect(200),
        get(`/api/analytics/top-managers?${owned()}`, adminToken).expect(200),
        get(`/api/analytics/lost-reasons?${owned()}`, adminToken).expect(200),
        get(`/api/analytics/funnel?${owned()}`, adminToken).expect(200),
      ]);

      const summary = body<SummaryBody>(summaryRes);
      const months = body<MonthPoint[]>(monthsRes);
      const managers = body<ManagerRow[]>(managersRes);
      const lost = body<LostReasonRow[]>(lostRes);
      const funnel = body<FunnelRow[]>(funnelRes);

      const revenueFromMonths = months.reduce((sum, m) => sum + m.revenue, 0);
      const wonFromMonths = months.reduce((sum, m) => sum + m.dealsWon, 0);
      const managerRevenue = managers.reduce((sum, m) => sum + m.revenue, 0);
      const managerWon = managers.reduce((sum, m) => sum + m.dealsWon, 0);
      const managerNew = managers.reduce((sum, m) => sum + m.newDeals, 0);
      const lostCount = lost.reduce((sum, r) => sum + r.count, 0);

      // Revenue is the sum of WON amounts, however you slice it: by month or by manager.
      expect(summary.revenue.value).toBe(revenueFromMonths);
      expect(summary.revenue.value).toBe(managerRevenue);

      // WON deal counts agree between the month series and the manager rollup.
      expect(wonFromMonths).toBe(managerWon);
      expect(wonFromMonths).toBeGreaterThan(0);

      // New deals in the period equal the per-manager new-deal counts and the funnel total
      // (the funnel buckets every deal created in the period by its current stage).
      expect(summary.newDeals.value).toBe(managerNew);
      const funnelTotal = funnel.reduce((sum, f) => sum + f.count, 0);
      expect(funnelTotal).toBe(summary.newDeals.value);

      // Average WON amount is revenue over WON count, rounded to a whole kopeck.
      expect(summary.avgWonAmount.value).toBe(Math.round(summary.revenue.value / wonFromMonths));

      // Conversion is WON out of everything closed (WON + LOST) in the period.
      const closed = wonFromMonths + lostCount;
      const expectedConversion =
        closed === 0 ? 0 : Math.round((wonFromMonths / closed) * 1000) / 10;
      expect(summary.conversionRate.value).toBe(expectedConversion);

      // Every metric is a real, non-negative number.
      for (const metric of [
        summary.revenue,
        summary.newDeals,
        summary.conversionRate,
        summary.avgWonAmount,
        summary.activeDeals,
        summary.overdueTasks,
      ]) {
        expect(Number.isFinite(metric.value)).toBe(true);
        expect(metric.value).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('GET /api/analytics/revenue-by-month', () => {
    it('returns every month of the range including zero months', async () => {
      const res = await get(`/api/analytics/revenue-by-month?${owned()}`, adminToken).expect(200);
      const months = body<MonthPoint[]>(res);

      expect(months.map((m) => m.month)).toEqual([
        '2024-01',
        '2024-02',
        '2024-03',
        '2024-04',
        '2024-05',
        '2024-06',
      ]);
      expect(months.find((m) => m.month === '2024-03')).toEqual({
        month: '2024-03',
        revenue: 100_000,
        dealsWon: 1,
      });
      expect(months.find((m) => m.month === '2024-05')).toEqual({
        month: '2024-05',
        revenue: 200_000,
        dealsWon: 1,
      });
      expect(months.filter((m) => m.revenue === 0)).toHaveLength(4);
    });
  });

  describe('GET /api/analytics/funnel', () => {
    it('returns all stages in pipeline order with counts and amounts', async () => {
      const res = await get(`/api/analytics/funnel?${owned()}`, adminToken).expect(200);
      const funnel = body<FunnelRow[]>(res);

      expect(funnel.map((f) => f.stage)).toEqual([
        DealStage.LEAD,
        DealStage.BRIEF,
        DealStage.PROPOSAL,
        DealStage.CONTRACT,
        DealStage.IN_PROGRESS,
        DealStage.DELIVERY,
        DealStage.WON,
        DealStage.LOST,
      ]);
      expect(funnel.find((f) => f.stage === DealStage.LEAD)).toEqual({
        stage: DealStage.LEAD,
        count: 1,
        amount: 42_000,
      });
      expect(funnel.find((f) => f.stage === DealStage.WON)).toEqual({
        stage: DealStage.WON,
        count: 2,
        amount: 300_000,
      });
      expect(funnel.find((f) => f.stage === DealStage.LOST)).toEqual({
        stage: DealStage.LOST,
        count: 2,
        amount: 600_000,
      });
      expect(funnel.find((f) => f.stage === DealStage.BRIEF)).toEqual({
        stage: DealStage.BRIEF,
        count: 0,
        amount: 0,
      });
    });
  });

  describe('GET /api/analytics/top-managers', () => {
    it('aggregates revenue, deal counts and conversion per manager', async () => {
      const res = await get(`/api/analytics/top-managers?${owned()}`, adminToken).expect(200);
      const managers = body<ManagerRow[]>(res);

      expect(managers).toHaveLength(1);
      expect(managers[0]).toMatchObject({
        id: managerId,
        name: 'Analytics Manager',
        revenue: 300_000,
        dealsWon: 2,
        newDeals: 5,
        conversionRate: 50,
      });
    });

    it('sorts managers by revenue', async () => {
      const res = await get(`/api/analytics/top-managers?${RANGE}`, adminToken).expect(200);
      const revenues = body<ManagerRow[]>(res).map((m) => m.revenue);
      expect(revenues).toEqual([...revenues].sort((a, b) => b - a));
    });
  });

  describe('GET /api/analytics/recent-activity', () => {
    it('returns newest-first activities with user, deal and client', async () => {
      const res = await get(`/api/analytics/recent-activity?${owned()}`, adminToken).expect(200);
      const activities = body<ActivityRow[]>(res);

      expect(activities).toHaveLength(2);
      expect(activities[0].type).toBe(ActivityType.STAGE_CHANGED);
      expect(activities[1].type).toBe(ActivityType.DEAL_CREATED);
      expect(activities[0].user.id).toBe(managerId);
      expect(activities[0].user.passwordHash).toBeUndefined();
      expect(activities[0].deal?.id).toBe(dealIds[1]);
      expect(activities[0].client?.id).toBe(clientId);
    });
  });

  describe('GET /api/analytics/lost-reasons', () => {
    it('counts lost deals per reason', async () => {
      const res = await get(`/api/analytics/lost-reasons?${owned()}`, adminToken).expect(200);
      expect(body<LostReasonRow[]>(res)).toEqual([{ reason: 'Дорого', count: 2 }]);
    });
  });
});
