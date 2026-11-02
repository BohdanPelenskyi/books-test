'use client';

import type { AuthResponse } from '@book-exchange/shared';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';
import { useIsClient } from '@/lib/use-is-client';
import { useAuthStore } from '@/stores/auth.store';
import { fetchCurrentUser, forgotPassword, login, register, resetPassword } from './api';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

function useSessionStarter() {
  const setSession = useAuthStore((state) => state.setSession);
  const queryClient = useQueryClient();

  return ({ accessToken, user }: AuthResponse) => {
    setSession({ token: accessToken, user });
    queryClient.setQueryData(authKeys.me, user);
    toast.success(`Вітаємо, ${user.name}!`);
  };
}

export function useLogin() {
  const startSession = useSessionStarter();

  return useMutation({
    mutationFn: login,
    onSuccess: startSession,
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useRegister() {
  const startSession = useSessionStarter();

  return useMutation({
    mutationFn: register,
    onSuccess: startSession,
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: forgotPassword,
    onError: (error) => toast.error(getApiErrorMessage(error)),
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: ({ token, password }: { token: string; password: string }) =>
      resetPassword(token, password),
    onSuccess: () => toast.success('Пароль змінено. Тепер можна увійти'),
  });
}

export function useLogout() {
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const router = useRouter();

  return () => {
    logout();
    queryClient.clear();
    toast.success('Ви вийшли з акаунта');
    router.replace('/login');
  };
}

/** Verifies the persisted token against the API and refreshes the stored user. */
export function useMe() {
  const token = useAuthStore((state) => state.token);
  const isClient = useIsClient();
  const setUser = useAuthStore((state) => state.setUser);

  const query = useQuery({
    queryKey: authKeys.me,
    queryFn: fetchCurrentUser,
    enabled: isClient && token !== null,
  });

  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return query;
}
