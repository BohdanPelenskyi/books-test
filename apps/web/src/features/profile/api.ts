import type { Profile } from '@book-exchange/shared';
import { apiClient } from '@/lib/api-client';

interface UpdateProfileInput {
  name: string;
  email: string;
  avatar?: File;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export async function fetchProfile(): Promise<Profile> {
  const { data } = await apiClient.get<Profile>('/users/me');
  return data;
}

export async function updateProfile({ name, email, avatar }: UpdateProfileInput): Promise<Profile> {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('email', email);
  if (avatar) formData.append('avatar', avatar);

  const { data } = await apiClient.patch<Profile>('/users/me', formData);
  return data;
}

export async function changePassword(input: ChangePasswordInput): Promise<void> {
  await apiClient.patch('/users/me/password', input);
}
