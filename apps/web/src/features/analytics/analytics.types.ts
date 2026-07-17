import type { ActivityType, DealStage } from '@crm/shared';

/** The period + owner lens every analytics endpoint is scoped by. */
export interface AnalyticsParams {
  /** ISO date, inclusive. */
  from: string;
  /** ISO date, exclusive. */
  to: string;
  /** ADMIN-only owner filter; managers always see studio-wide numbers. */
  ownerId?: string;
}

/** A metric value plus its change vs the previous period of the same length. */
export interface MetricWithDelta {
  value: number;
  /** Percent change vs the previous period; null when the previous value was 0. */
  deltaPct: number | null;
}

export interface AnalyticsSummary {
  period: { from: string; to: string };
  revenue: MetricWithDelta;
  newDeals: MetricWithDelta;
  conversionRate: MetricWithDelta;
  avgWonAmount: MetricWithDelta;
  activeDeals: MetricWithDelta;
  overdueTasks: MetricWithDelta;
}

export interface RevenueByMonthPoint {
  /** Calendar month formatted as `YYYY-MM`. */
  month: string;
  /** Sum of WON deal amounts (kopecks) closed in that month. */
  revenue: number;
  dealsWon: number;
}

export interface FunnelStage {
  stage: DealStage;
  /** Deals created in the period currently sitting on this stage. */
  count: number;
  /** Their total amount in kopecks. */
  amount: number;
}

export interface TopManager {
  id: string;
  name: string;
  avatarColor: string;
  /** Sum of WON deal amounts (kopecks) closed within the period. */
  revenue: number;
  dealsWon: number;
  newDeals: number;
  /** WON / (WON + LOST) among their closed deals, in percent; null when none closed. */
  conversionRate: number | null;
}

export interface LostReason {
  reason: string;
  count: number;
}

export interface RecentActivityEntry {
  id: string;
  type: ActivityType;
  payload: Record<string, unknown>;
  createdAt: string;
  user: { id: string; name: string; avatarColor: string };
  deal: { id: string; title: string } | null;
  client: { id: string; companyName: string } | null;
}
