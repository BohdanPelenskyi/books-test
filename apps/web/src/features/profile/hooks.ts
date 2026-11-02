'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { authKeys } from '@/features/auth/hooks';
import { useIsClient } from '@/lib/use-is-client';
import { useAuthStore } from '@/stores/auth.store';
import { changePassword, fetchProfile, updateProfile } from './api';

export const profileKeys = {
  all: ['profile'] as const,
};

export function useProfile() {
  const token = useAuthStore((state) => state.token);
  const isClient = useIsClient();

  return useQuery({
    queryKey: profileKeys.all,
    queryFn: fetchProfile,
    enabled: isClient && token !== null,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: updateProfile,
    onSuccess: async (profile) => {
      const { id, name, email, role, avatarUrl, createdAt } = profile;
      setUser({ id, name, email, role, avatarUrl, createdAt });
      toast.success('Профіль оновлено');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: profileKeys.all }),
        queryClient.invalidateQueries({ queryKey: authKeys.me }),
      ]);
    },
  });
}

export function useChangePassword() {
  return useMutation({
    mutationFn: changePassword,
    onSuccess: () => toast.success('Пароль змінено'),
  });
}
