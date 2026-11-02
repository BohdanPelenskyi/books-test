import type { Role } from '@book-exchange/shared';

export interface JwtPayload {
  sub: string;
  role: Role;
  /** Must match User.tokenVersion; a password change makes older tokens invalid. */
  tv: number;
}
