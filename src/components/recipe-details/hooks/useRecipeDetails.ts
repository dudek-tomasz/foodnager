/**
 * useRecipeDetails Hook
 * Główny hook zarządzający stanem i logiką widoku Recipe Details
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type {
  RecipeDTO,
  FridgeItemDTO,
  CreateCookingHistoryResponseDTO,
} from '../../../types';
import type {
  RecipeViewModel,
  RecipeDetailsUIState,
} from '../../../lib/types/recipe-view-models';
import { fetchRecipe, deleteRecipe, saveRecipeAsCopy } from '../../../lib/api/recipes-client';
import { fetchAllFridgeItems } from '../../../lib/api/fridge-client';
import { cookRecipe } from '../../../lib/api/cooking-history-client';
import { createRecipeViewModel, validateIngredientsAvailability } from '../../../lib/utils/recipe-utils';
import { ApiError } from '../../../lib/api-client';

interface UseRecipeDetailsParams {
  recipeId: number;
  initialMatchScore?: number;
}

interface UseRecipeDetailsReturn {
  // State
  uiState: RecipeDetailsUIState;
  recipe: RecipeViewModel | null;
  fridgeItems: FridgeItemDTO[];
  
  // Actions
  handleCook: () => void;
  handleDelete: () => void;
  handleSave: () => void;
  handleGenerateShoppingList: () => void;
  handleEdit: () => void;
  refetch: () => void;
  
  // Dialog controls
  openCookDialog: () => void;
  closeCookDialog: () => void;
  confirmCook: () => void;
  openDeleteDialog: () => void;
  closeDeleteDialog: () => void;
  confirmDelete: () => void;
  openShoppingListModal: () => void;
  closeShoppingListModal: () => void;
}

/**
 * Główny hook dla widoku Recipe Details
 * Enkapsuluje całą logikę state management, API calls i business logic
 */
export function useRecipeDetails({
  recipeId,
  initialMatchScore,
}: UseRecipeDetailsParams): UseRecipeDetailsReturn {
  // State
  const [uiState, setUiState] = useState<RecipeDetailsUIState>({
    isLoading: true,
    error: null,
    recipe: null,
    showDeleteDialog: false,
    showCookDialog: false,
    showShoppingListModal: false,
    isDeleting: false,
    isCooking: false,
    isSaving: false,
    isGeneratingShoppingList: false,
  });

  const [fridgeItems, setFridgeItems] = useState<FridgeItemDTO[]>([]);
  const [recipe, setRecipe] = useState<RecipeViewModel | null>(null);

  // =============================================================================
  // FETCH DATA
  // =============================================================================

  /**
   * Pobiera dane przepisu i lodówki równolegle
   */
  const fetchRecipeAndFridge = useCallback(async () => {
    setUiState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Parallel fetch
      const [recipeData, fridgeData] = await Promise.all([
        fetchRecipe(recipeId),
        fetchAllFridgeItems(),
      ]);

      // Transform do RecipeViewModel z availability check
      const viewModel = createRecipeViewModel(
        recipeData,
        fridgeData,
        initialMatchScore
      );

      setRecipe(viewModel);
      setFridgeItems(fridgeData);
      setUiState((prev) => ({
        ...prev,
        isLoading: false,
        recipe: viewModel,
      }));
    } catch (error) {
      console.error('Error fetching recipe details:', error);
      
      let errorMessage = 'Wystąpił błąd podczas ładowania przepisu';
      
      if (error instanceof ApiError) {
        if (error.status === 404) {
          errorMessage = 'Przepis nie został znaleziony';
        } else if (error.status === 401) {
          errorMessage = 'Musisz być zalogowany aby zobaczyć ten przepis';
        } else {
          errorMessage = error.message;
        }
      }

      setUiState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
    }
  }, [recipeId, initialMatchScore]);

  // Fetch on mount
  useEffect(() => {
    fetchRecipeAndFridge();
  }, [fetchRecipeAndFridge]);

  // =============================================================================
  // COOK RECIPE
  // =============================================================================

  const openCookDialog = useCallback(() => {
    setUiState((prev) => ({ ...prev, showCookDialog: true }));
  }, []);

  const closeCookDialog = useCallback(() => {
    setUiState((prev) => ({ ...prev, showCookDialog: false }));
  }, []);

  /**
   * Handler dla przycisku "Ugotuj to"
   * Waliduje dostępność składników i otwiera confirmation dialog
   */
  const handleCook = useCallback(() => {
    if (!recipe) return;

    // Walidacja dostępności składników
    const validation = validateIngredientsAvailability(recipe.enrichedIngredients);

    if (!validation.canCook) {
      toast.error('Brak składników', {
        description: validation.message || 'Nie masz wystarczających składników w lodówce.',
        action: {
          label: 'Generuj listę zakupów',
          onClick: handleGenerateShoppingList,
        },
      });
      return;
    }

    // Otwórz confirmation dialog
    openCookDialog();
  }, [recipe]);

  /**
   * Potwierdza ugotowanie przepisu i wywołuje API
   */
  const confirmCook = useCallback(async () => {
    if (!recipe) return;

    setUiState((prev) => ({ ...prev, isCooking: true }));
    closeCookDialog();

    try {
      const result: CreateCookingHistoryResponseDTO = await cookRecipe({
        recipe_id: recipe.id,
      });

      toast.success('Przepis ugotowany!', {
        description: `Zaktualizowano ${result.updated_fridge_items.length} produktów w lodówce.`,
      });

      // Redirect do historii
      window.location.href = '/history';
    } catch (error) {
      console.error('Error cooking recipe:', error);
      
      let errorMessage = 'Nie udało się ugotować przepisu';
      
      if (error instanceof ApiError) {
        if (error.status === 422) {
          errorMessage = 'Brak wystarczających składników w lodówce';
        } else {
          errorMessage = error.message;
        }
      }

      toast.error('Błąd gotowania', {
        description: errorMessage,
      });

      setUiState((prev) => ({ ...prev, isCooking: false }));
    }
  }, [recipe, closeCookDialog]);

  // =============================================================================
  // DELETE RECIPE
  // =============================================================================

  const openDeleteDialog = useCallback(() => {
    setUiState((prev) => ({ ...prev, showDeleteDialog: true }));
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setUiState((prev) => ({ ...prev, showDeleteDialog: false }));
  }, []);

  /**
   * Handler dla akcji "Usuń przepis"
   */
  const handleDelete = useCallback(() => {
    openDeleteDialog();
  }, [openDeleteDialog]);

  /**
   * Potwierdza usunięcie przepisu
   */
  const confirmDelete = useCallback(async () => {
    if (!recipe) return;

    setUiState((prev) => ({ ...prev, isDeleting: true }));
    closeDeleteDialog();

    try {
      await deleteRecipe(recipe.id);

      toast.success('Przepis usunięty', {
        description: 'Przepis został pomyślnie usunięty.',
      });

      // Redirect do listy przepisów
      window.location.href = '/recipes';
    } catch (error) {
      console.error('Error deleting recipe:', error);
      
      let errorMessage = 'Nie udało się usunąć przepisu';
      
      if (error instanceof ApiError) {
        errorMessage = error.message;
      }

      toast.error('Błąd usuwania', {
        description: errorMessage,
      });

      setUiState((prev) => ({ ...prev, isDeleting: false }));
    }
  }, [recipe, closeDeleteDialog]);

  // =============================================================================
  // SAVE RECIPE (COPY)
  // =============================================================================

  /**
   * Handler dla akcji "Zapisz do moich przepisów"
   * Tworzy kopię przepisu jako przepis użytkownika
   */
  const handleSave = useCallback(async () => {
    if (!recipe) return;

    setUiState((prev) => ({ ...prev, isSaving: true }));

    try {
      const savedRecipe: RecipeDTO = await saveRecipeAsCopy(recipe);

      toast.success('Przepis zapisany!', {
        description: 'Przepis został dodany do Twojej kolekcji.',
        action: {
          label: 'Zobacz przepis',
          onClick: () => {
            window.location.href = `/recipes/${savedRecipe.id}`;
          },
        },
      });

      setUiState((prev) => ({ ...prev, isSaving: false }));
    } catch (error) {
      console.error('Error saving recipe:', error);
      
      let errorMessage = 'Nie udało się zapisać przepisu';
      
      if (error instanceof ApiError) {
        errorMessage = error.message;
      }

      toast.error('Błąd zapisywania', {
        description: errorMessage,
      });

      setUiState((prev) => ({ ...prev, isSaving: false }));
    }
  }, [recipe]);

  // =============================================================================
  // GENERATE SHOPPING LIST
  // =============================================================================

  /**
   * Handler dla akcji "Generuj listę zakupów"
   * Otwiera modal Shopping List
   */
  const handleGenerateShoppingList = useCallback(() => {
    if (!recipe) return;
    openShoppingListModal();
  }, [recipe]);

  /**
   * Otwiera modal Shopping List
   */
  const openShoppingListModal = useCallback(() => {
    setUiState((prev) => ({ ...prev, showShoppingListModal: true }));
  }, []);

  /**
   * Zamyka modal Shopping List
   */
  const closeShoppingListModal = useCallback(() => {
    setUiState((prev) => ({ ...prev, showShoppingListModal: false }));
  }, []);

  // =============================================================================
  // EDIT RECIPE
  // =============================================================================

  /**
   * Handler dla akcji "Edytuj przepis"
   * Przekierowuje do widoku edycji
   */
  const handleEdit = useCallback(() => {
    if (!recipe) return;
    window.location.href = `/recipes/${recipe.id}/edit`;
  }, [recipe]);

  // =============================================================================
  // REFETCH
  // =============================================================================

  /**
   * Ponowne pobranie danych
   */
  const refetch = useCallback(() => {
    fetchRecipeAndFridge();
  }, [fetchRecipeAndFridge]);

  return {
    uiState,
    recipe,
    fridgeItems,
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
  };
}

