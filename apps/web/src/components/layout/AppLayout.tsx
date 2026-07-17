import { useCallback, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { MobileNavDrawer } from './MobileNavDrawer';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';

const COLLAPSED_STORAGE_KEY = 'crm-sidebar-collapsed';

function readStoredCollapsed(): boolean {
  return localStorage.getItem(COLLAPSED_STORAGE_KEY) === 'true';
}

export function AppLayout() {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(readStoredCollapsed);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const toggleCollapse = useCallback(() => {
    setCollapsed((current) => {
      const next = !current;
      localStorage.setItem(COLLAPSED_STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  const openMobileNav = useCallback(() => {
    setMobileNavOpen(true);
  }, []);

  // ProtectedRoute guarantees a user; this only satisfies the type.
  if (user === null) return null;

  return (
    // h-dvh (not min-h): pages scroll inside <main>, and full-height layouts like the
    // deals board can rely on `h-full` to pin their own internal scroll areas.
    <div className="flex h-dvh bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-sm focus:text-primary-foreground"
      >
        Перейти к содержимому
      </a>

      <Sidebar collapsed={collapsed} onToggleCollapse={toggleCollapse} />
      <MobileNavDrawer open={mobileNavOpen} onOpenChange={setMobileNavOpen} />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar user={user} onOpenMobileNav={openMobileNav} />
        <main id="main" className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
