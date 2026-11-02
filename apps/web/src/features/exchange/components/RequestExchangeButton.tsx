'use client';

import { BookStatus, ExchangeStatus, type Book } from '@book-exchange/shared';
import Link from 'next/link';
import { useState } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button, getButtonClasses } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { useIsClient } from '@/lib/use-is-client';
import { useAuthStore } from '@/stores/auth.store';
import { useOutgoingRequests } from '../hooks';
import { RequestExchangeModal } from './RequestExchangeModal';

export function RequestExchangeButton({ book }: { book: Book }) {
  const isClient = useIsClient();
  const user = useAuthStore((state) => state.user);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { data: outgoingRequests } = useOutgoingRequests();

  if (!isClient) {
    return <Skeleton className="h-10 w-48" />;
  }

  if (book.status === BookStatus.EXCHANGED) {
    return <Badge variant="neutral">Книга вже обміняна</Badge>;
  }

  if (!user) {
    return (
      <Link
        href={`/login?redirect=${encodeURIComponent(`/books/${book.id}`)}`}
        className={getButtonClasses({ variant: 'secondary' })}
      >
        Увійдіть, щоб запросити обмін
      </Link>
    );
  }

  if (user.id === book.ownerId) {
    return <Badge variant="accent">Це ваша книга</Badge>;
  }

  const hasPendingRequest = outgoingRequests?.some(
    (request) => request.book.id === book.id && request.status === ExchangeStatus.PENDING,
  );
  if (hasPendingRequest) {
    return <Button disabled>Запит надіслано</Button>;
  }

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>Запросити обмін</Button>
      <RequestExchangeModal
        book={book}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
