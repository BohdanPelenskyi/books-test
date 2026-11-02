import { Role } from '@book-exchange/shared';
import type { ReactNode } from 'react';
import { RoleGate } from '@/features/auth/components/RoleGate';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RoleGate role={Role.ADMIN}>{children}</RoleGate>;
}
