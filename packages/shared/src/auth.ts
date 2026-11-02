import type { Role } from './role';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatarUrl: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: AuthUser;
}

export interface Profile extends AuthUser {
  booksCount: number;
  incomingRequestsCount: number;
  outgoingRequestsCount: number;
  pendingIncomingCount: number;
}
