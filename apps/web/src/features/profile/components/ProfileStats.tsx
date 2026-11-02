import type { Profile } from '@book-exchange/shared';
import { BookOpen, Inbox, Send } from 'lucide-react';
import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  href: string;
}

function StatCard({ icon: Icon, label, value, href }: StatCardProps) {
  return (
    <Link
      href={href}
      className="block rounded-xl focus-visible:outline-2 focus-visible:outline-accent-600"
    >
      <Card className="flex items-center gap-4 p-4 transition-shadow hover:shadow-md">
        <div className="rounded-lg bg-accent-50 p-2.5 text-accent-600">
          <Icon className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-sm text-slate-600">{label}</p>
        </div>
      </Card>
    </Link>
  );
}

export function ProfileStats({ profile }: { profile: Profile }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <StatCard icon={BookOpen} label="Мої книги" value={profile.booksCount} href="/me/books" />
      <StatCard
        icon={Inbox}
        label="Вхідні запити"
        value={profile.incomingRequestsCount}
        href="/exchanges"
      />
      <StatCard
        icon={Send}
        label="Надіслані запити"
        value={profile.outgoingRequestsCount}
        href="/exchanges?tab=outgoing"
      />
    </div>
  );
}
