/**
 * RecipeDetailsView - Main container for Recipe Details page
 * Integrates all subcomponents and manages the view state
 */

import React from 'react';
import { useRecipeDetails } from './hooks/useRecipeDetails';
import { useScrollVisibility } from './hooks/useScrollVisibility';
import RecipeHeader from './RecipeHeader';
import RecipeMetaSection from './RecipeMetaSection';
import RecipeIngredientsSection from './RecipeIngredientsSection';
import RecipeInstructionsSection from './RecipeInstructionsSection';
import StickyBottomBar from './StickyBottomBar';
import CookConfirmationDialog from './dialogs/CookConfirmationDialog';
import DeleteConfirmationDialog from './dialogs/DeleteConfirmationDialog';
import { ShoppingListModal } from '@/components/shopping-list';
import LoadingSpinner from '@/components/ui/loading-spinner';
import ErrorState from '@/components/ui/error-state';
import type { ExternalRecipe } from '@/lib/services/external-api.service';

export interface RecipeDetailsViewProps {
  recipeId?: number;
  externalRecipe?: ExternalRecipe;
  from?: string;
  matchScore?: number;
  hideHistory?: boolean;
  // Callbacks for modal mode
  onSaveSuccess?: () => void;
  onDeleteSuccess?: () => void;
  onCookSuccess?: () => void;
}

export default function RecipeDetailsView({
  recipeId,
  externalRecipe,
  from,
  matchScore,
  hideHistory = false,
  onSaveSuccess,
  onDeleteSuccess,
  onCookSuccess,
}: RecipeDetailsViewProps) {
  // Main hook managing all state and logic
  const {
    uiState,
    recipe,
    handleCook,
    handleDelete,
    handleSave,
    handleGenerateShoppingList,
    handleEdit,
    refetch,
    openCookDialog,
    closeCookDialog,
    confirmCook,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
    openShoppingListModal,
    closeShoppingListModal,
  } = useRecipeDetails({
    recipeId,
    externalRecipe,
    initialMatchScore: matchScore,
    onSaveSuccess,
    onDeleteSuccess,
    onCookSuccess,
  });

  // Scroll visibility for sticky bottom bar
  const isStickyBarVisible = useScrollVisibility(300);

  // =============================================================================
  // LOADING STATE
  // =============================================================================

  if (uiState.isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <LoadingSpinner message="Ładowanie przepisu..." size="lg" />
      </div>
    );
  }

  // =============================================================================
  // ERROR STATE
  // =============================================================================

  if (uiState.error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState
          error={uiState.error}
          onRetry={refetch}
          showBackButton={true}
        />
      </div>
    );
  }

  // =============================================================================
  // NO RECIPE (shouldn't happen after loading, but just in case)
  // =============================================================================

  if (!recipe) {
    return (
      <div className="container mx-auto px-4 py-8">
        <ErrorState
          error="Przepis nie został znaleziony"
          showBackButton={true}
        />
      </div>
    );
  }

  // =============================================================================
  // MAIN CONTENT
  // =============================================================================

  return (
    <div className="container mx-auto px-4 py-8 pb-32">
      {/* Header with navigation, title, badges, and actions */}
      <RecipeHeader
        title={recipe.title}
        source={recipe.source}
        matchScore={recipe.matchScore}
        from={from}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSave={handleSave}
        isLoading={uiState.isSaving || uiState.isDeleting}
      />

      {/* Meta information: cooking time, difficulty, tags */}
      <RecipeMetaSection
        cookingTime={recipe.cooking_time}
        difficulty={recipe.difficulty}
        tags={recipe.tags}
      />

      {/* Ingredients section with availability status */}
      <RecipeIngredientsSection
        ingredients={recipe.enrichedIngredients}
        hasMissingIngredients={recipe.hasMissingIngredients}
        onGenerateShoppingList={handleGenerateShoppingList}
        isGenerating={uiState.isGeneratingShoppingList}
      />

      {/* Instructions section */}
      <RecipeInstructionsSection
        instructions={recipe.instructions}
        description={recipe.description}
      />

      {/* Primary action buttons (visible in main content) */}
      <div className="flex flex-col sm:flex-row gap-4 mt-8">
        <button
          onClick={handleCook}
          disabled={uiState.isCooking}
          className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 h-12 px-6 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          {uiState.isCooking ? 'Gotowanie...' : 'Ugotuj to'}
        </button>

        {recipe.source !== 'user' && (
          <button
            onClick={handleSave}
            disabled={uiState.isSaving}
            className="flex-1 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-12 px-6 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
              />
            </svg>
            {uiState.isSaving ? 'Zapisywanie...' : 'Zapisz przepis'}
          </button>
        )}
      </div>

      {/* Sticky bottom bar (appears on scroll) */}
      <StickyBottomBar
        source={recipe.source}
        isVisible={isStickyBarVisible}
        onCook={handleCook}
        onSave={handleSave}
        isCooking={uiState.isCooking}
        isSaving={uiState.isSaving}
      />

      {/* Cook Confirmation Dialog */}
      <CookConfirmationDialog
        isOpen={uiState.showCookDialog}
        recipeTitle={recipe.title}
        ingredients={recipe.enrichedIngredients}
        onConfirm={confirmCook}
        onCancel={closeCookDialog}
        isLoading={uiState.isCooking}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        isOpen={uiState.showDeleteDialog}
        recipeTitle={recipe.title}
        onConfirm={confirmDelete}
        onCancel={closeDeleteDialog}
        isLoading={uiState.isDeleting}
      />

      {/* Shopping List Modal */}
      <ShoppingListModal
        recipeId={recipe.id}
        recipeTitle={recipe.title}
        isOpen={uiState.showShoppingListModal}
        onClose={closeShoppingListModal}
      />
    </div>
  );
}

