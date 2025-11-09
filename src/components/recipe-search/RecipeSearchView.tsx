/**
 * RecipeSearchView - Main component for recipe search functionality
 * 
 * This component manages the overall recipe search flow through three steps:
 * 1. Source Selection - User selects where to search (user recipes, API, AI, all)
 * 2. Loading - Shows loading state while searching
 * 3. Results - Displays search results with match scores
 */

import React, { useState } from 'react';
import { useRecipeSearch } from '@/hooks/useRecipeSearch';
import { RecipeDetailsModal } from '@/components/recipe-details';
import type { RecipeSearchResultDTO } from '@/types/recipe-search.types';
import SourceSelectionView from './SourceSelectionView';
import SearchLoadingView from './SearchLoadingView';
import SearchResultsView from './SearchResultsView';

interface RecipeSearchViewProps {
  initialFridgeItemCount?: number;
}

/**
 * Temporary ID range for AI-generated recipes (not yet saved to database)
 */
const TEMP_ID_MIN = 100000;
const TEMP_ID_MAX = 1000000;

/**
 * Check if recipe ID is temporary (AI-generated, not saved to DB)
 */
const isTemporaryId = (id: number): boolean => {
  return id >= TEMP_ID_MIN && id < TEMP_ID_MAX;
};

export default function RecipeSearchView({ initialFridgeItemCount = 0 }: RecipeSearchViewProps) {
  const { state, actions } = useRecipeSearch(initialFridgeItemCount);

  // Recipe details modal state - store full recipe data for AI recipes
  const [selectedRecipe, setSelectedRecipe] = useState<RecipeSearchResultDTO | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // TODO: Fetch actual user recipe count from API
  const userRecipeCount = 0;

  /**
   * Opens recipe details modal
   * For AI recipes (temporary ID), pass full recipe data
   * For saved recipes, pass only ID to fetch from DB
   */
  const handleRecipeClick = (id: number) => {
    // Find the recipe in current results
    const recipe = state.results?.find(r => r.recipe.id === id);
    
    if (recipe) {
      setSelectedRecipe(recipe);
      setIsDetailsModalOpen(true);
    }
  };

  /**
   * Closes recipe details modal
   */
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedRecipe(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Step 1: Source Selection */}
      {state.step === 'source_selection' && (
        <SourceSelectionView
          fridgeItemCount={initialFridgeItemCount}
          userRecipeCount={userRecipeCount}
          onSourceSelect={actions.selectSource}
        />
      )}

      {/* Step 2: Loading */}
      {state.step === 'loading' && state.source && (
        <SearchLoadingView
          currentSource={state.source}
          searchDuration={state.searchDuration}
          onCancel={actions.cancelSearch}
        />
      )}

      {/* Step 3: Results */}
      {state.step === 'results' && state.source && (
        <SearchResultsView
          results={state.results || []}
          searchMetadata={state.searchMetadata}
          source={state.source}
          onBack={actions.goBack}
          onGenerateAI={actions.generateWithAI}
          onRecipeClick={handleRecipeClick}
        />
      )}

      {/* Recipe Details Modal */}
      {selectedRecipe && (
        <RecipeDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
          // For AI recipes (temporary ID), pass full recipe data
          // For saved recipes, pass only ID to fetch from DB
          recipeId={isTemporaryId(selectedRecipe.recipe.id) ? undefined : selectedRecipe.recipe.id}
          aiRecipe={isTemporaryId(selectedRecipe.recipe.id) ? selectedRecipe.recipe : undefined}
          matchScore={selectedRecipe.match_score}
          from="search"
        />
      )}
    </div>
  );
}

