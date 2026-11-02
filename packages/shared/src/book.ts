export const BookSort = {
  NAME_ASC: 'name:asc',
  NAME_DESC: 'name:desc',
  AUTHOR_ASC: 'author:asc',
  NEWEST: 'createdAt:desc',
} as const;

export type BookSort = (typeof BookSort)[keyof typeof BookSort];

export const BookStatus = {
  AVAILABLE: 'AVAILABLE',
  EXCHANGED: 'EXCHANGED',
} as const;

export type BookStatus = (typeof BookStatus)[keyof typeof BookStatus];

export const BookAvailability = {
  AVAILABLE: 'available',
  ALL: 'all',
} as const;

export type BookAvailability = (typeof BookAvailability)[keyof typeof BookAvailability];

export interface BookOwner {
  id: string;
  name: string;
}

export interface Book {
  id: string;
  name: string;
  author: string;
  photoUrl: string | null;
  status: BookStatus;
  ownerId: string;
  createdAt: string;
  owner: BookOwner;
}
