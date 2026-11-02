import type { ReactNode } from 'react';
import { Logo } from '@/components/layout/Logo';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-12">
      <Logo />
      <div className="w-full max-w-md">{children}</div>
    </main>
  );
}
