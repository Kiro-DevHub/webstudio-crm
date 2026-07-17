import { afterAll, afterEach, beforeAll } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

/**
 * A logged-out baseline: /auth/me 401s so AuthProvider settles on "no user" unless a test
 * overrides it. Origin is wildcarded because axios talks to the `/api` proxy path, which jsdom
 * resolves against its own origin.
 */
export const server = setupServer(
  http.get('*/api/auth/me', () => new HttpResponse(null, { status: 401 })),
);

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

export { http, HttpResponse };
