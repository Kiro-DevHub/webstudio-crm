import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { formatDeltaPct } from '@/lib/labels';
import { cn } from '@/lib/utils';
import type { MetricWithDelta } from './analytics.types';

interface KpiCardProps {
  label: string;
  metric: MetricWithDelta;
  /** Turns the raw metric value into its display string (money, count, percent). */
  format: (value: number) => string;
}

/**
 * One stat tile: a sentence-case label, the value in proportional sans, and a delta vs the
 * previous period. Up is good for every metric here, so a rise is success-green and a fall is
 * destructive-red; a null delta (no prior value to compare) reads as a muted dash.
 */
export function KpiCard({ label, metric, format }: KpiCardProps) {
  const { value, deltaPct } = metric;
  const direction =
    deltaPct === null ? 'none' : deltaPct > 0 ? 'up' : deltaPct < 0 ? 'down' : 'flat';
  const Icon = direction === 'up' ? ArrowUpRight : direction === 'down' ? ArrowDownRight : Minus;

  return (
    <div className="flex flex-col gap-2 rounded-xl bg-card p-4 text-card-foreground ring-1 ring-foreground/10">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tracking-tight">{format(value)}</span>
      <span
        className={cn(
          'inline-flex items-center gap-1 font-mono text-xs',
          direction === 'up' && 'text-success',
          direction === 'down' && 'text-destructive',
          (direction === 'flat' || direction === 'none') && 'text-muted-foreground',
        )}
        title="Изменение к предыдущему периоду такой же длины"
      >
        <Icon aria-hidden="true" className="size-3.5" />
        {deltaPct === null ? (
          <span>
            нет данных<span className="sr-only"> для сравнения с прошлым периодом</span>
          </span>
        ) : (
          <>
            <span className="tabular">{formatDeltaPct(deltaPct)}</span>
            <span className="text-muted-foreground">к пред. периоду</span>
          </>
        )}
      </span>
    </div>
  );
}
