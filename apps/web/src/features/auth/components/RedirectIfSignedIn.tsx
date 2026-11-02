'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useIsClient } from '@/lib/use-is-client';
import { useAuthStore } from '@/stores/auth.store';

/** Keeps signed-in users off the login and register pages. */
export function RedirectIfSignedIn({ redirectTo }: { redirectTo: string }) {
  const router = useRouter();
  const isClient = useIsClient();
  const isSignedIn = useAuthStore((state) => state.token !== null);

  useEffect(() => {
    if (isClient && isSignedIn) {
      router.replace(redirectTo);
    }
  }, [isClient, isSignedIn, redirectTo, router]);

  return null;
}
