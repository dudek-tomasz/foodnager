/**
 * Preferences Filter
 * 
 * Filters recipes based on user preferences:
 * - Maximum cooking time
 * - Difficulty level
 * - Dietary restrictions (via tags)
 */

import type { RecipeSummaryDTO, SearchRecipePreferencesDTO } from '@/types';

/**
 * Filters an array of recipes based on user preferences
 * 
 * @param recipes - Array of recipes to filter
 * @param preferences - User preferences for filtering
 * @returns Filtered array of recipes that match preferences
 * 
 * @example
 * const filtered = filterByPreferences(recipes, {
 *   max_cooking_time: 30,
 *   difficulty: 'easy',
 *   dietary_restrictions: ['vegetarian', 'gluten-free']
 * });
 */
export function filterByPreferences(
  recipes: RecipeSummaryDTO[],
  preferences?: SearchRecipePreferencesDTO
): RecipeSummaryDTO[] {
  if (!preferences) {
    return recipes;
  }
  
  return recipes.filter((recipe) => {
    // Filter by max cooking time
    if (preferences.max_cooking_time !== undefined) {
      // If recipe has no cooking_time, we can't determine if it matches
      // Conservative approach: exclude recipes without cooking_time
      if (recipe.cooking_time === null) {
        return false;
      }
      if (recipe.cooking_time > preferences.max_cooking_time) {
        return false;
      }
    }
    
    // Filter by difficulty
    if (preferences.difficulty !== undefined) {
      // If recipe has no difficulty, we can't determine if it matches
      // Conservative approach: exclude recipes without difficulty
      if (recipe.difficulty === null) {
        return false;
      }
      if (recipe.difficulty !== preferences.difficulty) {
        return false;
      }
    }
    
    // Filter by dietary restrictions (check recipe tags)
    if (preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
      // Get all tag names from recipe (lowercase for case-insensitive comparison)
      const recipeTagNames = recipe.tags.map(tag => tag.name.toLowerCase());
      
      // Check if recipe has all required dietary restriction tags
      // All dietary restrictions must be satisfied
      const hasAllRestrictions = preferences.dietary_restrictions.every(restriction => {
        const normalizedRestriction = restriction.toLowerCase();
        return recipeTagNames.includes(normalizedRestriction);
      });
      
      if (!hasAllRestrictions) {
        return false;
      }
    }
    
    return true;
  });
}

/**
 * Checks if a single recipe matches the given preferences
 * 
 * @param recipe - Recipe to check
 * @param preferences - User preferences
 * @returns True if recipe matches all preferences
 */
export function recipeMatchesPreferences(
  recipe: RecipeSummaryDTO,
  preferences?: SearchRecipePreferencesDTO
): boolean {
  const filtered = filterByPreferences([recipe], preferences);
  return filtered.length > 0;
}

