import { Menu } from '@base-ui/react/menu';
import { Role } from '@crm/shared';
import { ChevronDown, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/features/auth/useAuth';
import type { AuthUser } from '@/features/auth/auth.types';
import { UserAvatar } from './UserAvatar';

const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: 'Администратор',
  [Role.MANAGER]: 'Менеджер',
};

export function UserMenu({ user }: { user: AuthUser }) {
  const { logout, isLoggingOut } = useAuth();

  return (
    <Menu.Root>
      <Menu.Trigger
        render={
          <Button variant="ghost" size="sm" className="gap-2 pr-1.5 pl-1">
            <UserAvatar name={user.name} color={user.avatarColor} />
            <span className="hidden max-w-32 truncate sm:inline">{user.name}</span>
            <ChevronDown aria-hidden="true" className="opacity-60" strokeWidth={1.75} />
          </Button>
        }
      />
      <Menu.Portal>
        <Menu.Positioner sideOffset={6} align="end" className="z-50">
          <Menu.Popup className="min-w-56 rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none">
            <div className="flex items-center gap-2.5 px-2 py-1.5">
              <UserAvatar name={user.name} color={user.avatarColor} className="size-8 text-xs" />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>

            <div className="px-2 pb-1.5 text-xs text-muted-foreground">
              {ROLE_LABELS[user.role]}
            </div>

            <Separator className="-mx-1 my-1" />

            <Menu.Item
              onClick={logout}
              disabled={isLoggingOut}
              className="flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-sm outline-none select-none data-disabled:opacity-50 data-highlighted:bg-destructive/10 data-highlighted:text-destructive"
            >
              <LogOut aria-hidden="true" className="size-4" strokeWidth={1.75} />
              {isLoggingOut ? 'Выходим…' : 'Выйти'}
            </Menu.Item>
          </Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}
