import { Role } from '@crm/shared';
import { Route, Routes } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AuthProvider } from '@/features/auth/AuthProvider';
import { ProtectedRoute } from '@/routes/ProtectedRoute';
import { RoleRoute } from '@/routes/RoleRoute';
import { ClientsPage } from '@/pages/ClientsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DealsPage } from '@/pages/DealsPage';
import { LoginPage } from '@/pages/LoginPage';
import { NotFoundPage } from '@/pages/NotFoundPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { TasksPage } from '@/pages/TasksPage';

function App() {
  return (
    // Inside the router: AuthProvider navigates when a session ends.
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="clients" element={<ClientsPage />} />
            <Route path="deals" element={<DealsPage />} />
            <Route path="tasks" element={<TasksPage />} />

            <Route element={<RoleRoute allow={[Role.ADMIN]} />}>
              <Route path="settings" element={<SettingsPage />} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
