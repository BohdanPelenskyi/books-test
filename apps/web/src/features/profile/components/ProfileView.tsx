'use client';

import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { UserX } from 'lucide-react';
import { useProfile } from '../hooks';
import { ChangePasswordForm } from './ChangePasswordForm';
import { PendingRequestsNotice } from './PendingRequestsNotice';
import { ProfileForm } from './ProfileForm';
import { ProfileStats } from './ProfileStats';

export function ProfileView() {
  const { data: profile, isPending, isError } = useProfile();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Профіль</h1>

      {isPending && (
        <div role="status" aria-label="Завантаження профілю" className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-72 w-full" />
        </div>
      )}

      {isError && <EmptyState icon={UserX} title="Не вдалося завантажити профіль" />}

      {profile && (
        <>
          {profile.pendingIncomingCount > 0 && (
            <PendingRequestsNotice count={profile.pendingIncomingCount} />
          )}
          <ProfileStats profile={profile} />
          <div className="grid items-start gap-6 lg:grid-cols-2">
            <ProfileForm key={profile.id} profile={profile} />
            <ChangePasswordForm />
          </div>
        </>
      )}
    </div>
  );
}
