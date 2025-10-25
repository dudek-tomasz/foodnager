/**
 * RecipeListHeader Component
 * 
 * Header for recipe list view displaying:
 * - Page title
 * - Recipe statistics (total, by source)
 * - Add Recipe button (desktop only)
 */

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import type { RecipeStats } from './types';

interface RecipeListHeaderProps {
  stats: RecipeStats;
  onAddRecipe: () => void;
}

export function RecipeListHeader({ stats, onAddRecipe }: RecipeListHeaderProps) {
  return (
    <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
          Moje przepisy
        </h1>
        
        {/* Statistics Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <Badge 
            variant="secondary" 
            className="px-3 py-1"
          >
            <span className="font-semibold">Ogółem:</span>
            <span className="ml-1.5">{stats.total}</span>
          </Badge>
          
          {stats.userCount > 0 && (
            <Badge 
              className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-800"
            >
              <span className="font-semibold">Moje:</span>
              <span className="ml-1.5">{stats.userCount}</span>
            </Badge>
          )}
          
          {stats.apiCount > 0 && (
            <Badge 
              className="px-3 py-1 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-800"
            >
              <span className="font-semibold">API:</span>
              <span className="ml-1.5">{stats.apiCount}</span>
            </Badge>
          )}
          
          {stats.aiCount > 0 && (
            <Badge 
              className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-800"
            >
              <span className="font-semibold">AI:</span>
              <span className="ml-1.5">{stats.aiCount}</span>
            </Badge>
          )}
        </div>
      </div>

      {/* Add Recipe Button - Desktop only */}
      <Button
        onClick={onAddRecipe}
        size="lg"
        className="hidden sm:flex"
      >
        <Plus className="h-5 w-5 mr-2" />
        Dodaj przepis
      </Button>
    </header>
  );
}

