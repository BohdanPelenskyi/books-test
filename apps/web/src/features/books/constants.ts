import { BookSort } from '@book-exchange/shared';

export const BOOKS_PAGE_SIZE = 12;

export const SORT_OPTIONS: ReadonlyArray<{ value: BookSort; label: string }> = [
  { value: BookSort.NEWEST, label: 'Спочатку нові' },
  { value: BookSort.NAME_ASC, label: 'Назва: А → Я' },
  { value: BookSort.NAME_DESC, label: 'Назва: Я → А' },
  { value: BookSort.AUTHOR_ASC, label: 'Автор: А → Я' },
];
