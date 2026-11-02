'use client';

import { Role } from '@book-exchange/shared';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { getButtonClasses } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useIncomingPendingCount } from '@/features/exchange/hooks';
import { cn } from '@/lib/cn';
import { useIsClient } from '@/lib/use-is-client';
import { useAuthStore } from '@/stores/auth.store';
import { Logo } from './Logo';
import { UserMenu } from './UserMenu';

interface NavItem {
  href: string;
  label: string;
  requiresAuth?: boolean;
  requiresRole?: Role;
}

const EXCHANGES_PATH = '/exchanges';

const NAV_ITEMS: NavItem[] = [
  { href: '/books', label: 'Книги' },
  { href: '/me/books', label: 'Мої книги', requiresAuth: true },
  { href: EXCHANGES_PATH, label: 'Обміни', requiresAuth: true },
  { href: '/admin', label: 'Адмін', requiresRole: Role.ADMIN },
];

export function Header() {
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isClient = useIsClient();
  const pendingCount = useIncomingPendingCount();

  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.requiresRole) {
      return user?.role === item.requiresRole;
    }
    return !item.requiresAuth || user !== null;
  });

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
        <Logo />
        <nav
          aria-label="Основна навігація"
          className="order-last flex w-full gap-1 overflow-x-auto sm:order-none sm:w-auto sm:flex-1"
        >
          {visibleItems.map(({ href, label }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link
                key={href}
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium',
                  isActive
                    ? 'bg-accent-50 text-accent-700'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
                )}
              >
                {label}
                {href === EXCHANGES_PATH && pendingCount > 0 && (
                  <Badge variant="accent" aria-label={`Нових запитів: ${pendingCount}`}>
                    {pendingCount}
                  </Badge>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-2">
          {!isClient && <Skeleton className="size-9 rounded-full" />}
          {isClient && user && <UserMenu user={user} />}
          {isClient && !user && (
            <>
              <Link href="/login" className={getButtonClasses({ variant: 'ghost', size: 'sm' })}>
                Увійти
              </Link>
              <Link href="/register" className={getButtonClasses({ size: 'sm' })}>
                Реєстрація
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
