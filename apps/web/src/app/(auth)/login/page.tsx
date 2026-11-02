import type { Metadata } from 'next';
import { RedirectIfSignedIn } from '@/features/auth/components/RedirectIfSignedIn';
import { LoginForm } from '@/features/auth/components/LoginForm';
import { DEFAULT_REDIRECT_PATH, getSafeRedirectPath } from '@/lib/safe-redirect';

export const metadata: Metadata = { title: 'Вхід' };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const redirectTo = getSafeRedirectPath(redirect);
  const registerHref =
    redirectTo === DEFAULT_REDIRECT_PATH
      ? '/register'
      : `/register?redirect=${encodeURIComponent(redirectTo)}`;

  return (
    <>
      <RedirectIfSignedIn redirectTo={redirectTo} />
      <LoginForm redirectTo={redirectTo} registerHref={registerHref} />
    </>
  );
}
