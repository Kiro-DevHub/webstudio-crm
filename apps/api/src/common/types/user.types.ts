import { Prisma } from '@prisma/client';
import { Request } from 'express';

/** Every user shape that leaves the API MUST go through this select. */
export const SAFE_USER_SELECT = {
  id: true,
  email: true,
  name: true,
  role: true,
  avatarColor: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export type SafeUser = Prisma.UserGetPayload<{ select: typeof SAFE_USER_SELECT }>;

export interface AuthenticatedRequest extends Request {
  user?: SafeUser;
  cookies: Record<string, string | undefined>;
}
