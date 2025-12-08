/**
 * SourceSelectionGrid - Grid layout for source selection cards
 *
 * Responsive grid: 2x2 on desktop, 1x4 on mobile
 */

import React from "react";
import SourceCard from "./SourceCard";
import { RECIPE_SOURCES } from "@/types/recipe-search.types";
import type { RecipeSource } from "@/types/recipe-search.types";

interface SourceSelectionGridProps {
  userRecipeCount: number;
  onSourceSelect: (source: RecipeSource) => void;
}

export default function SourceSelectionGrid({ userRecipeCount, onSourceSelect }: SourceSelectionGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {RECIPE_SOURCES.map((sourceData) => (
        <SourceCard
          key={sourceData.source}
          source={sourceData.source}
          title={sourceData.title}
          description={sourceData.description}
          icon={sourceData.icon}
          badge={sourceData.source === "user" ? userRecipeCount : undefined}
          onClick={onSourceSelect}
        />
      ))}
    </div>
  );
}
