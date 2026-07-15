import axios from 'axios';
import { api, setAccessToken } from '@/lib/api';
import type { AuthUser, LoginInput } from './auth.types';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export async function fetchMe(): Promise<AuthUser> {
  const { data } = await api.get<AuthUser>('/auth/me');
  return data;
}

/**
 * On boot there is no access token, so /auth/me 401s and the interceptor tries the refresh
 * cookie. A still-failing 401 simply means "no session" — that is an answer, not an error.
 */
export async function fetchMeOrNull(): Promise<AuthUser | null> {
  try {
    return await fetchMe();
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 401) return null;
    throw error;
  }
}

export async function loginRequest(input: LoginInput): Promise<AuthUser> {
  const { data } = await api.post<{ accessToken: string }>('/auth/login', input);
  setAccessToken(data.accessToken);
  return fetchMe();
}

export async function logoutRequest(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    // The local session ends even if the server call fails, so the user is never stuck logged in.
    setAccessToken(null);
  }
}
