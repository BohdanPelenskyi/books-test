import { Skeleton } from '@/components/ui/Skeleton';
import { BOOKS_PAGE_SIZE } from '../constants';
import { BookGrid } from './BookGrid';

export function BookGridSkeleton({ count = BOOKS_PAGE_SIZE }: { count?: number }) {
  return (
    <div role="status" aria-label="Завантаження книг">
      <BookGrid>
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="space-y-3 rounded-xl border border-slate-200 bg-white p-3">
            <Skeleton className="aspect-[2/3] w-full" />
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </BookGrid>
    </div>
  );
}
