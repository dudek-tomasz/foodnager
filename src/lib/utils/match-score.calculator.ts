/**
 * Match Score Calculator
 * 
 * Calculates how well a recipe matches available fridge items.
 * Score is based on:
 * - Percentage of ingredients available
 * - Quantity sufficiency (do we have enough of each ingredient)
 */

import type { 
  RecipeIngredientDTO, 
  FridgeItemDTO,
  AvailableIngredientDTO 
} from '@/types';

export interface MatchScoreResult {
  score: number; // 0.0 - 1.0
  available_ingredients: AvailableIngredientDTO[];
  missing_ingredients: AvailableIngredientDTO[];
}

export interface FridgeItemMap {
  [productId: number]: FridgeItemDTO;
}

/**
 * MatchScoreCalculator
 * 
 * Calculates match score between recipe ingredients and available fridge items.
 */
export class MatchScoreCalculator {
  /**
   * Calculate match score for a recipe against available fridge items
   * 
   * @param recipeIngredients - List of ingredients required by the recipe
   * @param availableFridgeItems - List of items currently in the fridge
   * @returns Match score result with available and missing ingredients
   */
  calculate(
    recipeIngredients: RecipeIngredientDTO[],
    availableFridgeItems: FridgeItemDTO[]
  ): MatchScoreResult {
    // Create a map of fridge items by product ID for quick lookup
    const fridgeMap = this.createFridgeMap(availableFridgeItems);
    
    const available: AvailableIngredientDTO[] = [];
    const missing: AvailableIngredientDTO[] = [];
    
    let totalIngredients = recipeIngredients.length;
    let fullyAvailableCount = 0; // Ingredients with sufficient quantity
    let partiallyAvailableCount = 0; // Ingredients present but insufficient quantity
    
    // Check each recipe ingredient against fridge
    for (const ingredient of recipeIngredients) {
      const fridgeItem = fridgeMap[ingredient.product.id];
      const requiredQuantity = ingredient.quantity;
      
      if (fridgeItem) {
        // Product exists in fridge
        const availableQuantity = fridgeItem.quantity;
        
        // Check if units match (simple comparison for now)
        const unitsMatch = this.unitsMatch(ingredient.unit.id, fridgeItem.unit.id);
        
        if (unitsMatch) {
          const ingredientInfo: AvailableIngredientDTO = {
            product_id: ingredient.product.id,
            product_name: ingredient.product.name,
            required_quantity: requiredQuantity,
            available_quantity: availableQuantity,
            unit: ingredient.unit.abbreviation
          };
          
          if (availableQuantity >= requiredQuantity) {
            // Sufficient quantity available
            available.push(ingredientInfo);
            fullyAvailableCount++;
          } else {
            // Insufficient quantity (partially available)
            available.push(ingredientInfo);
            missing.push({
              ...ingredientInfo,
              available_quantity: 0,
              required_quantity: requiredQuantity - availableQuantity
            });
            partiallyAvailableCount++;
          }
        } else {
          // Units don't match - treat as missing
          missing.push({
            product_id: ingredient.product.id,
            product_name: ingredient.product.name,
            required_quantity: requiredQuantity,
            available_quantity: 0,
            unit: ingredient.unit.abbreviation
          });
        }
      } else {
        // Product not in fridge at all
        missing.push({
          product_id: ingredient.product.id,
          product_name: ingredient.product.name,
          required_quantity: requiredQuantity,
          available_quantity: 0,
          unit: ingredient.unit.abbreviation
        });
      }
    }
    
    // Calculate score
    // Formula: (fully_available + 0.5 * partially_available) / total
    // This gives full credit for sufficient ingredients, half credit for present but insufficient
    const score = totalIngredients > 0 
      ? (fullyAvailableCount + (partiallyAvailableCount * 0.5)) / totalIngredients 
      : 0;
    
    return {
      score: Math.max(0, Math.min(1, score)), // Clamp between 0 and 1
      available_ingredients: available,
      missing_ingredients: missing
    };
  }
  
  /**
   * Create a map of fridge items indexed by product ID
   */
  private createFridgeMap(fridgeItems: FridgeItemDTO[]): FridgeItemMap {
    const map: FridgeItemMap = {};
    for (const item of fridgeItems) {
      map[item.product.id] = item;
    }
    return map;
  }
  
  /**
   * Check if two units match
   * 
   * For now, this is a simple ID comparison.
   * In a more sophisticated implementation, this could handle unit conversions
   * (e.g., kg to g, liters to ml, etc.)
   */
  private unitsMatch(unitId1: number, unitId2: number): boolean {
    return unitId1 === unitId2;
  }
  
  /**
   * Static helper to check if a match result is considered "good"
   * A good match is typically when score >= threshold (e.g., 0.7)
   */
  static isGoodMatch(result: MatchScoreResult, threshold: number = 0.7): boolean {
    return result.score >= threshold;
  }
}

/**
 * Export singleton instance for convenience
 */
export const matchScoreCalculator = new MatchScoreCalculator();

