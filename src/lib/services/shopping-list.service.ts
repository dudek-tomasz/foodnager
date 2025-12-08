/**
 * ShoppingListService - Business logic for Shopping List API
 *
 * Handles shopping list generation by:
 * - Fetching recipe and verifying ownership
 * - Fetching recipe ingredients
 * - Fetching user's fridge contents
 * - Calculating missing quantities
 * - Building shopping list response
 */

import type { SupabaseClient } from "../../db/supabase.client";
import type { ShoppingListResponseDTO, ShoppingListItemDTO, RecipeReferenceDTO } from "../../types";
import { NotFoundError } from "../errors";

/**
 * Interface for required ingredient from recipe
 */
interface RequiredIngredient {
  product_id: number;
  required_quantity: number;
  unit_id: number;
  product_name: string;
  unit_name: string;
  unit_abbreviation: string;
}

/**
 * Interface for available item in fridge
 */
interface AvailableItem {
  product_id: number;
  unit_id: number;
  available_quantity: number;
}

/**
 * ShoppingListService class
 * All methods require SupabaseClient instance with authenticated user context
 */
export class ShoppingListService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Generates shopping list for a recipe
   *
   * @param userId - User ID from authenticated session
   * @param recipeId - Recipe ID to generate shopping list for
   * @returns Shopping list with missing ingredients
   * @throws NotFoundError if recipe not found or doesn't belong to user
   */
  async generateShoppingList(userId: string, recipeId: number): Promise<ShoppingListResponseDTO> {
    // Step 1: Fetch and verify recipe ownership
    const recipe = await this.fetchRecipe(userId, recipeId);

    // Step 2: Fetch recipe ingredients
    const requiredIngredients = await this.fetchRecipeIngredients(recipeId);

    // Step 3: Fetch user's fridge contents (only for needed products)
    const productIds = requiredIngredients.map((i) => i.product_id);
    const fridgeContents = await this.fetchFridgeContents(userId, productIds);

    // Step 4: Calculate missing quantities
    const missingIngredients = this.calculateMissingIngredients(requiredIngredients, fridgeContents);

    // Step 5: Build and return response
    return {
      recipe: {
        id: recipe.id,
        title: recipe.title,
      },
      missing_ingredients: missingIngredients,
      total_items: missingIngredients.length,
    };
  }

  /**
   * Fetches recipe and verifies it belongs to the user
   *
   * @param userId - User ID
   * @param recipeId - Recipe ID
   * @returns Recipe basic info
   * @throws NotFoundError if recipe not found or doesn't belong to user
   */
  private async fetchRecipe(userId: string, recipeId: number): Promise<RecipeReferenceDTO> {
    const { data, error } = await this.supabase
      .from("recipes")
      .select("id, title")
      .eq("id", recipeId)
      .eq("user_id", userId)
      .single();

    if (error || !data) {
      throw new NotFoundError("Recipe not found");
    }

    return data;
  }

  /**
   * Fetches all ingredients for a recipe with product and unit details
   *
   * @param recipeId - Recipe ID
   * @returns Array of required ingredients with details
   */
  private async fetchRecipeIngredients(recipeId: number): Promise<RequiredIngredient[]> {
    const { data, error } = await this.supabase
      .from("recipe_ingredients")
      .select(
        `
        product_id,
        quantity,
        unit_id,
        products!inner(name),
        units!inner(name, abbreviation)
      `
      )
      .eq("recipe_id", recipeId);

    if (error) {
      throw new Error(`Failed to fetch recipe ingredients: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Transform to RequiredIngredient format
    return data.map((row) => ({
      product_id: row.product_id,
      required_quantity: row.quantity,
      unit_id: row.unit_id,
      product_name: row.products.name,
      unit_name: row.units.name,
      unit_abbreviation: row.units.abbreviation,
    }));
  }

  /**
   * Fetches user's fridge contents for specific products
   * Uses aggregation to sum quantities of same product+unit combinations
   *
   * @param userId - User ID
   * @param productIds - Array of product IDs to filter by
   * @returns Map of "productId:unitId" -> available quantity
   */
  private async fetchFridgeContents(userId: string, productIds: number[]): Promise<Map<string, AvailableItem>> {
    // If no products needed, return empty map
    if (productIds.length === 0) {
      return new Map();
    }

    const { data, error } = await this.supabase
      .from("user_products")
      .select("product_id, unit_id, quantity")
      .eq("user_id", userId)
      .in("product_id", productIds);

    if (error) {
      throw new Error(`Failed to fetch fridge contents: ${error.message}`);
    }

    // Aggregate quantities for same product+unit combinations
    const aggregatedMap = new Map<string, AvailableItem>();

    if (data) {
      for (const row of data) {
        const key = `${row.product_id}:${row.unit_id}`;
        const existing = aggregatedMap.get(key);

        if (existing) {
          // Sum quantities if multiple entries exist
          existing.available_quantity += row.quantity;
        } else {
          aggregatedMap.set(key, {
            product_id: row.product_id,
            unit_id: row.unit_id,
            available_quantity: row.quantity,
          });
        }
      }
    }

    return aggregatedMap;
  }

  /**
   * Calculates missing ingredients by comparing required vs available
   *
   * Algorithm:
   * 1. For each required ingredient, find matching fridge item (product_id + unit_id)
   * 2. Calculate available quantity (0 if not found)
   * 3. Calculate missing quantity = max(0, required - available)
   * 4. Include in result only if missing_quantity > 0
   * 5. Sort by missing_quantity DESC (most critical first)
   *
   * @param required - Array of required ingredients from recipe
   * @param available - Map of available items in fridge
   * @returns Array of shopping list items (only missing ingredients)
   */
  private calculateMissingIngredients(
    required: RequiredIngredient[],
    available: Map<string, AvailableItem>
  ): ShoppingListItemDTO[] {
    const missingList: ShoppingListItemDTO[] = [];

    for (const req of required) {
      // Create lookup key: "productId:unitId"
      const key = `${req.product_id}:${req.unit_id}`;
      const avail = available.get(key);

      // Calculate available and missing quantities
      const availableQty = avail ? avail.available_quantity : 0;
      const missingQty = Math.max(0, req.required_quantity - availableQty);

      // Only add to shopping list if something is missing
      if (missingQty > 0) {
        missingList.push({
          product: {
            id: req.product_id,
            name: req.product_name,
          },
          required_quantity: req.required_quantity,
          available_quantity: availableQty,
          missing_quantity: missingQty,
          unit: {
            id: req.unit_id,
            name: req.unit_name,
            abbreviation: req.unit_abbreviation,
          },
        });
      }
    }

    // Sort by missing_quantity DESC - most critical items first
    missingList.sort((a, b) => b.missing_quantity - a.missing_quantity);

    return missingList;
  }
}
