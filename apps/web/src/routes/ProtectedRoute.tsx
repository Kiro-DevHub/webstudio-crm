import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { FullPageSpinner } from '@/components/FullPageSpinner';

export function ProtectedRoute() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  // On a reload the session is restored via the refresh cookie; redirecting before that
  // resolves would bounce a signed-in user to /login on every refresh.
  if (isLoading) return <FullPageSpinner />;

  if (user === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return <Outlet />;
}
