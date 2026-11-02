import type { Metadata } from 'next';
import { MyBooks } from '@/features/books/components/MyBooks';
import { parsePageParam, type RawSearchParams } from '@/features/books/search-params';

export const metadata: Metadata = { title: 'Мої книги' };

export default async function MyBooksPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const { page } = await searchParams;

  return <MyBooks page={parsePageParam(page)} />;
}
