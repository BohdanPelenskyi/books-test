import { BookSort } from '@book-exchange/shared';
import { SORT_OPTIONS } from './constants';

export interface BookCatalogParams {
  search: string;
  sort: BookSort;
  page: number;
  hideMine: boolean;
}

export type RawSearchParams = Record<string, string | string[] | undefined>;

const HIDE_MINE_VALUE = '1';

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function parsePageParam(value: string | string[] | undefined): number {
  const page = Number(firstValue(value));
  return Number.isInteger(page) && page > 0 ? page : 1;
}

export function parseCatalogParams(raw: RawSearchParams): BookCatalogParams {
  const sort = SORT_OPTIONS.find((option) => option.value === firstValue(raw.sort))?.value;

  return {
    search: firstValue(raw.search)?.trim() ?? '',
    sort: sort ?? BookSort.NEWEST,
    page: parsePageParam(raw.page),
    hideMine: firstValue(raw.hideMine) === HIDE_MINE_VALUE,
  };
}

/** Builds a query string that omits default values to keep URLs short. */
export function buildCatalogQuery({ search, sort, page, hideMine }: BookCatalogParams): string {
  const query = new URLSearchParams();
  if (search) query.set('search', search);
  if (sort !== BookSort.NEWEST) query.set('sort', sort);
  if (page > 1) query.set('page', String(page));
  if (hideMine) query.set('hideMine', HIDE_MINE_VALUE);

  const queryString = query.toString();
  return queryString ? `?${queryString}` : '';
}
