/**
 * SourceSelectionView - Step 1: Source selection interface
 * 
 * Displays 4 source cards for user to choose where to search for recipes
 */

import React from 'react';
import type { RecipeSource } from '@/types/recipe-search.types';
import FridgeStatusBanner from './FridgeStatusBanner';
import EmptyFridgeWarning from './EmptyFridgeWarning';
import SourceSelectionGrid from './SourceSelectionGrid';

interface SourceSelectionViewProps {
  fridgeItemCount: number;
  userRecipeCount: number;
  onSourceSelect: (source: RecipeSource) => void;
}

export default function SourceSelectionView({
  fridgeItemCount,
  userRecipeCount,
  onSourceSelect,
}: SourceSelectionViewProps) {
  const handleAddProducts = () => {
    window.location.href = '/fridge';
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Wybierz źródło przepisów
      </h1>

      {/* Fridge status banner */}
      <FridgeStatusBanner itemCount={fridgeItemCount} />

      {/* Empty fridge warning (conditional) */}
      {fridgeItemCount === 0 && (
        <EmptyFridgeWarning onAddProducts={handleAddProducts} />
      )}

      {/* Source selection grid */}
      <SourceSelectionGrid
        userRecipeCount={userRecipeCount}
        onSourceSelect={onSourceSelect}
      />
    </div>
  );
}

