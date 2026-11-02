'use client';

import type { Book } from '@book-exchange/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Button, getButtonClasses } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Skeleton } from '@/components/ui/Skeleton';
import { Textarea } from '@/components/ui/Textarea';
import { useMyBooks } from '@/features/books/hooks';
import { MESSAGE_MAX_LENGTH, MY_BOOKS_PREVIEW_LIMIT } from '../constants';
import { useCreateExchangeRequest } from '../hooks';
import { exchangeRequestSchema, type ExchangeRequestFormValues } from '../schemas';

interface RequestExchangeModalProps {
  book: Book;
  isOpen: boolean;
  onClose: () => void;
}

function RequestExchangeForm({ book, onClose }: Omit<RequestExchangeModalProps, 'isOpen'>) {
  const { data: myBooks, isPending: isLoadingBooks } = useMyBooks({
    limit: MY_BOOKS_PREVIEW_LIMIT,
  });
  const { mutate: sendRequest, isPending: isSending } = useCreateExchangeRequest();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExchangeRequestFormValues>({
    resolver: zodResolver(exchangeRequestSchema),
    defaultValues: { message: '' },
  });

  const hasNoBooks = myBooks?.meta.total === 0;

  function submit({ message }: ExchangeRequestFormValues) {
    sendRequest({ bookId: book.id, message: message || undefined }, { onSuccess: onClose });
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      <p className="text-sm text-slate-600">
        Ви хочете отримати «{book.name}». Власнику прийде лист з вашими контактами та списком книг,
        які ви пропонуєте:
      </p>

      {isLoadingBooks && <Skeleton className="h-24 w-full" />}

      {hasNoBooks && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>Щоб запросити обмін, додайте хоча б одну свою книгу.</p>
          <Link href="/me/books" className="mt-2 inline-block font-medium underline">
            Додати книгу
          </Link>
        </div>
      )}

      {myBooks && myBooks.items.length > 0 && (
        <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
          {myBooks.items.map((myBook) => (
            <li key={myBook.id} className="px-3 py-2 text-sm">
              <span className="font-medium">{myBook.name}</span>
              <span className="text-slate-500"> — {myBook.author}</span>
            </li>
          ))}
        </ul>
      )}

      <Textarea
        label="Повідомлення (необовʼязково)"
        placeholder="Напишіть, чому вам цікава ця книга"
        maxLength={MESSAGE_MAX_LENGTH}
        error={errors.message?.message}
        {...register('message')}
      />

      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="secondary" onClick={onClose} disabled={isSending}>
          Скасувати
        </Button>
        {hasNoBooks ? (
          <Link href="/me/books" className={getButtonClasses({})}>
            Мої книги
          </Link>
        ) : (
          <Button type="submit" isLoading={isSending} disabled={isLoadingBooks}>
            Надіслати
          </Button>
        )}
      </div>
    </form>
  );
}

export function RequestExchangeModal({ book, isOpen, onClose }: RequestExchangeModalProps) {
  return (
    <Modal isOpen={isOpen} title="Запросити обмін" onClose={onClose}>
      <RequestExchangeForm book={book} onClose={onClose} />
    </Modal>
  );
}
