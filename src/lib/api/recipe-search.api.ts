/**
 * API client functions for recipe search functionality
 * 
 * This module provides type-safe functions to interact with recipe search endpoints
 */

import type {
  SearchRecipesByFridgeDTO,
  SearchRecipesResponseDTO,
  GenerateRecipeDTO,
  GenerateRecipeResponseDTO,
} from '@/types';

/**
 * Searches for recipes based on fridge contents
 * 
 * @param searchDto - Search parameters including fridge items and preferences
 * @param signal - Optional AbortSignal for cancelling the request
 * @returns Promise resolving to search results with match scores
 * @throws Error if the request fails
 */
export async function searchRecipesByFridge(
  searchDto: SearchRecipesByFridgeDTO,
  signal?: AbortSignal
): Promise<SearchRecipesResponseDTO> {
  const response = await fetch('/api/recipes/search-by-fridge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(searchDto),
    signal,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Nie udało się wyszukać przepisów');
  }

  return response.json();
}

/**
 * Generates a new recipe using AI based on selected products
 * 
 * @param generateDto - Generation parameters including product IDs and preferences
 * @param signal - Optional AbortSignal for cancelling the request
 * @returns Promise resolving to generated recipe
 * @throws Error if the request fails
 */
export async function generateRecipeWithAI(
  generateDto: GenerateRecipeDTO,
  signal?: AbortSignal
): Promise<GenerateRecipeResponseDTO> {
  const response = await fetch('/api/recipes/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(generateDto),
    signal,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Nie udało się wygenerować przepisu');
  }

  return response.json();
}

