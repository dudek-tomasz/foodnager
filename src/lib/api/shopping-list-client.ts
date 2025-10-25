/**
 * Shopping List API Client
 * Client-side functions for shopping list-related API calls
 */

import { apiClient } from '../api-client';
import type {
  GenerateShoppingListDTO,
  ShoppingListResponseDTO,
} from '../../types';

/**
 * Generuje listę zakupów dla przepisu na podstawie brakujących składników
 * @param data - Dane zawierające recipe_id
 * @returns Lista brakujących składników
 * @throws ApiError jeśli przepis nie istnieje (404)
 */
export async function generateShoppingList(
  data: GenerateShoppingListDTO
): Promise<ShoppingListResponseDTO> {
  return apiClient.post<ShoppingListResponseDTO>(
    '/api/shopping-list/generate',
    data
  );
}

/**
 * Wrapper function - generuje listę zakupów na podstawie ID przepisu
 * @param recipeId - ID przepisu
 * @returns Lista brakujących składników
 */
export async function generateShoppingListForRecipe(
  recipeId: number
): Promise<ShoppingListResponseDTO> {
  return generateShoppingList({ recipe_id: recipeId });
}

