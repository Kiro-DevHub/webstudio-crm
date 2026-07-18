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
const suffix = `crm${Date.now()}`;
const adminEmail = `admin-${suffix}@test.dev`;
const ownerEmail = `owner-${suffix}@test.dev`;
const otherEmail = `other-${suffix}@test.dev`;

const prisma = new PrismaClient();

interface TokenBody {
  accessToken: string;
}

interface ClientBody {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  source: ClientSource;
  ownerId: string;
}

interface DealBody {
  id: string;
  title: string;
  amount: number;
  stage: DealStage;
  ownerId: string;
  clientId: string;
  closedAt: string | null;
  lostReason: string | null;
}

interface TaskBody {
  id: string;
  title: string;
  status: TaskStatus;
  assigneeId: string;
}

interface NoteBody {
  id: string;
  body: string;
}

interface ActivityBody {
  id: string;
  type: ActivityType;
  payload: Record<string, unknown>;
  createdAt: string;
}

interface DealDetailBody extends DealBody {
  client: { id: string; companyName: string };
  owner: { id: string; name: string; passwordHash?: string };
  tasks: TaskBody[];
  notes: NoteBody[];
  activities: ActivityBody[];
}

interface Paginated<T> {
  data: T[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/** Typed view of an untyped supertest response body. */
function body<T>(res: request.Response): T {
  return res.body as T;
}

describe('CRM CRUD modules (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;
  let adminToken: string;
  let ownerToken: string;
  let otherToken: string;
  let ownerId: string;
  let otherId: string;
  /** A client owned by `owner`, reused as the parent of test deals. */
  let sharedClientId: string;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    await prisma.user.createMany({
      data: [
        {
          email: adminEmail,
          passwordHash,
          name: 'CRM Admin',
          role: Role.ADMIN,
          avatarColor: '#6366f1',
        },
        {
          email: ownerEmail,
          passwordHash,
          name: 'CRM Owner',
          role: Role.MANAGER,
          avatarColor: '#0ea5e9',
        },
        {
          email: otherEmail,
          passwordHash,
          name: 'CRM Other',
          role: Role.MANAGER,
          avatarColor: '#10b981',
        },
      ],
    });
    ownerId = (await prisma.user.findUniqueOrThrow({ where: { email: ownerEmail } })).id;
    otherId = (await prisma.user.findUniqueOrThrow({ where: { email: otherEmail } })).id;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    server = app.getHttpServer();

    adminToken = await login(adminEmail);
    ownerToken = await login(ownerEmail);
    otherToken = await login(otherEmail);

    sharedClientId = (await createClient(ownerToken, { companyName: `ООО «Родитель ${suffix}»` }))
      .id;
  });

  afterAll(async () => {
    // Activities/tasks/notes cascade from deals and clients; users are last (FK Restrict).
    const userIds = [ownerId, otherId];
    await prisma.activity.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.note.deleteMany({ where: { authorId: { in: userIds } } });
    await prisma.task.deleteMany({ where: { assigneeId: { in: userIds } } });
    await prisma.deal.deleteMany({ where: { ownerId: { in: userIds } } });
    await prisma.client.deleteMany({ where: { ownerId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { email: { contains: suffix } } });
    await prisma.$disconnect();
    await app.close();
  });

  async function login(email: string): Promise<string> {
    const res = await request(server).post('/api/auth/login').send({ email, password: PASSWORD });
    return body<TokenBody>(res).accessToken;
  }

  async function createClient(
    token: string,
    overrides: Partial<ClientBody> = {},
  ): Promise<ClientBody> {
    const res = await request(server)
      .post('/api/clients')
      .set('Authorization', `Bearer ${token}`)
      .send({
        companyName: `ООО «Тест ${suffix}»`,
        contactName: 'Иван Петров',
        email: `client-${Date.now()}@test.dev`,
        phone: '+7 999 123-45-67',
        source: ClientSource.WEBSITE,
        ...overrides,
      });
    expect(res.status).toBe(201);
    return body<ClientBody>(res);
  }

  async function createDeal(
    token: string,
    overrides: Record<string, unknown> = {},
  ): Promise<DealBody> {
    const res = await request(server)
      .post('/api/deals')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: `Сделка ${suffix}`,
        amount: 15_000_000,
        clientId: sharedClientId,
        expectedCloseDate: new Date(Date.now() + 30 * 86_400_000).toISOString(),
        ...overrides,
      });
    expect(res.status).toBe(201);
    return body<DealBody>(res);
  }

  function changeStage(
    token: string,
    dealId: string,
    payload: Record<string, unknown>,
  ): request.Test {
    return request(server)
      .patch(`/api/deals/${dealId}/stage`)
      .set('Authorization', `Bearer ${token}`)
      .send(payload);
  }

  describe('Clients CRUD happy path', () => {
    let createdId: string;
    const companyName = `ООО «Хэппипас ${suffix}»`;

    it('POST /api/clients creates a client owned by the current user', async () => {
      const res = await request(server)
        .post('/api/clients')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          companyName,
          contactName: 'Мария Сидорова',
          email: `happy-${suffix}@test.dev`,
          phone: '+7 999 000-11-22',
          source: ClientSource.REFERRAL,
        });

      expect(res.status).toBe(201);
      const created = body<ClientBody>(res);
      expect(created.companyName).toBe(companyName);
      expect(created.ownerId).toBe(ownerId);
      createdId = created.id;
    });

    it('writes a CLIENT_CREATED activity on creation', async () => {
      const activities = await prisma.activity.findMany({ where: { clientId: createdId } });
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe(ActivityType.CLIENT_CREATED);
      expect(activities[0].userId).toBe(ownerId);
    });

    it('GET /api/clients returns the paginated shape from project conventions', async () => {
      const res = await request(server)
        .get('/api/clients')
        .query({ page: 1, limit: 10 })
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      const list = body<Paginated<ClientBody>>(res);
      expect(Array.isArray(list.data)).toBe(true);
      expect(list.meta).toMatchObject({ page: 1, limit: 10 });
      expect(typeof list.meta.total).toBe('number');
      expect(typeof list.meta.totalPages).toBe('number');
    });

    it('GET /api/clients?search= finds the client by company name', async () => {
      const res = await request(server)
        .get('/api/clients')
        .query({ search: `Хэппипас ${suffix}` })
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      const list = body<Paginated<ClientBody>>(res);
      expect(list.data.map((c) => c.id)).toContain(createdId);
    });

    it('GET /api/clients?search= also matches contact name and email', async () => {
      const byContact = await request(server)
        .get('/api/clients')
        .query({ search: 'Мария Сидорова' })
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(body<Paginated<ClientBody>>(byContact).data.map((c) => c.id)).toContain(createdId);

      const byEmail = await request(server)
        .get('/api/clients')
        .query({ search: `happy-${suffix}` })
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(body<Paginated<ClientBody>>(byEmail).data.map((c) => c.id)).toContain(createdId);
    });

    it('GET /api/clients?source= filters by source', async () => {
      const res = await request(server)
        .get('/api/clients')
        .query({ source: ClientSource.REFERRAL, ownerId, limit: 100 })
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      const list = body<Paginated<ClientBody>>(res);
      expect(list.data.every((c) => c.source === ClientSource.REFERRAL)).toBe(true);
      expect(list.data.every((c) => c.ownerId === ownerId)).toBe(true);
      expect(list.data.map((c) => c.id)).toContain(createdId);
    });

    it('GET /api/clients/:id returns the client', async () => {
      const res = await request(server)
        .get(`/api/clients/${createdId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(body<ClientBody>(res).id).toBe(createdId);
    });

    it('PATCH /api/clients/:id updates the client', async () => {
      const res = await request(server)
        .patch(`/api/clients/${createdId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ contactName: 'Мария Обновлённая' });

      expect(res.status).toBe(200);
      expect(body<ClientBody>(res).contactName).toBe('Мария Обновлённая');
    });

    it('POST /api/clients rejects an invalid body with 400', async () => {
      const res = await request(server)
        .post('/api/clients')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          companyName: '',
          contactName: 'X',
          email: 'not-an-email',
          phone: '1',
          source: 'MARS',
        });
      expect(res.status).toBe(400);
    });

    it('DELETE /api/clients/:id removes the client, which is then gone', async () => {
      const res = await request(server)
        .delete(`/api/clients/${createdId}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).toBe(204);

      const after = await request(server)
        .get(`/api/clients/${createdId}`)
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(after.status).toBe(404);
    });

    it('GET /api/clients/:id returns 404 for an unknown id', async () => {
      const res = await request(server)
        .get('/api/clients/ckzzzzzzzzzzzzzzzzzzzzzzz')
        .set('Authorization', `Bearer ${ownerToken}`);
      expect(res.status).toBe(404);
    });

    it('GET /api/clients returns 401 without a token', async () => {
      const res = await request(server).get('/api/clients');
      expect(res.status).toBe(401);
    });
  });

  describe('a MANAGER cannot modify a deal owned by someone else', () => {
    let foreignDealId: string;

    beforeAll(async () => {
      foreignDealId = (await createDeal(ownerToken)).id;
    });

    it('lets the other manager READ the deal (everyone can view)', async () => {
      const res = await request(server)
        .get(`/api/deals/${foreignDealId}`)
        .set('Authorization', `Bearer ${otherToken}`);
      expect(res.status).toBe(200);
    });

    it('rejects PATCH /api/deals/:id with 403', async () => {
      const res = await request(server)
        .patch(`/api/deals/${foreignDealId}`)
        .set('Authorization', `Bearer ${otherToken}`)
        .send({ title: 'Перехвачено' });
      expect(res.status).toBe(403);

      const deal = await prisma.deal.findUniqueOrThrow({ where: { id: foreignDealId } });
      expect(deal.title).not.toBe('Перехвачено');
    });

    it('rejects PATCH /api/deals/:id/stage with 403', async () => {
      const res = await changeStage(otherToken, foreignDealId, { stage: DealStage.WON });
      expect(res.status).toBe(403);

      const deal = await prisma.deal.findUniqueOrThrow({ where: { id: foreignDealId } });
      expect(deal.stage).toBe(DealStage.LEAD);
    });

    it('rejects DELETE /api/deals/:id with 403', async () => {
      const res = await request(server)
        .delete(`/api/deals/${foreignDealId}`)
        .set('Authorization', `Bearer ${otherToken}`);
      expect(res.status).toBe(403);
    });

    it('rejects a MANAGER creating a deal owned by another user with 403', async () => {
      const res = await request(server)
        .post('/api/deals')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          title: 'Чужая сделка',
          amount: 1_000_000,
          clientId: sharedClientId,
          ownerId,
          expectedCloseDate: new Date().toISOString(),
        });
      expect(res.status).toBe(403);
    });

    it('lets the owner PATCH their own deal', async () => {
      const res = await request(server)
        .patch(`/api/deals/${foreignDealId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ title: 'Обновлено владельцем' });
      expect(res.status).toBe(200);
      expect(body<DealBody>(res).title).toBe('Обновлено владельцем');
    });

    it('lets an ADMIN PATCH a deal they do not own', async () => {
      const res = await request(server)
        .patch(`/api/deals/${foreignDealId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: 'Обновлено админом' });
      expect(res.status).toBe(200);
      expect(body<DealBody>(res).title).toBe('Обновлено админом');
    });

    it('returns 404 when mutating a deal that does not exist', async () => {
      const res = await request(server)
        .patch('/api/deals/ckzzzzzzzzzzzzzzzzzzzzzzz')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ title: 'Призрак' });
      expect(res.status).toBe(404);
    });
  });

  describe('deal stage transitions', () => {
    it('moves a deal forward and logs STAGE_CHANGED with from/to', async () => {
      const deal = await createDeal(ownerToken);
      const res = await changeStage(ownerToken, deal.id, { stage: DealStage.PROPOSAL });

      expect(res.status).toBe(200);
      expect(body<DealBody>(res).stage).toBe(DealStage.PROPOSAL);

      const activities = await prisma.activity.findMany({
        where: { dealId: deal.id, type: ActivityType.STAGE_CHANGED },
      });
      expect(activities).toHaveLength(1);
      expect(activities[0].payload).toEqual({ from: DealStage.LEAD, to: DealStage.PROPOSAL });
    });

    it('allows moving backwards between open stages', async () => {
      const deal = await createDeal(ownerToken);
      await changeStage(ownerToken, deal.id, { stage: DealStage.CONTRACT }).expect(200);
      const res = await changeStage(ownerToken, deal.id, { stage: DealStage.BRIEF });
      expect(res.status).toBe(200);
      expect(body<DealBody>(res).stage).toBe(DealStage.BRIEF);
    });

    it('rejects a transition to the same stage with 400', async () => {
      const deal = await createDeal(ownerToken);
      const res = await changeStage(ownerToken, deal.id, { stage: DealStage.LEAD });
      expect(res.status).toBe(400);
    });

    it('rejects an unknown stage with 400', async () => {
      const deal = await createDeal(ownerToken);
      const res = await changeStage(ownerToken, deal.id, { stage: 'ALMOST_WON' });
      expect(res.status).toBe(400);
    });

    it('closes a deal as WON from any stage and stamps closedAt', async () => {
      const deal = await createDeal(ownerToken);
      const res = await changeStage(ownerToken, deal.id, { stage: DealStage.WON });

      expect(res.status).toBe(200);
      const won = body<DealBody>(res);
      expect(won.stage).toBe(DealStage.WON);
      expect(won.closedAt).not.toBeNull();
    });

    it('requires lostReason when closing as LOST', async () => {
      const deal = await createDeal(ownerToken);
      const res = await changeStage(ownerToken, deal.id, { stage: DealStage.LOST });

      expect(res.status).toBe(400);
      const unchanged = await prisma.deal.findUniqueOrThrow({ where: { id: deal.id } });
      expect(unchanged.stage).toBe(DealStage.LEAD);
      expect(unchanged.closedAt).toBeNull();
    });

    it('closes a deal as LOST with a reason and stamps closedAt', async () => {
      const deal = await createDeal(ownerToken);
      const res = await changeStage(ownerToken, deal.id, {
        stage: DealStage.LOST,
        lostReason: 'Выбрали другого подрядчика',
      });

      expect(res.status).toBe(200);
      const lost = body<DealBody>(res);
      expect(lost.stage).toBe(DealStage.LOST);
      expect(lost.lostReason).toBe('Выбрали другого подрядчика');
      expect(lost.closedAt).not.toBeNull();
    });

    it('refuses to reopen a WON deal', async () => {
      const deal = await createDeal(ownerToken);
      await changeStage(ownerToken, deal.id, { stage: DealStage.WON }).expect(200);

      const res = await changeStage(ownerToken, deal.id, { stage: DealStage.IN_PROGRESS });
      expect(res.status).toBe(400);
      const stillWon = await prisma.deal.findUniqueOrThrow({ where: { id: deal.id } });
      expect(stillWon.stage).toBe(DealStage.WON);
    });

    it('refuses to move a LOST deal to WON', async () => {
      const deal = await createDeal(ownerToken);
      await changeStage(ownerToken, deal.id, {
        stage: DealStage.LOST,
        lostReason: 'Не устроил бюджет',
      }).expect(200);

      const res = await changeStage(ownerToken, deal.id, { stage: DealStage.WON });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/deals/:id aggregate', () => {
    it('returns the deal with client, owner, tasks, notes and activities newest-first', async () => {
      const deal = await createDeal(ownerToken);

      const taskRes = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Позвонить клиенту',
          dueDate: new Date(Date.now() + 86_400_000).toISOString(),
          dealId: deal.id,
        });
      expect(taskRes.status).toBe(201);

      const noteRes = await request(server)
        .post(`/api/deals/${deal.id}/notes`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ body: 'Клиент готов подписывать договор.' });
      expect(noteRes.status).toBe(201);

      await changeStage(ownerToken, deal.id, { stage: DealStage.WON }).expect(200);

      const res = await request(server)
        .get(`/api/deals/${deal.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      const detail = body<DealDetailBody>(res);
      expect(detail.client.id).toBe(sharedClientId);
      expect(detail.owner.id).toBe(ownerId);
      expect(detail.owner.passwordHash).toBeUndefined();
      expect(detail.tasks.map((t) => t.title)).toContain('Позвонить клиенту');
      expect(detail.notes.map((n) => n.body)).toContain('Клиент готов подписывать договор.');

      const types = detail.activities.map((a) => a.type);
      expect(types).toContain(ActivityType.DEAL_CREATED);
      expect(types).toContain(ActivityType.TASK_CREATED);
      expect(types).toContain(ActivityType.NOTE_ADDED);
      expect(types).toContain(ActivityType.STAGE_CHANGED);

      const timestamps = detail.activities.map((a) => new Date(a.createdAt).getTime());
      expect(timestamps).toEqual([...timestamps].sort((a, b) => b - a));
    });
  });

  describe('tasks', () => {
    it('logs TASK_COMPLETED when the status becomes DONE', async () => {
      const deal = await createDeal(ownerToken);
      const created = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Выставить счёт',
          dueDate: new Date(Date.now() + 86_400_000).toISOString(),
          dealId: deal.id,
        });
      const taskId = body<TaskBody>(created).id;

      const res = await request(server)
        .patch(`/api/tasks/${taskId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: TaskStatus.DONE });
      expect(res.status).toBe(200);
      expect(body<TaskBody>(res).status).toBe(TaskStatus.DONE);

      const completed = await prisma.activity.findMany({
        where: { dealId: deal.id, type: ActivityType.TASK_COMPLETED },
      });
      expect(completed).toHaveLength(1);
    });

    it('GET /api/tasks?overdue=true returns only overdue, unfinished tasks', async () => {
      const overdue = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Просроченная задача',
          dueDate: new Date(Date.now() - 86_400_000).toISOString(),
        });
      const overdueId = body<TaskBody>(overdue).id;

      const res = await request(server)
        .get('/api/tasks')
        .query({ overdue: true, assigneeId: ownerId, limit: 100 })
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      const list = body<Paginated<TaskBody>>(res);
      expect(list.data.map((t) => t.id)).toContain(overdueId);
      expect(list.data.every((t) => t.status !== TaskStatus.DONE)).toBe(true);
    });

    it('GET /api/tasks?overdue=true excludes a DONE task even with a past due date', async () => {
      const created = await request(server)
        .post('/api/tasks')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          title: 'Выполненная просроченная задача',
          dueDate: new Date(Date.now() - 86_400_000).toISOString(),
        });
      const doneOverdueId = body<TaskBody>(created).id;

      await request(server)
        .patch(`/api/tasks/${doneOverdueId}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: TaskStatus.DONE })
        .expect(200);

      const res = await request(server)
        .get('/api/tasks')
        .query({ overdue: true, assigneeId: ownerId, limit: 100 })
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      const list = body<Paginated<TaskBody>>(res);
      expect(list.data.map((t) => t.id)).not.toContain(doneOverdueId);
    });
  });
});
