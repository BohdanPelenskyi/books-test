import { Compass } from 'lucide-react';
import Link from 'next/link';
import { getButtonClasses } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="w-full">
        <EmptyState
          icon={Compass}
          title="Сторінку не знайдено"
          description="Можливо, посилання застаріло або містить помилку."
          action={
            <Link href="/books" className={getButtonClasses({})}>
              До каталогу
            </Link>
          }
        />
      </div>
    </main>
  );
}
