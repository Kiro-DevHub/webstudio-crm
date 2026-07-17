import { formatNumber } from '@/lib/labels';
import type { LostReason } from './analytics.types';

interface LostReasonsCardProps {
  data: LostReason[];
}

/**
 * Why deals were lost in the period, most common first. A single count series, so one calm
 * neutral bar — red stays reserved for the LOST state itself, and the accent isn't spent on
 * context. Counts are labelled inline, so the bar only aids the ranking.
 */
export function LostReasonsCard({ data }: LostReasonsCardProps) {
  const max = Math.max(1, ...data.map((reason) => reason.count));

  return (
    <ul className="flex flex-col gap-2.5">
      {data.map((reason) => (
        <li key={reason.reason} className="flex flex-col gap-1">
          <div className="flex items-baseline justify-between gap-2 text-xs">
            <span className="truncate">{reason.reason}</span>
            <span className="tabular shrink-0 font-mono text-foreground">
              {formatNumber(reason.count)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-foreground/25"
              style={{ width: `${(reason.count / max) * 100}%`, minWidth: '0.5rem' }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
