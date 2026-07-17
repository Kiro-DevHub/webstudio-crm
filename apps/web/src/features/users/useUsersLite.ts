import { useQuery } from '@tanstack/react-query';
import { fetchUsersLite, usersKeys } from './users.api';

/** Owners/managers change rarely, so this can stay cached across the whole session. */
export function useUsersLite() {
  return useQuery({
    queryKey: usersKeys.lite,
    queryFn: fetchUsersLite,
    staleTime: 5 * 60_000,
  });
}
