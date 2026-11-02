'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error';
import { useRegister } from '../hooks';
import { registerSchema, type RegisterFormValues } from '../schemas';
import { PasswordInput } from './PasswordInput';

const HTTP_CONFLICT = 409;

interface RegisterFormProps {
  redirectTo: string;
  loginHref: string;
}

export function RegisterForm({ redirectTo, loginHref }: RegisterFormProps) {
  const router = useRouter();
  const { mutate: registerUser, isPending } = useRegister();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerSchema) });

  function submit(values: RegisterFormValues) {
    registerUser(values, {
      onSuccess: () => router.replace(redirectTo),
      onError: (error) => {
        const message = getApiErrorMessage(error);
        if (getApiErrorStatus(error) === HTTP_CONFLICT) {
          setError('email', { message });
          return;
        }
        toast.error(message);
      },
    });
  }

  return (
    <Card>
      <h1 className="text-2xl font-semibold">Реєстрація</h1>
      <p className="mt-1 text-sm text-slate-600">Створіть акаунт, щоб додавати власні книги</p>
      <form onSubmit={handleSubmit(submit)} noValidate className="mt-6 space-y-4">
        <Input
          label="Ім'я"
          autoComplete="name"
          error={errors.name?.message}
          {...register('name')}
        />
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <PasswordInput
          label="Пароль"
          autoComplete="new-password"
          error={errors.password?.message}
          {...register('password')}
        />
        <Button type="submit" isLoading={isPending} className="w-full">
          Зареєструватися
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Вже є акаунт?{' '}
        <Link href={loginHref} className="font-medium text-accent-600 hover:underline">
          Увійти
        </Link>
      </p>
    </Card>
  );
}
