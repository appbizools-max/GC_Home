import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationControlsProps {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (newSize: number) => void;
  itemLabel?: string;
}

export const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
  pageSizeOptions,
  onPageSizeChange,
  itemLabel = 'entries',
}) => {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  if (totalItems === 0) return null;

  // Windowing for large page numbers (1 ... 4 5 6 ... 10)
  const getVisiblePages = () => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | string)[] = [];
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);
    return pages;
  };

  const visiblePages = getVisiblePages();

  return (
    <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200 text-xs text-slate-600 font-medium select-none">
      {/* 1. Item Range Summary */}
      <div className="text-slate-600 text-xs">
        Showing <span className="font-bold text-slate-900">{startItem}</span>–
        <span className="font-bold text-slate-900">{endItem}</span> of{' '}
        <span className="font-bold text-slate-900">{totalItems}</span>{' '}
        {totalItems === 1
          ? itemLabel.endsWith('s')
            ? itemLabel.slice(0, -1)
            : itemLabel
          : itemLabel}
      </div>

      {/* 2. Optional Page Size Selector */}
      {pageSizeOptions && onPageSizeChange && (
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-600 whitespace-nowrap">
            Rows per page:
          </span>
          <select
            value={pageSize}
            onChange={e => {
              const newSize = Number(e.target.value);
              onPageSizeChange(newSize);
            }}
            className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-2.5 py-1 text-xs font-bold text-slate-800 shadow-2xs outline-none cursor-pointer transition-colors"
          >
            {pageSizeOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 3. Page Numbers & Prev/Next */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold transition flex items-center gap-1 cursor-pointer"
          aria-label="Previous Page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        {visiblePages.map((page, idx) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 font-bold select-none">
                ...
              </span>
            );
          }

          const pageNum = Number(page);
          return (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`min-w-8 h-8 rounded-lg border text-xs font-bold transition cursor-pointer ${
                pageNum === currentPage
                  ? 'bg-[#123D2A] border-[#123D2A] text-white shadow-2xs'
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700 font-semibold transition flex items-center gap-1 cursor-pointer"
          aria-label="Next Page"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
