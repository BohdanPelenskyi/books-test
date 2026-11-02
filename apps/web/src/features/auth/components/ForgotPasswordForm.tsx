'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { useForgotPassword } from '../hooks';
import { forgotPasswordSchema, type ForgotPasswordFormValues } from '../schemas';

export function ForgotPasswordForm() {
  const { mutate: requestReset, isPending, isSuccess } = useForgotPassword();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormValues>({ resolver: zodResolver(forgotPasswordSchema) });

  if (isSuccess) {
    return (
      <Card className="text-center">
        <div className="mx-auto mb-4 w-fit rounded-full bg-accent-50 p-3 text-accent-600">
          <MailCheck className="size-6" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold">Перевірте пошту</h1>
        <p className="mt-2 text-sm text-slate-600">
          Якщо такий email існує, ми надіслали лист із посиланням для відновлення пароля.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block text-sm font-medium text-accent-600 hover:underline"
        >
          Повернутися до входу
        </Link>
      </Card>
    );
  }

  return (
    <Card>
      <h1 className="text-2xl font-semibold">Забули пароль?</h1>
      <p className="mt-1 text-sm text-slate-600">
        Вкажіть email, і ми надішлемо посилання для встановлення нового пароля.
      </p>
      <form
        onSubmit={handleSubmit(({ email }) => requestReset(email))}
        noValidate
        className="mt-6 space-y-4"
      >
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" isLoading={isPending} className="w-full">
          Надіслати посилання
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        <Link href="/login" className="font-medium text-accent-600 hover:underline">
          Повернутися до входу
        </Link>
      </p>
    </Card>
  );
}
