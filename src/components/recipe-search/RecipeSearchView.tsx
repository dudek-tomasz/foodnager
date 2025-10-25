/**
 * RecipeSearchView - Main component for recipe search functionality
 * 
 * This component manages the overall recipe search flow through three steps:
 * 1. Source Selection - User selects where to search (user recipes, API, AI, all)
 * 2. Loading - Shows loading state while searching
 * 3. Results - Displays search results with match scores
 */

import React from 'react';
import { useRecipeSearch } from '@/hooks/useRecipeSearch';
import SourceSelectionView from './SourceSelectionView';
import SearchLoadingView from './SearchLoadingView';
import SearchResultsView from './SearchResultsView';

interface RecipeSearchViewProps {
  initialFridgeItemCount?: number;
}

export default function RecipeSearchView({ initialFridgeItemCount = 0 }: RecipeSearchViewProps) {
  const { state, actions } = useRecipeSearch(initialFridgeItemCount);

  // TODO: Fetch actual user recipe count from API
  const userRecipeCount = 0;

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
          onRecipeClick={(recipeId) => {
            window.location.href = `/recipes/${recipeId}`;
          }}
        />
      )}
    </div>
  );
}

