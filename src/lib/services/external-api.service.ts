/**
 * ExternalAPIService - Integration with external recipe APIs
 * 
 * Currently supports TheMealDB (free tier)
 * Can be extended to support Spoonacular or other APIs
 * 
 * This service is used in Tier 2 of recipe discovery
 */

import type { SearchRecipePreferencesDTO } from '@/types';

/**
 * External recipe response from API
 * This is a generic format that can be mapped to internal format
 */
export interface ExternalRecipe {
  id: string;
  title: string;
  description?: string;
  instructions: string;
  cooking_time?: number;
  difficulty?: 'easy' | 'medium' | 'hard';
  image_url?: string;
  ingredients: ExternalIngredient[];
  tags?: string[];
  source_url?: string;
  sources?: Array<{ name: string; url: string }>;
}

/**
 * External ingredient format
 */
export interface ExternalIngredient {
  name: string;
  quantity: number;
  unit: string;
}

/**
 * Configuration for external API
 */
interface ExternalAPIConfig {
  url: string;
  apiKey?: string;
  timeout: number;
}

/**
 * ExternalAPIService class
 */
export class ExternalAPIService {
  private config: ExternalAPIConfig;

  constructor(config?: Partial<ExternalAPIConfig>) {
    // Default configuration
    this.config = {
      url: import.meta.env.EXTERNAL_RECIPE_API_URL || 'https://www.themealdb.com/api/json/v1/1',
      apiKey: import.meta.env.EXTERNAL_RECIPE_API_KEY,
      timeout: parseInt(import.meta.env.TIER2_TIMEOUT_MS || '10000', 10),
      ...config,
    };
  }

  /**
   * Search recipes by ingredients
   * 
   * @param ingredients - Array of ingredient names to search for
   * @param preferences - Search preferences (optional)
   * @returns Array of external recipes
   */
  async searchRecipes(
    ingredients: string[],
    preferences?: SearchRecipePreferencesDTO
  ): Promise<ExternalRecipe[]> {
    try {
      // For TheMealDB, we can search by main ingredient
      // Note: TheMealDB has limited search capabilities, mainly searches by single ingredient
      const mainIngredient = ingredients[0]; // Use first ingredient as primary search term
      
      if (!mainIngredient) {
        return [];
      }

      const recipes = await this.searchByIngredient(mainIngredient);

      // Apply preferences filtering
      return this.filterByPreferences(recipes, preferences);
      
    } catch (error) {
      console.error('Error searching external recipes:', error);
      throw new Error('External API search failed');
    }
  }

  /**
   * Search recipes by single ingredient (TheMealDB specific)
   * 
   * @param ingredient - Ingredient name
   * @returns Array of external recipes
   */
  private async searchByIngredient(ingredient: string): Promise<ExternalRecipe[]> {
    const url = `${this.config.url}/filter.php?i=${encodeURIComponent(ingredient)}`;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: this.buildHeaders(),
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`External API returned ${response.status}`);
      }

      const data = await response.json();

      // TheMealDB returns { meals: [...] } or { meals: null }
      if (!data.meals) {
        return [];
      }

      // Get detailed information for each meal
      const detailedRecipes = await Promise.all(
        data.meals.slice(0, 5).map((meal: any) => this.getMealDetails(meal.idMeal))
      );

      return detailedRecipes.filter((r): r is ExternalRecipe => r !== null);
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        throw new Error('External API request timed out');
      }
      throw error;
    }
  }

  /**
   * Get detailed meal information by ID (TheMealDB specific)
   * 
   * @param mealId - Meal ID
   * @returns External recipe or null
   */
  private async getMealDetails(mealId: string): Promise<ExternalRecipe | null> {
    const url = `${this.config.url}/lookup.php?i=${mealId}`;

    try {
      const response = await fetch(url, {
        headers: this.buildHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();

      if (!data.meals || data.meals.length === 0) {
        return null;
      }

      const meal = data.meals[0];

      // Parse ingredients from TheMealDB format
      // TheMealDB stores ingredients as strIngredient1, strIngredient2, etc.
      const ingredients: ExternalIngredient[] = [];
      for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];

        if (ingredient && ingredient.trim()) {
          ingredients.push({
            name: ingredient.trim(),
            quantity: this.parseQuantity(measure),
            unit: this.parseUnit(measure),
          });
        }
      }

      // Parse tags
      const tags = meal.strTags ? meal.strTags.split(',').map((t: string) => t.trim()) : [];

      return {
        id: meal.idMeal,
        title: meal.strMeal,
        description: meal.strCategory,
        instructions: meal.strInstructions,
        cooking_time: undefined, // TheMealDB doesn't provide cooking time
        difficulty: this.inferDifficulty(ingredients.length),
        image_url: meal.strMealThumb,
        ingredients,
        tags,
        source_url: meal.strSource,
      };
      
    } catch (error) {
      console.error(`Error fetching meal details for ${mealId}:`, error);
      return null;
    }
  }

  /**
   * Build HTTP headers for API request
   */
  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  /**
   * Parse quantity from measure string (e.g., "2 cups" -> 2)
   */
  private parseQuantity(measure: string | null): number {
    if (!measure) return 1;

    const match = measure.match(/(\d+\.?\d*)/);
    return match ? parseFloat(match[1]) : 1;
  }

  /**
   * Parse unit from measure string (e.g., "2 cups" -> "cups")
   */
  private parseUnit(measure: string | null): string {
    if (!measure) return 'piece';

    // Remove numbers and fractions, trim
    const unit = measure.replace(/[\d\/\.\s]+/, '').trim();
    return unit || 'piece';
  }

  /**
   * Infer difficulty based on number of ingredients
   * Simple heuristic: more ingredients = harder
   */
  private inferDifficulty(ingredientCount: number): 'easy' | 'medium' | 'hard' {
    if (ingredientCount <= 5) return 'easy';
    if (ingredientCount <= 10) return 'medium';
    return 'hard';
  }

  /**
   * Filter external recipes by preferences
   */
  private filterByPreferences(
    recipes: ExternalRecipe[],
    preferences?: SearchRecipePreferencesDTO
  ): ExternalRecipe[] {
    if (!preferences) {
      return recipes;
    }

    return recipes.filter((recipe) => {
      // Filter by cooking time
      if (preferences.max_cooking_time && recipe.cooking_time) {
        if (recipe.cooking_time > preferences.max_cooking_time) {
          return false;
        }
      }

      // Filter by difficulty
      if (preferences.difficulty && recipe.difficulty) {
        if (recipe.difficulty !== preferences.difficulty) {
          return false;
        }
      }

      // Filter by dietary restrictions (check tags)
      if (preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
        const recipeTags = (recipe.tags || []).map(t => t.toLowerCase());
        const hasAllRestrictions = preferences.dietary_restrictions.every(restriction =>
          recipeTags.includes(restriction.toLowerCase())
        );
        if (!hasAllRestrictions) {
          return false;
        }
      }

      return true;
    });
  }
}

