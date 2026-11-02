import type { AuthResponse, AuthUser } from '@book-exchange/shared';
import { apiClient } from '@/lib/api-client';
import type { LoginFormValues, RegisterFormValues } from './schemas';

export async function login(values: LoginFormValues): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', values);
  return data;
}

export async function register(values: RegisterFormValues): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', values);
  return data;
}

export async function fetchCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get<AuthUser>('/auth/me');
  return data;
}

export async function forgotPassword(email: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { email });
}

export async function resetPassword(token: string, password: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { token, password });
}
