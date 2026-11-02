import { Bell } from 'lucide-react';
import Link from 'next/link';
import { pluralize } from '@/lib/plural';

const REQUEST_FORMS = ['запит', 'запити', 'запитів'] as const;
const WAIT_FORMS = ['очікує', 'очікують', 'очікують'] as const;

export function PendingRequestsNotice({ count }: { count: number }) {
  return (
    <Link
      href="/exchanges"
      className="flex items-center gap-3 rounded-xl border border-accent-100 bg-accent-50 p-4 text-sm text-accent-700 transition-colors hover:bg-accent-100"
    >
      <Bell className="size-5 shrink-0" aria-hidden="true" />
      <span className="flex-1">
        У вас {count} {pluralize(count, REQUEST_FORMS)} на обмін, що {pluralize(count, WAIT_FORMS)}{' '}
        відповіді
      </span>
      <span className="font-medium">Переглянути</span>
    </Link>
  );
}
