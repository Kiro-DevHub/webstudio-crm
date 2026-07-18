import { CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const ACCESS_TOKEN_TTL = '15m';

/** Single source of truth for the refresh lifetime: JWT exp and cookie maxAge derive from it. */
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_SECONDS * 1000;

/**
 * Hardened cookie: JS cannot read it and it is scoped to /api/auth/* routes.
 *
 * The SameSite/Secure pair depends on the environment. In production the web app
 * (Vercel) and the API (Render) live on different registrable domains, so the
 * cookie must be SameSite=None to be sent on cross-site requests — and browsers
 * only accept SameSite=None together with Secure. In development the API is
 * reached over plain http (localhost / Vite proxy), where some browsers reject
 * Secure cookies, so Lax without Secure keeps local login working.
 */
export function buildRefreshCookieOptions(isProduction: boolean): CookieOptions {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/api/auth',
  };
}

/**
 * NODE_ENV comes from the runtime environment, not from .env: the API Dockerfile
 * and Render set NODE_ENV=production; local dev and jest leave it non-production.
 */
export const REFRESH_COOKIE_OPTIONS: CookieOptions = buildRefreshCookieOptions(
  process.env.NODE_ENV === 'production',
);
