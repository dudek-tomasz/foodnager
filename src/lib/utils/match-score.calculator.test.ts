/**
 * Unit tests for MatchScoreCalculator
 *
 * Tests cover:
 * - Basic score calculation logic
 * - Edge cases (empty inputs, zero quantities)
 * - Unit matching and conversion scenarios
 * - Business rules (fully available, partially available, missing)
 * - Score calculation formulas
 */

import { describe, it, expect, beforeEach } from "vitest";
import { MatchScoreCalculator, matchScoreCalculator, type MatchScoreResult } from "./match-score.calculator";
import type { RecipeIngredientDTO, FridgeItemDTO, ProductReferenceDTO, UnitReferenceDTO } from "@/types";

describe("MatchScoreCalculator", () => {
  let calculator: MatchScoreCalculator;

  beforeEach(() => {
    calculator = new MatchScoreCalculator();
  });

  // ==========================================================================
  // HELPER FACTORIES
  // ==========================================================================

  const createProduct = (id: number, name: string): ProductReferenceDTO => ({
    id,
    name,
  });

  const createUnit = (id: number, name: string, abbreviation: string): UnitReferenceDTO => ({
    id,
    name,
    abbreviation,
  });

  const createRecipeIngredient = (
    productId: number,
    productName: string,
    quantity: number,
    unitId: number,
    unitName: string,
    unitAbbr: string
  ): RecipeIngredientDTO => ({
    product: createProduct(productId, productName),
    quantity,
    unit: createUnit(unitId, unitName, unitAbbr),
  });

  const createFridgeItem = (
    id: number,
    productId: number,
    productName: string,
    quantity: number,
    unitId: number,
    unitName: string,
    unitAbbr: string,
    expiryDate: string | null = null
  ): FridgeItemDTO => ({
    id,
    product: createProduct(productId, productName),
    quantity,
    unit: createUnit(unitId, unitName, unitAbbr),
    expiry_date: expiryDate,
    created_at: new Date().toISOString(),
  });

  // ==========================================================================
  // EDGE CASES - Empty Inputs
  // ==========================================================================

  describe("Edge Cases - Empty Inputs", () => {
    it("should return score 0 when recipe has no ingredients", () => {
      // Arrange
      const recipeIngredients: RecipeIngredientDTO[] = [];
      const fridgeItems: FridgeItemDTO[] = [createFridgeItem(1, 1, "Mąka", 1000, 1, "gram", "g")];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      expect(result.score).toBe(0);
      expect(result.available_ingredients).toHaveLength(0);
      expect(result.missing_ingredients).toHaveLength(0);
    });

    it("should return score 0 when fridge is empty and recipe has ingredients", () => {
      // Arrange
      const recipeIngredients: RecipeIngredientDTO[] = [
        createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g"),
        createRecipeIngredient(2, "Jajka", 3, 2, "sztuka", "szt"),
      ];
      const fridgeItems: FridgeItemDTO[] = [];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      expect(result.score).toBe(0);
      expect(result.available_ingredients).toHaveLength(0);
      expect(result.missing_ingredients).toHaveLength(2);
      expect(result.missing_ingredients[0].product_id).toBe(1);
      expect(result.missing_ingredients[0].available_quantity).toBe(0);
      expect(result.missing_ingredients[1].product_id).toBe(2);
    });

    it("should return score 0 when both recipe and fridge are empty", () => {
      // Arrange
      const recipeIngredients: RecipeIngredientDTO[] = [];
      const fridgeItems: FridgeItemDTO[] = [];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      expect(result.score).toBe(0);
      expect(result.available_ingredients).toHaveLength(0);
      expect(result.missing_ingredients).toHaveLength(0);
    });
  });

  // ==========================================================================
  // PERFECT MATCH - All ingredients fully available
  // ==========================================================================

  describe("Perfect Match Scenarios", () => {
    it("should return score 1.0 when all ingredients are fully available with exact quantities", () => {
      // Arrange
      const recipeIngredients: RecipeIngredientDTO[] = [
        createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g"),
        createRecipeIngredient(2, "Jajka", 3, 2, "sztuka", "szt"),
        createRecipeIngredient(3, "Mleko", 250, 3, "mililitr", "ml"),
      ];

      const fridgeItems: FridgeItemDTO[] = [
        createFridgeItem(1, 1, "Mąka", 500, 1, "gram", "g"),
        createFridgeItem(2, 2, "Jajka", 3, 2, "sztuka", "szt"),
        createFridgeItem(3, 3, "Mleko", 250, 3, "mililitr", "ml"),
      ];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      expect(result.score).toBe(1.0);
      expect(result.available_ingredients).toHaveLength(3);
      expect(result.missing_ingredients).toHaveLength(0);

      // Verify all ingredients are marked as available
      expect(result.available_ingredients[0].product_id).toBe(1);
      expect(result.available_ingredients[0].available_quantity).toBe(500);
      expect(result.available_ingredients[1].product_id).toBe(2);
      expect(result.available_ingredients[2].product_id).toBe(3);
    });

    it("should return score 1.0 when all ingredients are available with surplus quantities", () => {
      // Arrange
      const recipeIngredients: RecipeIngredientDTO[] = [
        createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g"),
        createRecipeIngredient(2, "Jajka", 3, 2, "sztuka", "szt"),
      ];

      const fridgeItems: FridgeItemDTO[] = [
        createFridgeItem(1, 1, "Mąka", 1000, 1, "gram", "g"), // Surplus
        createFridgeItem(2, 2, "Jajka", 6, 2, "sztuka", "szt"), // Surplus
      ];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      expect(result.score).toBe(1.0);
      expect(result.available_ingredients).toHaveLength(2);
      expect(result.missing_ingredients).toHaveLength(0);
      expect(result.available_ingredients[0].available_quantity).toBe(1000);
      expect(result.available_ingredients[1].available_quantity).toBe(6);
    });
  });

  // ==========================================================================
  // NO MATCH - All ingredients missing
  // ==========================================================================

  describe("No Match Scenarios", () => {
    it("should return score 0 when all ingredients are completely missing", () => {
      // Arrange
      const recipeIngredients: RecipeIngredientDTO[] = [
        createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g"),
        createRecipeIngredient(2, "Jajka", 3, 2, "sztuka", "szt"),
      ];

      const fridgeItems: FridgeItemDTO[] = [
        createFridgeItem(1, 10, "Cukier", 200, 1, "gram", "g"), // Different product
        createFridgeItem(2, 11, "Masło", 100, 1, "gram", "g"), // Different product
      ];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      expect(result.score).toBe(0);
      expect(result.available_ingredients).toHaveLength(0);
      expect(result.missing_ingredients).toHaveLength(2);
      expect(result.missing_ingredients[0].product_id).toBe(1);
      expect(result.missing_ingredients[0].required_quantity).toBe(500);
      expect(result.missing_ingredients[0].available_quantity).toBe(0);
      expect(result.missing_ingredients[1].product_id).toBe(2);
    });
  });

  // ==========================================================================
  // PARTIAL MATCH - Some ingredients available, some missing
  // ==========================================================================

  describe("Partial Match Scenarios", () => {
    it("should return score 0.5 when half of ingredients are fully available", () => {
      // Arrange
      const recipeIngredients: RecipeIngredientDTO[] = [
        createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g"),
        createRecipeIngredient(2, "Jajka", 3, 2, "sztuka", "szt"),
      ];

      const fridgeItems: FridgeItemDTO[] = [
        createFridgeItem(1, 1, "Mąka", 500, 1, "gram", "g"),
        // Jajka missing
      ];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      expect(result.score).toBe(0.5); // 1 of 2 = 50%
      expect(result.available_ingredients).toHaveLength(1);
      expect(result.missing_ingredients).toHaveLength(1);
      expect(result.available_ingredients[0].product_id).toBe(1);
      expect(result.missing_ingredients[0].product_id).toBe(2);
    });

    it("should calculate score correctly with mix of available and missing ingredients", () => {
      // Arrange - 3 ingredients: 2 available, 1 missing
      const recipeIngredients: RecipeIngredientDTO[] = [
        createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g"),
        createRecipeIngredient(2, "Jajka", 3, 2, "sztuka", "szt"),
        createRecipeIngredient(3, "Mleko", 250, 3, "mililitr", "ml"),
      ];

      const fridgeItems: FridgeItemDTO[] = [
        createFridgeItem(1, 1, "Mąka", 500, 1, "gram", "g"),
        createFridgeItem(2, 2, "Jajka", 3, 2, "sztuka", "szt"),
        // Mleko missing
      ];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      // Score = (2 fully available + 0 partially) / 3 = 2/3 ≈ 0.667
      expect(result.score).toBeCloseTo(0.667, 2);
      expect(result.available_ingredients).toHaveLength(2);
      expect(result.missing_ingredients).toHaveLength(1);
      expect(result.missing_ingredients[0].product_id).toBe(3);
    });
  });

  // ==========================================================================
  // INSUFFICIENT QUANTITY - Product exists but not enough
  // ==========================================================================

  describe("Insufficient Quantity Scenarios", () => {
    it("should treat insufficient quantity as partially available (0.5 credit)", () => {
      // Arrange - Need 500g, have only 200g
      const recipeIngredients: RecipeIngredientDTO[] = [createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g")];

      const fridgeItems: FridgeItemDTO[] = [
        createFridgeItem(1, 1, "Mąka", 200, 1, "gram", "g"), // Insufficient
      ];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      // Score = (0 fully + 1 * 0.5 partially) / 1 = 0.5
      expect(result.score).toBe(0.5);
      expect(result.available_ingredients).toHaveLength(1);
      expect(result.missing_ingredients).toHaveLength(1);

      // Check available ingredient info
      expect(result.available_ingredients[0].product_id).toBe(1);
      expect(result.available_ingredients[0].required_quantity).toBe(500);
      expect(result.available_ingredients[0].available_quantity).toBe(200);

      // Check missing ingredient info (missing 300g)
      expect(result.missing_ingredients[0].product_id).toBe(1);
      expect(result.missing_ingredients[0].required_quantity).toBe(300);
      expect(result.missing_ingredients[0].available_quantity).toBe(0);
    });

    it("should handle multiple ingredients with mixed sufficiency", () => {
      // Arrange
      // Mąka: need 500g, have 500g (fully available)
      // Jajka: need 6, have 3 (partially available)
      // Mleko: need 500ml, have 0ml (missing)
      const recipeIngredients: RecipeIngredientDTO[] = [
        createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g"),
        createRecipeIngredient(2, "Jajka", 6, 2, "sztuka", "szt"),
        createRecipeIngredient(3, "Mleko", 500, 3, "mililitr", "ml"),
      ];

      const fridgeItems: FridgeItemDTO[] = [
        createFridgeItem(1, 1, "Mąka", 500, 1, "gram", "g"),
        createFridgeItem(2, 2, "Jajka", 3, 2, "sztuka", "szt"),
      ];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      // Score = (1 fully + 1 * 0.5 partially + 0 missing) / 3 = 1.5 / 3 = 0.5
      expect(result.score).toBe(0.5);
      expect(result.available_ingredients).toHaveLength(2);
      expect(result.missing_ingredients).toHaveLength(2);

      // Mąka fully available
      expect(result.available_ingredients[0].product_id).toBe(1);
      expect(result.available_ingredients[0].available_quantity).toBe(500);

      // Jajka partially available
      expect(result.available_ingredients[1].product_id).toBe(2);
      expect(result.available_ingredients[1].available_quantity).toBe(3);

      // Jajka also in missing (need 3 more)
      expect(result.missing_ingredients[0].product_id).toBe(2);
      expect(result.missing_ingredients[0].required_quantity).toBe(3);

      // Mleko completely missing
      expect(result.missing_ingredients[1].product_id).toBe(3);
      expect(result.missing_ingredients[1].required_quantity).toBe(500);
      expect(result.missing_ingredients[1].available_quantity).toBe(0);
    });

    it("should handle edge case of zero quantity in fridge", () => {
      // Arrange
      const recipeIngredients: RecipeIngredientDTO[] = [createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g")];

      const fridgeItems: FridgeItemDTO[] = [
        createFridgeItem(1, 1, "Mąka", 0, 1, "gram", "g"), // Zero quantity
      ];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      // Zero quantity should be treated as insufficient (partially available)
      expect(result.score).toBe(0.5);
      expect(result.available_ingredients).toHaveLength(1);
      expect(result.missing_ingredients).toHaveLength(1);
      expect(result.available_ingredients[0].available_quantity).toBe(0);
      expect(result.missing_ingredients[0].required_quantity).toBe(500);
    });
  });

  // ==========================================================================
  // UNIT MISMATCH - Product exists but units don't match
  // ==========================================================================

  describe("Unit Mismatch Scenarios", () => {
    it("should treat unit mismatch as available with unit_mismatch flag", () => {
      // Arrange - Fridge has liters, recipe needs tablespoons
      const recipeIngredients: RecipeIngredientDTO[] = [createRecipeIngredient(1, "Olej", 2, 4, "łyżka", "łyżka")];

      const fridgeItems: FridgeItemDTO[] = [
        createFridgeItem(1, 1, "Olej", 1, 3, "litr", "L"), // Different unit
      ];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      // Should count as fully available for score calculation
      expect(result.score).toBe(1.0);
      expect(result.available_ingredients).toHaveLength(1);
      expect(result.missing_ingredients).toHaveLength(0);

      // Should have unit_mismatch flag
      expect(result.available_ingredients[0].unit_mismatch).toBe(true);
      expect(result.available_ingredients[0].fridge_unit).toBe("L");
      expect(result.available_ingredients[0].unit).toBe("łyżka");
      expect(result.available_ingredients[0].product_id).toBe(1);
    });

    it("should handle multiple ingredients with different unit scenarios", () => {
      // Arrange
      const recipeIngredients: RecipeIngredientDTO[] = [
        createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g"), // Same unit
        createRecipeIngredient(2, "Olej", 2, 4, "łyżka", "łyżka"), // Different unit
        createRecipeIngredient(3, "Sól", 5, 1, "gram", "g"), // Missing
      ];

      const fridgeItems: FridgeItemDTO[] = [
        createFridgeItem(1, 1, "Mąka", 500, 1, "gram", "g"),
        createFridgeItem(2, 2, "Olej", 1, 3, "litr", "L"), // Unit mismatch
      ];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      // Score = (2 fully available + 0 partially) / 3 = 2/3 ≈ 0.667
      expect(result.score).toBeCloseTo(0.667, 2);
      expect(result.available_ingredients).toHaveLength(2);
      expect(result.missing_ingredients).toHaveLength(1);

      // Mąka - matching units
      expect(result.available_ingredients[0].unit_mismatch).toBeUndefined();

      // Olej - unit mismatch
      expect(result.available_ingredients[1].unit_mismatch).toBe(true);
      expect(result.available_ingredients[1].fridge_unit).toBe("L");

      // Sól - missing
      expect(result.missing_ingredients[0].product_id).toBe(3);
    });
  });

  // ==========================================================================
  // SCORE CALCULATION FORMULAS
  // ==========================================================================

  describe("Score Calculation Formulas", () => {
    it("should calculate score using formula: (fully + 0.5*partially) / total", () => {
      // Arrange - Test the exact formula
      // 2 fully available, 2 partially available, 2 missing = 6 total
      const recipeIngredients: RecipeIngredientDTO[] = [
        createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g"), // Fully
        createRecipeIngredient(2, "Cukier", 200, 1, "gram", "g"), // Fully
        createRecipeIngredient(3, "Jajka", 6, 2, "sztuka", "szt"), // Partially
        createRecipeIngredient(4, "Mleko", 500, 3, "mililitr", "ml"), // Partially
        createRecipeIngredient(5, "Masło", 100, 1, "gram", "g"), // Missing
        createRecipeIngredient(6, "Sól", 5, 1, "gram", "g"), // Missing
      ];

      const fridgeItems: FridgeItemDTO[] = [
        createFridgeItem(1, 1, "Mąka", 500, 1, "gram", "g"),
        createFridgeItem(2, 2, "Cukier", 200, 1, "gram", "g"),
        createFridgeItem(3, 3, "Jajka", 3, 2, "sztuka", "szt"), // Half needed
        createFridgeItem(4, 4, "Mleko", 250, 3, "mililitr", "ml"), // Half needed
      ];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      // Formula: (2 + 2*0.5) / 6 = (2 + 1) / 6 = 3/6 = 0.5
      expect(result.score).toBe(0.5);
    });

    it("should clamp score between 0 and 1", () => {
      // Arrange - Normal case should never exceed 1, but test the clamping logic
      const recipeIngredients: RecipeIngredientDTO[] = [createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g")];

      const fridgeItems: FridgeItemDTO[] = [createFridgeItem(1, 1, "Mąka", 500, 1, "gram", "g")];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      expect(result.score).toBeGreaterThanOrEqual(0);
      expect(result.score).toBeLessThanOrEqual(1);
    });
  });

  // ==========================================================================
  // COMPLEX SCENARIOS
  // ==========================================================================

  describe("Complex Real-World Scenarios", () => {
    it("should handle recipe with many ingredients and complex availability", () => {
      // Arrange - Realistic recipe scenario
      const recipeIngredients: RecipeIngredientDTO[] = [
        createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g"),
        createRecipeIngredient(2, "Jajka", 4, 2, "sztuka", "szt"),
        createRecipeIngredient(3, "Mleko", 300, 3, "mililitr", "ml"),
        createRecipeIngredient(4, "Cukier", 100, 1, "gram", "g"),
        createRecipeIngredient(5, "Masło", 50, 1, "gram", "g"),
        createRecipeIngredient(6, "Sól", 5, 1, "gram", "g"),
        createRecipeIngredient(7, "Proszek do pieczenia", 10, 1, "gram", "g"),
      ];

      const fridgeItems: FridgeItemDTO[] = [
        createFridgeItem(1, 1, "Mąka", 1000, 1, "gram", "g"), // Available (surplus)
        createFridgeItem(2, 2, "Jajka", 2, 2, "sztuka", "szt"), // Partially (need 4, have 2)
        createFridgeItem(3, 3, "Mleko", 300, 3, "mililitr", "ml"), // Available (exact)
        createFridgeItem(4, 4, "Cukier", 50, 1, "gram", "g"), // Partially (need 100, have 50)
        createFridgeItem(5, 5, "Masło", 100, 1, "gram", "g"), // Available (surplus)
        // Sól missing
        // Proszek do pieczenia missing
      ];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      // 3 fully available (Mąka, Mleko, Masło)
      // 2 partially available (Jajka, Cukier)
      // 2 missing (Sól, Proszek)
      // Score = (3 + 2*0.5) / 7 = 4/7 ≈ 0.571
      expect(result.score).toBeCloseTo(0.571, 2);
      expect(result.available_ingredients).toHaveLength(5);
      expect(result.missing_ingredients).toHaveLength(4); // 2 partially + 2 fully missing
    });

    it("should handle duplicate products in fridge (last one wins in map)", () => {
      // Arrange - Edge case: same product twice in fridge
      const recipeIngredients: RecipeIngredientDTO[] = [createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g")];

      const fridgeItems: FridgeItemDTO[] = [
        createFridgeItem(1, 1, "Mąka", 200, 1, "gram", "g"), // First entry
        createFridgeItem(2, 1, "Mąka", 800, 1, "gram", "g"), // Second entry (same product)
      ];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      // Map will use last entry (800g), which is sufficient
      expect(result.score).toBe(1.0);
      expect(result.available_ingredients).toHaveLength(1);
      expect(result.available_ingredients[0].available_quantity).toBe(800);
    });
  });

  // ==========================================================================
  // STATIC HELPER METHOD - isGoodMatch
  // ==========================================================================

  describe("Static Helper - isGoodMatch", () => {
    it("should return true when score meets default threshold (0.7)", () => {
      // Arrange
      const result: MatchScoreResult = {
        score: 0.7,
        available_ingredients: [],
        missing_ingredients: [],
      };

      // Act & Assert
      expect(MatchScoreCalculator.isGoodMatch(result)).toBe(true);
    });

    it("should return false when score is below default threshold", () => {
      // Arrange
      const result: MatchScoreResult = {
        score: 0.69,
        available_ingredients: [],
        missing_ingredients: [],
      };

      // Act & Assert
      expect(MatchScoreCalculator.isGoodMatch(result)).toBe(false);
    });

    it("should use custom threshold when provided", () => {
      // Arrange
      const result: MatchScoreResult = {
        score: 0.5,
        available_ingredients: [],
        missing_ingredients: [],
      };

      // Act & Assert
      expect(MatchScoreCalculator.isGoodMatch(result, 0.5)).toBe(true);
      expect(MatchScoreCalculator.isGoodMatch(result, 0.6)).toBe(false);
    });

    it("should handle edge cases of 0 and 1", () => {
      // Arrange
      const perfectMatch: MatchScoreResult = {
        score: 1.0,
        available_ingredients: [],
        missing_ingredients: [],
      };

      const noMatch: MatchScoreResult = {
        score: 0.0,
        available_ingredients: [],
        missing_ingredients: [],
      };

      // Act & Assert
      expect(MatchScoreCalculator.isGoodMatch(perfectMatch)).toBe(true);
      expect(MatchScoreCalculator.isGoodMatch(noMatch)).toBe(false);
      expect(MatchScoreCalculator.isGoodMatch(noMatch, 0.0)).toBe(true);
    });
  });

  // ==========================================================================
  // SINGLETON INSTANCE
  // ==========================================================================

  describe("Singleton Instance", () => {
    it("should export a singleton instance for convenience", () => {
      // Arrange
      const recipeIngredients: RecipeIngredientDTO[] = [createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g")];

      const fridgeItems: FridgeItemDTO[] = [createFridgeItem(1, 1, "Mąka", 500, 1, "gram", "g")];

      // Act
      const result = matchScoreCalculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      expect(result.score).toBe(1.0);
      expect(matchScoreCalculator).toBeInstanceOf(MatchScoreCalculator);
    });
  });

  // ==========================================================================
  // AVAILABLE/MISSING INGREDIENT STRUCTURE VALIDATION
  // ==========================================================================

  describe("AvailableIngredientDTO Structure Validation", () => {
    it("should return correct structure for available ingredients", () => {
      // Arrange
      const recipeIngredients: RecipeIngredientDTO[] = [createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g")];

      const fridgeItems: FridgeItemDTO[] = [createFridgeItem(1, 1, "Mąka", 800, 1, "gram", "g")];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      expect(result.available_ingredients[0]).toEqual({
        product_id: 1,
        product_name: "Mąka",
        required_quantity: 500,
        available_quantity: 800,
        unit: "g",
      });
    });

    it("should return correct structure for missing ingredients", () => {
      // Arrange
      const recipeIngredients: RecipeIngredientDTO[] = [createRecipeIngredient(1, "Mąka", 500, 1, "gram", "g")];

      const fridgeItems: FridgeItemDTO[] = [];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      expect(result.missing_ingredients[0]).toEqual({
        product_id: 1,
        product_name: "Mąka",
        required_quantity: 500,
        available_quantity: 0,
        unit: "g",
      });
    });

    it("should return correct structure for unit mismatch scenario", () => {
      // Arrange
      const recipeIngredients: RecipeIngredientDTO[] = [createRecipeIngredient(1, "Olej", 2, 4, "łyżka", "łyżka")];

      const fridgeItems: FridgeItemDTO[] = [createFridgeItem(1, 1, "Olej", 1, 3, "litr", "L")];

      // Act
      const result = calculator.calculate(recipeIngredients, fridgeItems);

      // Assert
      expect(result.available_ingredients[0]).toEqual({
        product_id: 1,
        product_name: "Olej",
        required_quantity: 2,
        available_quantity: 1,
        unit: "łyżka",
        unit_mismatch: true,
        fridge_unit: "L",
      });
    });
  });
});
