export type Theme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'crm-theme';

function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark';
}

export function readStoredTheme(): Theme | null {
  const stored: unknown = localStorage.getItem(THEME_STORAGE_KEY);
  return isTheme(stored) ? stored : null;
}

export function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** The stored choice wins; the system preference is only the first-visit default. */
export function resolveInitialTheme(): Theme {
  return readStoredTheme() ?? getSystemTheme();
}

/** Must track --background in index.css: the browser chrome should not seam against the page. */
const THEME_COLORS: Record<Theme, string> = {
  light: '#fdfdff',
  dark: '#0d1013',
};

export function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  // Keeps native controls (scrollbars, form widgets) in the same theme as the app.
  root.style.colorScheme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLORS[theme]);
}
