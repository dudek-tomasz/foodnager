/**
 * RecipeGrid Component
 * 
 * Displays recipes in a responsive grid layout.
 * Handles loading states with skeleton cards and empty states.
 */

import { RecipeCard } from './RecipeCard';
import { EmptyState } from './EmptyState';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import type { RecipeSummaryDTO } from '@/types';

interface RecipeGridProps {
  recipes: RecipeSummaryDTO[];
  loading: boolean;
  searchQuery?: string;
  onRecipeClick: (id: number) => void;
  onCookRecipe: (id: number) => void;
  onEditRecipe: (recipe: RecipeSummaryDTO) => void;
  onDeleteRecipe: (id: number) => void;
  onAddRecipe: () => void;
}

/**
 * Skeleton card for loading state
 */
function RecipeCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        {/* Title skeleton */}
        <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-3/4" />
        <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-1/2 mt-2" />
      </CardHeader>

      <CardContent className="pb-3">
        {/* Ingredients skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-20" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-full" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-5/6" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-4/6" />
        </div>

        {/* Tags skeleton */}
        <div className="flex gap-2 mt-3">
          <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-16" />
          <div className="h-5 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-20" />
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-3">
        {/* Meta skeleton */}
        <div className="flex gap-3">
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-16" />
          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-16" />
        </div>
        {/* Buttons skeleton */}
        <div className="flex gap-2">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-20" />
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded animate-pulse w-16" />
        </div>
      </CardFooter>
    </Card>
  );
}

export function RecipeGrid({
  recipes,
  loading,
  searchQuery,
  onRecipeClick,
  onCookRecipe,
  onEditRecipe,
  onDeleteRecipe,
  onAddRecipe,
}: RecipeGridProps) {
  // Loading state - show skeleton cards
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <RecipeCardSkeleton key={`skeleton-${index}`} />
        ))}
      </div>
    );
  }

  // Empty state - no recipes
  if (recipes.length === 0) {
    return (
      <EmptyState 
        onAddRecipe={onAddRecipe}
        isSearchResult={!!searchQuery}
        searchQuery={searchQuery}
      />
    );
  }

  // Main grid with recipes
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {recipes.map((recipe) => (
        <RecipeCard
          key={recipe.id}
          recipe={recipe}
          onRecipeClick={() => onRecipeClick(recipe.id)}
          onDetailsClick={() => onRecipeClick(recipe.id)}
          onCookClick={() => onCookRecipe(recipe.id)}
          onEditClick={
            recipe.source === 'user' 
              ? () => onEditRecipe(recipe)
              : undefined
          }
          onDeleteClick={
            recipe.source === 'user'
              ? () => onDeleteRecipe(recipe.id)
              : undefined
          }
        />
      ))}
    </div>
  );
}

