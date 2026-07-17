import { keepPreviousData, useQuery } from '@tanstack/react-query';
import {
  analyticsKeys,
  fetchFunnel,
  fetchLostReasons,
  fetchRecentActivity,
  fetchRevenueByMonth,
  fetchSummary,
  fetchTopManagers,
} from './analytics.api';
import type { AnalyticsParams } from './analytics.types';

/**
 * One hook per widget: each owns its own request, cache entry and error state, so a
 * failing endpoint takes down only its card. `keepPreviousData` holds the last render
 * while a period change refetches — the dashboard reflows instead of flashing skeletons.
 */

export function useSummary(params: AnalyticsParams) {
  return useQuery({
    queryKey: analyticsKeys.summary(params),
    queryFn: () => fetchSummary(params),
    placeholderData: keepPreviousData,
  });
}

export function useRevenueByMonth(params: AnalyticsParams) {
  return useQuery({
    queryKey: analyticsKeys.revenue(params),
    queryFn: () => fetchRevenueByMonth(params),
    placeholderData: keepPreviousData,
  });
}

export function useFunnel(params: AnalyticsParams) {
  return useQuery({
    queryKey: analyticsKeys.funnel(params),
    queryFn: () => fetchFunnel(params),
    placeholderData: keepPreviousData,
  });
}

export function useTopManagers(params: AnalyticsParams) {
  return useQuery({
    queryKey: analyticsKeys.topManagers(params),
    queryFn: () => fetchTopManagers(params),
    placeholderData: keepPreviousData,
  });
}

export function useRecentActivity(params: AnalyticsParams) {
  return useQuery({
    queryKey: analyticsKeys.recentActivity(params),
    queryFn: () => fetchRecentActivity(params),
    placeholderData: keepPreviousData,
  });
}

export function useLostReasons(params: AnalyticsParams) {
  return useQuery({
    queryKey: analyticsKeys.lostReasons(params),
    queryFn: () => fetchLostReasons(params),
    placeholderData: keepPreviousData,
  });
}
