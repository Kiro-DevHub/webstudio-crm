import { useCallback, useEffect, useMemo, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { resetUnauthorizedHandler, setUnauthorizedHandler } from '@/lib/api';
import { authKeys, fetchMeOrNull, logoutRequest } from './auth.api';
import { AuthContext, type AuthContextValue } from './auth-context';

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user = null, isPending } = useQuery({
    queryKey: authKeys.me,
    queryFn: fetchMeOrNull,
    retry: false,
    staleTime: Infinity,
  });

  /** Ends the session locally: the cache must not outlive the user who loaded it. */
  const endSession = useCallback(() => {
    queryClient.clear();
    // Seeded after clear() so the still-mounted 'me' observer settles on "logged out"
    // instead of immediately refetching against a session that is already gone.
    queryClient.setQueryData(authKeys.me, null);
    void navigate('/login', { replace: true });
  }, [navigate, queryClient]);

  /** A refresh can fail behind any request, not just /auth/me — one exit for all of them. */
  useEffect(() => {
    setUnauthorizedHandler(endSession);
    return resetUnauthorizedHandler;
  }, [endSession]);

  const logoutMutation = useMutation({
    mutationFn: logoutRequest,
    onSettled: endSession,
  });

  const { mutate: logoutMutate } = logoutMutation;
  const logout = useCallback(() => {
    logoutMutate();
  }, [logoutMutate]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading: isPending, logout, isLoggingOut: logoutMutation.isPending }),
    [user, isPending, logout, logoutMutation.isPending],
  );

  return <AuthContext value={value}>{children}</AuthContext>;
}
