import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PaginationMetaDTO } from "../../types";

interface PaginationControlsProps {
  pagination: PaginationMetaDTO;
  onPageChange: (page: number) => void;
}

/**
 * Komponenty kontrolek paginacji (previous, page numbers, next)
 */
export function PaginationControls({ pagination, onPageChange }: PaginationControlsProps) {
  const { page, total_pages } = pagination;

  if (total_pages <= 1) {
    return null;
  }

  const canGoPrevious = page > 1;
  const canGoNext = page < total_pages;

  // Generowanie numerów stron do wyświetlenia (max 5 stron)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;

    if (total_pages <= maxVisible) {
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 3) {
        pages.push(1, 2, 3, 4, total_pages);
      } else if (page >= total_pages - 2) {
        pages.push(1, total_pages - 3, total_pages - 2, total_pages - 1, total_pages);
      } else {
        pages.push(1, page - 1, page, page + 1, total_pages);
      }
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page - 1)}
        disabled={!canGoPrevious}
        aria-label="Poprzednia strona"
      >
        <ChevronLeft className="h-4 w-4 mr-1" />
        Poprzednia
      </Button>

      <div className="flex items-center gap-1">
        {pageNumbers.map((pageNum, index) => {
          const showEllipsis = index > 0 && pageNum - pageNumbers[index - 1] > 1;

          return (
            <div key={pageNum} className="flex items-center gap-1">
              {showEllipsis && <span className="px-2 text-muted-foreground">...</span>}
              <Button
                variant={pageNum === page ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(pageNum)}
                className="min-w-[40px]"
              >
                {pageNum}
              </Button>
            </div>
          );
        })}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(page + 1)}
        disabled={!canGoNext}
        aria-label="Następna strona"
      >
        Następna
        <ChevronRight className="h-4 w-4 ml-1" />
      </Button>

      <span className="text-sm text-muted-foreground ml-4">
        Strona {page} z {total_pages}
      </span>
    </div>
  );
}
