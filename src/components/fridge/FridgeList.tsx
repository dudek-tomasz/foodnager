/**
 * FridgeList - List of fridge items with pagination
 *
 * Displays:
 * - List of FridgeItem components
 * - Pagination controls
 * - Empty state when no items
 */

import React from "react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
import FridgeItem from "./FridgeItem";
import type { FridgeItemDTO, PaginationMetaDTO } from "@/types";

interface FridgeListProps {
  items: FridgeItemDTO[];
  isLoading: boolean;
  pagination: PaginationMetaDTO;
  onEdit: (itemId: number) => void;
  onDelete: (itemId: number) => void;
  onPageChange: (page: number) => void;
}

export default function FridgeList({ items, pagination, onEdit, onDelete, onPageChange }: FridgeListProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const { page, total_pages } = pagination;
    const pages: (number | "ellipsis")[] = [];

    if (total_pages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= total_pages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (page > 3) {
        pages.push("ellipsis");
      }

      // Show pages around current page
      const start = Math.max(2, page - 1);
      const end = Math.min(total_pages - 1, page + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (page < total_pages - 2) {
        pages.push("ellipsis");
      }

      // Always show last page
      pages.push(total_pages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();
  const { page, total_pages } = pagination;

  return (
    <div>
      {/* List */}
      <ul
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden"
        data-testid="fridge-items-list"
      >
        {items.map((item) => (
          <FridgeItem key={item.id} item={item} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </ul>

      {/* Pagination */}
      {total_pages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              {/* Previous Button */}
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => page > 1 && onPageChange(page - 1)}
                  className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  aria-disabled={page === 1}
                />
              </PaginationItem>

              {/* Page Numbers */}
              {pageNumbers.map((pageNum, index) => (
                <PaginationItem key={`${pageNum}-${index}`}>
                  {pageNum === "ellipsis" ? (
                    <PaginationEllipsis />
                  ) : (
                    <PaginationLink
                      onClick={() => onPageChange(pageNum)}
                      isActive={pageNum === page}
                      className="cursor-pointer"
                      aria-label={`Przejdź do strony ${pageNum}`}
                    >
                      {pageNum}
                    </PaginationLink>
                  )}
                </PaginationItem>
              ))}

              {/* Next Button */}
              <PaginationItem>
                <PaginationNext
                  onClick={() => page < total_pages && onPageChange(page + 1)}
                  className={page === total_pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  aria-disabled={page === total_pages}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>

          {/* Page Info */}
          <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Strona {page} z {total_pages} ({pagination.total} produktów)
          </div>
        </div>
      )}
    </div>
  );
}
