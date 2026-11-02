import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const VISIBLE_PAGES_RADIUS = 1;

function getVisiblePages(page: number, totalPages: number): number[] {
  const pages = new Set([1, totalPages]);
  for (let offset = -VISIBLE_PAGES_RADIUS; offset <= VISIBLE_PAGES_RADIUS; offset += 1) {
    pages.add(page + offset);
  }
  return [...pages].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);
}

const NAV_BUTTON_CLASSES =
  'inline-flex size-9 items-center justify-center rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50';

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const visiblePages = getVisiblePages(page, totalPages);

  return (
    <nav aria-label="Пагінація" className="flex items-center justify-center gap-1">
      <button
        type="button"
        aria-label="Попередня сторінка"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        className={NAV_BUTTON_CLASSES}
      >
        <ChevronLeft className="size-4" aria-hidden="true" />
      </button>
      {visiblePages.map((visiblePage, index) => (
        <span key={visiblePage} className="flex items-center gap-1">
          {index > 0 && visiblePage - (visiblePages[index - 1] ?? 0) > 1 && (
            <span className="px-1 text-slate-400">…</span>
          )}
          <button
            type="button"
            aria-label={`Сторінка ${visiblePage}`}
            aria-current={visiblePage === page ? 'page' : undefined}
            onClick={() => onPageChange(visiblePage)}
            className={cn(
              'inline-flex size-9 items-center justify-center rounded-lg text-sm font-medium',
              visiblePage === page
                ? 'bg-accent-600 text-white'
                : 'text-slate-700 hover:bg-slate-200/60',
            )}
          >
            {visiblePage}
          </button>
        </span>
      ))}
      <button
        type="button"
        aria-label="Наступна сторінка"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        className={NAV_BUTTON_CLASSES}
      >
        <ChevronRight className="size-4" aria-hidden="true" />
      </button>
    </nav>
  );
}
