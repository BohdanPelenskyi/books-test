'use client';

import { BookStatus, Role } from '@book-exchange/shared';
import { ArrowLeft, BookX, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button, getButtonClasses } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useDeleteBookAsAdmin } from '@/features/admin/hooks';
import { RequestExchangeButton } from '@/features/exchange/components/RequestExchangeButton';
import { getApiErrorStatus } from '@/lib/api-error';
import { formatDate } from '@/lib/format-date';
import { useIsClient } from '@/lib/use-is-client';
import { useAuthStore } from '@/stores/auth.store';
import { useBook } from '../hooks';
import { BookCover } from './BookCover';

const HTTP_NOT_FOUND = 404;
const COVER_SIZES = '(min-width: 768px) 280px, 100vw';

function BookDetailsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Завантаження книги"
      className="grid gap-8 md:grid-cols-[280px_1fr]"
    >
      <Skeleton className="aspect-[2/3] w-full max-w-xs" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>
    </div>
  );
}

export function BookDetails({ id }: { id: string }) {
  const router = useRouter();
  const isClient = useIsClient();
  const user = useAuthStore((state) => state.user);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { data: book, isPending, isError, error } = useBook(id);
  const deleteBook = useDeleteBookAsAdmin();

  const isAdmin = isClient && user?.role === Role.ADMIN;

  function confirmDelete() {
    deleteBook.mutate(id, { onSuccess: () => router.replace('/books') });
  }

  return (
    <div className="space-y-6">
      <Link
        href="/books"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        До каталогу
      </Link>

      {isPending && <BookDetailsSkeleton />}

      {isError && (
        <EmptyState
          icon={BookX}
          title={
            getApiErrorStatus(error) === HTTP_NOT_FOUND
              ? 'Книгу не знайдено'
              : 'Не вдалося завантажити книгу'
          }
          description="Можливо, власник її видалив."
          action={
            <Link href="/books" className={getButtonClasses({})}>
              До каталогу
            </Link>
          }
        />
      )}

      {book && (
        <div className="grid gap-8 md:grid-cols-[280px_1fr]">
          <BookCover
            name={book.name}
            photoUrl={book.photoUrl}
            sizes={COVER_SIZES}
            priority
            className="max-w-xs"
          />
          <div className="space-y-4">
            <div>
              <h1 className="text-2xl font-semibold sm:text-3xl">{book.name}</h1>
              <p className="mt-1 text-lg text-slate-600">{book.author}</p>
              {book.status === BookStatus.EXCHANGED && (
                <Badge variant="neutral" className="mt-2">
                  Обміняно
                </Badge>
              )}
            </div>
            <dl className="space-y-1 text-sm">
              <div className="flex gap-2">
                <dt className="text-slate-500">Власник:</dt>
                <dd className="font-medium">{book.owner.name}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="text-slate-500">Додано:</dt>
                <dd className="font-medium">{formatDate(book.createdAt)}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap items-center gap-3">
              <RequestExchangeButton book={book} />
              {isAdmin && (
                <Button variant="danger" onClick={() => setIsDeleteDialogOpen(true)}>
                  <Trash2 className="size-4" aria-hidden="true" />
                  Видалити як адмін
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Видалити книгу?"
        description={`Книгу «${book?.name ?? ''}» буде видалено разом з обкладинкою. Цю дію не можна скасувати.`}
        confirmLabel="Видалити"
        isLoading={deleteBook.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setIsDeleteDialogOpen(false)}
      />
    </div>
  );
}
