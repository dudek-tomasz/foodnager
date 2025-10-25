/**
 * RecipeToolbar Component
 * 
 * Toolbar combining search, sort, and filter controls.
 * Includes responsive layout with "Add Recipe" button for mobile.
 */

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { SearchBar } from './SearchBar';
import { SortDropdown } from './SortDropdown';
import { FilterMultiSelect } from './FilterMultiSelect';
import type { SortOption, RecipeFilters } from './types';
import type { TagDTO } from '@/types';

interface RecipeToolbarProps {
  searchValue: string;
  sortOption: SortOption;
  filters: RecipeFilters;
  availableTags: TagDTO[];
  loading?: boolean;
  onSearchChange: (value: string) => void;
  onSortChange: (option: SortOption) => void;
  onFilterChange: (filters: RecipeFilters) => void;
  onAddRecipe: () => void;
}

export function RecipeToolbar({
  searchValue,
  sortOption,
  filters,
  availableTags,
  loading = false,
  onSearchChange,
  onSortChange,
  onFilterChange,
  onAddRecipe,
}: RecipeToolbarProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
      {/* Search Bar - 40% width on desktop, full on mobile */}
      <div className="flex-1 sm:max-w-md">
        <SearchBar
          value={searchValue}
          onChange={onSearchChange}
          loading={loading}
        />
      </div>

      {/* Sort and Filter Controls */}
      <div className="flex items-center gap-2 flex-wrap">
        <SortDropdown
          value={sortOption}
          onChange={onSortChange}
        />
        
        <FilterMultiSelect
          filters={filters}
          onChange={onFilterChange}
          availableTags={availableTags}
        />

        {/* Add Recipe Button - Mobile only */}
        <Button
          onClick={onAddRecipe}
          className="sm:hidden"
        >
          <Plus className="h-4 w-4 mr-2" />
          Dodaj przepis
        </Button>
      </div>
    </div>
  );
}

