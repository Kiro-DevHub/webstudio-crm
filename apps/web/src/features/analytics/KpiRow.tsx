import { Skeleton } from '@/components/ui/skeleton';
import { formatMoneyCompact, formatNumber, formatPercent } from '@/lib/labels';
import type { AnalyticsParams, AnalyticsSummary } from './analytics.types';
import { KpiCard } from './KpiCard';
import { useSummary } from './useAnalytics';
import { WidgetError } from './WidgetError';

/** The four headline metrics, in reading order: money earned, deals in, how many close, size. */
const KPIS: {
  key: keyof Omit<AnalyticsSummary, 'period'>;
  label: string;
  format: (value: number) => string;
}[] = [
  { key: 'revenue', label: 'Выручка (выигранные)', format: formatMoneyCompact },
  { key: 'newDeals', label: 'Новые сделки', format: formatNumber },
  { key: 'conversionRate', label: 'Конверсия в продажу', format: formatPercent },
  { key: 'avgWonAmount', label: 'Средний чек', format: formatMoneyCompact },
];

interface KpiRowProps {
  params: AnalyticsParams;
}

/** The summary is one request feeding four tiles, so it loads and fails as a single unit. */
export function KpiRow({ params }: KpiRowProps) {
  const { data, isLoading, isError, isFetching, refetch } = useSummary(params);

  if (isError) {
    return (
      <div className="rounded-xl bg-card ring-1 ring-foreground/10">
        <WidgetError subject="показатели" onRetry={() => void refetch()} />
      </div>
    );
  }

  return (
    <div
      className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 ${
        isFetching && !isLoading ? 'opacity-60 transition-opacity' : ''
      }`}
    >
      {isLoading || data === undefined
        ? KPIS.map((kpi) => (
            <div
              key={kpi.key}
              className="flex flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
            >
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-7 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
          ))
        : KPIS.map((kpi) => (
            <KpiCard key={kpi.key} label={kpi.label} metric={data[kpi.key]} format={kpi.format} />
          ))}
    </div>
  );
}
