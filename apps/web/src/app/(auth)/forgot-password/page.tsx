import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/features/auth/components/ForgotPasswordForm';

export const metadata: Metadata = { title: 'Відновлення пароля' };

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
