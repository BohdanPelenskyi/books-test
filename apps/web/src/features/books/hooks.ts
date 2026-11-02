'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  createBook,
  deleteBook,
  fetchBook,
  fetchBooks,
  fetchMyBooks,
  updateBook,
  type BookInput,
  type BookListParams,
  type MyBooksParams,
} from './api';

export const bookKeys = {
  all: ['books'] as const,
  list: (params: BookListParams) => [...bookKeys.all, 'list', params] as const,
  mine: (params: MyBooksParams) => [...bookKeys.all, 'mine', params] as const,
  detail: (id: string) => [...bookKeys.all, 'detail', id] as const,
};

export function useBooks(params: BookListParams, isEnabled = true) {
  return useQuery({
    queryKey: bookKeys.list(params),
    queryFn: () => fetchBooks(params),
    placeholderData: keepPreviousData,
    enabled: isEnabled,
  });
}

export function useMyBooks(params: MyBooksParams) {
  return useQuery({
    queryKey: bookKeys.mine(params),
    queryFn: () => fetchMyBooks(params),
    placeholderData: keepPreviousData,
  });
}

export function useBook(id: string) {
  return useQuery({ queryKey: bookKeys.detail(id), queryFn: () => fetchBook(id) });
}

function useBookMutationHandlers(successMessage: string) {
  const queryClient = useQueryClient();

  return {
    onSuccess: () => {
      toast.success(successMessage);
      return queryClient.invalidateQueries({ queryKey: bookKeys.all });
    },
    onError: (error: unknown) => toast.error(getApiErrorMessage(error)),
  };
}

export function useCreateBook() {
  return useMutation({
    mutationFn: (input: BookInput) => createBook(input),
    ...useBookMutationHandlers('Книгу додано'),
  });
}

export function useUpdateBook() {
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: BookInput }) => updateBook(id, input),
    ...useBookMutationHandlers('Книгу оновлено'),
  });
}

export function useDeleteBook() {
  return useMutation({
    mutationFn: (id: string) => deleteBook(id),
    ...useBookMutationHandlers('Книгу видалено'),
  });
}
