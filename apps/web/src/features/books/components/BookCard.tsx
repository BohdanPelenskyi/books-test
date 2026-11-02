import type { Book } from '@book-exchange/shared';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BookCover } from './BookCover';

interface BookCardProps {
  book: Book;
  showOwner?: boolean;
  footer?: ReactNode;
}

export function BookCard({ book, showOwner = false, footer }: BookCardProps) {
  return (
    <article className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link href={`/books/${book.id}`} className="flex flex-1 flex-col gap-3 p-3">
        <BookCover name={book.name} photoUrl={book.photoUrl} />
        <div className="min-w-0">
          <h2 className="line-clamp-2 font-semibold leading-snug">{book.name}</h2>
          <p className="mt-0.5 truncate text-sm text-slate-600">{book.author}</p>
          {showOwner && (
            <p className="mt-1 truncate text-xs text-slate-500">Власник: {book.owner.name}</p>
          )}
        </div>
      </Link>
      {footer && <div className="flex gap-2 border-t border-slate-100 p-3">{footer}</div>}
    </article>
  );
}
