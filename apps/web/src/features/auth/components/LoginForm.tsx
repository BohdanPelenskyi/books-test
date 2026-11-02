'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useLogin } from '../hooks';
import { loginSchema, type LoginFormValues } from '../schemas';
import { PasswordInput } from './PasswordInput';

interface LoginFormProps {
  redirectTo: string;
  registerHref: string;
}

export function LoginForm({ redirectTo, registerHref }: LoginFormProps) {
  const router = useRouter();
  const { mutate: login, isPending } = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  function submit(values: LoginFormValues) {
    login(values, { onSuccess: () => router.replace(redirectTo) });
  }

  return (
    <Card>
      <h1 className="text-2xl font-semibold">Вхід</h1>
      <p className="mt-1 text-sm text-slate-600">Увійдіть, щоб обмінюватися книгами</p>
      <form onSubmit={handleSubmit(submit)} noValidate className="mt-6 space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          label="Пароль"
          autoComplete="current-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-accent-600 hover:underline">
            Забули пароль?
          </Link>
        </div>
        <Button type="submit" isLoading={isPending} className="w-full">
          Увійти
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Немає акаунта?{' '}
        <Link href={registerHref} className="font-medium text-accent-600 hover:underline">
          Зареєструватися
        </Link>
      </p>
    </Card>
  );
}
