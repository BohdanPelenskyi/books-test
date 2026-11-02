'use client';

import { TriangleAlert } from 'lucide-react';
import Link from 'next/link';
import { Button, getButtonClasses } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="w-full">
        <EmptyState
          icon={TriangleAlert}
          title="Щось пішло не так"
          description="Сталася неочікувана помилка. Спробуйте ще раз або поверніться до каталогу."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={reset}>Спробувати знову</Button>
              <Link href="/books" className={getButtonClasses({ variant: 'secondary' })}>
                До каталогу
              </Link>
            </div>
          }
        />
      </div>
    </main>
  );
}
