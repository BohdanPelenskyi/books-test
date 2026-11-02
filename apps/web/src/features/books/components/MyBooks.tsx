'use client';

import type { Book } from '@book-exchange/shared';
import { BookPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { Pagination } from '@/components/ui/Pagination';
import { cn } from '@/lib/cn';
import type { BookInput } from '../api';
import { BOOKS_PAGE_SIZE } from '../constants';
import { useCreateBook, useDeleteBook, useMyBooks, useUpdateBook } from '../hooks';
import { BookCard } from './BookCard';
import { BookForm } from './BookForm';
import { BookGrid } from './BookGrid';
import { BookGridSkeleton } from './BookGridSkeleton';

type DialogState =
  { type: 'create' } | { type: 'edit'; book: Book } | { type: 'delete'; book: Book } | null;

const MY_BOOKS_PATH = '/me/books';

export function MyBooks({ page }: { page: number }) {
  const router = useRouter();
  const [dialog, setDialog] = useState<DialogState>(null);
  const { data, isPending, isError, isPlaceholderData } = useMyBooks({
    page,
    limit: BOOKS_PAGE_SIZE,
  });
  const createBook = useCreateBook();
  const updateBook = useUpdateBook();
  const deleteBook = useDeleteBook();

  const closeDialog = () => setDialog(null);

  function goToPage(targetPage: number) {
    router.replace(targetPage > 1 ? `${MY_BOOKS_PATH}?page=${targetPage}` : MY_BOOKS_PATH);
  }

  useEffect(() => {
    if (data && data.items.length === 0 && page > 1) {
      router.replace(
        data.meta.totalPages > 1 ? `${MY_BOOKS_PATH}?page=${data.meta.totalPages}` : MY_BOOKS_PATH,
      );
    }
  }, [data, page, router]);

  function submitBook(input: BookInput) {
    if (dialog?.type === 'edit') {
      updateBook.mutate({ id: dialog.book.id, input }, { onSuccess: closeDialog });
    } else {
      createBook.mutate(input, { onSuccess: closeDialog });
    }
  }

  function confirmDelete() {
    if (dialog?.type === 'delete') {
      deleteBook.mutate(dialog.book.id, { onSuccess: closeDialog });
    }
  }

  const editedBook = dialog?.type === 'edit' ? dialog.book : undefined;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Мої книги</h1>
        <Button onClick={() => setDialog({ type: 'create' })}>
          <Plus className="size-4" aria-hidden="true" />
          Додати книгу
        </Button>
      </div>

      {isPending && <BookGridSkeleton count={4} />}

      {isError && <EmptyState icon={BookPlus} title="Не вдалося завантажити ваші книги" />}

      {data && data.items.length === 0 && page === 1 && (
        <EmptyState
          icon={BookPlus}
          title="У вас ще немає книг"
          description="Додайте книгу, щоб пропонувати її для обміну."
          action={<Button onClick={() => setDialog({ type: 'create' })}>Додати книгу</Button>}
        />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
            <BookGrid>
              {data.items.map((book) => (
                <BookCard
                  key={book.id}
                  book={book}
                  footer={
                    <>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        onClick={() => setDialog({ type: 'edit', book })}
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                        Редагувати
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        aria-label={`Видалити «${book.name}»`}
                        onClick={() => setDialog({ type: 'delete', book })}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </>
                  }
                />
              ))}
            </BookGrid>
          </div>
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={goToPage}
          />
        </>
      )}

      <Modal
        isOpen={dialog?.type === 'create' || dialog?.type === 'edit'}
        title={editedBook ? 'Редагувати книгу' : 'Додати книгу'}
        onClose={closeDialog}
      >
        <BookForm
          book={editedBook}
          isSubmitting={createBook.isPending || updateBook.isPending}
          onSubmit={submitBook}
          onCancel={closeDialog}
        />
      </Modal>

      <ConfirmDialog
        isOpen={dialog?.type === 'delete'}
        title="Видалити книгу?"
        description={
          dialog?.type === 'delete'
            ? `Книгу «${dialog.book.name}» буде видалено разом з обкладинкою. Цю дію не можна скасувати.`
            : ''
        }
        confirmLabel="Видалити"
        isLoading={deleteBook.isPending}
        onConfirm={confirmDelete}
        onCancel={closeDialog}
      />
    </div>
  );
}
