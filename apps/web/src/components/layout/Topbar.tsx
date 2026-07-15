import { Menu as MenuIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AuthUser } from '@/features/auth/auth.types';
import { ThemeToggle } from './ThemeToggle';
import { UserMenu } from './UserMenu';

interface TopbarProps {
  user: AuthUser;
  onOpenMobileNav: () => void;
}

export function Topbar({ user, onOpenMobileNav }: TopbarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background px-3">
      <Button
        variant="ghost"
        size="icon-sm"
        className="lg:hidden"
        onClick={onOpenMobileNav}
        aria-label="Открыть меню"
      >
        <MenuIcon aria-hidden="true" strokeWidth={1.75} />
      </Button>

      <div className="relative w-full max-w-72">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          strokeWidth={1.75}
        />
        {/* Disabled on purpose: search arrives with the data stages, and a control that
            looks live but does nothing is worse than one that says it is not ready. */}
        <Input
          type="search"
          disabled
          placeholder="Поиск (скоро)"
          aria-label="Поиск по CRM (появится позже)"
          className="pl-8"
        />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
