export const BookSort = {
  NAME_ASC: 'name:asc',
  NAME_DESC: 'name:desc',
  AUTHOR_ASC: 'author:asc',
  NEWEST: 'createdAt:desc',
} as const;

export type BookSort = (typeof BookSort)[keyof typeof BookSort];

export interface BookOwner {
  id: string;
  name: string;
}

export interface Book {
  id: string;
  name: string;
  author: string;
  photoUrl: string | null;
  ownerId: string;
  createdAt: string;
  owner: BookOwner;
}
