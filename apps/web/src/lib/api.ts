import axios, { type InternalAxiosRequestConfig } from 'axios';

const API_URL: string = import.meta.env.VITE_API_URL ?? '/api';

/**
 * The access token is kept in memory only: localStorage would hand it to any XSS.
 * A reload therefore starts tokenless, and the httpOnly refresh cookie restores the session
 * through the 401 interceptor below.
 */
let accessToken: string | null = null;

/**
 * Bumped on every token change. A 401 answering a request that carried an older generation
 * is stale news — the token has already been replaced, so that request just needs a retry,
 * not another refresh.
 */
let tokenGeneration = 0;

export function setAccessToken(token: string | null): void {
  accessToken = token;
  tokenGeneration += 1;
}

type UnauthorizedHandler = () => void;

const noop: UnauthorizedHandler = () => {};
let onUnauthorized: UnauthorizedHandler = noop;

/** Lets the app end the session (clear cache, go to /login) without pulling the router into lib/. */
export function setUnauthorizedHandler(handler: UnauthorizedHandler): void {
  onUnauthorized = handler;
}

export function resetUnauthorizedHandler(): void {
  onUnauthorized = noop;
}

export const api = axios.create({ baseURL: API_URL, withCredentials: true });

/** Refresh runs on its own client so it can never re-enter the 401 interceptor. */
const refreshClient = axios.create({ baseURL: API_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  (config as RetriableConfig)._generation = tokenGeneration;
  if (accessToken !== null) {
    config.headers.set('Authorization', `Bearer ${accessToken}`);
  }
  return config;
});

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  /** The token generation this request was sent with. */
  _generation?: number;
}

let refreshPromise: Promise<string> | null = null;

/**
 * Every 401 that arrives while a refresh is in flight awaits this same promise,
 * so N parallel requests still trigger exactly one POST /auth/refresh.
 */
function refreshAccessToken(): Promise<string> {
  refreshPromise ??= refreshClient
    .post<{ accessToken: string }>('/auth/refresh')
    .then((response) => {
      setAccessToken(response.data.accessToken);
      return response.data.accessToken;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

/**
 * A 401 from these endpoints is an answer, not an expired token:
 * refreshing after a wrong password would be nonsense.
 */
const NON_REFRESHABLE_PATHS = ['/auth/login', '/auth/refresh', '/auth/logout'];

function isNonRefreshable(url: string | undefined): boolean {
  if (url === undefined) return false;
  return NON_REFRESHABLE_PATHS.some((path) => url === path || url === `${API_URL}${path}`);
}

api.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error)) throw error;

    const original = error.config as RetriableConfig | undefined;
    const canRetry =
      error.response?.status === 401 &&
      original !== undefined &&
      original._retry !== true &&
      !isNonRefreshable(original.url);

    if (!canRetry || original === undefined) throw error;

    original._retry = true;
    try {
      // The refresh cookie is single-use: the API revokes the whole session if a rotated-out
      // token is ever replayed. So a request whose token was already superseded must reuse the
      // current one rather than start a second, racing refresh.
      const superseded =
        original._generation !== undefined &&
        original._generation < tokenGeneration &&
        accessToken !== null;
      const token = superseded ? accessToken : await refreshAccessToken();
      original.headers.set('Authorization', `Bearer ${token}`);
      return await api.request(original);
    } catch (refreshError) {
      setAccessToken(null);
      onUnauthorized();
      throw refreshError;
    }
  },
);
