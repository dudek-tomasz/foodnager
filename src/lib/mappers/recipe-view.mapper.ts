/**
 * Mappers for transforming between Recipe DTOs and ViewModels
 *
 * These functions handle the transformation between API DTOs (from src/types.ts)
 * and frontend-specific ViewModels (from src/components/recipes/types.ts)
 */

import type { RecipeFormData, RecipeIngredientFormData, RecipeStats } from "@/components/recipes/types";
import type { CreateRecipeDTO, UpdateRecipeDTO, RecipeSummaryDTO, RecipeDTO } from "@/types";

/**
 * Transforms RecipeFormData to CreateRecipeDTO for POST /api/recipes
 */
export function mapRecipeFormDataToCreateDTO(formData: RecipeFormData): CreateRecipeDTO {
  return {
    title: formData.title.trim(),
    description: formData.description.trim() || null,
    instructions: formData.instructions.trim(),
    cooking_time: formData.cookingTime,
    difficulty: formData.difficulty,
    ingredients: formData.ingredients.map((ing) => ({
      product_id: ing.productId ?? 0,
      quantity: ing.quantity,
      unit_id: ing.unitId ?? 0,
    })),
    tag_ids: formData.tagIds.length > 0 ? formData.tagIds : undefined,
  };
}

/**
 * Transforms RecipeFormData to UpdateRecipeDTO for PATCH /api/recipes/:id
 */
export function mapRecipeFormDataToUpdateDTO(formData: RecipeFormData): UpdateRecipeDTO {
  const updates: UpdateRecipeDTO = {};

  if (formData.title) {
    updates.title = formData.title.trim();
  }

  if (formData.description !== undefined) {
    updates.description = formData.description.trim() || null;
  }

  if (formData.instructions) {
    updates.instructions = formData.instructions.trim();
  }

  if (formData.cookingTime !== null) {
    updates.cooking_time = formData.cookingTime;
  }

  if (formData.difficulty !== null) {
    updates.difficulty = formData.difficulty;
  }

  if (formData.ingredients.length > 0) {
    updates.ingredients = formData.ingredients.map((ing) => ({
      product_id: ing.productId ?? 0,
      quantity: ing.quantity,
      unit_id: ing.unitId ?? 0,
    }));
  }

  if (formData.tagIds.length > 0) {
    updates.tag_ids = formData.tagIds;
  }

  return updates;
}

/**
 * Transforms RecipeDTO or RecipeSummaryDTO to RecipeFormData for editing
 */
export function mapRecipeDTOToFormData(recipe: RecipeSummaryDTO | RecipeDTO): RecipeFormData {
  return {
    title: recipe.title,
    description: recipe.description || "",
    instructions: recipe.instructions,
    cookingTime: recipe.cooking_time,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients.map((ing, index) => ({
      id: `ingredient-${index}`,
      productId: ing.product.id,
      productName: ing.product.name,
      quantity: ing.quantity,
      unitId: ing.unit.id,
    })),
    tagIds: recipe.tags.map((tag) => tag.id),
  };
}

/**
 * Calculates recipe statistics from a list of recipes
 */
export function calculateRecipeStats(recipes: RecipeSummaryDTO[]): RecipeStats {
  return {
    total: recipes.length,
    userCount: recipes.filter((r) => r.source === "user").length,
    apiCount: recipes.filter((r) => r.source === "api").length,
    aiCount: recipes.filter((r) => r.source === "ai").length,
  };
}

/**
 * Creates an empty RecipeFormData with default values
 */
export function createEmptyRecipeFormData(): RecipeFormData {
  return {
    title: "",
    description: "",
    instructions: "",
    cookingTime: null,
    difficulty: null,
    ingredients: [],
    tagIds: [],
  };
}

/**
 * Creates an empty RecipeIngredientFormData with default values
 */
export function createEmptyIngredientFormData(): RecipeIngredientFormData {
  return {
    id: `ingredient-${Date.now()}-${Math.random()}`,
    productId: null,
    productName: "",
    quantity: 0,
    unitId: null,
  };
}
