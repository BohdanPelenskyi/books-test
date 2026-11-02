'use client';

import { BookStatus, type Book } from '@book-exchange/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
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
  // null means "nothing was changed yet", i.e. every available book is offered.
  const [chosenIds, setChosenIds] = useState<string[] | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ExchangeRequestFormValues>({
    resolver: zodResolver(exchangeRequestSchema),
    defaultValues: { message: '' },
  });

  const availableBooks =
    myBooks?.items.filter(({ status }) => status === BookStatus.AVAILABLE) ?? [];
  const offeredIds = chosenIds ?? availableBooks.map(({ id }) => id);
  const hasNoBooks = myBooks !== undefined && availableBooks.length === 0;

  function toggleBook(id: string) {
    setChosenIds(
      offeredIds.includes(id)
        ? offeredIds.filter((offeredId) => offeredId !== id)
        : [...offeredIds, id],
    );
  }

  function submit({ message }: ExchangeRequestFormValues) {
    sendRequest(
      { bookId: book.id, offeredBookIds: offeredIds, message: message || undefined },
      { onSuccess: onClose },
    );
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate className="space-y-4">
      <p className="text-sm text-slate-600">
        Ви хочете отримати «{book.name}». Власнику прийде лист з вашими контактами та книгами, які
        ви оберете для обміну:
      </p>

      {isLoadingBooks && <Skeleton className="h-24 w-full" />}

      {hasNoBooks && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <p>Щоб запросити обмін, додайте хоча б одну свою доступну книгу.</p>
          <Link href="/me/books" className="mt-2 inline-block font-medium underline">
            Додати книгу
          </Link>
        </div>
      )}

      {availableBooks.length > 0 && (
        <fieldset>
          <legend className="sr-only">Книги, які ви пропонуєте</legend>
          <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
            {availableBooks.map((myBook) => (
              <li key={myBook.id}>
                <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50">
                  <input
                    type="checkbox"
                    checked={offeredIds.includes(myBook.id)}
                    onChange={() => toggleBook(myBook.id)}
                    className="size-4 rounded border-slate-300 accent-accent-600"
                  />
                  <span className="min-w-0">
                    <span className="font-medium">{myBook.name}</span>
                    <span className="text-slate-500"> — {myBook.author}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          {offeredIds.length === 0 && (
            <p className="mt-1.5 text-sm text-red-600">Оберіть хоча б одну книгу</p>
          )}
        </fieldset>
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
          <Button
            type="submit"
            isLoading={isSending}
            disabled={isLoadingBooks || offeredIds.length === 0}
          >
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
