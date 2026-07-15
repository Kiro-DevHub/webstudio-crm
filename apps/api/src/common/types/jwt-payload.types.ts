import { Role } from '@prisma/client';

export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: Role;
}

export interface RefreshTokenPayload {
  sub: string;
  /** Random id so two refresh tokens issued within the same second still differ. */
  jti: string;
}
