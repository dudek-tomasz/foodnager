/**
 * Unit tests for Recipe validation schemas
 */

import { describe, expect, it } from "vitest";
import {
  createRecipeSchema,
  listRecipesQuerySchema,
  recipeIdSchema,
  recipeIngredientSchema,
  updateRecipeSchema,
  type CreateRecipeSchema,
  type UpdateRecipeSchema,
} from "./recipe.validation";

// =============================================================================
// QUERY PARAMETERS SCHEMA TESTS
// =============================================================================

describe("listRecipesQuerySchema", () => {
  describe("happy path", () => {
    it("should validate query with all optional parameters", () => {
      // Arrange
      const input = {
        search: "pasta",
        source: "user" as const,
        difficulty: "easy" as const,
        tags: "1,2,3",
        max_cooking_time: 30,
        sort: "title" as const,
        order: "asc" as const,
        page: 2,
        limit: 50,
      };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          search: "pasta",
          source: "user",
          difficulty: "easy",
          tags: [1, 2, 3],
          max_cooking_time: 30,
          sort: "title",
          order: "asc",
          page: 2,
          limit: 50,
        });
      }
    });

    it("should apply default values for sort, order, page, and limit", () => {
      // Arrange
      const input = {};

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sort).toBe("created_at");
        expect(result.data.order).toBe("desc");
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it("should trim search parameter", () => {
      // Arrange
      const input = { search: "  pasta  " };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.search).toBe("pasta");
      }
    });

    it("should transform empty tags string to undefined", () => {
      // Arrange
      const input = { tags: "  " };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toBeUndefined();
      }
    });

    it("should coerce string numbers to numbers", () => {
      // Arrange
      const input = {
        max_cooking_time: "45",
        page: "3",
        limit: "25",
      };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.max_cooking_time).toBe(45);
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(25);
      }
    });
  });

  describe("edge cases", () => {
    it("should accept minimum valid page (1)", () => {
      // Arrange
      const input = { page: 1 };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept minimum valid limit (1)", () => {
      // Arrange
      const input = { limit: 1 };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept maximum valid limit (100)", () => {
      // Arrange
      const input = { limit: 100 };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should parse single tag", () => {
      // Arrange
      const input = { tags: "5" };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual([5]);
      }
    });

    it("should handle tags with spaces", () => {
      // Arrange
      const input = { tags: " 1 , 2 , 3 " };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual([1, 2, 3]);
      }
    });
  });

  describe("validation errors", () => {
    it("should reject invalid source enum value", () => {
      // Arrange
      const input = { source: "invalid" };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject invalid difficulty enum value", () => {
      // Arrange
      const input = { difficulty: "super-hard" };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject invalid sort value", () => {
      // Arrange
      const input = { sort: "invalid_field" };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject invalid order value", () => {
      // Arrange
      const input = { order: "random" };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject page less than 1", () => {
      // Arrange
      const input = { page: 0 };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject negative page", () => {
      // Arrange
      const input = { page: -1 };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject limit less than 1", () => {
      // Arrange
      const input = { limit: 0 };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject limit greater than 100", () => {
      // Arrange
      const input = { limit: 101 };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject zero max_cooking_time", () => {
      // Arrange
      const input = { max_cooking_time: 0 };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject negative max_cooking_time", () => {
      // Arrange
      const input = { max_cooking_time: -10 };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject non-integer max_cooking_time", () => {
      // Arrange
      const input = { max_cooking_time: 30.5 };

      // Act
      const result = listRecipesQuerySchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject tags with invalid format (non-numeric)", () => {
      // Arrange
      const input = { tags: "1,abc,3" };

      // Act & Assert
      // The transform function throws an error for invalid tag IDs
      expect(() => listRecipesQuerySchema.parse(input)).toThrow("Invalid tag ID");
    });
  });
});

// =============================================================================
// RECIPE INGREDIENT SCHEMA TESTS
// =============================================================================

describe("recipeIngredientSchema", () => {
  describe("happy path", () => {
    it("should validate valid ingredient", () => {
      // Arrange
      const input = {
        product_id: 1,
        quantity: 2.5,
        unit_id: 3,
      };

      // Act
      const result = recipeIngredientSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it("should accept decimal quantity", () => {
      // Arrange
      const input = {
        product_id: 1,
        quantity: 0.5,
        unit_id: 2,
      };

      // Act
      const result = recipeIngredientSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("validation errors", () => {
    it("should reject zero product_id", () => {
      // Arrange
      const input = {
        product_id: 0,
        quantity: 1,
        unit_id: 1,
      };

      // Act
      const result = recipeIngredientSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("positive integer");
      }
    });

    it("should reject negative product_id", () => {
      // Arrange
      const input = {
        product_id: -1,
        quantity: 1,
        unit_id: 1,
      };

      // Act
      const result = recipeIngredientSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject decimal product_id", () => {
      // Arrange
      const input = {
        product_id: 1.5,
        quantity: 1,
        unit_id: 1,
      };

      // Act
      const result = recipeIngredientSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject zero quantity", () => {
      // Arrange
      const input = {
        product_id: 1,
        quantity: 0,
        unit_id: 1,
      };

      // Act
      const result = recipeIngredientSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("positive");
      }
    });

    it("should reject negative quantity", () => {
      // Arrange
      const input = {
        product_id: 1,
        quantity: -2.5,
        unit_id: 1,
      };

      // Act
      const result = recipeIngredientSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject zero unit_id", () => {
      // Arrange
      const input = {
        product_id: 1,
        quantity: 1,
        unit_id: 0,
      };

      // Act
      const result = recipeIngredientSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("positive integer");
      }
    });

    it("should reject missing required fields", () => {
      // Arrange
      const input = {};

      // Act
      const result = recipeIngredientSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});

// =============================================================================
// CREATE RECIPE SCHEMA TESTS
// =============================================================================

describe("createRecipeSchema", () => {
  const validIngredient = {
    product_id: 1,
    quantity: 2,
    unit_id: 1,
  };

  describe("happy path", () => {
    it("should validate complete recipe with all fields", () => {
      // Arrange
      const input: CreateRecipeSchema = {
        title: "Pasta Carbonara",
        description: "Classic Italian pasta dish",
        instructions: "Cook pasta, mix with eggs and cheese",
        cooking_time: 30,
        difficulty: "medium",
        ingredients: [validIngredient],
        tag_ids: [1, 2],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it("should validate recipe with minimal required fields", () => {
      // Arrange
      const input = {
        title: "Simple Recipe",
        instructions: "Cook",
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should trim title and instructions", () => {
      // Arrange
      const input = {
        title: "  Pasta  ",
        instructions: "  Cook it  ",
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Pasta");
        expect(result.data.instructions).toBe("Cook it");
      }
    });

    it("should accept null cooking_time", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "Cook",
        cooking_time: null,
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept null difficulty", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "Cook",
        difficulty: null,
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept multiple ingredients", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "Cook",
        ingredients: [
          { product_id: 1, quantity: 2, unit_id: 1 },
          { product_id: 2, quantity: 3, unit_id: 2 },
          { product_id: 3, quantity: 1, unit_id: 1 },
        ],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept empty tag_ids array", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "Cook",
        ingredients: [validIngredient],
        tag_ids: [],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should accept title with exactly 255 characters", () => {
      // Arrange
      const input = {
        title: "a".repeat(255),
        instructions: "Cook",
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept cooking_time of 1 minute", () => {
      // Arrange
      const input = {
        title: "Quick Recipe",
        instructions: "Cook",
        cooking_time: 1,
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept very long cooking_time", () => {
      // Arrange
      const input = {
        title: "Slow Cooked",
        instructions: "Cook",
        cooking_time: 999999,
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("validation errors", () => {
    it("should reject empty title", () => {
      // Arrange
      const input = {
        title: "",
        instructions: "Cook",
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required");
      }
    });

    it("should reject title with only whitespace", () => {
      // Arrange
      const input = {
        title: "   ",
        instructions: "Cook",
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject title exceeding 255 characters", () => {
      // Arrange
      const input = {
        title: "a".repeat(256),
        instructions: "Cook",
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("255 characters");
      }
    });

    it("should reject missing title", () => {
      // Arrange
      const input = {
        instructions: "Cook",
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject empty instructions", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "",
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("required");
      }
    });

    it("should reject instructions with only whitespace", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "   ",
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject missing instructions", () => {
      // Arrange
      const input = {
        title: "Recipe",
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject zero cooking_time", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "Cook",
        cooking_time: 0,
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("positive");
      }
    });

    it("should reject negative cooking_time", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "Cook",
        cooking_time: -10,
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject decimal cooking_time", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "Cook",
        cooking_time: 30.5,
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject invalid difficulty value", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "Cook",
        difficulty: "impossible",
        ingredients: [validIngredient],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject empty ingredients array", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "Cook",
        ingredients: [],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least one ingredient");
      }
    });

    it("should reject missing ingredients", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "Cook",
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject duplicate product_ids in ingredients", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "Cook",
        ingredients: [
          { product_id: 1, quantity: 2, unit_id: 1 },
          { product_id: 2, quantity: 3, unit_id: 2 },
          { product_id: 1, quantity: 1, unit_id: 3 }, // duplicate product_id
        ],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Duplicate products");
      }
    });

    it("should reject invalid ingredient in array", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "Cook",
        ingredients: [
          { product_id: 1, quantity: 2, unit_id: 1 },
          { product_id: 0, quantity: -1, unit_id: 2 }, // invalid
        ],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject non-positive tag_ids", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "Cook",
        ingredients: [validIngredient],
        tag_ids: [1, 0, 3],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject negative tag_ids", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "Cook",
        ingredients: [validIngredient],
        tag_ids: [1, -2, 3],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject decimal tag_ids", () => {
      // Arrange
      const input = {
        title: "Recipe",
        instructions: "Cook",
        ingredients: [validIngredient],
        tag_ids: [1, 2.5, 3],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe("business rules", () => {
    it("should enforce unique products across ingredients (business rule)", () => {
      // Arrange - attempting to add same product twice
      const input = {
        title: "Recipe",
        instructions: "Cook",
        ingredients: [
          { product_id: 5, quantity: 100, unit_id: 1 },
          { product_id: 5, quantity: 50, unit_id: 2 }, // same product, different unit
        ],
      };

      // Act
      const result = createRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Duplicate products");
      }
    });
  });
});

// =============================================================================
// UPDATE RECIPE SCHEMA TESTS
// =============================================================================

describe("updateRecipeSchema", () => {
  const validIngredient = {
    product_id: 1,
    quantity: 2,
    unit_id: 1,
  };

  describe("happy path", () => {
    it("should validate update with single field", () => {
      // Arrange
      const input = {
        title: "Updated Title",
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should validate update with multiple fields", () => {
      // Arrange
      const input: UpdateRecipeSchema = {
        title: "Updated Title",
        description: "Updated description",
        cooking_time: 45,
        difficulty: "hard",
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should validate update with all fields", () => {
      // Arrange
      const input: UpdateRecipeSchema = {
        title: "Updated Recipe",
        description: "New description",
        instructions: "New instructions",
        cooking_time: 60,
        difficulty: "easy",
        source: "ai",
        ingredients: [validIngredient],
        tag_ids: [1, 2],
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should trim title and instructions when provided", () => {
      // Arrange
      const input = {
        title: "  Updated  ",
        instructions: "  New steps  ",
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Updated");
        expect(result.data.instructions).toBe("New steps");
      }
    });

    it("should accept null values for nullable fields", () => {
      // Arrange
      const input = {
        description: null,
        cooking_time: null,
        difficulty: null,
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept source field update", () => {
      // Arrange
      const input = {
        source: "ai" as const,
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should accept title with exactly 255 characters", () => {
      // Arrange
      const input = {
        title: "a".repeat(255),
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });

    it("should accept empty tag_ids array", () => {
      // Arrange
      const input = {
        tag_ids: [],
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("validation errors", () => {
    it("should reject empty update object", () => {
      // Arrange
      const input = {};

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one field is required");
      }
    });

    it("should reject empty title when provided", () => {
      // Arrange
      const input = {
        title: "",
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("cannot be empty");
      }
    });

    it("should reject title with only whitespace", () => {
      // Arrange
      const input = {
        title: "   ",
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject title exceeding 255 characters", () => {
      // Arrange
      const input = {
        title: "a".repeat(256),
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("255 characters");
      }
    });

    it("should reject empty instructions when provided", () => {
      // Arrange
      const input = {
        instructions: "",
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("cannot be empty");
      }
    });

    it("should reject instructions with only whitespace", () => {
      // Arrange
      const input = {
        instructions: "   ",
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject zero cooking_time when provided", () => {
      // Arrange
      const input = {
        cooking_time: 0,
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject negative cooking_time", () => {
      // Arrange
      const input = {
        cooking_time: -5,
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject decimal cooking_time", () => {
      // Arrange
      const input = {
        cooking_time: 30.5,
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject invalid difficulty value", () => {
      // Arrange
      const input = {
        difficulty: "super-easy",
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject invalid source value", () => {
      // Arrange
      const input = {
        source: "external",
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject empty ingredients array when provided", () => {
      // Arrange
      const input = {
        ingredients: [],
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("at least one ingredient");
      }
    });

    it("should reject duplicate product_ids in ingredients when provided", () => {
      // Arrange
      const input = {
        ingredients: [
          { product_id: 1, quantity: 2, unit_id: 1 },
          { product_id: 1, quantity: 3, unit_id: 2 }, // duplicate
        ],
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Duplicate products");
      }
    });

    it("should reject invalid ingredient in array", () => {
      // Arrange
      const input = {
        ingredients: [
          { product_id: 1, quantity: 2, unit_id: 1 },
          { product_id: -1, quantity: 0, unit_id: 0 }, // invalid
        ],
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject non-positive tag_ids", () => {
      // Arrange
      const input = {
        tag_ids: [1, 0, 3],
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });

  describe("business rules", () => {
    it("should require at least one field for update (business rule)", () => {
      // Arrange - empty update object
      const input = {};

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("At least one field is required");
      }
    });

    it("should enforce unique products in ingredients when updating (business rule)", () => {
      // Arrange
      const input = {
        ingredients: [
          { product_id: 3, quantity: 2, unit_id: 1 },
          { product_id: 3, quantity: 5, unit_id: 2 }, // duplicate product
        ],
      };

      // Act
      const result = updateRecipeSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Duplicate products");
      }
    });
  });
});

// =============================================================================
// RECIPE ID SCHEMA TESTS
// =============================================================================

describe("recipeIdSchema", () => {
  describe("happy path", () => {
    it("should validate positive integer", () => {
      // Arrange
      const input = 123;

      // Act
      const result = recipeIdSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(123);
      }
    });

    it("should coerce string number to number", () => {
      // Arrange
      const input = "456";

      // Act
      const result = recipeIdSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(456);
      }
    });

    it("should accept ID value of 1", () => {
      // Arrange
      const input = 1;

      // Act
      const result = recipeIdSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("validation errors", () => {
    it("should reject zero", () => {
      // Arrange
      const input = 0;

      // Act
      const result = recipeIdSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Invalid recipe ID");
      }
    });

    it("should reject negative number", () => {
      // Arrange
      const input = -5;

      // Act
      const result = recipeIdSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject decimal number", () => {
      // Arrange
      const input = 12.5;

      // Act
      const result = recipeIdSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject non-numeric string", () => {
      // Arrange
      const input = "abc";

      // Act
      const result = recipeIdSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });

    it("should reject empty string", () => {
      // Arrange
      const input = "";

      // Act
      const result = recipeIdSchema.safeParse(input);

      // Assert
      expect(result.success).toBe(false);
    });
  });
});
