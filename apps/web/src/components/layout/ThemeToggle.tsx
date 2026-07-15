import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/features/theme/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const goingDark = theme === 'light';

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={goingDark ? 'Включить тёмную тему' : 'Включить светлую тему'}
    >
      {goingDark ? (
        <Moon aria-hidden="true" strokeWidth={1.75} />
      ) : (
        <Sun aria-hidden="true" strokeWidth={1.75} />
      )}
    </Button>
  );
}
