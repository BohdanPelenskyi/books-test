import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth/components/RegisterForm';
import { DEFAULT_REDIRECT_PATH, getSafeRedirectPath } from '@/lib/safe-redirect';

export const metadata: Metadata = { title: 'Реєстрація' };

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const { redirect } = await searchParams;
  const redirectTo = getSafeRedirectPath(redirect);
  const loginHref =
    redirectTo === DEFAULT_REDIRECT_PATH
      ? '/login'
      : `/login?redirect=${encodeURIComponent(redirectTo)}`;

  return <RegisterForm redirectTo={redirectTo} loginHref={loginHref} />;
}
