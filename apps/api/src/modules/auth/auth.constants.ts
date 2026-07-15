import { CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = 'refreshToken';

export const ACCESS_TOKEN_TTL = '15m';

/** Single source of truth for the refresh lifetime: JWT exp and cookie maxAge derive from it. */
export const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;
export const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_SECONDS * 1000;

/**
 * Hardened cookie: JS cannot read it, it only travels over HTTPS
 * (browsers treat localhost as a secure context, so dev still works),
 * same-site only, and only to /api/auth/* routes.
 */
export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  path: '/api/auth',
};
