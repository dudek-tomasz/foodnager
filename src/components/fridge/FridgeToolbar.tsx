/**
 * FridgeToolbar - Toolbar containing search, sort, and add product button
 */

import React from 'react';
import { Button } from '@/components/ui/button';
import SearchBar from './SearchBar';
import SortDropdown from './SortDropdown';
import type { SortField, SortOrderEnum } from '@/types';

interface FridgeToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: SortField;
  sortOrder: SortOrderEnum;
  onSortChange: (sortBy: SortField, order: SortOrderEnum) => void;
  onAddProduct: () => void;
}

export default function FridgeToolbar({
  searchQuery,
  onSearchChange,
  sortBy,
  sortOrder,
  onSortChange,
  onAddProduct,
}: FridgeToolbarProps) {
  return (
    <div className="mb-6">
      {/* Main toolbar row */}
      <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
        {/* Search Bar - takes remaining space */}
        <div className="flex-1 min-w-0">
          <SearchBar
            value={searchQuery}
            onChange={onSearchChange}
            placeholder="Szukaj produktów..."
          />
        </div>

        {/* Sort Dropdown */}
        <div className="flex-shrink-0">
          <SortDropdown
            sortBy={sortBy}
            sortOrder={sortOrder}
            onChange={onSortChange}
          />
        </div>

        {/* Add Product Button - Desktop */}
        <div className="hidden sm:block flex-shrink-0">
          <Button onClick={onAddProduct} className="w-full sm:w-auto">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Dodaj produkt
          </Button>
        </div>
      </div>

      {/* Add Product Button - Mobile (Full width) */}
      <div className="sm:hidden mt-4">
        <Button onClick={onAddProduct} className="w-full">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          Dodaj produkt
        </Button>
      </div>
    </div>
  );
}

