import type { LoginInput } from './auth.types';

/**
 * Configured through .env so the shortcut simply does not exist where it is not wanted.
 * These are seed credentials, not a secret — anything in a VITE_ var ships to the browser.
 */
export function getDemoCredentials(): LoginInput | null {
  const email = import.meta.env.VITE_DEMO_EMAIL;
  const password = import.meta.env.VITE_DEMO_PASSWORD;
  if (email === undefined || email === '' || password === undefined || password === '') {
    return null;
  }
  return { email, password };
}
