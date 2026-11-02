import type { AuthUser } from './auth';

export interface AdminUser extends AuthUser {
  booksCount: number;
}
