'use client';

import { ExchangeAction, ExchangeStatus, type ExchangeRequest } from '@book-exchange/shared';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { BookCover } from '@/features/books/components/BookCover';
import { formatDate } from '@/lib/format-date';
import { STATUS_DISPLAY } from '../constants';
import { useRespondToRequest } from '../hooks';

export type ExchangePerspective = 'incoming' | 'outgoing';

interface ExchangeRequestCardProps {
  request: ExchangeRequest;
  perspective: ExchangePerspective;
}

const COVER_SIZES = '80px';

export function ExchangeRequestCard({ request, perspective }: ExchangeRequestCardProps) {
  const { mutate: respond, isPending, variables } = useRespondToRequest();
  const { book, requester, owner, message, status } = request;
  const { label, tone } = STATUS_DISPLAY[status];
  const isPendingRequest = status === ExchangeStatus.PENDING;
  const pendingAction = isPending ? variables.action : null;

  function respondWith(action: ExchangeAction) {
    respond({ id: request.id, action });
  }

  return (
    <article className="flex gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <BookCover
        name={book.name}
        photoUrl={book.photoUrl}
        sizes={COVER_SIZES}
        className="w-16 shrink-0 sm:w-20"
      />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <Link
              href={`/books/${book.id}`}
              className="line-clamp-2 font-semibold hover:text-accent-700"
            >
              {book.name}
            </Link>
            <p className="truncate text-sm text-slate-600">{book.author}</p>
          </div>
          <Badge variant={tone}>{label}</Badge>
        </div>

        <p className="text-sm text-slate-700">
          {perspective === 'incoming' ? (
            <>
              Від: <span className="font-medium">{requester.name}</span>{' '}
              {requester.email && (
                <a href={`mailto:${requester.email}`} className="text-accent-600 hover:underline">
                  {requester.email}
                </a>
              )}
            </>
          ) : (
            <>
              Власник: <span className="font-medium">{owner.name}</span>
            </>
          )}
        </p>

        {message && (
          <blockquote className="border-l-4 border-accent-100 pl-3 text-sm italic text-slate-600">
            {message}
          </blockquote>
        )}

        <p className="text-xs text-slate-500">{formatDate(request.createdAt)}</p>

        {isPendingRequest && (
          <div className="flex flex-wrap gap-2 pt-1">
            {perspective === 'incoming' ? (
              <>
                <Button
                  size="sm"
                  isLoading={pendingAction === ExchangeAction.ACCEPT}
                  disabled={isPending}
                  onClick={() => respondWith(ExchangeAction.ACCEPT)}
                >
                  Прийняти
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  isLoading={pendingAction === ExchangeAction.DECLINE}
                  disabled={isPending}
                  onClick={() => respondWith(ExchangeAction.DECLINE)}
                >
                  Відхилити
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="secondary"
                isLoading={pendingAction === ExchangeAction.CANCEL}
                disabled={isPending}
                onClick={() => respondWith(ExchangeAction.CANCEL)}
              >
                Скасувати
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
