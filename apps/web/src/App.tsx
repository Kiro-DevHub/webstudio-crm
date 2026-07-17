import { Role } from '@crm/shared';
import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { FullPageSpinner } from '@/components/FullPageSpinner';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RoleRoute } from '@/routes/RoleRoute';

// Route-level code splitting: each page is its own chunk, so recharts (dashboard), dnd-kit
// (deals) and the table code load only when their route is opened. The layout shell stays eager.
const LoginPage = lazy(() => import('@/pages/LoginPage').then((m) => ({ default: m.LoginPage })));
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
);
const ClientsPage = lazy(() =>
  import('@/pages/ClientsPage').then((m) => ({ default: m.ClientsPage })),
);
const DealsPage = lazy(() => import('@/pages/DealsPage').then((m) => ({ default: m.DealsPage })));
const DealPage = lazy(() => import('@/pages/DealPage').then((m) => ({ default: m.DealPage })));
const TasksPage = lazy(() => import('@/pages/TasksPage').then((m) => ({ default: m.TasksPage })));
const SettingsPage = lazy(() =>
  import('@/pages/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const NotFoundPage = lazy(() =>
  import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })),
);

function App() {
  return (
    // Inside the router: AuthProvider navigates when a session ends.
    <AuthProvider>
      {/* Outer boundary for the login route (which has no layout shell); protected pages resolve
          against the inner boundary in AppLayout, so their sidebar survives a chunk load. */}
      <Suspense fallback={<FullPageSpinner />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="clients" element={<ClientsPage />} />
              <Route path="deals" element={<DealsPage />} />
              <Route path="deals/:id" element={<DealPage />} />
              <Route path="tasks" element={<TasksPage />} />

              <Route element={<RoleRoute allow={[Role.ADMIN]} />}>
                <Route path="settings" element={<SettingsPage />} />
              </Route>

              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}

export default App;
