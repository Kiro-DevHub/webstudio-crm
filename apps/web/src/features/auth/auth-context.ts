import { createContext } from 'react';
import type { AuthUser } from './auth.types';

/**
 * Context carries only identity and the logout action. Everything the server owns
 * stays in TanStack Query under ['auth', 'me'].
 */
export interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  logout: () => void;
  isLoggingOut: boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
