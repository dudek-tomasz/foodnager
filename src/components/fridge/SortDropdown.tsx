/**
 * SortDropdown - Dropdown for selecting sort field and order
 */

import React from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { SortField, SortOrderEnum } from "@/types";

interface SortDropdownProps {
  sortBy: SortField;
  sortOrder: SortOrderEnum;
  onChange: (sortBy: SortField, order: SortOrderEnum) => void;
}

/**
 * Sort field options with labels
 */
const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: "name", label: "Nazwa" },
  { value: "quantity", label: "Ilość" },
  { value: "expiry_date", label: "Data ważności" },
  { value: "created_at", label: "Data dodania" },
];

export default function SortDropdown({ sortBy, sortOrder, onChange }: SortDropdownProps) {
  const handleSortByChange = (value: string) => {
    onChange(value as SortField, sortOrder);
  };

  const handleOrderToggle = () => {
    const newOrder: SortOrderEnum = sortOrder === "asc" ? "desc" : "asc";
    onChange(sortBy, newOrder);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Sort By Select */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700 dark:text-gray-300 hidden sm:inline">Sortuj:</span>
        <Select value={sortBy} onValueChange={handleSortByChange}>
          <SelectTrigger className="w-[180px]" aria-label="Wybierz pole sortowania">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Order Toggle Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleOrderToggle}
        className="h-9 w-9 p-0"
        aria-label={`Zmień kierunek sortowania na ${sortOrder === "asc" ? "malejący" : "rosnący"}`}
        title={sortOrder === "asc" ? "Rosnąco (A-Z, 0-9)" : "Malejąco (Z-A, 9-0)"}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform duration-200 ${sortOrder === "desc" ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
        </svg>
      </Button>
    </div>
  );
}
