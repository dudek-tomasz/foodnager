/**
 * SearchResultsView - Step 3: Display search results
 * 
 * Shows recipe search results with match scores and ingredient availability
 */

import React from 'react';
import type {
  RecipeSearchResultDTO,
  SearchMetadataDTO,
  RecipeSource,
} from '@/types/recipe-search.types';
import ResultsHeader from './ResultsHeader';
import SearchMetadataBar from './SearchMetadataBar';
import RecipeResultsGrid from './RecipeResultsGrid';
import EmptyResults from './EmptyResults';

interface SearchResultsViewProps {
  results: RecipeSearchResultDTO[];
  searchMetadata: SearchMetadataDTO | null;
  source: RecipeSource;
  onBack: () => void;
  onGenerateAI: () => void;
  onRecipeClick: (recipeId: number) => void;
}

export default function SearchResultsView({
  results,
  searchMetadata,
  source,
  onBack,
  onGenerateAI,
  onRecipeClick,
}: SearchResultsViewProps) {
  const hasResults = results.length > 0;

  return (
    <div>
      {/* Header with back button */}
      <ResultsHeader source={source} onBack={onBack} />

      {/* Metadata bar (only if we have metadata) */}
      {searchMetadata && hasResults && (
        <SearchMetadataBar metadata={searchMetadata} />
      )}

      {/* Results grid or empty state */}
      {hasResults ? (
        <RecipeResultsGrid results={results} onRecipeClick={onRecipeClick} />
      ) : (
        <EmptyResults
          source={source}
          onBack={onBack}
          onGenerateAI={onGenerateAI}
        />
      )}
    </div>
  );
}

