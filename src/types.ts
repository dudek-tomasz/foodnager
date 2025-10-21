/**
 * Data Transfer Objects (DTOs) and Command Models for Foodnager API
 * 
 * This file contains all type definitions for API requests and responses,
 * derived from database entity types defined in database.types.ts
 */

import type { Tables, Enums, Json } from './db/database.types';

// =============================================================================
// BASE ENTITY TYPES (derived from database tables)
// =============================================================================

/**
 * Database entity types - direct mappings from database.types.ts
 */
export type ProductEntity = Tables<'products'>;
export type UnitEntity = Tables<'units'>;
export type TagEntity = Tables<'tags'>;
export type UserProductEntity = Tables<'user_products'>;
export type RecipeEntity = Tables<'recipes'>;
export type RecipeIngredientEntity = Tables<'recipe_ingredients'>;
export type CookingHistoryEntity = Tables<'cooking_history'>;

/**
 * Database enums
 */
export type DifficultyEnum = Enums<'difficulty_enum'>;
export type SourceEnum = Enums<'source_enum'>;

// =============================================================================
// COMMON TYPES
// =============================================================================

/**
 * Pagination metadata for list responses
 */
export interface PaginationMetaDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

/**
 * Sort order enum
 */
export type SortOrderEnum = 'asc' | 'desc';

// =============================================================================
// PRODUCTS (2.2)
// =============================================================================

/**
 * Product DTO with computed is_global field
 * Extends ProductEntity with a computed field indicating if product is global
 */
export interface ProductDTO extends Omit<ProductEntity, 'user_id'> {
  user_id: string | null;
  is_global: boolean;
}

/**
 * Query parameters for listing products
 */
export interface ListProductsQueryDTO {
  search?: string;
  scope?: 'global' | 'private' | 'all';
  page?: number;
  limit?: number;
}

/**
 * Command model for creating a new product
 * Only requires name, other fields are set by the system
 */
export interface CreateProductDTO {
  name: string;
}

/**
 * Command model for updating an existing product
 * All fields are optional as this is a PATCH operation
 */
export interface UpdateProductDTO {
  name?: string;
}

/**
 * Response for list products endpoint
 */
export interface ProductsListResponseDTO {
  data: ProductDTO[];
  pagination: PaginationMetaDTO;
}

// =============================================================================
// UNITS (2.8)
// =============================================================================

/**
 * Unit DTO - direct mapping from UnitEntity
 */
export type UnitDTO = UnitEntity;

/**
 * Response for list units endpoint (no pagination)
 */
export interface UnitsListResponseDTO {
  data: UnitDTO[];
}

// =============================================================================
// TAGS (2.9)
// =============================================================================

/**
 * Tag DTO - direct mapping from TagEntity
 */
export type TagDTO = TagEntity;

/**
 * Query parameters for listing tags
 */
export interface ListTagsQueryDTO {
  search?: string;
}

/**
 * Command model for creating a new tag
 */
export interface CreateTagDTO {
  name: string;
}

/**
 * Response for list tags endpoint (no pagination)
 */
export interface TagsListResponseDTO {
  data: TagDTO[];
}

// =============================================================================
// VIRTUAL FRIDGE / USER PRODUCTS (2.3)
// =============================================================================

/**
 * Simplified product reference (nested in other DTOs)
 */
export interface ProductReferenceDTO {
  id: number;
  name: string;
}

/**
 * Simplified unit reference (nested in other DTOs)
 */
export interface UnitReferenceDTO {
  id: number;
  name: string;
  abbreviation: string;
}

/**
 * Fridge item DTO with nested product and unit objects
 * Transforms UserProductEntity by expanding foreign key references
 */
export interface FridgeItemDTO {
  id: number;
  product: ProductReferenceDTO;
  quantity: number;
  unit: UnitReferenceDTO;
  expiry_date: string | null;
  created_at: string;
}

/**
 * Query parameters for listing fridge items
 */
export interface ListFridgeQueryDTO {
  expired?: 'yes' | 'no' | 'all';
  expiring_soon?: number;
  search?: string;
  sort?: 'name' | 'quantity' | 'expiry_date' | 'created_at';
  order?: SortOrderEnum;
  page?: number;
  limit?: number;
}

/**
 * Command model for adding item to fridge
 * Uses foreign key IDs instead of nested objects
 */
export interface CreateFridgeItemDTO {
  product_id: number;
  quantity: number;
  unit_id: number;
  expiry_date?: string | null;
}

/**
 * Command model for updating fridge item
 * All fields optional for PATCH operation
 */
export interface UpdateFridgeItemDTO {
  quantity?: number;
  unit_id?: number;
  expiry_date?: string | null;
}

/**
 * Response for list fridge items endpoint
 */
export interface FridgeListResponseDTO {
  data: FridgeItemDTO[];
  pagination: PaginationMetaDTO;
}

// =============================================================================
// RECIPES (2.4)
// =============================================================================

/**
 * Recipe ingredient DTO (for responses)
 * Expands foreign keys to nested objects
 */
export interface RecipeIngredientDTO {
  product: ProductReferenceDTO;
  quantity: number;
  unit: UnitReferenceDTO;
}

/**
 * Recipe ingredient for request bodies
 * Uses foreign key IDs instead of nested objects
 */
export interface CreateRecipeIngredientDTO {
  product_id: number;
  quantity: number;
  unit_id: number;
}

/**
 * Full recipe DTO with all related data expanded
 * Transforms RecipeEntity by expanding ingredients and tags
 */
export interface RecipeDTO {
  id: number;
  title: string;
  description: string | null;
  instructions: string;
  cooking_time: number | null;
  difficulty: DifficultyEnum | null;
  source: SourceEnum;
  metadata?: Json | null;
  tags: TagDTO[];
  ingredients: RecipeIngredientDTO[];
  created_at: string;
  updated_at: string;
}

/**
 * Simplified recipe DTO (without metadata, used in some responses)
 */
export type RecipeSummaryDTO = Omit<RecipeDTO, 'metadata'>;

/**
 * Query parameters for listing recipes
 */
export interface ListRecipesQueryDTO {
  search?: string;
  source?: SourceEnum;
  difficulty?: DifficultyEnum;
  tags?: number[];
  max_cooking_time?: number;
  sort?: 'title' | 'cooking_time' | 'difficulty' | 'created_at';
  order?: SortOrderEnum;
  page?: number;
  limit?: number;
}

/**
 * Command model for creating a new recipe
 */
export interface CreateRecipeDTO {
  title: string;
  description?: string | null;
  instructions: string;
  cooking_time?: number | null;
  difficulty?: DifficultyEnum | null;
  ingredients: CreateRecipeIngredientDTO[];
  tag_ids?: number[];
}

/**
 * Command model for updating an existing recipe
 * All fields optional for PATCH operation
 */
export interface UpdateRecipeDTO {
  title?: string;
  description?: string | null;
  instructions?: string;
  cooking_time?: number | null;
  difficulty?: DifficultyEnum | null;
  ingredients?: CreateRecipeIngredientDTO[];
  tag_ids?: number[];
}

/**
 * Response for list recipes endpoint
 */
export interface RecipesListResponseDTO {
  data: RecipeSummaryDTO[];
  pagination: PaginationMetaDTO;
}

// =============================================================================
// RECIPE DISCOVERY & AI INTEGRATION (2.5)
// =============================================================================

/**
 * Preferences for recipe search
 */
export interface SearchRecipePreferencesDTO {
  max_cooking_time?: number;
  difficulty?: DifficultyEnum;
  dietary_restrictions?: string[];
}

/**
 * Command model for searching recipes by fridge contents
 */
export interface SearchRecipesByFridgeDTO {
  use_all_fridge_items: boolean;
  custom_product_ids?: number[];
  max_results?: number;
  preferences?: SearchRecipePreferencesDTO;
}

/**
 * Information about available ingredient in fridge
 */
export interface AvailableIngredientDTO {
  product_id: number;
  product_name: string;
  required_quantity: number;
  available_quantity: number;
  unit: string;
}

/**
 * Single recipe search result with match information
 */
export interface RecipeSearchResultDTO {
  recipe: RecipeSummaryDTO;
  match_score: number;
  available_ingredients: AvailableIngredientDTO[];
  missing_ingredients: AvailableIngredientDTO[];
}

/**
 * Metadata about the search operation
 */
export interface SearchMetadataDTO {
  source: 'user_recipes' | 'external_api' | 'ai_generated';
  total_results: number;
  search_duration_ms: number;
}

/**
 * Response for search recipes by fridge endpoint
 */
export interface SearchRecipesResponseDTO {
  results: RecipeSearchResultDTO[];
  search_metadata: SearchMetadataDTO;
}

/**
 * Preferences for AI recipe generation
 */
export interface GenerateRecipePreferencesDTO {
  cuisine?: string;
  max_cooking_time?: number;
  difficulty?: DifficultyEnum;
  dietary_restrictions?: string[];
}

/**
 * Command model for generating recipe with AI
 */
export interface GenerateRecipeDTO {
  product_ids: number[];
  preferences?: GenerateRecipePreferencesDTO;
  save_to_recipes?: boolean;
}

/**
 * Response for generate recipe endpoint
 */
export interface GenerateRecipeResponseDTO {
  recipe: RecipeDTO;
}

// =============================================================================
// SHOPPING LIST (2.6)
// =============================================================================

/**
 * Simple recipe reference for shopping list
 */
export interface RecipeReferenceDTO {
  id: number;
  title: string;
}

/**
 * Single item in shopping list with availability information
 */
export interface ShoppingListItemDTO {
  product: ProductReferenceDTO;
  required_quantity: number;
  available_quantity: number;
  missing_quantity: number;
  unit: UnitReferenceDTO;
}

/**
 * Command model for generating shopping list
 */
export interface GenerateShoppingListDTO {
  recipe_id: number;
}

/**
 * Response for generate shopping list endpoint
 */
export interface ShoppingListResponseDTO {
  recipe: RecipeReferenceDTO;
  missing_ingredients: ShoppingListItemDTO[];
  total_items: number;
}

// =============================================================================
// COOKING HISTORY (2.7)
// =============================================================================

/**
 * Single item in fridge state snapshot
 */
export interface FridgeStateItemDTO {
  product_id: number;
  product_name: string;
  quantity: number;
  unit: string;
}

/**
 * Snapshot of fridge state at a point in time
 */
export interface FridgeStateDTO {
  items: FridgeStateItemDTO[];
}

/**
 * Information about updated fridge item after cooking
 */
export interface UpdatedFridgeItemDTO {
  product_id: number;
  old_quantity: number;
  new_quantity: number;
  unit: string;
}

/**
 * Cooking history entry with expanded recipe reference and fridge states
 */
export interface CookingHistoryDTO {
  id: number;
  recipe: RecipeReferenceDTO;
  cooked_at: string;
  fridge_state_before: FridgeStateDTO;
  fridge_state_after: FridgeStateDTO;
}

/**
 * Query parameters for listing cooking history
 */
export interface ListCookingHistoryQueryDTO {
  recipe_id?: number;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

/**
 * Command model for creating cooking history entry
 */
export interface CreateCookingHistoryDTO {
  recipe_id: number;
}

/**
 * Response for create cooking history endpoint
 * Includes additional information about updated items
 */
export interface CreateCookingHistoryResponseDTO extends CookingHistoryDTO {
  updated_fridge_items: UpdatedFridgeItemDTO[];
}

/**
 * Response for list cooking history endpoint
 */
export interface CookingHistoryListResponseDTO {
  data: CookingHistoryDTO[];
  pagination: PaginationMetaDTO;
}

// =============================================================================
// ERROR RESPONSE TYPES
// =============================================================================

/**
 * Standard error response format
 */
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Common error codes used across the API
 */
export enum ErrorCode {
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  CONFLICT = 'CONFLICT',
  INSUFFICIENT_INGREDIENTS = 'INSUFFICIENT_INGREDIENTS',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  AI_SERVICE_ERROR = 'AI_SERVICE_ERROR',
}

// =============================================================================
// VIEW MODEL TYPES (for frontend state management)
// =============================================================================

/**
 * Status daty ważności produktu
 */
export type ExpiryStatus = 'expired' | 'expiring-soon' | 'fresh' | 'no-expiry';

/**
 * Pole sortowania w widoku lodówki
 */
export type SortField = 'name' | 'quantity' | 'expiry_date' | 'created_at';

/**
 * Stan głównego widoku lodówki
 */
export interface FridgeViewState {
  // Dane
  items: FridgeItemDTO[];
  pagination: PaginationMetaDTO;
  
  // Filtrowanie i sortowanie
  searchQuery: string;
  sortBy: SortField;
  sortOrder: SortOrderEnum;
  expiredFilter: 'yes' | 'no' | 'all';
  expiringSoonDays: number | undefined;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  
  // Modals
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  editingItem: FridgeItemDTO | null;
  
  // Confirm dialog
  isConfirmDialogOpen: boolean;
  deletingItemId: number | null;
  deletingItemName: string | null;
  
  // Stats
  stats: {
    totalCount: number;
    expiredCount: number;
  };
}

/**
 * Stan formularza dodawania produktu
 */
export interface AddProductFormState {
  product: ProductDTO | null;
  quantity: number | null;
  unit: UnitDTO | null;
  expiryDate: string | null;
  addAnother: boolean;
  
  // Validation errors
  errors: {
    product?: string;
    quantity?: string;
    unit?: string;
    expiryDate?: string;
  };
}

/**
 * Stan formularza edycji produktu
 */
export interface EditProductFormState {
  quantity: number | null;
  unit: UnitDTO | null;
  expiryDate: string | null;
  
  // Validation errors
  errors: {
    quantity?: string;
    unit?: string;
    expiryDate?: string;
  };
}

/**
 * Opcje autocomplete produktów
 */
export interface ProductAutocompleteState {
  query: string;
  results: ProductDTO[];
  isLoading: boolean;
  showCreateForm: boolean;
  newProductName: string;
}

