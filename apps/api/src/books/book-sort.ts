import type { Prisma } from '@prisma/client';
import { BookSort } from '@book-exchange/shared';

export { BookSort };

export const BOOK_ORDER_BY: Readonly<Record<BookSort, Prisma.BookOrderByWithRelationInput>> = {
  [BookSort.NAME_ASC]: { name: 'asc' },
  [BookSort.NAME_DESC]: { name: 'desc' },
  [BookSort.AUTHOR_ASC]: { author: 'asc' },
  [BookSort.NEWEST]: { createdAt: 'desc' },
};
