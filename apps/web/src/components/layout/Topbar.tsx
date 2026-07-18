import { Menu as MenuIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AuthUser } from '@/features/auth/auth.types';
import { GlobalSearch } from '@/features/search/GlobalSearch';
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

      <GlobalSearch />

      <div className="ml-auto flex items-center gap-1">
        <ThemeToggle />
        <UserMenu user={user} />
      </div>
    </header>
  );
}
