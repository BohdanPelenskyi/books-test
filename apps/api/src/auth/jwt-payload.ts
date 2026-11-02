import type { Role } from '@book-exchange/shared';

export interface JwtPayload {
  sub: string;
  role: Role;
}
