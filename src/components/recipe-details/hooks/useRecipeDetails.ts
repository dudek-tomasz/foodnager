/**
 * useRecipeDetails Hook
 * Główny hook zarządzający stanem i logiką widoku Recipe Details
 */

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type {
  RecipeDTO,
  RecipeSummaryDTO,
  FridgeItemDTO,
  CreateCookingHistoryResponseDTO,
} from '../../../types';
import type {
  RecipeViewModel,
  RecipeDetailsUIState,
} from '../../../lib/types/recipe-view-models';
import { fetchRecipe, deleteRecipe, updateRecipe, createRecipe } from '../../../lib/api/recipes-client';
import { fetchAllFridgeItems } from '../../../lib/api/fridge-client';
import { cookRecipe } from '../../../lib/api/cooking-history-client';
import { createRecipeViewModel, validateIngredientsAvailability } from '../../../lib/utils/recipe-utils';
import { ApiError } from '../../../lib/api-client';
import type { ExternalRecipe } from '../../../lib/services/external-api.service';

interface UseRecipeDetailsParams {
  recipeId?: number;
  externalRecipe?: ExternalRecipe;
  aiRecipe?: RecipeSummaryDTO; // For AI-generated recipes with temporary IDs
  initialMatchScore?: number;
  // Callbacks for modal mode
  onSaveSuccess?: () => void;
  onDeleteSuccess?: () => void;
  onCookSuccess?: () => void;
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
  externalRecipe,
  aiRecipe,
  initialMatchScore,
  onSaveSuccess,
  onDeleteSuccess,
  onCookSuccess,
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
  
  // Track if this is an external recipe (not yet saved to DB)
  const [isExternalRecipe, setIsExternalRecipe] = useState(!!externalRecipe);
  
  // Track if this is an AI-generated recipe with temporary ID (not yet saved to DB)
  const [isAIRecipe, setIsAIRecipe] = useState(!!aiRecipe);

  // =============================================================================
  // HELPER FUNCTIONS
  // =============================================================================

  /**
   * Konwertuje ExternalRecipe do RecipeDTO format
   * Używane dla wyświetlenia external recipe bez zapisywania do bazy
   */
  const convertExternalRecipeToDTO = async (
    external: ExternalRecipe,
    fridgeData: FridgeItemDTO[]
  ): Promise<RecipeDTO> => {
    // Create a temporary RecipeDTO-like object for display
    // Note: This won't have a real ID until saved
    // Ingredients will be matched to fridge items by name
    const recipeDTO: RecipeDTO = {
      id: 0, // Temporary ID - will be set on save
      title: external.title,
      description: external.description || null,
      instructions: external.instructions,
      cooking_time: external.cooking_time || null,
      difficulty: external.difficulty || 'medium',
      source: 'api', // External recipe
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        external_id: external.id,
        image_url: external.image_url,
        source_url: external.source_url,
      },
      // Map external ingredients to RecipeIngredientDTO format
      // Match by name with fridge items
      ingredients: external.ingredients.map((ing, index) => ({
        product: {
          id: 0, // Temporary - will be resolved on save
          name: ing.name,
        },
        quantity: ing.quantity,
        unit: {
          id: 0, // Temporary - will be resolved on save
          name: ing.unit,
          abbreviation: ing.unit,
        },
      })),
      // Tags from external recipe
      tags: (external.tags || []).map((tagName, index) => ({
        id: 0, // Temporary - will be resolved on save
        name: tagName,
        created_at: new Date().toISOString(),
      })),
    };
    
    return recipeDTO;
  };

  // =============================================================================
  // FETCH DATA
  // =============================================================================

  /**
   * Pobiera dane przepisu i lodówki równolegle
   * Obsługuje saved recipes (recipeId), external recipes, i AI recipes
   */
  const fetchRecipeAndFridge = useCallback(async () => {
    setUiState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Always fetch fridge data
      const fridgeData = await fetchAllFridgeItems();
      setFridgeItems(fridgeData);

      let recipeData: RecipeDTO;

      // Mode 1: AI-generated recipe with temporary ID (not yet saved to DB)
      if (aiRecipe && isAIRecipe) {
        // AI recipe already in RecipeSummaryDTO format, just add metadata field
        recipeData = {
          ...aiRecipe,
          metadata: {
            temporary_id: aiRecipe.id, // Store original temporary ID
            ai_generated: true,
          },
        };
      }
      // Mode 2: External recipe (not yet saved to DB)
      else if (externalRecipe && isExternalRecipe) {
        // Convert ExternalRecipe to RecipeDTO format
        // External recipes don't have an ID yet, use temporary ID
        recipeData = await convertExternalRecipeToDTO(externalRecipe, fridgeData);
      }
      // Mode 3: Saved recipe (has ID in DB)
      else if (recipeId) {
        recipeData = await fetchRecipe(recipeId);
      } else {
        throw new Error('Either recipeId, externalRecipe, or aiRecipe must be provided');
      }

      // Transform do RecipeViewModel z availability check
      const viewModel = createRecipeViewModel(
        recipeData,
        fridgeData,
        initialMatchScore
      );

      setRecipe(viewModel);
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
  }, [recipeId, externalRecipe, isExternalRecipe, initialMatchScore]);

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

    // Prevent cooking AI or external recipes that haven't been saved yet
    if (isAIRecipe || isExternalRecipe || recipe.id === 0) {
      toast.error('Zapisz przepis', {
        description: 'Aby ugotować ten przepis, musisz najpierw go zapisać.',
      });
      closeCookDialog();
      return;
    }

    setUiState((prev) => ({ ...prev, isCooking: true }));
    closeCookDialog();

    try {
      const result: CreateCookingHistoryResponseDTO = await cookRecipe({
        recipe_id: recipe.id,
      });

      toast.success('Przepis ugotowany!', {
        description: `Zaktualizowano ${result.updated_fridge_items.length} produktów w lodówce.`,
      });

      // Call callback if provided (for modal close)
      if (onCookSuccess) {
        onCookSuccess();
      } else {
        // Redirect do historii (only if not in modal mode)
        window.location.href = '/history';
      }
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
  }, [recipe, isAIRecipe, isExternalRecipe, closeCookDialog, onCookSuccess]);

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

    // Can't delete AI or external recipes that haven't been saved
    if (isAIRecipe || isExternalRecipe || recipe.id === 0) {
      toast.error('Nie można usunąć', {
        description: 'Ten przepis nie jest jeszcze zapisany w bazie danych.',
      });
      closeDeleteDialog();
      return;
    }

    setUiState((prev) => ({ ...prev, isDeleting: true }));
    closeDeleteDialog();

    try {
      await deleteRecipe(recipe.id);

      toast.success('Przepis usunięty', {
        description: 'Przepis został pomyślnie usunięty.',
      });

      // Call callback if provided (for modal close)
      if (onDeleteSuccess) {
        onDeleteSuccess();
      } else {
        // Redirect do listy przepisów (only if not in modal mode)
        window.location.href = '/recipes';
      }
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
  }, [recipe, isAIRecipe, isExternalRecipe, closeDeleteDialog, onDeleteSuccess]);

  // =============================================================================
  // SAVE RECIPE (COPY)
  // =============================================================================

  /**
   * Handler dla akcji "Zapisz do moich przepisów"
   * 
   * Three modes:
   * 1. AI recipe (not in DB yet) - creates new recipe from RecipeSummaryDTO
   * 2. External recipe (not in DB yet) - creates new recipe from ExternalRecipe
   * 3. Saved recipe (already in DB) - updates source to 'user'
   */
  const handleSave = useCallback(async () => {
    if (!recipe && !externalRecipe && !aiRecipe) return;

    setUiState((prev) => ({ ...prev, isSaving: true }));

    try {
      let savedRecipeId: number;

      // Mode 1: AI-generated recipe - save RecipeSummaryDTO to DB
      if (isAIRecipe && aiRecipe) {
        const response = await fetch('/api/recipes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: aiRecipe.title,
            description: aiRecipe.description || null,
            instructions: aiRecipe.instructions,
            cooking_time: aiRecipe.cooking_time || null,
            difficulty: aiRecipe.difficulty || 'medium',
            source: 'user', // Save as user recipe (from AI)
            ingredients: aiRecipe.ingredients.map(ing => ({
              product_name: ing.product.name,
              quantity: ing.quantity,
              unit_name: ing.unit.name,
            })),
            tags: aiRecipe.tags.map(tag => tag.name),
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save AI recipe');
        }

        const createdRecipe = await response.json();
        savedRecipeId = createdRecipe.id;
        
        // After saving, switch to saved mode
        setIsAIRecipe(false);
        
        toast.success('Przepis AI zapisany!', {
          description: 'Przepis został dodany do Twojej kolekcji.',
        });

        // Call callback if provided (for modal close)
        if (onSaveSuccess) {
          onSaveSuccess();
        }
      }
      // Mode 2: External recipe - create new recipe in DB
      else if (isExternalRecipe && externalRecipe) {
        const response = await fetch('/api/recipes', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: externalRecipe.title,
            description: externalRecipe.description || null,
            instructions: externalRecipe.instructions,
            cooking_time: externalRecipe.cooking_time || null,
            difficulty: externalRecipe.difficulty || 'medium',
            source: 'user', // Save as user recipe
            ingredients: externalRecipe.ingredients.map(ing => ({
              product_name: ing.name,
              quantity: ing.quantity,
              unit_name: ing.unit,
            })),
            tags: externalRecipe.tags || [],
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to save recipe');
        }

        const createdRecipe = await response.json();
        savedRecipeId = createdRecipe.id;
        
        // After saving, switch to saved mode
        setIsExternalRecipe(false);
        
        toast.success('Przepis zapisany!', {
          description: 'Przepis został dodany do Twojej kolekcji.',
        });

        // Call callback if provided (for modal close)
        if (onSaveSuccess) {
          onSaveSuccess();
        }
      }
      // Mode 3: Already saved recipe - just update source
      else if (recipe && recipe.id) {
        await updateRecipe(recipe.id, { source: 'user' });
        savedRecipeId = recipe.id;
        
        toast.success('Przepis zapisany!', {
          description: 'Przepis został dodany do Twojej kolekcji.',
        });

        // Refetch recipe to update UI
        await fetchRecipeAndFridge();
        
        // Call callback if provided (for modal close)
        if (onSaveSuccess) {
          onSaveSuccess();
        }
      } else {
        throw new Error('No recipe data available to save');
      }
      
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
  }, [recipe, externalRecipe, aiRecipe, isExternalRecipe, isAIRecipe, fetchRecipeAndFridge, onSaveSuccess]);

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

