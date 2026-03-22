'use client';

import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { clsx } from 'clsx';

interface Props {
  page: number;
  pages: number;
  onPage: (p: number) => void;
}

export function Pagination({ page, pages, onPage }: Props) {
  if (pages <= 1) return null;

  const range: (number | '...')[] = [];
  for (let i = 1; i <= pages; i++) {
    if (i === 1 || i === pages || (i >= page - 1 && i <= page + 1)) {
      range.push(i);
    } else if (range[range.length - 1] !== '...') {
      range.push('...');
    }
  }

  return (
    <nav className="flex items-center justify-center gap-1 mt-10">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page === 1}
        className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
        aria-label="Previous"
      >
        <ChevronLeftIcon className="w-4 h-4" />
      </button>

      {range.map((item, idx) =>
        item === '...' ? (
          <span key={`ellipsis-${idx}`} className="px-3 py-2 text-sm text-slate-400">
            …
          </span>
        ) : (
          <button
            key={item}
            onClick={() => onPage(item)}
            className={clsx(
              'w-9 h-9 rounded-lg text-sm font-medium transition-colors',
              page === item
                ? 'bg-brand-600 text-white'
                : 'border border-slate-200 text-slate-700 hover:bg-slate-50',
            )}
          >
            {item}
          </button>
        ),
      )}

      <button
        onClick={() => onPage(page + 1)}
        disabled={page === pages}
        className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition-colors"
        aria-label="Next"
      >
        <ChevronRightIcon className="w-4 h-4" />
      </button>
    </nav>
  );
}
