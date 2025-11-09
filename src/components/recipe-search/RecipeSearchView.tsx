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
import SourceSelectionView from './SourceSelectionView';
import SearchLoadingView from './SearchLoadingView';
import SearchResultsView from './SearchResultsView';

interface RecipeSearchViewProps {
  initialFridgeItemCount?: number;
}

export default function RecipeSearchView({ initialFridgeItemCount = 0 }: RecipeSearchViewProps) {
  const { state, actions } = useRecipeSearch(initialFridgeItemCount);

  // Recipe details modal state
  const [selectedRecipeId, setSelectedRecipeId] = useState<number | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // TODO: Fetch actual user recipe count from API
  const userRecipeCount = 0;

  /**
   * Opens recipe details modal
   */
  const handleRecipeClick = (id: number) => {
    setSelectedRecipeId(id);
    setIsDetailsModalOpen(true);
  };

  /**
   * Closes recipe details modal
   */
  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedRecipeId(null);
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
      {selectedRecipeId && (
        <RecipeDetailsModal
          isOpen={isDetailsModalOpen}
          onClose={handleCloseDetailsModal}
          recipeId={selectedRecipeId}
          from="search"
        />
      )}
    </div>
  );
}

