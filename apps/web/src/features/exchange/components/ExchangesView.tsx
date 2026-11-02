'use client';

import { Inbox, Send } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getButtonClasses } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { getTabPanelProps, Tabs } from '@/components/ui/Tabs';
import { useIncomingPendingCount, useIncomingRequests, useOutgoingRequests } from '../hooks';
import { ExchangeRequestCard, type ExchangePerspective } from './ExchangeRequestCard';

const EXCHANGES_PATH = '/exchanges';
const TABS_ID = 'exchange';

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

      <Tabs
        idPrefix={TABS_ID}
        label="Тип запитів"
        tabs={[
          { value: 'incoming', label: 'Вхідні', badgeCount: pendingCount },
          { value: 'outgoing', label: 'Надіслані' },
        ]}
        value={perspective}
        onChange={selectTab}
        className="sm:w-fit"
      />

      <div {...getTabPanelProps(TABS_ID, perspective)} className="space-y-6">
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
    </div>
  );
}
