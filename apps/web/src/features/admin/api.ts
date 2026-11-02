import type { AdminUser, Book, Paginated, Role } from '@book-exchange/shared';
import { apiClient } from '@/lib/api-client';

export interface AdminUsersParams {
  search?: string;
  page?: number;
  limit?: number;
}

export interface AdminUserInput {
  name: string;
  email: string;
  role: Role;
  password?: string;
}

export async function fetchAdminUsers(params: AdminUsersParams): Promise<Paginated<AdminUser>> {
  const { data } = await apiClient.get<Paginated<AdminUser>>('/admin/users', { params });
  return data;
}

export async function createAdminUser(input: AdminUserInput): Promise<AdminUser> {
  const { data } = await apiClient.post<AdminUser>('/admin/users', input);
  return data;
}

export async function updateAdminUser(id: string, input: AdminUserInput): Promise<AdminUser> {
  const { data } = await apiClient.patch<AdminUser>(`/admin/users/${id}`, input);
  return data;
}

export async function deleteAdminUser(id: string): Promise<void> {
  await apiClient.delete(`/admin/users/${id}`);
}

export async function fetchAdminUserBooks(
  userId: string,
  params: { page: number; limit: number },
): Promise<Paginated<Book>> {
  const { data } = await apiClient.get<Paginated<Book>>(`/admin/users/${userId}/books`, {
    params,
  });
  return data;
}

export async function deleteAdminBook(id: string): Promise<void> {
  await apiClient.delete(`/admin/books/${id}`);
}
