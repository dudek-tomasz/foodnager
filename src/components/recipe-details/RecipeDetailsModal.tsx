/**
 * RecipeDetailsModal - Modal wrapper for Recipe Details
 *
 * Supports two modes:
 * 1. Saved recipe with recipeId (fetches from API)
 * 2. External recipe data passed directly (from discovery/AI)
 *
 * Modal can be controlled externally or internally
 */

import React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@/components/ui/visually-hidden";
import RecipeDetailsView from "./RecipeDetailsView";
import type { ExternalRecipe } from "@/lib/services/external-api.service";
import type { RecipeSummaryDTO } from "@/types";

export interface RecipeDetailsModalProps {
  // Control state
  isOpen: boolean;
  onClose: () => void;

  // Data source - one of these is required
  recipeId?: number;
  externalRecipe?: ExternalRecipe;
  aiRecipe?: RecipeSummaryDTO; // For AI-generated recipes with temporary IDs

  // Optional params
  from?: string;
  matchScore?: number;

  // Hide specific sections
  hideHistory?: boolean;
}

export default function RecipeDetailsModal({
  isOpen,
  onClose,
  recipeId,
  externalRecipe,
  aiRecipe,
  from,
  matchScore,
  hideHistory = false,
}: RecipeDetailsModalProps) {
  // Validate that exactly one data source is provided
  if (!recipeId && !externalRecipe && !aiRecipe) {
    console.error("RecipeDetailsModal: Either recipeId, externalRecipe, or aiRecipe must be provided");
    return null;
  }

  if ((recipeId && externalRecipe) || (recipeId && aiRecipe) || (externalRecipe && aiRecipe)) {
    console.warn(
      "RecipeDetailsModal: Multiple data sources provided, using priority: recipeId > aiRecipe > externalRecipe"
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0" showCloseButton={true}>
        <VisuallyHidden>
          <DialogTitle>Szczegóły przepisu</DialogTitle>
        </VisuallyHidden>
        {/* 
          Pass recipeId, externalRecipe, or aiRecipe to RecipeDetailsView
          View will handle all cases internally
        */}
        <div className="p-6">
          <RecipeDetailsView
            recipeId={recipeId}
            externalRecipe={externalRecipe}
            aiRecipe={aiRecipe}
            from={from}
            matchScore={matchScore}
            hideHistory={hideHistory}
            onSaveSuccess={onClose}
            onDeleteSuccess={onClose}
            onCookSuccess={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
