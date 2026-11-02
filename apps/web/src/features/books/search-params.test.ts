import { BookSort } from '@book-exchange/shared';
import { describe, expect, it } from 'vitest';
import { buildCatalogQuery, parseCatalogParams, parsePageParam } from './search-params';

describe('parseCatalogParams', () => {
  it('uses defaults for an empty query', () => {
    expect(parseCatalogParams({})).toEqual({
      search: '',
      sort: BookSort.NEWEST,
      page: 1,
      hideMine: false,
    });
  });

  it('reads valid values and trims the search text', () => {
    expect(
      parseCatalogParams({ search: '  dune ', sort: 'name:desc', page: '3', hideMine: '1' }),
    ).toEqual({ search: 'dune', sort: BookSort.NAME_DESC, page: 3, hideMine: true });
  });

  it('ignores an unknown sort and a malformed page', () => {
    const params = parseCatalogParams({ sort: 'price:asc', page: '-4' });

    expect(params.sort).toBe(BookSort.NEWEST);
    expect(params.page).toBe(1);
  });

  it('takes the first value of a repeated parameter', () => {
    expect(parsePageParam(['2', '5'])).toBe(2);
  });
});

describe('buildCatalogQuery', () => {
  it('omits defaults to keep URLs short', () => {
    expect(buildCatalogQuery({ search: '', sort: BookSort.NEWEST, page: 1, hideMine: false })).toBe(
      '',
    );
  });

  it('round-trips with parseCatalogParams', () => {
    const params = { search: 'war & peace', sort: BookSort.NAME_ASC, page: 2, hideMine: true };
    const query = new URLSearchParams(buildCatalogQuery(params));

    expect(parseCatalogParams(Object.fromEntries(query))).toEqual(params);
  });
});
