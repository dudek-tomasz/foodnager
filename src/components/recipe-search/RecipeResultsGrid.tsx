/**
 * RecipeResultsGrid - Grid layout for recipe search results
 *
 * Responsive grid: 3 columns on desktop, 2 on tablet, 1 on mobile
 */

import React from "react";
import type { RecipeSearchResultDTO } from "@/types/recipe-search.types";
import RecipeResultCard from "./RecipeResultCard";

interface RecipeResultsGridProps {
  results: RecipeSearchResultDTO[];
  onRecipeClick: (recipeId: number) => void;
}

export default function RecipeResultsGrid({ results, onRecipeClick }: RecipeResultsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((result) => (
        <RecipeResultCard key={result.recipe.id} result={result} onClick={onRecipeClick} />
      ))}
    </div>
  );
}
