import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { AnalyticsParams } from './analytics.types';

export const PERIOD_MONTHS = [3, 6, 12] as const;
export type PeriodMonths = (typeof PERIOD_MONTHS)[number];

const DEFAULT_MONTHS: PeriodMonths = 6;

function isPeriodMonths(value: number): value is PeriodMonths {
  return (PERIOD_MONTHS as readonly number[]).includes(value);
}

/** A local date as a `YYYY-MM-DD` string — date-only keeps the query key stable within a day. */
function toDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * The dashboard's scope lives in the URL: `period` (3/6/12 months back from today) and,
 * for ADMIN, `ownerId`. `from`/`to` are derived date-only bounds so every widget shares one
 * stable key — changing the period changes that key and refetches all of them at once.
 */
export function useDashboardParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const monthsRaw = Number(searchParams.get('period'));
  const months: PeriodMonths = isPeriodMonths(monthsRaw) ? monthsRaw : DEFAULT_MONTHS;
  const ownerId = searchParams.get('ownerId') ?? undefined;

  const params: AnalyticsParams = useMemo(() => {
    const to = new Date();
    const from = new Date(to);
    from.setMonth(from.getMonth() - months);
    return { from: toDateOnly(from), to: toDateOnly(to), ownerId };
  }, [months, ownerId]);

  const patch = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          for (const [key, value] of Object.entries(updates)) {
            if (value === undefined || value === '') {
              next.delete(key);
            } else {
              next.set(key, value);
            }
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setMonths = useCallback(
    (next: PeriodMonths) => {
      patch({ period: next === DEFAULT_MONTHS ? undefined : String(next) });
    },
    [patch],
  );

  const setOwnerId = useCallback(
    (next: string | undefined) => {
      patch({ ownerId: next });
    },
    [patch],
  );

  return { params, months, ownerId, setMonths, setOwnerId };
}
