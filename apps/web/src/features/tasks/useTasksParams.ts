import { TaskStatus } from '@crm/shared';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { MyTasksParams } from './tasks.types';

function isTaskStatus(value: string | null): value is TaskStatus {
  return value !== null && value in TaskStatus;
}

/**
 * The task filters live in the URL: `status`, `overdue`, and `dealId`. `assigneeId` is not a
 * filter — it is pinned to the current user, so the caller passes it in.
 */
export function useTasksParams(assigneeId: string) {
  const [searchParams, setSearchParams] = useSearchParams();

  const statusRaw = searchParams.get('status');
  const status = isTaskStatus(statusRaw) ? statusRaw : undefined;
  const overdue = searchParams.get('overdue') === 'true';
  const dealId = searchParams.get('dealId') ?? undefined;

  const params: MyTasksParams = useMemo(
    () => ({ assigneeId, status, overdue: overdue ? true : undefined, dealId }),
    [assigneeId, status, overdue, dealId],
  );

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

  const setStatus = useCallback(
    (next: TaskStatus | undefined) => {
      patch({ status: next });
    },
    [patch],
  );

  const setOverdue = useCallback(
    (next: boolean) => {
      patch({ overdue: next ? 'true' : undefined });
    },
    [patch],
  );

  const setDealId = useCallback(
    (next: string | undefined) => {
      patch({ dealId: next });
    },
    [patch],
  );

  const hasFilters = status !== undefined || overdue || dealId !== undefined;
  const clear = useCallback(() => {
    patch({ status: undefined, overdue: undefined, dealId: undefined });
  }, [patch]);

  return { params, status, overdue, dealId, hasFilters, setStatus, setOverdue, setDealId, clear };
}
