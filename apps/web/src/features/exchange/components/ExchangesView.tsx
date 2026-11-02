'use client';

import { Inbox, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/Badge';
import { getButtonClasses } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { useIncomingPendingCount, useIncomingRequests, useOutgoingRequests } from '../hooks';
import { ExchangeRequestCard, type ExchangePerspective } from './ExchangeRequestCard';

const EXCHANGE_TABS: ReadonlyArray<{ perspective: ExchangePerspective; label: string }> = [
  { perspective: 'incoming', label: 'Вхідні' },
  { perspective: 'outgoing', label: 'Надіслані' },
];

const EXCHANGES_PATH = '/exchanges';
const EXCHANGE_PANEL_ID = 'exchange-panel';

function ExchangeListSkeleton() {
  return (
    <div role="status" aria-label="Завантаження запитів" className="space-y-4">
      {[0, 1, 2].map((index) => (
        <Skeleton key={index} className="h-36 w-full" />
      ))}
    </div>
  );
}

export function ExchangesView({ perspective }: { perspective: ExchangePerspective }) {
  const router = useRouter();
  const incoming = useIncomingRequests();
  const outgoing = useOutgoingRequests();
  const pendingCount = useIncomingPendingCount();

  const { data, isPending, isError } = perspective === 'incoming' ? incoming : outgoing;

  function selectTab(tab: ExchangePerspective) {
    router.replace(tab === 'incoming' ? EXCHANGES_PATH : `${EXCHANGES_PATH}?tab=${tab}`);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Обміни</h1>

      <div
        role="tablist"
        aria-label="Тип запитів"
        className="flex gap-1 rounded-lg bg-slate-100 p-1 sm:w-fit"
      >
        {EXCHANGE_TABS.map((tab) => (
          <button
            key={tab.perspective}
            type="button"
            role="tab"
            id={`exchange-tab-${tab.perspective}`}
            aria-controls={EXCHANGE_PANEL_ID}
            aria-selected={perspective === tab.perspective}
            onClick={() => selectTab(tab.perspective)}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-1.5 text-sm font-medium sm:flex-none',
              perspective === tab.perspective
                ? 'bg-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            {tab.label}
            {tab.perspective === 'incoming' && pendingCount > 0 && (
              <Badge variant="accent">{pendingCount}</Badge>
            )}
          </button>
        ))}
      </div>

      {isPending && <ExchangeListSkeleton />}

      {isError && (
        <EmptyState
          icon={Inbox}
          title="Не вдалося завантажити запити"
          description="Спробуйте оновити сторінку."
        />
      )}

      {data && data.length === 0 && (
        <EmptyState
          icon={perspective === 'incoming' ? Inbox : Send}
          title={
            perspective === 'incoming' ? 'Вхідних запитів ще немає' : 'Ви ще не надсилали запитів'
          }
          description={
            perspective === 'incoming'
              ? 'Коли хтось захоче обмінятися з вами, запит зʼявиться тут.'
              : 'Знайдіть цікаву книгу в каталозі та запропонуйте обмін.'
          }
          action={
            perspective === 'outgoing' ? (
              <Link href="/books" className={getButtonClasses({})}>
                До каталогу
              </Link>
            ) : undefined
          }
        />
      )}

      {data && data.length > 0 && (
        <div className="space-y-4">
          {data.map((request) => (
            <ExchangeRequestCard key={request.id} request={request} perspective={perspective} />
          ))}
        </div>
      )}
    </div>
  );
}
