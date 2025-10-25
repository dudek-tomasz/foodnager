/**
 * EmptyState Component
 * 
 * Displays an empty state when user has no recipes or search returns no results.
 * Includes CTA buttons to add recipes or find recipes.
 */

import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';

interface EmptyStateProps {
  onAddRecipe: () => void;
  isSearchResult?: boolean;
  searchQuery?: string;
}

export function EmptyState({ 
  onAddRecipe, 
  isSearchResult = false,
  searchQuery = ''
}: EmptyStateProps) {
  if (isSearchResult) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
          <Search className="w-8 h-8 text-neutral-400" />
        </div>
        <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
          Nie znaleziono przepisów
        </h2>
        <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-md mb-6">
          {searchQuery 
            ? `Nie znaleziono przepisów pasujących do "${searchQuery}"`
            : 'Nie znaleziono przepisów pasujących do wybranych filtrów'}
        </p>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onAddRecipe}>
            <Plus className="w-4 h-4 mr-2" />
            Dodaj przepis
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-16 h-16 mb-4 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center">
        <svg 
          className="w-8 h-8 text-neutral-400" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-2">
        Nie masz jeszcze przepisów
      </h2>
      <p className="text-neutral-600 dark:text-neutral-400 text-center max-w-md mb-6">
        Dodaj swój pierwszy przepis lub wyszukaj przepisy dopasowane do Twojej lodówki
      </p>
      <div className="flex gap-3">
        <Button onClick={onAddRecipe}>
          <Plus className="w-4 h-4 mr-2" />
          Dodaj przepis
        </Button>
        <Button variant="outline" onClick={() => window.location.href = '/recipes/search'}>
          <Search className="w-4 h-4 mr-2" />
          Znajdź przepis
        </Button>
      </div>
    </div>
  );
}

