import type { Role } from '@crm/shared';

/** Mirrors SAFE_USER_SELECT on the API — the only user shape that leaves the backend. */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarColor: string;
  isActive: boolean;
  createdAt: string;
}

export interface LoginInput {
  email: string;
  password: string;
}
