import type { Role } from '@crm/shared';

/** Mirrors UserLite on the API — just enough for owner/assignee pickers. */
export interface UserLite {
  id: string;
  name: string;
  avatarColor: string;
  role: Role;
}
