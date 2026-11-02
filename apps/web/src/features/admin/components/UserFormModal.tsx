'use client';

import type { AdminUser } from '@book-exchange/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { PasswordInput } from '@/features/auth/components/PasswordInput';
import { getApiErrorStatus } from '@/lib/api-error';
import { ROLE_OPTIONS } from '../constants';
import { useCreateUser, useUpdateUser } from '../hooks';
import { buildUserFormSchema, type UserFormValues } from '../schemas';

const HTTP_CONFLICT = 409;

interface UserFormModalProps {
  isOpen: boolean;
  user: AdminUser | undefined;
  onClose: () => void;
}

function UserForm({ user, onClose }: Omit<UserFormModalProps, 'isOpen'>) {
  const isEditing = user !== undefined;
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const isSubmitting = createUser.isPending || updateUser.isPending;

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<UserFormValues>({
    resolver: zodResolver(buildUserFormSchema(isEditing)),
    defaultValues: {
      name: user?.name ?? '',
      email: user?.email ?? '',
      role: user?.role ?? 'USER',
      password: '',
    },
  });

  function submit({ password, ...values }: UserFormValues) {
    const input = { ...values, ...(password && { password }) };
    const handlers = {
      onSuccess: onClose,
      onError: (error: unknown) => {
        if (getApiErrorStatus(error) === HTTP_CONFLICT) {
          setError('email', { message: 'Користувач з таким email вже існує' });
        }
      },
    };

    if (user) {
      updateUser.mutate({ id: user.id, input }, handlers);
    } else {
      createUser.mutate(input, handlers);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      <Input label="Ім'я" autoComplete="off" error={errors.name?.message} {...register('name')} />
      <Input
        label="Email"
        type="email"
        autoComplete="off"
        error={errors.email?.message}
        {...register('email')}
      />
      <PasswordInput
        label={isEditing ? 'Новий пароль (залиште порожнім, щоб не змінювати)' : 'Пароль'}
        autoComplete="new-password"
        error={errors.password?.message}
        {...register('password')}
      />
      <div className="space-y-1.5">
        <label htmlFor="user-role" className="block text-sm font-medium text-slate-700">
          Роль
        </label>
        <select
          id="user-role"
          className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none focus:border-accent-500 focus:ring-2 focus:ring-accent-100"
          {...register('role')}
        >
          {ROLE_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
          Скасувати
        </Button>
        <Button type="submit" isLoading={isSubmitting}>
          {isEditing ? 'Зберегти' : 'Створити'}
        </Button>
      </div>
    </form>
  );
}

export function UserFormModal({ isOpen, user, onClose }: UserFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      title={user ? 'Редагувати користувача' : 'Новий користувач'}
      onClose={onClose}
    >
      <UserForm user={user} onClose={onClose} />
    </Modal>
  );
}
