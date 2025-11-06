/**
 * RecipeDetailsModal - Modal wrapper for Recipe Details
 * 
 * Supports two modes:
 * 1. Saved recipe with recipeId (fetches from API)
 * 2. External recipe data passed directly (from discovery/AI)
 * 
 * Modal can be controlled externally or internally
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import RecipeDetailsView from './RecipeDetailsView';
import type { ExternalRecipe } from '@/lib/services/external-api.service';

export interface RecipeDetailsModalProps {
  // Control state
  isOpen: boolean;
  onClose: () => void;
  
  // Data source - one of these is required
  recipeId?: number;
  externalRecipe?: ExternalRecipe;
  
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
  from,
  matchScore,
  hideHistory = false,
}: RecipeDetailsModalProps) {
  // Validate that exactly one data source is provided
  if (!recipeId && !externalRecipe) {
    console.error('RecipeDetailsModal: Either recipeId or externalRecipe must be provided');
    return null;
  }

  if (recipeId && externalRecipe) {
    console.warn('RecipeDetailsModal: Both recipeId and externalRecipe provided, using recipeId');
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto p-0"
        showCloseButton={true}
      >
        {/* 
          Pass recipeId or externalRecipe to RecipeDetailsView
          View will handle both cases internally
        */}
        <div className="p-6">
          <RecipeDetailsView
            recipeId={recipeId}
            externalRecipe={externalRecipe}
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

