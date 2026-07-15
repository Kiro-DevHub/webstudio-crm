import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/setup-app';

const PASSWORD = 'E2ePassword123!';
const suffix = `e2e${Date.now()}`;
const adminEmail = `admin-${suffix}@test.dev`;
const managerEmail = `manager-${suffix}@test.dev`;
const inactiveEmail = `inactive-${suffix}@test.dev`;
const tempEmail = `temp-${suffix}@test.dev`;
const createdEmail = `created-${suffix}@test.dev`;

const prisma = new PrismaClient();

interface TokenBody {
  accessToken: string;
}

interface ErrorBody {
  message: string;
}

interface UserBody {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  passwordHash?: string;
  refreshTokenHash?: string;
}

interface ListUsersBody {
  data: UserBody[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}

/** Typed view of an untyped supertest response body. */
function body<T>(res: request.Response): T {
  return res.body as T;
}

/** Extracts the full refreshToken Set-Cookie string from a response. */
function refreshSetCookie(res: request.Response): string {
  const cookies = res.get('Set-Cookie') ?? [];
  const cookie = cookies.find((c) => c.startsWith('refreshToken='));
  if (!cookie) {
    throw new Error(`refreshToken cookie not set; got: ${cookies.join(' | ')}`);
  }
  return cookie;
}

/** Turns a Set-Cookie string into a value usable in a Cookie request header. */
function asCookieHeader(setCookie: string): string {
  return setCookie.split(';')[0];
}

describe('Auth & Users (e2e)', () => {
  let app: INestApplication<App>;
  let server: App;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(PASSWORD, 4);
    await prisma.user.createMany({
      data: [
        {
          email: adminEmail,
          passwordHash,
          name: 'E2E Admin',
          role: Role.ADMIN,
          avatarColor: '#6366f1',
        },
        {
          email: managerEmail,
          passwordHash,
          name: 'E2E Manager',
          role: Role.MANAGER,
          avatarColor: '#0ea5e9',
        },
        {
          email: inactiveEmail,
          passwordHash,
          name: 'E2E Inactive',
          role: Role.MANAGER,
          avatarColor: '#10b981',
          isActive: false,
        },
        {
          email: tempEmail,
          passwordHash,
          name: 'E2E Temp',
          role: Role.MANAGER,
          avatarColor: '#f59e0b',
        },
      ],
    });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    configureApp(app);
    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: suffix } } });
    await prisma.$disconnect();
    await app.close();
  });

  async function login(email: string, password = PASSWORD): Promise<request.Response> {
    return request(server).post('/api/auth/login').send({ email, password });
  }

  describe('POST /api/auth/login', () => {
    it('returns an access token and sets a hardened refresh cookie', async () => {
      const res = await login(managerEmail);

      expect(res.status).toBe(200);
      const { accessToken } = body<TokenBody>(res);
      expect(typeof accessToken).toBe('string');
      expect(accessToken.split('.')).toHaveLength(3);
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');

      const cookie = refreshSetCookie(res);
      expect(cookie).toContain('HttpOnly');
      expect(cookie).toContain('Secure');
      expect(cookie).toContain('SameSite=Strict');
      expect(cookie).toContain('Path=/api/auth');
    });

    it('rejects a wrong password with 401', async () => {
      const res = await login(managerEmail, 'WrongPassword123!');
      expect(res.status).toBe(401);
    });

    it('rejects an unknown email with 401 and the same error message as a wrong password', async () => {
      const wrongPassword = await login(managerEmail, 'WrongPassword123!');
      const unknownEmail = await login(`ghost-${suffix}@test.dev`);
      expect(unknownEmail.status).toBe(401);
      expect(body<ErrorBody>(unknownEmail).message).toBe(body<ErrorBody>(wrongPassword).message);
    });

    it('rejects a deactivated user with 401', async () => {
      const res = await login(inactiveEmail);
      expect(res.status).toBe(401);
    });

    it('rejects a malformed body with 400', async () => {
      const res = await request(server)
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('returns 401 without a token', async () => {
      const res = await request(server).get('/api/auth/me');
      expect(res.status).toBe(401);
    });

    it('returns 401 with a garbage token', async () => {
      const res = await request(server)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer not.a.jwt');
      expect(res.status).toBe(401);
    });

    it('returns the current user without passwordHash or refreshTokenHash', async () => {
      const loginRes = await login(managerEmail);
      const res = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${body<TokenBody>(loginRes).accessToken}`);

      expect(res.status).toBe(200);
      const me = body<UserBody>(res);
      expect(me.email).toBe(managerEmail);
      expect(me.role).toBe(Role.MANAGER);
      expect(me.passwordHash).toBeUndefined();
      expect(me.refreshTokenHash).toBeUndefined();
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('returns 401 without a refresh cookie', async () => {
      const res = await request(server).post('/api/auth/refresh');
      expect(res.status).toBe(401);
    });

    it('rotates the refresh token and invalidates the previous one', async () => {
      const loginRes = await login(managerEmail);
      const firstCookie = refreshSetCookie(loginRes);

      const refreshRes = await request(server)
        .post('/api/auth/refresh')
        .set('Cookie', asCookieHeader(firstCookie));
      expect(refreshRes.status).toBe(200);
      expect(typeof body<TokenBody>(refreshRes).accessToken).toBe('string');

      const secondCookie = refreshSetCookie(refreshRes);
      expect(asCookieHeader(secondCookie)).not.toBe(asCookieHeader(firstCookie));

      // The rotated-out token must be dead.
      const reuseRes = await request(server)
        .post('/api/auth/refresh')
        .set('Cookie', asCookieHeader(firstCookie));
      expect(reuseRes.status).toBe(401);
    });

    it('issues an access token that authorizes /me', async () => {
      const loginRes = await login(managerEmail);
      const refreshRes = await request(server)
        .post('/api/auth/refresh')
        .set('Cookie', asCookieHeader(refreshSetCookie(loginRes)));

      const meRes = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${body<TokenBody>(refreshRes).accessToken}`);
      expect(meRes.status).toBe(200);
      expect(body<UserBody>(meRes).email).toBe(managerEmail);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('clears the cookie and invalidates the stored refresh token', async () => {
      const loginRes = await login(managerEmail);
      const cookie = refreshSetCookie(loginRes);

      const logoutRes = await request(server)
        .post('/api/auth/logout')
        .set('Cookie', asCookieHeader(cookie));
      expect(logoutRes.status).toBe(204);
      const cleared = refreshSetCookie(logoutRes);
      expect(asCookieHeader(cleared)).toBe('refreshToken=');

      const refreshRes = await request(server)
        .post('/api/auth/refresh')
        .set('Cookie', asCookieHeader(cookie));
      expect(refreshRes.status).toBe(401);
    });
  });

  describe('access token invalidation on deactivation', () => {
    it('rejects a valid access token once the user is deactivated', async () => {
      const loginRes = await login(tempEmail);
      await prisma.user.update({
        where: { email: tempEmail },
        data: { isActive: false },
      });

      const res = await request(server)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${body<TokenBody>(loginRes).accessToken}`);
      expect(res.status).toBe(401);
    });
  });

  describe('Users module (ADMIN only)', () => {
    let adminToken: string;
    let managerToken: string;

    beforeAll(async () => {
      adminToken = body<TokenBody>(await login(adminEmail)).accessToken;
      managerToken = body<TokenBody>(await login(managerEmail)).accessToken;
    });

    it('GET /api/users returns 401 without a token', async () => {
      const res = await request(server).get('/api/users');
      expect(res.status).toBe(401);
    });

    it('GET /api/users returns 403 for a MANAGER', async () => {
      const res = await request(server)
        .get('/api/users')
        .set('Authorization', `Bearer ${managerToken}`);
      expect(res.status).toBe(403);
    });

    it('GET /api/users returns a paginated list without hashes for an ADMIN', async () => {
      const res = await request(server)
        .get('/api/users')
        .query({ page: 1, limit: 100 })
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const list = body<ListUsersBody>(res);
      expect(Array.isArray(list.data)).toBe(true);
      expect(list.meta).toMatchObject({ page: 1, limit: 100 });
      expect(typeof list.meta.total).toBe('number');
      expect(typeof list.meta.totalPages).toBe('number');
      expect(JSON.stringify(res.body)).not.toContain('passwordHash');
      expect(JSON.stringify(res.body)).not.toContain('refreshTokenHash');
      expect(list.data.map((u) => u.email)).toContain(adminEmail);
    });

    it('POST /api/users creates an active MANAGER for an ADMIN', async () => {
      const res = await request(server)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: createdEmail, name: 'E2E Created', password: PASSWORD });

      expect(res.status).toBe(201);
      const created = body<UserBody>(res);
      expect(created.email).toBe(createdEmail);
      expect(created.role).toBe(Role.MANAGER);
      expect(created.isActive).toBe(true);
      expect(created.passwordHash).toBeUndefined();

      const loginRes = await login(createdEmail);
      expect(loginRes.status).toBe(200);
    });

    it('POST /api/users returns 409 for a duplicate email', async () => {
      const res = await request(server)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: createdEmail, name: 'E2E Dup', password: PASSWORD });
      expect(res.status).toBe(409);
    });

    it('POST /api/users returns 403 for a MANAGER', async () => {
      const res = await request(server)
        .post('/api/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ email: `other-${suffix}@test.dev`, name: 'X', password: PASSWORD });
      expect(res.status).toBe(403);
    });

    it('PATCH /api/users/:id/deactivate deactivates a user, who then cannot log in', async () => {
      const created = await prisma.user.findUniqueOrThrow({ where: { email: createdEmail } });

      const res = await request(server)
        .patch(`/api/users/${created.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(body<UserBody>(res).isActive).toBe(false);

      const loginRes = await login(createdEmail);
      expect(loginRes.status).toBe(401);
    });

    it('PATCH /api/users/:id/deactivate returns 400 when an admin targets themselves', async () => {
      const admin = await prisma.user.findUniqueOrThrow({ where: { email: adminEmail } });
      const res = await request(server)
        .patch(`/api/users/${admin.id}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(400);
    });
  });

  describe('public routes', () => {
    it('GET /api/health stays public', async () => {
      const res = await request(server).get('/api/health');
      expect(res.status).toBe(200);
    });

    it('GET /api/docs serves Swagger UI', async () => {
      const res = await request(server).get('/api/docs');
      expect([200, 301].includes(res.status)).toBe(true);
    });
  });
});
