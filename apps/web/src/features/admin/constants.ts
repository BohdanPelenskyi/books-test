import { Role } from '@book-exchange/shared';

export const ADMIN_USERS_PAGE_SIZE = 10;
export const USER_BOOKS_PAGE_SIZE = 6;

export const ROLE_OPTIONS: ReadonlyArray<{ value: Role; label: string }> = [
  { value: Role.USER, label: 'Користувач' },
  { value: Role.ADMIN, label: 'Адміністратор' },
];
