import type { Metadata } from 'next';
import { ExchangesView } from '@/features/exchange/components/ExchangesView';

export const metadata: Metadata = { title: 'Обміни' };

export default async function ExchangesPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;

  return <ExchangesView perspective={tab === 'outgoing' ? 'outgoing' : 'incoming'} />;
}
