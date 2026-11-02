import { Prisma } from '@prisma/client';

export const PUBLIC_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  role: true,
  avatarUrl: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

export const AUTH_STATE_USER_SELECT = {
  ...PUBLIC_USER_SELECT,
  tokenVersion: true,
} satisfies Prisma.UserSelect;

export const CREDENTIALS_USER_SELECT = {
  ...AUTH_STATE_USER_SELECT,
  passwordHash: true,
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{ select: typeof PUBLIC_USER_SELECT }>;
export type UserAuthState = Prisma.UserGetPayload<{ select: typeof AUTH_STATE_USER_SELECT }>;
export type UserWithCredentials = Prisma.UserGetPayload<{
  select: typeof CREDENTIALS_USER_SELECT;
}>;
