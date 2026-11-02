import type { Metadata } from 'next';
import { BooksCatalog } from '@/features/books/components/BooksCatalog';
import { parseCatalogParams, type RawSearchParams } from '@/features/books/search-params';

export const metadata: Metadata = { title: 'Книги' };

export default async function BooksPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const params = parseCatalogParams(await searchParams);

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Книги</h1>
      <BooksCatalog params={params} />
    </>
  );
}
