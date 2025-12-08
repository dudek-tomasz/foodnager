/**
 * SearchLoadingView - Step 2: Loading state during search
 *
 * Shows skeleton cards with shimmer animation while searching for recipes
 */

import React from "react";
import type { RecipeSource } from "@/types/recipe-search.types";
import { SEARCH_TIMEOUTS } from "@/types/recipe-search.types";
import SearchProgress from "./SearchProgress";
import RecipeCardSkeleton from "./RecipeCardSkeleton";
import TimeoutWarning from "./TimeoutWarning";
import CancelButton from "./CancelButton";

interface SearchLoadingViewProps {
  currentSource: RecipeSource;
  searchDuration: number;
  onCancel: () => void;
}

export default function SearchLoadingView({ currentSource, searchDuration, onCancel }: SearchLoadingViewProps) {
  const isTimedOut = searchDuration > SEARCH_TIMEOUTS.WARNING_THRESHOLD;

  return (
    <div>
      {/* Progress indicator */}
      <SearchProgress currentSource={currentSource} />

      {/* Timeout warning (conditional, after 30s) */}
      {isTimedOut && <TimeoutWarning />}

      {/* Grid of skeleton cards */}
      <div
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        aria-busy="true"
        aria-label="Ładowanie przepisów"
      >
        {Array.from({ length: 6 }, (_, index) => (
          <RecipeCardSkeleton key={index} />
        ))}
      </div>

      {/* Cancel button */}
      <CancelButton onCancel={onCancel} />
    </div>
  );
}
