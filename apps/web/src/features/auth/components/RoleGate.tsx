'use client';

import type { Role } from '@book-exchange/shared';
import { ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { getButtonClasses } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useIsClient } from '@/lib/use-is-client';
import { useAuthStore } from '@/stores/auth.store';

/** UI-level guard only; the API enforces roles independently. */
export function RoleGate({ role, children }: { role: Role; children: ReactNode }) {
  const isClient = useIsClient();
  const user = useAuthStore((state) => state.user);

  if (!isClient) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (user?.role !== role) {
    return (
      <EmptyState
        icon={ShieldAlert}
        title="Доступ заборонено"
        description="Ця сторінка доступна лише адміністраторам."
        action={
          <Link href="/books" className={getButtonClasses({})}>
            До каталогу
          </Link>
        }
      />
    );
  }

  return children;
}
