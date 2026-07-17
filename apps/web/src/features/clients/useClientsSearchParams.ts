import type { ClientSource } from '@crm/shared';
import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  CLIENT_SORT_FIELDS,
  type ClientSortField,
  type ClientsListParams,
  type SortOrder,
} from './clients.types';

const DEFAULT_LIMIT = 20;
const DEFAULT_SORT_BY: ClientSortField = 'createdAt';
const DEFAULT_SORT_ORDER: SortOrder = 'desc';

function isClientSortField(value: string | null): value is ClientSortField {
  return value !== null && (CLIENT_SORT_FIELDS as readonly string[]).includes(value);
}

function isSortOrder(value: string | null): value is SortOrder {
  return value === 'asc' || value === 'desc';
}

/**
 * The table's entire query state (page, sort, search, filters) lives in the URL — that is
 * what makes a filtered view shareable by link and durable across a reload. Defaults are
 * never written to the URL, only deviations from them, so the shared link stays short.
 */
export function useClientsSearchParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = Number(searchParams.get('page') ?? '1') || 1;
  const limit = Number(searchParams.get('limit') ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT;
  const sortByRaw = searchParams.get('sortBy');
  const sortOrderRaw = searchParams.get('sortOrder');
  const sortBy = isClientSortField(sortByRaw) ? sortByRaw : DEFAULT_SORT_BY;
  const sortOrder = isSortOrder(sortOrderRaw) ? sortOrderRaw : DEFAULT_SORT_ORDER;
  const search = searchParams.get('search') ?? '';
  const source = (searchParams.get('source') ?? undefined) as ClientSource | undefined;
  const ownerId = searchParams.get('ownerId') ?? undefined;

  const params: ClientsListParams = useMemo(
    () => ({
      page,
      limit,
      sortBy,
      sortOrder,
      search: search === '' ? undefined : search,
      source,
      ownerId,
    }),
    [page, limit, sortBy, sortOrder, search, source, ownerId],
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

  const setPage = useCallback(
    (nextPage: number) => {
      patch({ page: nextPage > 1 ? String(nextPage) : undefined }, { resetPage: false });
    },
    [patch],
  );

  const setSearch = useCallback(
    (nextSearch: string) => {
      patch({ search: nextSearch });
    },
    [patch],
  );

  const setSource = useCallback(
    (nextSource: ClientSource | undefined) => {
      patch({ source: nextSource });
    },
    [patch],
  );

  const setOwnerId = useCallback(
    (nextOwnerId: string | undefined) => {
      patch({ ownerId: nextOwnerId });
    },
    [patch],
  );

  const setSorting = useCallback(
    (nextSortBy: ClientSortField, nextSortOrder: SortOrder) => {
      patch({
        sortBy: nextSortBy === DEFAULT_SORT_BY ? undefined : nextSortBy,
        sortOrder: nextSortOrder === DEFAULT_SORT_ORDER ? undefined : nextSortOrder,
      });
    },
    [patch],
  );

  return { params, setPage, setSearch, setSource, setOwnerId, setSorting };
}
