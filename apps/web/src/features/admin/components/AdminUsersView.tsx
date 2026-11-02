'use client';

import type { AdminUser } from '@book-exchange/shared';
import { Plus, UserX } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { useDebouncedSearch } from '@/lib/use-debounced-search';
import { useAuthStore } from '@/stores/auth.store';
import { ADMIN_USERS_PAGE_SIZE } from '../constants';
import { useAdminUsers, useDeleteUser } from '../hooks';
import { UserBooksModal } from './UserBooksModal';
import { UserFormModal } from './UserFormModal';
import { UsersTable } from './UsersTable';

type DialogState =
  | { type: 'create' }
  | { type: 'edit'; user: AdminUser }
  | { type: 'delete'; user: AdminUser }
  | { type: 'books'; user: AdminUser }
  | null;

interface AdminUsersViewProps {
  search: string;
  page: number;
}

function buildQuery(search: string, page: number): string {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (page > 1) query.set('page', String(page));

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}

export function AdminUsersView({ search, page }: AdminUsersViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [dialog, setDialog] = useState<DialogState>(null);

  const { data, isPending, isError, isPlaceholderData } = useAdminUsers({
    search: search || undefined,
    page,
    limit: ADMIN_USERS_PAGE_SIZE,
  });
  const deleteUser = useDeleteUser();

  function navigate(nextSearch: string, nextPage: number) {
    router.replace(`${pathname}${buildQuery(nextSearch, nextPage)}`, { scroll: false });
  }

  const [searchInput, setSearchInput] = useDebouncedSearch(search, (nextSearch) =>
    navigate(nextSearch, 1),
  );

  const closeDialog = () => setDialog(null);

  function confirmDelete() {
    if (dialog?.type === 'delete') {
      deleteUser.mutate(dialog.user.id, { onSuccess: closeDialog });
    }
  }

  const formUser = dialog?.type === 'edit' ? dialog.user : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Користувачі</h1>
        <Button onClick={() => setDialog({ type: 'create' })}>
          <Plus className="size-4" aria-hidden="true" />
          Додати користувача
        </Button>
      </div>

      <div className="flex">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Пошук за імʼям або email"
          label="Пошук користувачів"
        />
      </div>

      {isPending && (
        <div role="status" aria-label="Завантаження користувачів" className="space-y-2">
          {[0, 1, 2, 3].map((index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      )}

      {isError && <EmptyState icon={UserX} title="Не вдалося завантажити користувачів" />}

      {data && data.items.length === 0 && (
        <EmptyState
          icon={UserX}
          title="Користувачів не знайдено"
          description={search ? 'Спробуйте змінити запит.' : undefined}
        />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
            <UsersTable
              users={data.items}
              currentUserId={currentUserId}
              onShowBooks={(user) => setDialog({ type: 'books', user })}
              onEdit={(user) => setDialog({ type: 'edit', user })}
              onDelete={(user) => setDialog({ type: 'delete', user })}
            />
          </div>
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={(nextPage) => navigate(search, nextPage)}
          />
        </>
      )}

      <UserFormModal
        isOpen={dialog?.type === 'create' || dialog?.type === 'edit'}
        user={formUser}
        onClose={closeDialog}
      />

      <UserBooksModal user={dialog?.type === 'books' ? dialog.user : null} onClose={closeDialog} />

      <ConfirmDialog
        isOpen={dialog?.type === 'delete'}
        title="Видалити користувача?"
        description={
          dialog?.type === 'delete'
            ? `Акаунт «${dialog.user.name}» буде видалено разом з усіма його книгами та запитами на обмін.`
            : ''
        }
        confirmLabel="Видалити"
        isLoading={deleteUser.isPending}
        onConfirm={confirmDelete}
        onCancel={closeDialog}
      />
    </div>
  );
}
