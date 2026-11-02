import type { Book, BookSort, Paginated } from '@book-exchange/shared';
import { apiClient } from '@/lib/api-client';

export interface BookListParams {
  search?: string;
  sort?: BookSort;
  page?: number;
  limit?: number;
  excludeOwnerId?: string;
}

export interface MyBooksParams {
  page?: number;
  limit?: number;
}

export interface BookInput {
  name: string;
  author: string;
  photoUrl?: string;
  photo?: File;
}

function toFormData({ name, author, photoUrl, photo }: BookInput): FormData {
  const formData = new FormData();
  formData.append('name', name);
  formData.append('author', author);
  if (photoUrl) formData.append('photoUrl', photoUrl);
  if (photo) formData.append('photo', photo);
  return formData;
}

export async function fetchBooks(params: BookListParams): Promise<Paginated<Book>> {
  const { data } = await apiClient.get<Paginated<Book>>('/books', { params });
  return data;
}

export async function fetchBook(id: string): Promise<Book> {
  const { data } = await apiClient.get<Book>(`/books/${id}`);
  return data;
}

export async function fetchMyBooks(params: MyBooksParams): Promise<Paginated<Book>> {
  const { data } = await apiClient.get<Paginated<Book>>('/me/books', { params });
  return data;
}

export async function createBook(input: BookInput): Promise<Book> {
  const { data } = await apiClient.post<Book>('/me/books', toFormData(input));
  return data;
}

export async function updateBook(id: string, input: BookInput): Promise<Book> {
  const { data } = await apiClient.patch<Book>(`/me/books/${id}`, toFormData(input));
  return data;
}

export async function deleteBook(id: string): Promise<void> {
  await apiClient.delete(`/me/books/${id}`);
}
