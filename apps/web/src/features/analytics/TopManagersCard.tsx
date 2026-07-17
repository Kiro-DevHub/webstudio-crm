import { UserAvatar } from '@/components/layout/UserAvatar';
import { formatMoneyCompact, formatNumber, formatPercent } from '@/lib/labels';
import type { TopManager } from './analytics.types';

interface TopManagersCardProps {
  data: TopManager[];
}

/**
 * Managers ranked by WON revenue. One series, so one hue — the cobalt accent for every bar;
 * length carries the ranking, colour is identity, not value. Revenue and deal count sit on the
 * row, so the bar is a visual aid rather than the only way to read the number.
 */
export function TopManagersCard({ data }: TopManagersCardProps) {
  const max = Math.max(1, ...data.map((manager) => manager.revenue));

  return (
    <ul className="flex flex-col divide-y divide-border">
      {data.map((manager) => (
        <li key={manager.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
          <UserAvatar
            name={manager.name}
            color={manager.avatarColor}
            className="size-7 text-[10px]"
          />
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-sm">{manager.name}</span>
              <span className="tabular shrink-0 font-mono text-sm">
                {formatMoneyCompact(manager.revenue)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${(manager.revenue / max) * 100}%`,
                  minWidth: manager.revenue > 0 ? '0.375rem' : 0,
                }}
              />
            </div>
            <span className="tabular font-mono text-xs text-muted-foreground">
              {formatNumber(manager.dealsWon)} выигр. · {formatNumber(manager.newDeals)} новых ·{' '}
              {manager.conversionRate === null
                ? 'без закрытых'
                : `конверсия ${formatPercent(manager.conversionRate)}`}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}
