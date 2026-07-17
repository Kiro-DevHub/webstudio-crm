import { api } from '@/lib/api';
import type {
  AnalyticsParams,
  AnalyticsSummary,
  FunnelStage,
  LostReason,
  RecentActivityEntry,
  RevenueByMonthPoint,
  TopManager,
} from './analytics.types';

/**
 * Every widget keys on the same params, so changing the period (or the owner lens)
 * changes every key at once and all six widgets refetch together.
 */
export const analyticsKeys = {
  all: ['analytics'] as const,
  summary: (params: AnalyticsParams) => ['analytics', 'summary', params] as const,
  revenue: (params: AnalyticsParams) => ['analytics', 'revenue-by-month', params] as const,
  funnel: (params: AnalyticsParams) => ['analytics', 'funnel', params] as const,
  topManagers: (params: AnalyticsParams) => ['analytics', 'top-managers', params] as const,
  recentActivity: (params: AnalyticsParams) => ['analytics', 'recent-activity', params] as const,
  lostReasons: (params: AnalyticsParams) => ['analytics', 'lost-reasons', params] as const,
};

export async function fetchSummary(params: AnalyticsParams): Promise<AnalyticsSummary> {
  const { data } = await api.get<AnalyticsSummary>('/analytics/summary', { params });
  return data;
}

export async function fetchRevenueByMonth(params: AnalyticsParams): Promise<RevenueByMonthPoint[]> {
  const { data } = await api.get<RevenueByMonthPoint[]>('/analytics/revenue-by-month', { params });
  return data;
}

export async function fetchFunnel(params: AnalyticsParams): Promise<FunnelStage[]> {
  const { data } = await api.get<FunnelStage[]>('/analytics/funnel', { params });
  return data;
}

export async function fetchTopManagers(params: AnalyticsParams): Promise<TopManager[]> {
  const { data } = await api.get<TopManager[]>('/analytics/top-managers', { params });
  return data;
}

export async function fetchRecentActivity(params: AnalyticsParams): Promise<RecentActivityEntry[]> {
  const { data } = await api.get<RecentActivityEntry[]>('/analytics/recent-activity', { params });
  return data;
}

export async function fetchLostReasons(params: AnalyticsParams): Promise<LostReason[]> {
  const { data } = await api.get<LostReason[]>('/analytics/lost-reasons', { params });
  return data;
}
