import { useCallback, useMemo, useState, type ReactNode } from 'react';
import { applyTheme, resolveInitialTheme, THEME_STORAGE_KEY, type Theme } from './theme';
import { ThemeContext, type ThemeContextValue } from './theme-context';

export function ThemeProvider({ children }: { children: ReactNode }) {
  // The inline script in index.html has already applied this same theme before first paint,
  // so reading it here only syncs React state — it never causes a flash.
  const [theme, setTheme] = useState<Theme>(resolveInitialTheme);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: Theme = current === 'dark' ? 'light' : 'dark';
      applyTheme(next);
      localStorage.setItem(THEME_STORAGE_KEY, next);
      return next;
    });
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({ theme, toggleTheme }), [theme, toggleTheme]);

  return <ThemeContext value={value}>{children}</ThemeContext>;
}
