import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Brand } from './Brand';
import { SidebarNav } from './SidebarNav';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

/** Desktop rail. On mobile the same nav is rendered inside MobileNavDrawer instead. */
export function Sidebar({ collapsed, onToggleCollapse }: SidebarProps) {
  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 motion-reduce:transition-none lg:flex',
        collapsed ? 'w-14' : 'w-60',
      )}
    >
      <div className={cn('flex h-12 items-center border-b border-sidebar-border px-3')}>
        <Brand collapsed={collapsed} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <SidebarNav collapsed={collapsed} />
      </div>

      <div className={cn('border-t border-sidebar-border p-2', collapsed && 'flex justify-center')}>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleCollapse}
          aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}
        >
          {collapsed ? (
            <PanelLeftOpen aria-hidden="true" strokeWidth={1.75} />
          ) : (
            <PanelLeftClose aria-hidden="true" strokeWidth={1.75} />
          )}
        </Button>
      </div>
    </aside>
  );
}
