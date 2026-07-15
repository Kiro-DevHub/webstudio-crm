import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AccessTokenPayload, RefreshTokenPayload } from '../../common/types/jwt-payload.types';
import { PrismaService } from '../../prisma/prisma.service';
import { ACCESS_TOKEN_TTL, REFRESH_TOKEN_TTL_SECONDS } from './auth.constants';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const INVALID_CREDENTIALS = 'Invalid credentials';

@Injectable()
export class AuthService {
  /**
   * Compared against when the email is unknown, so that "no such user"
   * and "wrong password" take the same time (no user enumeration by timing).
   */
  private readonly dummyPasswordHash = bcrypt.hashSync(randomUUID(), 10);

  /** Resolved in the constructor so a missing secret fails at bootstrap, not on the first request. */
  private readonly accessSecret: string;
  private readonly refreshSecret: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    configService: ConfigService,
  ) {
    this.accessSecret = configService.getOrThrow<string>('JWT_ACCESS_SECRET');
    this.refreshSecret = configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }

  async login(email: string, password: string): Promise<TokenPair> {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // Always run exactly one bcrypt compare, and only then branch,
    // so all three failure modes are indistinguishable to the caller.
    const passwordMatches = await bcrypt.compare(
      password,
      user?.passwordHash ?? this.dummyPasswordHash,
    );
    if (!user || !passwordMatches || !user.isActive) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    return this.issueTokenPair(user.id, user.email, user.role);
  }

  async refresh(presentedToken: string | undefined): Promise<TokenPair> {
    if (!presentedToken) {
      throw new UnauthorizedException();
    }

    let payload: RefreshTokenPayload;
    try {
      payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(presentedToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException();
    }

    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException();
    }

    if (!this.tokenMatchesHash(presentedToken, user.refreshTokenHash)) {
      // A signed but rotated-out token means it leaked or was replayed:
      // revoke the active session entirely.
      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshTokenHash: null },
      });
      throw new UnauthorizedException();
    }

    return this.issueTokenPair(user.id, user.email, user.role);
  }

  async logout(presentedToken: string | undefined): Promise<void> {
    if (!presentedToken) {
      return;
    }
    try {
      const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(presentedToken, {
        secret: this.refreshSecret,
      });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
      if (user?.refreshTokenHash && this.tokenMatchesHash(presentedToken, user.refreshTokenHash)) {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { refreshTokenHash: null },
        });
      }
    } catch {
      // Invalid or expired token: nothing to revoke, the controller clears the cookie anyway.
    }
  }

  private async issueTokenPair(userId: string, email: string, role: Role): Promise<TokenPair> {
    const accessPayload: AccessTokenPayload = { sub: userId, email, role };
    const refreshPayload: RefreshTokenPayload = { sub: userId, jti: randomUUID() };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(accessPayload, {
        secret: this.accessSecret,
        expiresIn: ACCESS_TOKEN_TTL,
      }),
      this.jwtService.signAsync(refreshPayload, {
        secret: this.refreshSecret,
        expiresIn: REFRESH_TOKEN_TTL_SECONDS,
      }),
    ]);

    // Only a SHA-256 digest of the refresh token is persisted: a DB leak
    // does not yield usable tokens, and unlike bcrypt there is no 72-byte
    // truncation issue for long JWTs.
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: this.hashToken(refreshToken) },
    });

    return { accessToken, refreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private tokenMatchesHash(token: string, storedHash: string): boolean {
    const presented = Buffer.from(this.hashToken(token), 'hex');
    const stored = Buffer.from(storedHash, 'hex');
    return presented.length === stored.length && timingSafeEqual(presented, stored);
  }
}
