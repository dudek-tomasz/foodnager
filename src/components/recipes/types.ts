/**
 * View Models and types for Recipe List View
 *
 * These types are specific to the frontend recipes view and extend/transform
 * the base DTOs from src/types.ts for UI-specific needs.
 */

import type { SourceEnum, DifficultyEnum, RecipesListResponseDTO, TagDTO, UnitDTO } from "@/types";

// =============================================================================
// RECIPE STATISTICS
// =============================================================================

/**
 * Model widoku dla statystyk przepisów
 */
export interface RecipeStats {
  total: number;
  userCount: number;
  apiCount: number;
  aiCount: number;
}

// =============================================================================
// SORTING AND FILTERING
// =============================================================================

/**
 * Opcje sortowania dla widoku przepisów
 */
export interface SortOption {
  field: "title" | "cooking_time" | "difficulty" | "created_at";
  order: "asc" | "desc";
}

/**
 * Filtry dla widoku przepisów
 */
export interface RecipeFilters {
  source?: SourceEnum;
  difficulty?: DifficultyEnum;
  tagIds?: number[];
  maxCookingTime?: number;
}

/**
 * Kompletny stan filtrów, sortowania i paginacji dla widoku
 */
export interface RecipeListState {
  search: string;
  sort: SortOption;
  filters: RecipeFilters;
  page: number;
  limit: number;
}

// =============================================================================
// FORM DATA
// =============================================================================

/**
 * Model formularza dodawania/edycji przepisu
 */
export interface RecipeFormData {
  title: string;
  description: string;
  instructions: string;
  cookingTime: number | null;
  difficulty: DifficultyEnum | null;
  ingredients: RecipeIngredientFormData[];
  tagIds: number[];
}

/**
 * Model składnika w formularzu
 */
export interface RecipeIngredientFormData {
  id?: string; // temporary ID dla key w React
  productId: number | null;
  productName: string; // dla display w autocomplete
  quantity: number;
  unitId: number | null;
}

/**
 * Błędy walidacji formularza
 */
export interface RecipeFormErrors {
  title?: string;
  description?: string;
  instructions?: string;
  cookingTime?: string;
  ingredients?: Record<
    number,
    {
      productId?: string;
      quantity?: string;
      unitId?: string;
    }
  >;
}

// =============================================================================
// COMPONENT PROPS
// =============================================================================

/**
 * Props dla głównego widoku (z SSR)
 */
export interface RecipesPageProps {
  initialData?: RecipesListResponseDTO;
  initialTags?: TagDTO[];
  initialUnits?: UnitDTO[];
}
