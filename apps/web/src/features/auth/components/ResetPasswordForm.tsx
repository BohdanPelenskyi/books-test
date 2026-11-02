'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button, getButtonClasses } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { getApiErrorMessage } from '@/lib/api-error';
import { useResetPassword } from '../hooks';
import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas';
import { PasswordInput } from './PasswordInput';

export function ResetPasswordForm({ token }: { token: string | undefined }) {
  const router = useRouter();
  const { mutate: resetPassword, isPending } = useResetPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordFormValues>({ resolver: zodResolver(resetPasswordSchema) });

  if (!token) {
    return (
      <Card className="text-center">
        <h1 className="text-xl font-semibold">Недійсне посилання</h1>
        <p className="mt-2 text-sm text-slate-600">
          У посиланні немає токена. Запросіть відновлення пароля ще раз.
        </p>
        <Link href="/forgot-password" className={`${getButtonClasses({})} mt-6`}>
          Відновити пароль
        </Link>
      </Card>
    );
  }

  function submit({ password }: ResetPasswordFormValues) {
    resetPassword(
      { token: token as string, password },
      {
        onSuccess: () => router.replace('/login'),
        onError: (error) => toast.error(getApiErrorMessage(error)),
      },
    );
  }

  return (
    <Card>
      <h1 className="text-2xl font-semibold">Новий пароль</h1>
      <p className="mt-1 text-sm text-slate-600">Придумайте новий пароль для вашого акаунта.</p>
      <form onSubmit={handleSubmit(submit)} noValidate className="mt-6 space-y-4">
        <PasswordInput
          label="Новий пароль"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <PasswordInput
          label="Підтвердіть пароль"
          autoComplete="new-password"
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" isLoading={isPending} className="w-full">
          Зберегти пароль
        </Button>
      </form>
    </Card>
  );
}
