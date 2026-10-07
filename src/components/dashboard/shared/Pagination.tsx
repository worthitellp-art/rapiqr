import React, { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;
export const DEFAULT_PAGE_SIZE = 10;

/**
 * Page state for a list. Resets to page 1 whenever the list's inputs change
 * (pass them in `resetKey`), so a filter never strands you on an empty page.
 */
export interface PaginationState<T> {
  pageItems: T[];
  page: number;
  setPage: (page: number) => void;
  pageCount: number;
  pageSize: number;
  setPageSize: (size: number) => void;
  total: number;
  start: number;
}

export function usePagination<T>(items: T[], resetKey: unknown, initialPageSize = DEFAULT_PAGE_SIZE): PaginationState<T> {
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [page, setPage] = useState(1);

  // Callers pass a fresh array each render, so compare the key by value. Depending on
  // the array itself reset the page on every render, which made Next do nothing.
  const resetSignature = JSON.stringify(resetKey ?? null);
  useEffect(() => {
    setPage(1);
  }, [resetSignature, pageSize]);

  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const start = (safePage - 1) * pageSize;
  const pageItems = items.slice(start, start + pageSize);

  return { pageItems, page: safePage, setPage, pageCount, pageSize, setPageSize, total: items.length, start };
}

/** Prev / next, page label and a rows-per-page selector. Renders nothing when everything fits on one page. */
export default function Pagination({
  page,
  pageCount,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  pageCount: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}) {
  if (total <= PAGE_SIZE_OPTIONS[0]) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const btn =
    'inline-flex items-center gap-1 px-2.5 py-1.5 rounded-[var(--fx-radius-control)] border border-[var(--fx-border)] bg-white text-xs font-semibold text-[var(--fx-ink)] hover:bg-[var(--fx-canvas)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors';

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-between gap-3 pt-3 text-xs text-[var(--fx-ink-2)]">
      <div className="flex items-center gap-2">
        <span>Rows</span>
        <select
          value={pageSize}
          onChange={(e) => onPageSizeChange(Number(e.target.value))}
          className="px-2 py-1 rounded-[var(--fx-radius-control)] border border-[var(--fx-border)] bg-white text-xs font-semibold text-[var(--fx-ink)] outline-none cursor-pointer"
          aria-label="Rows per page"
        >
          {PAGE_SIZE_OPTIONS.map((n) => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
        <span className="tabular-nums">{from}–{to} of {total}</span>
      </div>

      <div className="flex items-center gap-2">
        <button type="button" className={btn} onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
          <ChevronLeft size={13} /> Prev
        </button>
        <span className="tabular-nums font-semibold text-[var(--fx-ink)]">Page {page} of {pageCount}</span>
        <button type="button" className={btn} onClick={() => onPageChange(page + 1)} disabled={page >= pageCount}>
          Next <ChevronRight size={13} />
        </button>
      </div>
    </nav>
  );
}
