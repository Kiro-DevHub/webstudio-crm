import type { Role } from '@crm/shared';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';

/**
 * Hiding a nav item is cosmetics; this is what actually keeps a manager out of /settings
 * when they type the URL. The API enforces the same rule again — this is not the boundary.
 */
export function RoleRoute({ allow }: { allow: Role[] }) {
  const { user } = useAuth();

  if (user === null || !allow.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
