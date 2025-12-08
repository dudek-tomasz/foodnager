/**
 * Unit tests for Recipe View Mappers
 *
 * Tests cover:
 * - mapRecipeFormDataToCreateDTO - transformation to create DTO
 * - mapRecipeFormDataToUpdateDTO - transformation to update DTO
 * - mapRecipeDTOToFormData - transformation from DTO to form data
 * - calculateRecipeStats - statistics calculation
 * - createEmptyRecipeFormData - factory for empty form
 * - createEmptyIngredientFormData - factory for empty ingredient
 *
 * Business rules tested:
 * - String trimming for title, description, instructions
 * - Empty description converts to null
 * - Empty tagIds array converts to undefined (for CreateDTO)
 * - Ingredients mapping with proper field name transformation
 * - Non-assertive null handling in productId and unitId
 * - Statistics calculation by source type
 * - Unique ID generation for ingredients
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  mapRecipeFormDataToCreateDTO,
  mapRecipeFormDataToUpdateDTO,
  mapRecipeDTOToFormData,
  calculateRecipeStats,
  createEmptyRecipeFormData,
  createEmptyIngredientFormData,
} from "./recipe-view.mapper";
import type { RecipeFormData } from "@/components/recipes/types";
import type {
  RecipeSummaryDTO,
  RecipeDTO,
  RecipeIngredientDTO,
  ProductReferenceDTO,
  UnitReferenceDTO,
  TagDTO,
} from "@/types";

// =============================================================================
// HELPER FACTORIES
// =============================================================================

const createProduct = (id: number, name: string): ProductReferenceDTO => ({
  id,
  name,
});

const createUnit = (id: number, name: string, abbreviation: string): UnitReferenceDTO => ({
  id,
  name,
  abbreviation,
});

const createTag = (id: number, name: string): TagDTO => ({
  id,
  name,
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

const createRecipeSummaryDTO = (overrides?: Partial<RecipeSummaryDTO>): RecipeSummaryDTO => ({
  id: 1,
  title: "Test Recipe",
  description: "Test description",
  instructions: "Test instructions",
  cooking_time: 30,
  difficulty: "easy",
  source: "user",
  tags: [],
  ingredients: [],
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
  ...overrides,
});

const createRecipeDTO = (overrides?: Partial<RecipeDTO>): RecipeDTO => ({
  ...createRecipeSummaryDTO(overrides),
  metadata: null,
  ...overrides,
});

const createRecipeFormData = (overrides?: Partial<RecipeFormData>): RecipeFormData => ({
  title: "Test Recipe",
  description: "Test description",
  instructions: "Test instructions",
  cookingTime: 30,
  difficulty: "easy",
  ingredients: [],
  tagIds: [],
  ...overrides,
});

// =============================================================================
// mapRecipeFormDataToCreateDTO
// =============================================================================

describe("mapRecipeFormDataToCreateDTO", () => {
  describe("happy path", () => {
    it("should map complete form data to create DTO", () => {
      // Arrange
      const formData = createRecipeFormData({
        title: "Pasta Carbonara",
        description: "Delicious Italian pasta",
        instructions: "Cook pasta, add sauce",
        cookingTime: 20,
        difficulty: "medium",
        ingredients: [
          {
            id: "ing-1",
            productId: 1,
            productName: "Pasta",
            quantity: 200,
            unitId: 1,
          },
          {
            id: "ing-2",
            productId: 2,
            productName: "Eggs",
            quantity: 2,
            unitId: 2,
          },
        ],
        tagIds: [1, 2, 3],
      });

      // Act
      const result = mapRecipeFormDataToCreateDTO(formData);

      // Assert
      expect(result).toEqual({
        title: "Pasta Carbonara",
        description: "Delicious Italian pasta",
        instructions: "Cook pasta, add sauce",
        cooking_time: 20,
        difficulty: "medium",
        ingredients: [
          { product_id: 1, quantity: 200, unit_id: 1 },
          { product_id: 2, quantity: 2, unit_id: 2 },
        ],
        tag_ids: [1, 2, 3],
      });
    });

    it("should trim whitespace from title, description, and instructions", () => {
      // Arrange
      const formData = createRecipeFormData({
        title: "  Pasta Carbonara  ",
        description: "  Delicious Italian pasta  ",
        instructions: "  Cook pasta, add sauce  ",
      });

      // Act
      const result = mapRecipeFormDataToCreateDTO(formData);

      // Assert
      expect(result.title).toBe("Pasta Carbonara");
      expect(result.description).toBe("Delicious Italian pasta");
      expect(result.instructions).toBe("Cook pasta, add sauce");
    });

    it("should convert empty description to null", () => {
      // Arrange
      const formData = createRecipeFormData({
        description: "",
      });

      // Act
      const result = mapRecipeFormDataToCreateDTO(formData);

      // Assert
      expect(result.description).toBeNull();
    });

    it("should convert whitespace-only description to null", () => {
      // Arrange
      const formData = createRecipeFormData({
        description: "   ",
      });

      // Act
      const result = mapRecipeFormDataToCreateDTO(formData);

      // Assert
      expect(result.description).toBeNull();
    });

    it("should map null cookingTime and difficulty correctly", () => {
      // Arrange
      const formData = createRecipeFormData({
        cookingTime: null,
        difficulty: null,
      });

      // Act
      const result = mapRecipeFormDataToCreateDTO(formData);

      // Assert
      expect(result.cooking_time).toBeNull();
      expect(result.difficulty).toBeNull();
    });

    it("should not include tag_ids when array is empty", () => {
      // Arrange
      const formData = createRecipeFormData({
        tagIds: [],
      });

      // Act
      const result = mapRecipeFormDataToCreateDTO(formData);

      // Assert
      expect(result.tag_ids).toBeUndefined();
    });

    it("should map ingredients with correct field name transformations", () => {
      // Arrange
      const formData = createRecipeFormData({
        ingredients: [
          {
            id: "ing-1",
            productId: 10,
            productName: "Flour",
            quantity: 500,
            unitId: 5,
          },
        ],
      });

      // Act
      const result = mapRecipeFormDataToCreateDTO(formData);

      // Assert
      expect(result.ingredients).toEqual([{ product_id: 10, quantity: 500, unit_id: 5 }]);
    });
  });

  describe("edge cases", () => {
    it("should handle empty ingredients array", () => {
      // Arrange
      const formData = createRecipeFormData({
        ingredients: [],
      });

      // Act
      const result = mapRecipeFormDataToCreateDTO(formData);

      // Assert
      expect(result.ingredients).toEqual([]);
    });

    it("should handle multiple ingredients", () => {
      // Arrange
      const formData = createRecipeFormData({
        ingredients: [
          {
            id: "ing-1",
            productId: 1,
            productName: "Product 1",
            quantity: 100,
            unitId: 1,
          },
          {
            id: "ing-2",
            productId: 2,
            productName: "Product 2",
            quantity: 200,
            unitId: 2,
          },
          {
            id: "ing-3",
            productId: 3,
            productName: "Product 3",
            quantity: 300,
            unitId: 3,
          },
        ],
      });

      // Act
      const result = mapRecipeFormDataToCreateDTO(formData);

      // Assert
      expect(result.ingredients).toHaveLength(3);
      expect(result.ingredients[0]).toEqual({
        product_id: 1,
        quantity: 100,
        unit_id: 1,
      });
      expect(result.ingredients[2]).toEqual({
        product_id: 3,
        quantity: 300,
        unit_id: 3,
      });
    });

    it("should handle zero cooking time", () => {
      // Arrange
      const formData = createRecipeFormData({
        cookingTime: 0,
      });

      // Act
      const result = mapRecipeFormDataToCreateDTO(formData);

      // Assert
      expect(result.cooking_time).toBe(0);
    });

    it("should preserve productId and unitId even though they use non-null assertion", () => {
      // Arrange
      const formData = createRecipeFormData({
        ingredients: [
          {
            id: "ing-1",
            productId: 5,
            productName: "Test Product",
            quantity: 150,
            unitId: 7,
          },
        ],
      });

      // Act
      const result = mapRecipeFormDataToCreateDTO(formData);

      // Assert
      expect(result.ingredients[0].product_id).toBe(5);
      expect(result.ingredients[0].unit_id).toBe(7);
    });

    it("should handle very long strings in title, description, instructions", () => {
      // Arrange
      const longString = "a".repeat(1000);
      const formData = createRecipeFormData({
        title: longString,
        description: longString,
        instructions: longString,
      });

      // Act
      const result = mapRecipeFormDataToCreateDTO(formData);

      // Assert
      expect(result.title).toBe(longString);
      expect(result.description).toBe(longString);
      expect(result.instructions).toBe(longString);
    });

    it("should handle special characters in strings", () => {
      // Arrange
      const formData = createRecipeFormData({
        title: 'Recipe with "quotes" & <symbols>',
        description: "Contains newlines\n\nand tabs\t\there",
        instructions: "Step 1:\nBoil water\nStep 2:\nAdd pasta",
      });

      // Act
      const result = mapRecipeFormDataToCreateDTO(formData);

      // Assert
      expect(result.title).toBe('Recipe with "quotes" & <symbols>');
      expect(result.description).toBe("Contains newlines\n\nand tabs\t\there");
      expect(result.instructions).toBe("Step 1:\nBoil water\nStep 2:\nAdd pasta");
    });
  });
});

// =============================================================================
// mapRecipeFormDataToUpdateDTO
// =============================================================================

describe("mapRecipeFormDataToUpdateDTO", () => {
  describe("happy path", () => {
    it("should map complete form data to update DTO", () => {
      // Arrange
      const formData = createRecipeFormData({
        title: "Updated Recipe",
        description: "Updated description",
        instructions: "Updated instructions",
        cookingTime: 45,
        difficulty: "hard",
        ingredients: [
          {
            id: "ing-1",
            productId: 10,
            productName: "Ingredient",
            quantity: 100,
            unitId: 5,
          },
        ],
        tagIds: [5, 6],
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      expect(result).toEqual({
        title: "Updated Recipe",
        description: "Updated description",
        instructions: "Updated instructions",
        cooking_time: 45,
        difficulty: "hard",
        ingredients: [{ product_id: 10, quantity: 100, unit_id: 5 }],
        tag_ids: [5, 6],
      });
    });

    it("should only include fields that are present", () => {
      // Arrange
      const formData = createRecipeFormData({
        title: "Only title",
        description: "",
        instructions: "",
        cookingTime: null,
        difficulty: null,
        ingredients: [],
        tagIds: [],
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      expect(result.title).toBe("Only title");
      // description !== undefined, so it should be included and converted to null
      expect(result.description).toBeNull();
      // instructions is empty string (falsy), so it won't be included
      expect(result.instructions).toBeUndefined();
      // cookingTime is null, so it won't be included (condition is !== null)
      expect(result.cooking_time).toBeUndefined();
      // difficulty is null, so it won't be included (condition is !== null)
      expect(result.difficulty).toBeUndefined();
      // Empty arrays should not be included
      expect(result.ingredients).toBeUndefined();
      expect(result.tag_ids).toBeUndefined();
    });

    it("should trim whitespace from title, description, and instructions", () => {
      // Arrange
      const formData = createRecipeFormData({
        title: "  Trimmed Title  ",
        description: "  Trimmed Description  ",
        instructions: "  Trimmed Instructions  ",
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      expect(result.title).toBe("Trimmed Title");
      expect(result.description).toBe("Trimmed Description");
      expect(result.instructions).toBe("Trimmed Instructions");
    });

    it("should convert empty description to null", () => {
      // Arrange
      const formData = createRecipeFormData({
        description: "",
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      expect(result.description).toBeNull();
    });

    it("should convert whitespace-only description to null", () => {
      // Arrange
      const formData = createRecipeFormData({
        description: "   ",
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      expect(result.description).toBeNull();
    });

    it("should include cooking_time when it is 0", () => {
      // Arrange
      const formData = createRecipeFormData({
        cookingTime: 0,
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      expect(result.cooking_time).toBe(0);
    });

    it("should not include ingredients when array is empty", () => {
      // Arrange
      const formData = createRecipeFormData({
        ingredients: [],
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      expect(result.ingredients).toBeUndefined();
    });

    it("should not include tag_ids when array is empty", () => {
      // Arrange
      const formData = createRecipeFormData({
        tagIds: [],
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      expect(result.tag_ids).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    it("should handle partial updates with only title", () => {
      // Arrange
      const formData = createRecipeFormData({
        title: "New Title",
        description: "",
        instructions: "",
        cookingTime: null,
        difficulty: null,
        ingredients: [],
        tagIds: [],
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      expect(result).toHaveProperty("title");
      expect(Object.keys(result)).toContain("title");
    });

    it("should handle all fields being empty/null", () => {
      // Arrange
      const formData = createRecipeFormData({
        title: "",
        description: "",
        instructions: "",
        cookingTime: null,
        difficulty: null,
        ingredients: [],
        tagIds: [],
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      // title is empty string (falsy), so it won't be included
      expect(result.title).toBeUndefined();
      // description !== undefined, so it will be included and converted to null
      expect(result.description).toBeNull();
      // instructions is empty string (falsy), so it won't be included
      expect(result.instructions).toBeUndefined();
      // cookingTime and difficulty are null, so they won't be included
      expect(result.cooking_time).toBeUndefined();
      expect(result.difficulty).toBeUndefined();
    });

    it("should map ingredients with proper field transformations", () => {
      // Arrange
      const formData = createRecipeFormData({
        ingredients: [
          {
            id: "ing-1",
            productId: 20,
            productName: "Sugar",
            quantity: 50,
            unitId: 3,
          },
          {
            id: "ing-2",
            productId: 21,
            productName: "Salt",
            quantity: 10,
            unitId: 3,
          },
        ],
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      expect(result.ingredients).toEqual([
        { product_id: 20, quantity: 50, unit_id: 3 },
        { product_id: 21, quantity: 10, unit_id: 3 },
      ]);
    });

    it("should include difficulty when set to a valid value", () => {
      // Arrange
      const formData = createRecipeFormData({
        difficulty: "easy",
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      expect(result.difficulty).toBe("easy");
    });

    it("should not include cooking_time when set to null explicitly", () => {
      // Arrange
      const formData = createRecipeFormData({
        cookingTime: null,
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      // cookingTime is null, so condition (cookingTime !== null) is false
      expect(result.cooking_time).toBeUndefined();
    });
  });

  describe("conditional field inclusion logic", () => {
    it("should include title when truthy", () => {
      // Arrange
      const formData = createRecipeFormData({
        title: "Title",
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      expect(result).toHaveProperty("title");
    });

    it("should include description when defined (even if empty)", () => {
      // Arrange
      const formData = createRecipeFormData({
        description: "",
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      expect(result).toHaveProperty("description");
      expect(result.description).toBeNull();
    });

    it("should include instructions when truthy", () => {
      // Arrange
      const formData = createRecipeFormData({
        instructions: "Some instructions",
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      expect(result).toHaveProperty("instructions");
    });

    it("should include cookingTime when not null", () => {
      // Arrange
      const formData = createRecipeFormData({
        cookingTime: 15,
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      expect(result).toHaveProperty("cooking_time");
    });

    it("should include difficulty when not null", () => {
      // Arrange
      const formData = createRecipeFormData({
        difficulty: "medium",
      });

      // Act
      const result = mapRecipeFormDataToUpdateDTO(formData);

      // Assert
      expect(result).toHaveProperty("difficulty");
    });
  });
});

// =============================================================================
// mapRecipeDTOToFormData
// =============================================================================

describe("mapRecipeDTOToFormData", () => {
  describe("happy path", () => {
    it("should map RecipeSummaryDTO to RecipeFormData", () => {
      // Arrange
      const recipeDTO = createRecipeSummaryDTO({
        title: "Pizza Margherita",
        description: "Classic Italian pizza",
        instructions: "Make dough, add sauce, bake",
        cooking_time: 30,
        difficulty: "easy",
        ingredients: [
          createRecipeIngredient(1, "Flour", 500, 1, "gram", "g"),
          createRecipeIngredient(2, "Tomato", 3, 2, "piece", "pc"),
        ],
        tags: [createTag(1, "Italian"), createTag(2, "Vegetarian")],
      });

      // Act
      const result = mapRecipeDTOToFormData(recipeDTO);

      // Assert
      expect(result).toEqual({
        title: "Pizza Margherita",
        description: "Classic Italian pizza",
        instructions: "Make dough, add sauce, bake",
        cookingTime: 30,
        difficulty: "easy",
        ingredients: [
          {
            id: "ingredient-0",
            productId: 1,
            productName: "Flour",
            quantity: 500,
            unitId: 1,
          },
          {
            id: "ingredient-1",
            productId: 2,
            productName: "Tomato",
            quantity: 3,
            unitId: 2,
          },
        ],
        tagIds: [1, 2],
      });
    });

    it("should map RecipeDTO with metadata to RecipeFormData", () => {
      // Arrange
      const recipeDTO = createRecipeDTO({
        title: "Recipe with Metadata",
        description: "Has metadata",
        instructions: "Follow steps",
        cooking_time: 20,
        difficulty: "medium",
        metadata: { source_url: "https://example.com" },
        ingredients: [],
        tags: [],
      });

      // Act
      const result = mapRecipeDTOToFormData(recipeDTO);

      // Assert
      expect(result.title).toBe("Recipe with Metadata");
      expect(result.description).toBe("Has metadata");
    });

    it("should convert null description to empty string", () => {
      // Arrange
      const recipeDTO = createRecipeSummaryDTO({
        description: null,
      });

      // Act
      const result = mapRecipeDTOToFormData(recipeDTO);

      // Assert
      expect(result.description).toBe("");
    });

    it("should generate unique ingredient IDs based on index", () => {
      // Arrange
      const recipeDTO = createRecipeSummaryDTO({
        ingredients: [
          createRecipeIngredient(1, "Ingredient 1", 100, 1, "gram", "g"),
          createRecipeIngredient(2, "Ingredient 2", 200, 2, "liter", "l"),
          createRecipeIngredient(3, "Ingredient 3", 300, 3, "piece", "pc"),
        ],
      });

      // Act
      const result = mapRecipeDTOToFormData(recipeDTO);

      // Assert
      expect(result.ingredients[0].id).toBe("ingredient-0");
      expect(result.ingredients[1].id).toBe("ingredient-1");
      expect(result.ingredients[2].id).toBe("ingredient-2");
    });

    it("should extract tag IDs correctly", () => {
      // Arrange
      const recipeDTO = createRecipeSummaryDTO({
        tags: [createTag(10, "Tag 1"), createTag(20, "Tag 2"), createTag(30, "Tag 3")],
      });

      // Act
      const result = mapRecipeDTOToFormData(recipeDTO);

      // Assert
      expect(result.tagIds).toEqual([10, 20, 30]);
    });
  });

  describe("edge cases", () => {
    it("should handle recipe with no ingredients", () => {
      // Arrange
      const recipeDTO = createRecipeSummaryDTO({
        ingredients: [],
      });

      // Act
      const result = mapRecipeDTOToFormData(recipeDTO);

      // Assert
      expect(result.ingredients).toEqual([]);
    });

    it("should handle recipe with no tags", () => {
      // Arrange
      const recipeDTO = createRecipeSummaryDTO({
        tags: [],
      });

      // Act
      const result = mapRecipeDTOToFormData(recipeDTO);

      // Assert
      expect(result.tagIds).toEqual([]);
    });

    it("should handle null cooking_time", () => {
      // Arrange
      const recipeDTO = createRecipeSummaryDTO({
        cooking_time: null,
      });

      // Act
      const result = mapRecipeDTOToFormData(recipeDTO);

      // Assert
      expect(result.cookingTime).toBeNull();
    });

    it("should handle null difficulty", () => {
      // Arrange
      const recipeDTO = createRecipeSummaryDTO({
        difficulty: null,
      });

      // Act
      const result = mapRecipeDTOToFormData(recipeDTO);

      // Assert
      expect(result.difficulty).toBeNull();
    });

    it("should preserve all ingredient fields including productName", () => {
      // Arrange
      const recipeDTO = createRecipeSummaryDTO({
        ingredients: [createRecipeIngredient(5, "Special Ingredient", 250, 3, "ml", "ml")],
      });

      // Act
      const result = mapRecipeDTOToFormData(recipeDTO);

      // Assert
      expect(result.ingredients[0]).toMatchObject({
        productId: 5,
        productName: "Special Ingredient",
        quantity: 250,
        unitId: 3,
      });
    });

    it("should handle recipes with all difficulty levels", () => {
      // Arrange
      const easyRecipe = createRecipeSummaryDTO({ difficulty: "easy" });
      const mediumRecipe = createRecipeSummaryDTO({ difficulty: "medium" });
      const hardRecipe = createRecipeSummaryDTO({ difficulty: "hard" });

      // Act
      const easyResult = mapRecipeDTOToFormData(easyRecipe);
      const mediumResult = mapRecipeDTOToFormData(mediumRecipe);
      const hardResult = mapRecipeDTOToFormData(hardRecipe);

      // Assert
      expect(easyResult.difficulty).toBe("easy");
      expect(mediumResult.difficulty).toBe("medium");
      expect(hardResult.difficulty).toBe("hard");
    });

    it("should handle zero cooking time", () => {
      // Arrange
      const recipeDTO = createRecipeSummaryDTO({
        cooking_time: 0,
      });

      // Act
      const result = mapRecipeDTOToFormData(recipeDTO);

      // Assert
      expect(result.cookingTime).toBe(0);
    });

    it("should handle large number of ingredients", () => {
      // Arrange
      const ingredients = Array.from({ length: 20 }, (_, i) =>
        createRecipeIngredient(i + 1, `Ingredient ${i + 1}`, i * 10, 1, "gram", "g")
      );
      const recipeDTO = createRecipeSummaryDTO({ ingredients });

      // Act
      const result = mapRecipeDTOToFormData(recipeDTO);

      // Assert
      expect(result.ingredients).toHaveLength(20);
      expect(result.ingredients[0].id).toBe("ingredient-0");
      expect(result.ingredients[19].id).toBe("ingredient-19");
    });

    it("should handle large number of tags", () => {
      // Arrange
      const tags = Array.from({ length: 15 }, (_, i) => createTag(i + 1, `Tag ${i + 1}`));
      const recipeDTO = createRecipeSummaryDTO({ tags });

      // Act
      const result = mapRecipeDTOToFormData(recipeDTO);

      // Assert
      expect(result.tagIds).toHaveLength(15);
      expect(result.tagIds[0]).toBe(1);
      expect(result.tagIds[14]).toBe(15);
    });
  });
});

// =============================================================================
// calculateRecipeStats
// =============================================================================

describe("calculateRecipeStats", () => {
  describe("happy path", () => {
    it("should calculate statistics for mixed recipe sources", () => {
      // Arrange
      const recipes: RecipeSummaryDTO[] = [
        createRecipeSummaryDTO({ source: "user" }),
        createRecipeSummaryDTO({ source: "user" }),
        createRecipeSummaryDTO({ source: "api" }),
        createRecipeSummaryDTO({ source: "ai" }),
        createRecipeSummaryDTO({ source: "ai" }),
        createRecipeSummaryDTO({ source: "ai" }),
      ];

      // Act
      const result = calculateRecipeStats(recipes);

      // Assert
      expect(result).toEqual({
        total: 6,
        userCount: 2,
        apiCount: 1,
        aiCount: 3,
      });
    });

    it("should calculate statistics for all user recipes", () => {
      // Arrange
      const recipes: RecipeSummaryDTO[] = [
        createRecipeSummaryDTO({ source: "user" }),
        createRecipeSummaryDTO({ source: "user" }),
        createRecipeSummaryDTO({ source: "user" }),
      ];

      // Act
      const result = calculateRecipeStats(recipes);

      // Assert
      expect(result).toEqual({
        total: 3,
        userCount: 3,
        apiCount: 0,
        aiCount: 0,
      });
    });

    it("should calculate statistics for all API recipes", () => {
      // Arrange
      const recipes: RecipeSummaryDTO[] = [
        createRecipeSummaryDTO({ source: "api" }),
        createRecipeSummaryDTO({ source: "api" }),
      ];

      // Act
      const result = calculateRecipeStats(recipes);

      // Assert
      expect(result).toEqual({
        total: 2,
        userCount: 0,
        apiCount: 2,
        aiCount: 0,
      });
    });

    it("should calculate statistics for all AI recipes", () => {
      // Arrange
      const recipes: RecipeSummaryDTO[] = [
        createRecipeSummaryDTO({ source: "ai" }),
        createRecipeSummaryDTO({ source: "ai" }),
        createRecipeSummaryDTO({ source: "ai" }),
        createRecipeSummaryDTO({ source: "ai" }),
      ];

      // Act
      const result = calculateRecipeStats(recipes);

      // Assert
      expect(result).toEqual({
        total: 4,
        userCount: 0,
        apiCount: 0,
        aiCount: 4,
      });
    });
  });

  describe("edge cases", () => {
    it("should return zero statistics for empty array", () => {
      // Arrange
      const recipes: RecipeSummaryDTO[] = [];

      // Act
      const result = calculateRecipeStats(recipes);

      // Assert
      expect(result).toEqual({
        total: 0,
        userCount: 0,
        apiCount: 0,
        aiCount: 0,
      });
    });

    it("should handle single recipe", () => {
      // Arrange
      const recipes: RecipeSummaryDTO[] = [createRecipeSummaryDTO({ source: "user" })];

      // Act
      const result = calculateRecipeStats(recipes);

      // Assert
      expect(result).toEqual({
        total: 1,
        userCount: 1,
        apiCount: 0,
        aiCount: 0,
      });
    });

    it("should handle large number of recipes", () => {
      // Arrange
      const recipes: RecipeSummaryDTO[] = [
        ...Array.from({ length: 100 }, () => createRecipeSummaryDTO({ source: "user" })),
        ...Array.from({ length: 50 }, () => createRecipeSummaryDTO({ source: "api" })),
        ...Array.from({ length: 75 }, () => createRecipeSummaryDTO({ source: "ai" })),
      ];

      // Act
      const result = calculateRecipeStats(recipes);

      // Assert
      expect(result).toEqual({
        total: 225,
        userCount: 100,
        apiCount: 50,
        aiCount: 75,
      });
    });
  });
});

// =============================================================================
// createEmptyRecipeFormData
// =============================================================================

describe("createEmptyRecipeFormData", () => {
  it("should create empty form data with default values", () => {
    // Act
    const result = createEmptyRecipeFormData();

    // Assert
    expect(result).toEqual({
      title: "",
      description: "",
      instructions: "",
      cookingTime: null,
      difficulty: null,
      ingredients: [],
      tagIds: [],
    });
  });

  it("should create new instance each time", () => {
    // Act
    const result1 = createEmptyRecipeFormData();
    const result2 = createEmptyRecipeFormData();

    // Assert
    expect(result1).not.toBe(result2);
    expect(result1).toEqual(result2);
  });

  it("should have empty arrays that can be mutated independently", () => {
    // Act
    const result1 = createEmptyRecipeFormData();
    const result2 = createEmptyRecipeFormData();
    result1.tagIds.push(1);

    // Assert
    expect(result1.tagIds).toEqual([1]);
    expect(result2.tagIds).toEqual([]);
  });

  it("should have all required fields", () => {
    // Act
    const result = createEmptyRecipeFormData();

    // Assert
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("instructions");
    expect(result).toHaveProperty("cookingTime");
    expect(result).toHaveProperty("difficulty");
    expect(result).toHaveProperty("ingredients");
    expect(result).toHaveProperty("tagIds");
  });
});

// =============================================================================
// createEmptyIngredientFormData
// =============================================================================

describe("createEmptyIngredientFormData", () => {
  beforeEach(() => {
    // Reset Date.now and Math.random mocks before each test
    vi.restoreAllMocks();
  });

  it("should create empty ingredient with default values", () => {
    // Act
    const result = createEmptyIngredientFormData();

    // Assert
    expect(result.productId).toBeNull();
    expect(result.productName).toBe("");
    expect(result.quantity).toBe(0);
    expect(result.unitId).toBeNull();
    expect(result.id).toBeDefined();
  });

  it("should generate unique ID based on timestamp and random", () => {
    // Arrange
    const mockTimestamp = 1234567890;
    const mockRandom = 0.123456789;
    vi.spyOn(Date, "now").mockReturnValue(mockTimestamp);
    vi.spyOn(Math, "random").mockReturnValue(mockRandom);

    // Act
    const result = createEmptyIngredientFormData();

    // Assert
    expect(result.id).toBe(`ingredient-${mockTimestamp}-${mockRandom}`);
  });

  it("should create different IDs for each call", () => {
    // Act
    const result1 = createEmptyIngredientFormData();
    const result2 = createEmptyIngredientFormData();

    // Assert
    expect(result1.id).not.toBe(result2.id);
  });

  it("should create new instance each time", () => {
    // Act
    const result1 = createEmptyIngredientFormData();
    const result2 = createEmptyIngredientFormData();

    // Assert
    expect(result1).not.toBe(result2);
  });

  it("should have all required fields", () => {
    // Act
    const result = createEmptyIngredientFormData();

    // Assert
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("productId");
    expect(result).toHaveProperty("productName");
    expect(result).toHaveProperty("quantity");
    expect(result).toHaveProperty("unitId");
  });

  it("should have ID property even though optional in type definition", () => {
    // Act
    const result = createEmptyIngredientFormData();

    // Assert
    expect(result.id).toBeDefined();
    expect(typeof result.id).toBe("string");
  });
});
