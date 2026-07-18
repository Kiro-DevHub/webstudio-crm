import { useQuery } from '@tanstack/react-query';
import { clientsKeys, fetchClients } from '@/features/clients/clients.api';
import type { ClientListItem } from '@/features/clients/clients.types';
import { dealsKeys, fetchDeals } from '@/features/deals/deals.api';
import type { DealListItem } from '@/features/deals/deals.types';

const RESULT_LIMIT = 5;

/**
 * Reuses the clients/deals list endpoints (same `search` param the toolbars use) instead of a
 * dedicated search endpoint — both entities already support it, so a topbar-only backend
 * wouldn't add anything but a second place to keep the matching logic in sync.
 */
export function useGlobalSearch(query: string) {
  const enabled = query.trim() !== '';

  const clientsParams = {
    page: 1,
    limit: RESULT_LIMIT,
    sortBy: 'createdAt' as const,
    sortOrder: 'desc' as const,
    search: query,
  };
  const dealsParams = {
    page: 1,
    limit: RESULT_LIMIT,
    sortBy: 'createdAt' as const,
    sortOrder: 'desc' as const,
    search: query,
  };

  const clientsQuery = useQuery({
    queryKey: clientsKeys.list(clientsParams),
    queryFn: () => fetchClients(clientsParams),
    enabled,
  });

  const dealsQuery = useQuery({
    queryKey: dealsKeys.list(dealsParams),
    queryFn: () => fetchDeals(dealsParams),
    enabled,
  });

  const clients: ClientListItem[] = enabled ? (clientsQuery.data?.data ?? []) : [];
  const deals: DealListItem[] = enabled ? (dealsQuery.data?.data ?? []) : [];

  return {
    clients,
    deals,
    isLoading: enabled && (clientsQuery.isLoading || dealsQuery.isLoading),
    hasResults: clients.length > 0 || deals.length > 0,
  };
}
