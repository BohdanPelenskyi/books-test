'use client';

import type { Profile } from '@book-exchange/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { getApiErrorMessage, getApiErrorStatus } from '@/lib/api-error';
import { useImageUpload } from '@/lib/use-image-upload';
import { useUpdateProfile } from '../hooks';
import { profileSchema, type ProfileFormValues } from '../schemas';
import { AvatarUpload } from './AvatarUpload';

const HTTP_CONFLICT = 409;

export function ProfileForm({ profile }: { profile: Profile }) {
  const avatarUpload = useImageUpload();
  const { mutate: saveProfile, isPending } = useUpdateProfile();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: profile.name, email: profile.email },
  });

  const name = useWatch({ control, name: 'name' });

  function submit(values: ProfileFormValues) {
    saveProfile(
      { ...values, avatar: avatarUpload.file ?? undefined },
      {
        onError: (error) => {
          const message = getApiErrorMessage(error);
          if (getApiErrorStatus(error) === HTTP_CONFLICT) {
            setError('email', { message });
            return;
          }
          toast.error(message);
        },
      },
    );
  }

  return (
    <Card>
      <h2 className="text-lg font-semibold">Особисті дані</h2>
      <form onSubmit={handleSubmit(submit)} noValidate className="mt-4 space-y-4">
        <AvatarUpload
          name={name || profile.name}
          avatarUrl={profile.avatarUrl}
          previewUrl={avatarUpload.previewUrl}
          error={avatarUpload.error}
          onChange={avatarUpload.onChange}
        />
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
        <Button type="submit" isLoading={isPending}>
          Зберегти
        </Button>
      </form>
    </Card>
  );
}
