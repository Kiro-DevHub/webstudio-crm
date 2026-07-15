import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/useAuth';
import { visibleNavItems } from './nav-items';

interface SidebarNavProps {
  collapsed?: boolean;
  /** Lets the mobile drawer close itself once navigation happens. */
  onNavigate?: () => void;
}

export function SidebarNav({ collapsed = false, onNavigate }: SidebarNavProps) {
  const { user } = useAuth();
  const items = visibleNavItems(user?.role);

  return (
    <nav aria-label="Основная навигация" className="flex flex-col gap-0.5 p-2">
      {items.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          onClick={onNavigate}
          // NavLink sets aria-current="page" on the active item on its own.
          className={({ isActive }) =>
            cn(
              'group relative flex h-8 items-center rounded-md text-sm outline-none transition-colors motion-reduce:transition-none',
              'focus-visible:ring-3 focus-visible:ring-ring/50',
              collapsed ? 'justify-center px-0' : 'gap-2.5 px-2',
              isActive
                ? 'bg-sidebar-accent font-medium text-sidebar-accent-foreground'
                : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              {/* Marks the active item without relying on colour alone. */}
              <span
                aria-hidden="true"
                className={cn(
                  'absolute left-0 h-4 w-0.5 rounded-r-full bg-primary transition-opacity',
                  isActive ? 'opacity-100' : 'opacity-0',
                )}
              />
              <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={1.75} />
              <span className={cn(collapsed && 'sr-only')}>{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
