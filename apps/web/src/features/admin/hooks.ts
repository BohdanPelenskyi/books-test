'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authKeys } from '@/features/auth/hooks';
import { bookKeys } from '@/features/books/hooks';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/stores/auth.store';
import {
  createAdminUser,
  deleteAdminBook,
  deleteAdminUser,
  fetchAdminUserBooks,
  fetchAdminUsers,
  updateAdminUser,
  type AdminUserInput,
  type AdminUsersParams,
} from './api';

export const adminKeys = {
  all: ['admin'] as const,
  users: (params: AdminUsersParams) => [...adminKeys.all, 'users', params] as const,
  userBooks: (userId: string, page: number) =>
    [...adminKeys.all, 'user-books', userId, page] as const,
};

export function useAdminUsers(params: AdminUsersParams) {
  return useQuery({
    queryKey: adminKeys.users(params),
    queryFn: () => fetchAdminUsers(params),
    placeholderData: keepPreviousData,
  });
}

export function useAdminUserBooks(userId: string, page: number, limit: number) {
  return useQuery({
    queryKey: adminKeys.userBooks(userId, page),
    queryFn: () => fetchAdminUserBooks(userId, { page, limit }),
    placeholderData: keepPreviousData,
  });
}

function useAdminMutationHandlers(successMessage: string) {
  const queryClient = useQueryClient();

  return {
    onSuccess: async () => {
      toast.success(successMessage);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: adminKeys.all }),
        queryClient.invalidateQueries({ queryKey: bookKeys.all }),
      ]);
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error)),
  };
}

export function useCreateUser() {
  return useMutation({
    mutationFn: (input: AdminUserInput) => createAdminUser(input),
    ...useAdminMutationHandlers('Користувача створено'),
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const handlers = useAdminMutationHandlers('Користувача оновлено');

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AdminUserInput }) =>
      updateAdminUser(id, input),
    onSuccess: async (updatedUser) => {
      await handlers.onSuccess();
      if (updatedUser.id === currentUserId) {
        await queryClient.invalidateQueries({ queryKey: authKeys.me });
      }
    },
    onError: handlers.onError,
  });
}

export function useDeleteUser() {
  return useMutation({
    mutationFn: (id: string) => deleteAdminUser(id),
    ...useAdminMutationHandlers('Користувача видалено'),
  });
}

export function useDeleteBookAsAdmin() {
  return useMutation({
    mutationFn: (id: string) => deleteAdminBook(id),
    ...useAdminMutationHandlers('Книгу видалено'),
  });
}
