'use client';

import type { AdminUser, Book } from '@book-exchange/shared';
import { Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/Skeleton';
import { BookCover } from '@/features/books/components/BookCover';
import { USER_BOOKS_PAGE_SIZE } from '../constants';
import { useAdminUserBooks, useDeleteBookAsAdmin } from '../hooks';

interface UserBooksModalProps {
  user: AdminUser | null;
  onClose: () => void;
}

function UserBooksList({ user }: { user: AdminUser }) {
  const [page, setPage] = useState(1);
  const [bookToDelete, setBookToDelete] = useState<Book | null>(null);
  const { data, isPending, isError } = useAdminUserBooks(user.id, page, USER_BOOKS_PAGE_SIZE);
  const deleteBook = useDeleteBookAsAdmin();

  function confirmDelete() {
    if (bookToDelete) {
      deleteBook.mutate(bookToDelete.id, {
        onSuccess: () => {
          setBookToDelete(null);
          if (data?.items.length === 1 && page > 1) {
            setPage(page - 1);
          }
        },
      });
    }
  }

  return (
    <div className="space-y-4">
      {isPending && <Skeleton className="h-40 w-full" />}
      {isError && <p className="text-sm text-red-600">Не вдалося завантажити книги</p>}
      {data && data.items.length === 0 && (
        <p className="text-sm text-slate-600">У цього користувача ще немає книг.</p>
      )}

      {data && data.items.length > 0 && (
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {data.items.map((book) => (
            <li key={book.id} className="flex items-center gap-3 p-3">
              <BookCover
                name={book.name}
                photoUrl={book.photoUrl}
                sizes="48px"
                className="w-10 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{book.name}</p>
                <p className="truncate text-xs text-slate-500">{book.author}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                aria-label={`Видалити «${book.name}»`}
                onClick={() => setBookToDelete(book)}
                className="text-red-600 hover:bg-red-50"
              >
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {data && (
        <Pagination
          page={data.meta.page}
          totalPages={data.meta.totalPages}
          onPageChange={setPage}
        />
      )}

      <ConfirmDialog
        isOpen={bookToDelete !== null}
        title="Видалити книгу?"
        description={`Книгу «${bookToDelete?.name ?? ''}» буде видалено разом з обкладинкою.`}
        confirmLabel="Видалити"
        isLoading={deleteBook.isPending}
        onConfirm={confirmDelete}
        onCancel={() => setBookToDelete(null)}
      />
    </div>
  );
}

export function UserBooksModal({ user, onClose }: UserBooksModalProps) {
  return (
    <Modal isOpen={user !== null} title={`Книги: ${user?.name ?? ''}`} onClose={onClose}>
      {user && <UserBooksList user={user} />}
    </Modal>
  );
}
