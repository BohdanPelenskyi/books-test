import type { Paginated, PaginationMeta } from '@book-exchange/shared';

export type PaginatedResponse<T> = Paginated<T>;

interface PageParams {
  page: number;
  limit: number;
}

export function buildPaginationMeta(total: number, { page, limit }: PageParams): PaginationMeta {
  return { page, limit, total, totalPages: Math.ceil(total / limit) };
}

export function getPaginationSkip({ page, limit }: PageParams): number {
  return (page - 1) * limit;
}
