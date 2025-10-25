/**
 * PaginationControls Component
 * 
 * Displays pagination controls with previous, page numbers, and next buttons.
 * Includes current page indicator and page info.
 * 
 * Performance: Memoized to prevent unnecessary re-renders
 */

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { PaginationMetaDTO } from '@/types';

interface PaginationControlsProps {
  pagination: PaginationMetaDTO;
  onPageChange: (page: number) => void;
}

const PaginationControlsComponent = ({ 
  pagination, 
  onPageChange 
}: PaginationControlsProps) => {
  const { page, total_pages } = pagination;

  // Don't render if only one page or no pages
  if (total_pages <= 1) {
    return null;
  }

  // Calculate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisible = 5;

    if (total_pages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push('ellipsis');
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(total_pages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < total_pages - 2) {
        pages.push('ellipsis');
      }

      // Always show last page
      pages.push(total_pages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4">
      <div className="text-sm text-neutral-600 dark:text-neutral-400">
        Strona {page} z {total_pages}
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page === 1}
          aria-label="Poprzednia strona"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Poprzednia
        </Button>

        <div className="hidden sm:flex items-center gap-1">
          {pageNumbers.map((pageNum, index) => {
            if (pageNum === 'ellipsis') {
              return (
                <span 
                  key={`ellipsis-${index}`}
                  className="px-2 text-neutral-400"
                >
                  ...
                </span>
              );
            }

            return (
              <Button
                key={pageNum}
                variant={pageNum === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="min-w-[2.5rem]"
                aria-label={`Strona ${pageNum}`}
                aria-current={pageNum === page ? 'page' : undefined}
              >
                {pageNum}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page === total_pages}
          aria-label="Następna strona"
        >
          Następna
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
};

// Export memoized component for better performance
export const PaginationControls = memo(PaginationControlsComponent);

