import { Activity, DealStage } from '@prisma/client';
import { SafeUser } from '../../common/types/user.types';

/** A metric value plus its change vs the previous period of the same length. */
export interface MetricWithDelta {
  value: number;
  /** Percent change vs the previous period; null when the previous value is 0. */
  deltaPct: number | null;
}

export interface AnalyticsSummary {
  period: { from: string; to: string };
  /** Sum of WON deal amounts (kopecks) closed within the period. */
  revenue: MetricWithDelta;
  /** Deals created within the period. */
  newDeals: MetricWithDelta;
  /** WON / (WON + LOST) among deals closed within the period, in percent. */
  conversionRate: MetricWithDelta;
  /** Average WON deal amount (kopecks) closed within the period. */
  avgWonAmount: MetricWithDelta;
  /** Deals still in an open stage at the end of the period. */
  activeDeals: MetricWithDelta;
  /** Unfinished tasks whose due date fell inside the period and has passed. */
  overdueTasks: MetricWithDelta;
}

export interface RevenueByMonthPoint {
  /** Calendar month formatted as YYYY-MM. */
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
  /** Deals created within the period. */
  newDeals: number;
  /** WON / (WON + LOST) among their deals closed in the period; null when none closed. */
  conversionRate: number | null;
}

export type RecentActivityEntry = Activity & {
  user: SafeUser;
  deal: { id: string; title: string } | null;
  client: { id: string; companyName: string } | null;
};

export interface LostReason {
  reason: string;
  count: number;
}
