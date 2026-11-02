'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { PasswordInput } from '@/features/auth/components/PasswordInput';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error';
import { useChangePassword } from '../hooks';
import { changePasswordSchema, type ChangePasswordFormValues } from '../schemas';

const HTTP_BAD_REQUEST = 400;

export function ChangePasswordForm() {
  const { mutate: changePassword, isPending } = useChangePassword();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  function submit({ currentPassword, newPassword }: ChangePasswordFormValues) {
    changePassword(
      { currentPassword, newPassword },
      {
        onSuccess: () => reset(),
        onError: (error) => {
          const message = getApiErrorMessage(error);
          if (getApiErrorStatus(error) === HTTP_BAD_REQUEST) {
            setError('currentPassword', { message });
            return;
          }
          toast.error(message);
        },
      },
    );
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">Зміна пароля</h2>
      <form onSubmit={handleSubmit(submit)} noValidate className="mt-4 space-y-4">
        <PasswordInput
          label="Поточний пароль"
          autoComplete="current-password"
          error={errors.currentPassword?.message}
          {...register('currentPassword')}
        />
        <PasswordInput
          label="Новий пароль"
          autoComplete="new-password"
          error={errors.newPassword?.message}
          {...register('newPassword')}
        />
        <PasswordInput
          label="Підтвердіть новий пароль"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" isLoading={isPending}>
          Змінити пароль
        </Button>
      </form>
    </Card>
  );
}
