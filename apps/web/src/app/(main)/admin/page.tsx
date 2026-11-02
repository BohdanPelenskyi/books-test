import type { Metadata } from 'next';
import { AdminUsersView } from '@/features/admin/components/AdminUsersView';
import { parsePageParam, type RawSearchParams } from '@/features/books/search-params';

export const metadata: Metadata = { title: 'Адмін' };

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>;
}) {
  const { search, page } = await searchParams;
  const searchText = (Array.isArray(search) ? search[0] : search)?.trim() ?? '';

  return <AdminUsersView search={searchText} page={parsePageParam(page)} />;
}
