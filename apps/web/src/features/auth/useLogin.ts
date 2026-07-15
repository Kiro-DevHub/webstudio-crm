import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authKeys, loginRequest } from './auth.api';
import type { AuthUser, LoginInput } from './auth.types';

export function useLogin(onSuccess: (user: AuthUser) => void) {
  const queryClient = useQueryClient();

  return useMutation<AuthUser, unknown, LoginInput>({
    mutationFn: loginRequest,
    onSuccess: (user) => {
      // Login already fetched the user; seeding the cache spares /auth/me a second round trip.
      queryClient.setQueryData(authKeys.me, user);
      onSuccess(user);
    },
  });
}
