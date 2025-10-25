/**
 * View Model types for Recipe Details view
 * These types extend base DTOs with additional UI-specific fields
 */

import type {
  RecipeDTO,
  RecipeIngredientDTO,
  FridgeItemDTO,
  DifficultyEnum,
  SourceEnum,
} from '../../types';

// =============================================================================
// AVAILABILITY TYPES
// =============================================================================

/**
 * Status dostępności składnika w lodówce
 */
export type AvailabilityStatus = 'full' | 'partial' | 'none';

/**
 * Składnik z informacją o dostępności w lodówce
 */
export interface IngredientWithAvailability extends RecipeIngredientDTO {
  availabilityStatus: AvailabilityStatus;
  availableQuantity: number;
  requiredQuantity: number;
  // Ilość brakująca (0 dla full, >0 dla partial/none)
  missingQuantity: number;
}

/**
 * Rezultat porównania składnika z lodówką
 */
export interface IngredientAvailabilityCheckResult {
  status: AvailabilityStatus;
  availableQuantity: number;
  missingQuantity: number;
}

/**
 * Rezultat obliczeń dostępności dla całego przepisu
 */
export interface RecipeAvailabilityResult {
  enrichedIngredients: IngredientWithAvailability[];
  hasAllIngredients: boolean;
  hasMissingIngredients: boolean;
}

// =============================================================================
// RECIPE VIEW MODEL
// =============================================================================

/**
 * Rozszerzony model przepisu z dodatkowymi danymi dla widoku
 */
export interface RecipeViewModel extends RecipeDTO {
  // Składniki z informacją o dostępności
  enrichedIngredients: IngredientWithAvailability[];
  // Czy użytkownik ma wszystkie składniki
  hasAllIngredients: boolean;
  // Czy są jakieś brakujące składniki
  hasMissingIngredients: boolean;
  // Match score z wyszukiwania (opcjonalnie)
  matchScore?: number;
}

// =============================================================================
// UI STATE
// =============================================================================

/**
 * Stan UI dla widoku Recipe Details
 */
export interface RecipeDetailsUIState {
  isLoading: boolean;
  error: string | null;
  recipe: RecipeViewModel | null;
  showDeleteDialog: boolean;
  showCookDialog: boolean;
  showShoppingListModal: boolean;
  isDeleting: boolean;
  isCooking: boolean;
  isSaving: boolean;
  isGeneratingShoppingList: boolean;
}

// =============================================================================
// NAVIGATION PARAMS
// =============================================================================

/**
 * Parametry nawigacji dla widoku
 */
export interface RecipeDetailsNavigationParams {
  recipeId: number;
  from?: string;
  matchScore?: number;
}

// =============================================================================
// INSTRUCTIONS PARSING
// =============================================================================

/**
 * Helper type dla parsowania instrukcji
 */
export interface ParsedInstructions {
  steps: string[];
  isNumbered: boolean;
}

// =============================================================================
// VALIDATION RESULTS
// =============================================================================

/**
 * Rezultat walidacji możliwości ugotowania przepisu
 */
export interface CookingValidationResult {
  canCook: boolean;
  missingIngredients: IngredientWithAvailability[];
  message?: string;
}

