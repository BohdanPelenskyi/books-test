import { BookOpen } from 'lucide-react';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href="/books" className="flex items-center gap-2 text-lg font-semibold">
      <BookOpen className="size-6 text-accent-600" aria-hidden="true" />
      Book Exchange
    </Link>
  );
}
