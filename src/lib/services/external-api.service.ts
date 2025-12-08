/**
 * ExternalAPIService - Integration with external recipe APIs
 *
 * Currently supports Spoonacular API
 *
 * This service is used in Tier 2 of recipe discovery
 */

/* eslint-disable no-console */
// Console logs are intentional for debugging external API integration

import type { SearchRecipePreferencesDTO } from "@/types";
import { translateIngredients } from "../utils/ingredient-translator";
import { htmlToText, extractSummary } from "../utils/html-to-text";
import { translateRecipe } from "../utils/recipe-translator";
import { translateTags } from "../utils/tag-translator";

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
  difficulty?: "easy" | "medium" | "hard";
  image_url?: string;
  ingredients: ExternalIngredient[];
  tags?: string[];
  source_url?: string;
  sources?: { name: string; url: string }[];
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
 * Spoonacular API response types
 */
interface SpoonacularIngredientSearchResult {
  id: number;
  title: string;
  image: string;
  usedIngredientCount: number;
  missedIngredientCount: number;
  missedIngredients: SpoonacularIngredient[];
  usedIngredients: SpoonacularIngredient[];
  unusedIngredients: SpoonacularIngredient[];
  likes: number;
}

interface SpoonacularIngredient {
  id: number;
  amount: number;
  unit: string;
  unitLong: string;
  unitShort: string;
  aisle: string;
  name: string;
  original: string;
  originalName: string;
  meta: string[];
  image: string;
}

interface SpoonacularRecipeDetails {
  id: number;
  title: string;
  image: string;
  servings: number;
  readyInMinutes: number;
  cookingMinutes?: number;
  preparationMinutes?: number;
  sourceUrl: string;
  spoonacularSourceUrl: string;
  aggregateLikes: number;
  healthScore: number;
  spoonacularScore: number;
  pricePerServing: number;
  analyzedInstructions: SpoonacularInstruction[];
  cheap: boolean;
  creditsText: string;
  cuisines: string[];
  dairyFree: boolean;
  diets: string[];
  gaps: string;
  glutenFree: boolean;
  instructions: string;
  ketogenic: boolean;
  lowFodmap: boolean;
  occasions: string[];
  sustainable: boolean;
  vegan: boolean;
  vegetarian: boolean;
  veryHealthy: boolean;
  veryPopular: boolean;
  whole30: boolean;
  weightWatcherSmartPoints: number;
  dishTypes: string[];
  extendedIngredients: SpoonacularExtendedIngredient[];
  summary: string;
  winePairing?: Record<string, unknown>;
}

interface SpoonacularExtendedIngredient {
  id: number;
  aisle: string;
  image: string;
  consistency: string;
  name: string;
  nameClean: string;
  original: string;
  originalName: string;
  amount: number;
  unit: string;
  meta: string[];
  measures: {
    us: { amount: number; unitShort: string; unitLong: string };
    metric: { amount: number; unitShort: string; unitLong: string };
  };
}

interface SpoonacularInstruction {
  name: string;
  steps: {
    number: number;
    step: string;
    ingredients: { id: number; name: string; localizedName: string; image: string }[];
    equipment: { id: number; name: string; localizedName: string; image: string }[];
    length?: { number: number; unit: string };
  }[];
}

/**
 * ExternalAPIService class
 */
export class ExternalAPIService {
  private config: ExternalAPIConfig;

  constructor(config?: Partial<ExternalAPIConfig>) {
    // Default configuration for Spoonacular
    this.config = {
      url: import.meta.env.EXTERNAL_RECIPE_API_URL || "https://api.spoonacular.com",
      apiKey: import.meta.env.EXTERNAL_RECIPE_API_KEY,
      timeout: parseInt(import.meta.env.TIER2_TIMEOUT_MS || "10000", 10),
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
  async searchRecipes(ingredients: string[], preferences?: SearchRecipePreferencesDTO): Promise<ExternalRecipe[]> {
    console.log(`🌐 [SPOONACULAR] Starting search with ingredients:`, ingredients);

    try {
      if (!ingredients || ingredients.length === 0) {
        console.log("🌐 [SPOONACULAR] ⚠️ No ingredients provided");
        return [];
      }

      if (!this.config.apiKey) {
        console.warn("🌐 [SPOONACULAR] ⚠️ API key not configured, skipping external API search");
        return [];
      }

      // Translate Polish ingredient names to English
      const translatedIngredients = translateIngredients(ingredients);
      console.log(`🌐 [SPOONACULAR] ✅ API key configured, searching with translated ingredients...`);

      // TODO: Use preferences for filtering/sorting in future implementation
      const recipes = await this.searchByIngredients(translatedIngredients);
      console.log(`🌐 [SPOONACULAR] Found ${recipes.length} recipes before filtering`);

      // Apply preferences filtering
      const filtered = this.filterByPreferences(recipes, preferences);
      console.log(`🌐 [SPOONACULAR] Returning ${filtered.length} recipes after filtering`);

      return filtered;
    } catch (error) {
      console.error("🌐 [SPOONACULAR] ❌ Error searching external recipes:", error);
      throw new Error("External API search failed");
    }
  }

  /**
   * Search recipes by ingredients using Spoonacular API
   *
   * @param ingredients - Array of ingredient names
   * @returns Array of external recipes
   */
  private async searchByIngredients(ingredients: string[]): Promise<ExternalRecipe[]> {
    // Spoonacular findByIngredients endpoint
    const params = new URLSearchParams({
      apiKey: this.config.apiKey || "",
      ingredients: ingredients.join(","),
      number: "5", // Limit to 5 results
      ranking: "1", // Maximize used ingredients
      ignorePantry: "true",
    });

    const url = `${this.config.url}/recipes/findByIngredients?${params.toString()}`;
    console.log(`🌐 [SPOONACULAR] Request URL: ${url.replace(this.config.apiKey || "", "HIDDEN")}`);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      console.log(`🌐 [SPOONACULAR] Making request to Spoonacular...`);
      const response = await fetch(url, {
        signal: controller.signal,
        headers: this.buildHeaders(),
      });

      clearTimeout(timeoutId);
      console.log(`🌐 [SPOONACULAR] Response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`🌐 [SPOONACULAR] API Error: ${response.status} - ${errorText}`);
        throw new Error(`External API returned ${response.status}: ${errorText}`);
      }

      const data: SpoonacularIngredientSearchResult[] = await response.json();
      console.log(`🌐 [SPOONACULAR] Found ${data?.length || 0} recipe summaries`);

      if (!data || data.length === 0) {
        console.log(`🌐 [SPOONACULAR] No recipes found for ingredients: ${ingredients.join(", ")}`);
        return [];
      }

      // Get detailed information for each recipe
      console.log(`🌐 [SPOONACULAR] Fetching details for ${data.length} recipes...`);
      const detailedRecipes = await Promise.all(data.map((recipe) => this.getRecipeDetails(recipe.id)));

      const validRecipes = detailedRecipes.filter((r): r is ExternalRecipe => r !== null);
      console.log(`🌐 [SPOONACULAR] Successfully fetched ${validRecipes.length} detailed recipes`);

      return validRecipes;
    } catch (error: unknown) {
      if ((error as Error).name === "AbortError") {
        console.error(`🌐 [SPOONACULAR] ❌ Request timed out after ${this.config.timeout}ms`);
        throw new Error("External API request timed out");
      }
      console.error(`🌐 [SPOONACULAR] ❌ Request failed:`, error);
      throw error;
    }
  }

  /**
   * Get detailed recipe information by ID from Spoonacular
   *
   * @param recipeId - Recipe ID
   * @returns External recipe or null
   */
  private async getRecipeDetails(recipeId: number): Promise<ExternalRecipe | null> {
    const params = new URLSearchParams({
      apiKey: this.config.apiKey || "",
    });

    const url = `${this.config.url}/recipes/${recipeId}/information?${params.toString()}`;

    try {
      console.log(`🌐 [SPOONACULAR] Fetching details for recipe ${recipeId}...`);
      const response = await fetch(url, {
        headers: this.buildHeaders(),
      });

      if (!response.ok) {
        console.warn(`🌐 [SPOONACULAR] ⚠️ Failed to fetch recipe ${recipeId}: ${response.status}`);
        return null;
      }

      const recipe: SpoonacularRecipeDetails = await response.json();
      console.log(`🌐 [SPOONACULAR] ✅ Fetched recipe: ${recipe.title}`);
      console.log(`🌐 [SPOONACULAR] Recipe has ${recipe.extendedIngredients?.length || 0} ingredients`);

      // Parse ingredients from Spoonacular format
      const ingredients: ExternalIngredient[] = [];

      if (recipe.extendedIngredients && recipe.extendedIngredients.length > 0) {
        for (const ing of recipe.extendedIngredients) {
          ingredients.push({
            name: ing.nameClean || ing.name || ing.originalName || "unknown",
            quantity: ing.amount && ing.amount > 0 ? ing.amount : 1,
            unit: ing.measures?.metric?.unitShort || ing.unit || "piece",
          });
        }
        console.log(`🌐 [SPOONACULAR] Parsed ${ingredients.length} ingredients`);
      } else {
        console.warn(`🌐 [SPOONACULAR] ⚠️ No extendedIngredients found for recipe ${recipeId}`);
      }

      // Build instructions - prefer analyzedInstructions, fallback to plain instructions
      let instructions = "";

      if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
        console.log(`🌐 [SPOONACULAR] Using analyzedInstructions (${recipe.analyzedInstructions.length} sections)`);
        instructions = recipe.analyzedInstructions
          .map((instruction) => instruction.steps.map((step) => `${step.number}. ${step.step}`).join("\n"))
          .join("\n\n");
      } else if (recipe.instructions) {
        console.log(`🌐 [SPOONACULAR] Using plain instructions field (HTML format)`);
        instructions = htmlToText(recipe.instructions);
      } else {
        console.warn(`🌐 [SPOONACULAR] ⚠️ No instructions found for recipe ${recipeId}`);
        instructions = "Brak instrukcji przygotowania.";
      }

      // Extract clean description (summary) - remove HTML and limit length
      const description = recipe.summary ? extractSummary(recipe.summary, 500) : undefined;

      // Collect tags from diets, cuisines, and dish types
      const englishTags: string[] = [...recipe.diets, ...recipe.cuisines, ...recipe.dishTypes];

      // Add dietary tags
      if (recipe.vegetarian) englishTags.push("vegetarian");
      if (recipe.vegan) englishTags.push("vegan");
      if (recipe.glutenFree) englishTags.push("gluten-free");
      if (recipe.dairyFree) englishTags.push("dairy-free");

      // Translate tags to Polish
      const tags = translateTags(englishTags);
      console.log(`🌍 [TRANSLATOR] Translated ${englishTags.length} tags to Polish`);

      // Create external recipe object (English)
      const externalRecipe: ExternalRecipe = {
        id: recipe.id.toString(),
        title: recipe.title,
        description,
        instructions,
        cooking_time: recipe.readyInMinutes,
        difficulty: this.inferDifficulty(ingredients.length, recipe.readyInMinutes),
        image_url: recipe.image,
        ingredients,
        tags: [...new Set(tags)], // Remove duplicates
        source_url: recipe.sourceUrl,
      };

      // Translate recipe to Polish
      console.log(`🌍 [TRANSLATOR] Translating recipe: "${externalRecipe.title}"`);
      try {
        const translated = await translateRecipe({
          title: externalRecipe.title,
          description: externalRecipe.description,
          instructions: externalRecipe.instructions,
        });

        externalRecipe.title = translated.title;
        externalRecipe.description = translated.description;
        externalRecipe.instructions = translated.instructions;

        console.log(`🌍 [TRANSLATOR] ✅ Translated to: "${translated.title}"`);
      } catch (error) {
        console.warn(`🌍 [TRANSLATOR] ⚠️ Translation failed, using original English:`, error);
      }

      return externalRecipe;
    } catch (error) {
      console.error(`Error fetching recipe details for ${recipeId}:`, error);
      return null;
    }
  }

  /**
   * Build HTTP headers for API request
   */
  private buildHeaders(): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    // Spoonacular uses API key in query params, not headers
    // But we include it here for consistency with other APIs
    return headers;
  }

  /**
   * Infer difficulty based on number of ingredients and cooking time
   * Heuristic: considers both ingredient count and time
   */
  private inferDifficulty(ingredientCount: number, cookingTime?: number): "easy" | "medium" | "hard" {
    // Base score on ingredients
    let difficultyScore = 0;

    if (ingredientCount <= 5) difficultyScore += 1;
    else if (ingredientCount <= 10) difficultyScore += 2;
    else difficultyScore += 3;

    // Add score based on cooking time
    if (cookingTime) {
      if (cookingTime <= 30) difficultyScore += 1;
      else if (cookingTime <= 60) difficultyScore += 2;
      else difficultyScore += 3;
    }

    // Determine final difficulty
    if (difficultyScore <= 3) return "easy";
    if (difficultyScore <= 5) return "medium";
    return "hard";
  }

  /**
   * Filter external recipes by preferences
   */
  private filterByPreferences(recipes: ExternalRecipe[], preferences?: SearchRecipePreferencesDTO): ExternalRecipe[] {
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
        const recipeTags = (recipe.tags || []).map((t) => t.toLowerCase());
        const hasAllRestrictions = preferences.dietary_restrictions.every((restriction) =>
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
