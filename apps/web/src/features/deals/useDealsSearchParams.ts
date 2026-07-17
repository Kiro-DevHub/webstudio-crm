import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { SortOrder } from '@/lib/pagination';
import {
  DEAL_SORT_FIELDS,
  type DealSortField,
  type DealsBoardParams,
  type DealsListParams,
} from './deals.types';

const DEFAULT_LIMIT = 20;
const DEFAULT_SORT_BY: DealSortField = 'createdAt';
const DEFAULT_SORT_ORDER: SortOrder = 'desc';

export type DealsView = 'board' | 'table';

function isDealSortField(value: string | null): value is DealSortField {
  return value !== null && (DEAL_SORT_FIELDS as readonly string[]).includes(value);
}

function isSortOrder(value: string | null): value is SortOrder {
  return value === 'asc' || value === 'desc';
}

/**
 * Same contract as the clients table: the URL is the source of truth for view, filters,
 * page and sort, and only deviations from the defaults are written into it.
 */
export function useDealsSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const view: DealsView = searchParams.get('view') === 'table' ? 'table' : 'board';
  const search = searchParams.get('search') ?? '';
  const ownerId = searchParams.get('ownerId') ?? undefined;
  const clientId = searchParams.get('clientId') ?? undefined;
  const page = Number(searchParams.get('page') ?? '1') || 1;
  const sortByRaw = searchParams.get('sortBy');
  const sortOrderRaw = searchParams.get('sortOrder');
  const sortBy = isDealSortField(sortByRaw) ? sortByRaw : DEFAULT_SORT_BY;
  const sortOrder = isSortOrder(sortOrderRaw) ? sortOrderRaw : DEFAULT_SORT_ORDER;

  const boardParams: DealsBoardParams = useMemo(
    () => ({
      search: search === '' ? undefined : search,
      ownerId,
      clientId,
    }),
    [search, ownerId, clientId],
  );

  const listParams: DealsListParams = useMemo(
    () => ({
      ...boardParams,
      page,
      limit: DEFAULT_LIMIT,
      sortBy,
      sortOrder,
    }),
    [boardParams, page, sortBy, sortOrder],
  );

  const patch = useCallback(
    (updates: Record<string, string | undefined>, options?: { resetPage?: boolean }) => {
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
          if (options?.resetPage !== false) {
            next.delete('page');
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setView = useCallback(
    (nextView: DealsView) => {
      patch({ view: nextView === 'board' ? undefined : nextView });
    },
    [patch],
  );

  const setSearch = useCallback(
    (nextSearch: string) => {
      patch({ search: nextSearch });
    },
    [patch],
  );

  const setOwnerId = useCallback(
    (nextOwnerId: string | undefined) => {
      patch({ ownerId: nextOwnerId });
    },
    [patch],
  );

  const setClientId = useCallback(
    (nextClientId: string | undefined) => {
      patch({ clientId: nextClientId });
    },
    [patch],
  );

  const setPage = useCallback(
    (nextPage: number) => {
      patch({ page: nextPage > 1 ? String(nextPage) : undefined }, { resetPage: false });
    },
    [patch],
  );

  const setSorting = useCallback(
    (nextSortBy: DealSortField, nextSortOrder: SortOrder) => {
      patch({
        sortBy: nextSortBy === DEFAULT_SORT_BY ? undefined : nextSortBy,
        sortOrder: nextSortOrder === DEFAULT_SORT_ORDER ? undefined : nextSortOrder,
      });
    },
    [patch],
  );

  return {
    view,
    search,
    ownerId,
    clientId,
    boardParams,
    listParams,
    setView,
    setSearch,
    setOwnerId,
    setClientId,
    setPage,
    setSorting,
  };
}
