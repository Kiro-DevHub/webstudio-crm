import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { DealStage, Prisma, Role } from '@prisma/client';
import { SAFE_USER_SELECT, SafeUser } from '../../common/types/user.types';
import { PrismaService } from '../../prisma/prisma.service';
import {
  AnalyticsSummary,
  FunnelStage,
  LostReason,
  MetricWithDelta,
  RecentActivityEntry,
  RevenueByMonthPoint,
  TopManager,
} from './analytics.types';
import { AnalyticsQueryDto } from './dto/analytics-query.dto';

/** Half-open date range `[from, to)`. */
interface Period {
  from: Date;
  to: Date;
}

/** One row of the per-period deal stats query; raw COUNT/SUM come back as bigint. */
interface DealStatsRow {
  revenue: bigint;
  newDeals: bigint;
  wonDeals: bigint;
  closedDeals: bigint;
  activeDeals: bigint;
}

interface PeriodStats {
  revenue: number;
  newDeals: number;
  wonDeals: number;
  closedDeals: number;
  activeDeals: number;
  overdueTasks: number;
}

interface TopManagerRow {
  id: string;
  name: string;
  avatarColor: string;
  revenue: bigint;
  dealsWon: number;
  closedDeals: number;
  newDeals: number;
}

interface RevenueByMonthRow {
  month: string;
  revenue: bigint;
  dealsWon: number;
}

const FUNNEL_STAGE_ORDER: DealStage[] = [
  DealStage.LEAD,
  DealStage.BRIEF,
  DealStage.PROPOSAL,
  DealStage.CONTRACT,
  DealStage.IN_PROGRESS,
  DealStage.DELIVERY,
  DealStage.WON,
  DealStage.LOST,
];

const round1 = (value: number): number => Math.round(value * 10) / 10;

/** Pairs a value with its relative change vs the previous period (null when prev is 0). */
function metric(value: number, previous: number): MetricWithDelta {
  return {
    value,
    deltaPct: previous === 0 ? null : round1(((value - previous) / previous) * 100),
  };
}

/** WON share among closed deals, in percent; 0 when nothing closed. */
function conversionRate(won: number, closed: number): number {
  return closed === 0 ? 0 : round1((won / closed) * 100);
}

/**
 * Read-only dashboard aggregations. Everything is computed in PostgreSQL
 * (groupBy / aggregate / $queryRaw with FILTER clauses) — no table is ever
 * loaded into memory. Money stays integer kopecks end to end.
 */
@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async summary(query: AnalyticsQueryDto, actor: SafeUser): Promise<AnalyticsSummary> {
    const ownerId = this.resolveOwnerFilter(query, actor);
    const { current, previous } = this.resolvePeriods(query);

    const [curr, prev] = await Promise.all([
      this.periodStats(current, ownerId),
      this.periodStats(previous, ownerId),
    ]);

    return {
      period: { from: current.from.toISOString(), to: current.to.toISOString() },
      revenue: metric(curr.revenue, prev.revenue),
      newDeals: metric(curr.newDeals, prev.newDeals),
      conversionRate: metric(
        conversionRate(curr.wonDeals, curr.closedDeals),
        conversionRate(prev.wonDeals, prev.closedDeals),
      ),
      avgWonAmount: metric(
        curr.wonDeals === 0 ? 0 : Math.round(curr.revenue / curr.wonDeals),
        prev.wonDeals === 0 ? 0 : Math.round(prev.revenue / prev.wonDeals),
      ),
      activeDeals: metric(curr.activeDeals, prev.activeDeals),
      overdueTasks: metric(curr.overdueTasks, prev.overdueTasks),
    };
  }

  async revenueByMonth(query: AnalyticsQueryDto, actor: SafeUser): Promise<RevenueByMonthPoint[]> {
    const ownerId = this.resolveOwnerFilter(query, actor);
    const { current } = this.resolvePeriods(query);
    const owner = ownerId ? Prisma.sql`AND d."ownerId" = ${ownerId}` : Prisma.empty;

    // generate_series keeps months with no revenue in the result. Buckets are
    // UTC calendar months (AT TIME ZONE 'UTC'), not server-local ones, so the
    // API is timezone-independent; the upper bound backs off one microsecond
    // so an exclusive `to` on a month boundary does not add an empty extra month.
    const rows = await this.prisma.$queryRaw<RevenueByMonthRow[]>(Prisma.sql`
      SELECT
        to_char(m.month, 'YYYY-MM') AS "month",
        COALESCE(SUM(d.amount), 0)::bigint AS "revenue",
        COUNT(d.id)::int AS "dealsWon"
      FROM generate_series(
        date_trunc('month', ${current.from}::timestamptz AT TIME ZONE 'UTC'),
        date_trunc('month', (${current.to}::timestamptz - interval '1 microsecond') AT TIME ZONE 'UTC'),
        interval '1 month'
      ) AS m(month)
      LEFT JOIN deals d
        ON d.stage = 'WON'
        AND (d."closedAt" AT TIME ZONE 'UTC') >= m.month
        AND (d."closedAt" AT TIME ZONE 'UTC') < m.month + interval '1 month'
        AND d."closedAt" >= ${current.from}
        AND d."closedAt" < ${current.to}
        ${owner}
      GROUP BY m.month
      ORDER BY m.month
    `);

    return rows.map((row) => ({
      month: row.month,
      revenue: Number(row.revenue),
      dealsWon: row.dealsWon,
    }));
  }

  /** Current stage distribution of deals created in the period, in pipeline order. */
  async funnel(query: AnalyticsQueryDto, actor: SafeUser): Promise<FunnelStage[]> {
    const ownerId = this.resolveOwnerFilter(query, actor);
    const { current } = this.resolvePeriods(query);

    const grouped = await this.prisma.deal.groupBy({
      by: ['stage'],
      where: {
        createdAt: { gte: current.from, lt: current.to },
        ...(ownerId ? { ownerId } : {}),
      },
      _count: { _all: true },
      _sum: { amount: true },
    });

    return FUNNEL_STAGE_ORDER.map((stage) => {
      const row = grouped.find((g) => g.stage === stage);
      return {
        stage,
        count: row?._count._all ?? 0,
        amount: row?._sum.amount ?? 0,
      };
    });
  }

  async topManagers(query: AnalyticsQueryDto, actor: SafeUser): Promise<TopManager[]> {
    const ownerId = this.resolveOwnerFilter(query, actor);
    const { current } = this.resolvePeriods(query);
    const { from, to } = current;
    const owner = ownerId ? Prisma.sql`AND u.id = ${ownerId}` : Prisma.empty;

    const rows = await this.prisma.$queryRaw<TopManagerRow[]>(Prisma.sql`
      SELECT
        u.id,
        u.name,
        u."avatarColor",
        COALESCE(SUM(d.amount) FILTER (
          WHERE d.stage = 'WON' AND d."closedAt" >= ${from} AND d."closedAt" < ${to}
        ), 0)::bigint AS "revenue",
        COUNT(d.id) FILTER (
          WHERE d.stage = 'WON' AND d."closedAt" >= ${from} AND d."closedAt" < ${to}
        )::int AS "dealsWon",
        COUNT(d.id) FILTER (
          WHERE d.stage IN ('WON', 'LOST') AND d."closedAt" >= ${from} AND d."closedAt" < ${to}
        )::int AS "closedDeals",
        COUNT(d.id) FILTER (
          WHERE d."createdAt" >= ${from} AND d."createdAt" < ${to}
        )::int AS "newDeals"
      FROM users u
      LEFT JOIN deals d ON d."ownerId" = u.id
      WHERE u."isActive" = TRUE ${owner}
      GROUP BY u.id, u.name, u."avatarColor"
      ORDER BY "revenue" DESC, u.name ASC
    `);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      avatarColor: row.avatarColor,
      revenue: Number(row.revenue),
      dealsWon: row.dealsWon,
      newDeals: row.newDeals,
      conversionRate: row.closedDeals === 0 ? null : round1((row.dealsWon / row.closedDeals) * 100),
    }));
  }

  async recentActivity(query: AnalyticsQueryDto, actor: SafeUser): Promise<RecentActivityEntry[]> {
    const ownerId = this.resolveOwnerFilter(query, actor);
    const { current } = this.resolvePeriods(query);

    return this.prisma.activity.findMany({
      where: {
        createdAt: { gte: current.from, lt: current.to },
        ...(ownerId ? { userId: ownerId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        user: { select: SAFE_USER_SELECT },
        deal: { select: { id: true, title: true } },
        client: { select: { id: true, companyName: true } },
      },
    });
  }

  async lostReasons(query: AnalyticsQueryDto, actor: SafeUser): Promise<LostReason[]> {
    const ownerId = this.resolveOwnerFilter(query, actor);
    const { current } = this.resolvePeriods(query);

    const grouped = await this.prisma.deal.groupBy({
      by: ['lostReason'],
      where: {
        stage: DealStage.LOST,
        closedAt: { gte: current.from, lt: current.to },
        lostReason: { not: null },
        ...(ownerId ? { ownerId } : {}),
      },
      _count: { _all: true },
      orderBy: [{ _count: { lostReason: 'desc' } }, { lostReason: 'asc' }],
    });

    return grouped.map((row) => ({
      reason: row.lostReason ?? '',
      count: row._count._all,
    }));
  }

  /**
   * All six summary numbers for one period in two aggregate-only queries:
   * a FILTER-per-metric scan of deals and an overdue-task count.
   */
  private async periodStats(period: Period, ownerId?: string): Promise<PeriodStats> {
    const { from, to } = period;
    const dealOwner = ownerId ? Prisma.sql`AND "ownerId" = ${ownerId}` : Prisma.empty;
    const taskOwner = ownerId ? Prisma.sql`AND "assigneeId" = ${ownerId}` : Prisma.empty;

    const [dealRows, taskRows] = await Promise.all([
      this.prisma.$queryRaw<DealStatsRow[]>(Prisma.sql`
        SELECT
          COALESCE(SUM(amount) FILTER (
            WHERE stage = 'WON' AND "closedAt" >= ${from} AND "closedAt" < ${to}
          ), 0)::bigint AS "revenue",
          COUNT(*) FILTER (
            WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
          ) AS "newDeals",
          COUNT(*) FILTER (
            WHERE stage = 'WON' AND "closedAt" >= ${from} AND "closedAt" < ${to}
          ) AS "wonDeals",
          COUNT(*) FILTER (
            WHERE stage IN ('WON', 'LOST') AND "closedAt" >= ${from} AND "closedAt" < ${to}
          ) AS "closedDeals",
          COUNT(*) FILTER (
            WHERE "createdAt" < ${to} AND ("closedAt" IS NULL OR "closedAt" >= ${to})
          ) AS "activeDeals"
        FROM deals
        WHERE TRUE ${dealOwner}
      `),
      this.prisma.$queryRaw<Array<{ overdueTasks: bigint }>>(Prisma.sql`
        SELECT COUNT(*) AS "overdueTasks"
        FROM tasks
        WHERE status <> 'DONE'
          AND "dueDate" < NOW()
          AND "dueDate" >= ${from} AND "dueDate" < ${to}
          ${taskOwner}
      `),
    ]);

    const deals = dealRows[0];
    return {
      revenue: Number(deals.revenue),
      newDeals: Number(deals.newDeals),
      wonDeals: Number(deals.wonDeals),
      closedDeals: Number(deals.closedDeals),
      activeDeals: Number(deals.activeDeals),
      overdueTasks: Number(taskRows[0].overdueTasks),
    };
  }

  /**
   * Current period from the query (default: last 6 months, half-open `[from, to)`)
   * plus the previous period of the same length ending where the current one starts.
   */
  private resolvePeriods(query: AnalyticsQueryDto): { current: Period; previous: Period } {
    const to = query.to ? new Date(query.to) : new Date();
    let from: Date;
    if (query.from) {
      from = new Date(query.from);
    } else {
      from = new Date(to);
      from.setMonth(from.getMonth() - 6);
    }
    if (from >= to) {
      throw new BadRequestException('`from` must be earlier than `to`');
    }
    return {
      current: { from, to },
      previous: { from: new Date(from.getTime() - (to.getTime() - from.getTime())), to: from },
    };
  }

  /** The ownerId filter is an ADMIN-only lens; managers always see studio-wide numbers. */
  private resolveOwnerFilter(query: AnalyticsQueryDto, actor: SafeUser): string | undefined {
    if (!query.ownerId) {
      return undefined;
    }
    if (actor.role !== Role.ADMIN) {
      throw new ForbiddenException('Only an admin can filter analytics by owner');
    }
    return query.ownerId;
  }
}
