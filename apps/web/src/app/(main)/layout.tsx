import type { ReactNode } from 'react';
import { Header } from '@/components/layout/Header';

export default function MainLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </>
  );
}
