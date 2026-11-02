'use client';

import { SearchX, Library } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Button, getButtonClasses } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { SearchInput } from '@/components/ui/SearchInput';
import { cn } from '@/lib/cn';
import { useDebouncedSearch } from '@/lib/use-debounced-search';
import { useIsClient } from '@/lib/use-is-client';
import { useAuthStore } from '@/stores/auth.store';
import { BOOKS_PAGE_SIZE } from '../constants';
import { useBooks } from '../hooks';
import { buildCatalogQuery, type BookCatalogParams } from '../search-params';
import { BookCard } from './BookCard';
import { BookGrid } from './BookGrid';
import { BookGridSkeleton } from './BookGridSkeleton';
import { SortSelect } from './SortSelect';

export function BooksCatalog({ params }: { params: BookCatalogParams }) {
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isClient = useIsClient();

  const { data, isPending, isError, isPlaceholderData, refetch } = useBooks(
    {
      search: params.search || undefined,
      sort: params.sort,
      page: params.page,
      limit: BOOKS_PAGE_SIZE,
      excludeOwnerId: params.hideMine && user ? user.id : undefined,
    },
    isClient,
  );

  function updateParams(changes: Partial<BookCatalogParams>) {
    const query = buildCatalogQuery({ ...params, ...changes });
    router.replace(`${pathname}${query}`, { scroll: false });
  }

  const [searchInput, setSearchInput] = useDebouncedSearch(params.search, (search) =>
    updateParams({ search, page: 1 }),
  );

  const hasFilters = params.search !== '' || params.hideMine;

  function resetFilters() {
    setSearchInput('');
    updateParams({ search: '', hideMine: false, page: 1 });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          value={searchInput}
          onChange={setSearchInput}
          placeholder="Пошук за назвою або автором"
          label="Пошук книг"
        />
        <SortSelect value={params.sort} onChange={(sort) => updateParams({ sort, page: 1 })} />
      </div>

      {isClient && user && (
        <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={params.hideMine}
            onChange={(event) => updateParams({ hideMine: event.target.checked, page: 1 })}
            className="size-4 rounded border-slate-300 accent-accent-600"
          />
          Приховати мої книги
        </label>
      )}

      {isPending && <BookGridSkeleton />}

      {isError && (
        <EmptyState
          icon={SearchX}
          title="Не вдалося завантажити книги"
          description="Перевірте зʼєднання та спробуйте ще раз."
          action={<Button onClick={() => refetch()}>Спробувати знову</Button>}
        />
      )}

      {data && data.items.length === 0 && (
        <EmptyState
          icon={hasFilters ? SearchX : Library}
          title={hasFilters ? 'Нічого не знайдено' : 'Поки що немає книг'}
          description={
            hasFilters ? 'Спробуйте змінити запит або скинути фільтри.' : 'Додайте першу книгу!'
          }
          action={
            hasFilters ? (
              <Button variant="secondary" onClick={resetFilters}>
                Скинути фільтри
              </Button>
            ) : (
              <Link href="/me/books" className={getButtonClasses({})}>
                Додати книгу
              </Link>
            )
          }
        />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className={cn('transition-opacity', isPlaceholderData && 'opacity-60')}>
            <BookGrid>
              {data.items.map((book) => (
                <BookCard key={book.id} book={book} showOwner />
              ))}
            </BookGrid>
          </div>
          <Pagination
            page={data.meta.page}
            totalPages={data.meta.totalPages}
            onPageChange={(page) => updateParams({ page })}
          />
        </>
      )}
    </div>
  );
}
