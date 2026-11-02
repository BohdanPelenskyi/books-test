import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/features/auth/components/ResetPasswordForm';

export const metadata: Metadata = { title: 'Новий пароль' };

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return <ResetPasswordForm token={token} />;
}
