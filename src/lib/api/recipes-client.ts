/**
 * Recipe API Client
 * Client-side functions for recipe-related API calls
 */

import { apiClient } from '../api-client';
import type {
  RecipeDTO,
  CreateRecipeDTO,
  UpdateRecipeDTO,
  RecipesListResponseDTO,
  ListRecipesQueryDTO,
} from '../../types';

/**
 * Pobiera szczegóły pojedynczego przepisu
 * @param recipeId - ID przepisu
 * @returns Pełny przepis z składnikami i tagami
 * @throws ApiError jeśli przepis nie istnieje (404) lub brak autoryzacji (401)
 */
export async function fetchRecipe(recipeId: number): Promise<RecipeDTO> {
  return apiClient.get<RecipeDTO>(`/api/recipes/${recipeId}`);
}

/**
 * Pobiera listę przepisów z filtrowaniem
 * @param query - Parametry filtrowania i paginacji
 * @returns Lista przepisów z paginacją
 */
export async function fetchRecipes(
  query?: ListRecipesQueryDTO
): Promise<RecipesListResponseDTO> {
  return apiClient.get<RecipesListResponseDTO>('/api/recipes', query);
}

/**
 * Tworzy nowy przepis (także jako kopia zewnętrznego przepisu)
 * @param recipe - Dane przepisu do utworzenia
 * @returns Utworzony przepis
 * @throws ApiError jeśli dane są nieprawidłowe (400)
 */
export async function createRecipe(
  recipe: CreateRecipeDTO
): Promise<RecipeDTO> {
  return apiClient.post<RecipeDTO>('/api/recipes', recipe);
}

/**
 * Aktualizuje przepis użytkownika
 * @param recipeId - ID przepisu do zaktualizowania
 * @param updateDto - Dane do aktualizacji
 * @returns Zaktualizowany przepis
 * @throws ApiError jeśli przepis nie istnieje (404) lub brak uprawnień
 */
export async function updateRecipe(
  recipeId: number,
  updateDto: UpdateRecipeDTO
): Promise<RecipeDTO> {
  return apiClient.patch<RecipeDTO>(`/api/recipes/${recipeId}`, updateDto);
}

/**
 * Usuwa przepis użytkownika
 * @param recipeId - ID przepisu do usunięcia
 * @throws ApiError jeśli przepis nie istnieje (404) lub brak uprawnień
 */
export async function deleteRecipe(recipeId: number): Promise<void> {
  return apiClient.delete<void>(`/api/recipes/${recipeId}`);
}

/**
 * Zapisuje kopię przepisu z zewnętrznego źródła jako przepis użytkownika
 * Transformuje RecipeDTO na CreateRecipeDTO i wysyła POST
 * @param recipe - Przepis do skopiowania
 * @returns Nowy przepis użytkownika
 */
export async function saveRecipeAsCopy(
  recipe: RecipeDTO
): Promise<RecipeDTO> {
  // Transform RecipeDTO to CreateRecipeDTO
  const createDto: CreateRecipeDTO = {
    title: recipe.title,
    description: recipe.description,
    instructions: recipe.instructions,
    cooking_time: recipe.cooking_time,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients.map((ing) => ({
      product_id: ing.product.id,
      quantity: ing.quantity,
      unit_id: ing.unit.id,
    })),
    tag_ids: recipe.tags.map((tag) => tag.id),
  };

  return createRecipe(createDto);
}

