import { api } from '@/lib/api';
import type { UserLite } from './users.types';

export const usersKeys = {
  lite: ['users', 'lite'] as const,
};

export async function fetchUsersLite(): Promise<UserLite[]> {
  const { data } = await api.get<UserLite[]>('/users/lite');
  return data;
}
