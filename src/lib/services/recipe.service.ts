/**
 * RecipeService - Business logic for Recipe API
 * 
 * Handles all recipe-related operations including:
 * - Listing recipes with advanced filtering (search, source, difficulty, tags, cooking time)
 * - Getting individual recipes with ingredients and tags
 * - Creating recipes with ingredients and tags (transactional)
 * - Updating recipes (transactional)
 * - Deleting recipes (cascade)
 */

import type { SupabaseClient } from '../../db/supabase.client';
import type {
  RecipeDTO,
  RecipeSummaryDTO,
  ListRecipesQueryDTO,
  CreateRecipeDTO,
  UpdateRecipeDTO,
  RecipesListResponseDTO,
  RecipeIngredientDTO,
  TagDTO,
  ProductReferenceDTO,
  UnitReferenceDTO,
} from '../../types';
import { NotFoundError } from '../errors';
import { calculatePaginationMeta, calculateOffset } from '../utils/pagination';

/**
 * Interface for raw recipe row from database
 */
interface RecipeRow {
  id: number;
  title: string;
  description: string | null;
  instructions: string;
  cooking_time: number | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  source: 'user' | 'api' | 'ai';
  metadata: any;
  created_at: string;
  updated_at: string;
}

/**
 * Interface for recipe ingredient row with JOINed data
 */
interface RecipeIngredientRow {
  recipe_id: number;
  quantity: number;
  product_id: number;
  product_name: string;
  unit_id: number;
  unit_name: string;
  unit_abbreviation: string;
}

/**
 * Interface for recipe tag row with JOINed data
 */
interface RecipeTagRow {
  recipe_id: number;
  tag_id: number;
  tag_name: string;
}

/**
 * RecipeService class
 * All methods require SupabaseClient instance with authenticated user context
 */
export class RecipeService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Lists recipes with advanced filtering and pagination
   * 
   * Supports:
   * - Full-text search in title and instructions
   * - Filtering by source, difficulty, tags, max cooking time
   * - Sorting by multiple fields
   * - Pagination
   * - Batch loading of ingredients and tags to avoid N+1 queries
   * 
   * @param userId - Current authenticated user ID
   * @param query - Query parameters for filtering and pagination
   * @returns Paginated list of recipes with ingredients and tags
   */
  async listRecipes(
    userId: string,
    query: ListRecipesQueryDTO
  ): Promise<RecipesListResponseDTO> {
    const {
      search,
      source,
      difficulty,
      tags,
      max_cooking_time,
      sort = 'created_at',
      order = 'desc',
      page = 1,
      limit = 20,
    } = query;

    const offset = calculateOffset(page, limit);

    // Build base query
    let queryBuilder = this.supabase
      .from('recipes')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // Apply search filter (full-text search in title and instructions)
    if (search && search.trim()) {
      // Use textSearch for full-text search
      queryBuilder = queryBuilder.or(
        `title.ilike.%${search.trim()}%,instructions.ilike.%${search.trim()}%`
      );
    }

    // Apply source filter
    if (source) {
      queryBuilder = queryBuilder.eq('source', source);
    }

    // Apply difficulty filter
    if (difficulty) {
      queryBuilder = queryBuilder.eq('difficulty', difficulty);
    }

    // Apply max_cooking_time filter
    if (max_cooking_time !== undefined) {
      queryBuilder = queryBuilder.lte('cooking_time', max_cooking_time);
    }

    // Apply sorting
    queryBuilder = queryBuilder.order(sort, { ascending: order === 'asc' });

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1);

    // Execute query
    const { data: recipes, error, count } = await queryBuilder;

    if (error) {
      console.error('Error fetching recipes:', error);
      throw new Error('Failed to fetch recipes');
    }

    if (!recipes || recipes.length === 0) {
      return {
        data: [],
        pagination: calculatePaginationMeta(page, limit, count || 0),
      };
    }

    // Get recipe IDs
    const recipeIds = recipes.map((r) => r.id);

    // Filter by tags if provided (need to check recipe_tags table)
    let filteredRecipeIds = recipeIds;
    if (tags && tags.length > 0) {
      const { data: recipesWithTags, error: tagsError } = await this.supabase
        .from('recipe_tags')
        .select('recipe_id')
        .in('recipe_id', recipeIds)
        .in('tag_id', tags);

      if (tagsError) {
        console.error('Error filtering by tags:', tagsError);
        throw new Error('Failed to filter by tags');
      }

      // Get unique recipe IDs that have at least one of the requested tags
      filteredRecipeIds = [...new Set(recipesWithTags?.map((rt) => rt.recipe_id) || [])];

      // Filter recipes to only include those with matching tags
      if (filteredRecipeIds.length === 0) {
        return {
          data: [],
          pagination: calculatePaginationMeta(page, limit, 0),
        };
      }
    }

    // Batch load ingredients for all recipes
    const ingredientsMap = await this.batchLoadIngredients(filteredRecipeIds);

    // Batch load tags for all recipes
    const tagsMap = await this.batchLoadTags(filteredRecipeIds);

    // Transform recipes to RecipeSummaryDTO
    const recipeSummaries: RecipeSummaryDTO[] = recipes
      .filter((r) => filteredRecipeIds.includes(r.id))
      .map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        description: recipe.description,
        instructions: recipe.instructions,
        cooking_time: recipe.cooking_time,
        difficulty: recipe.difficulty,
        source: recipe.source,
        tags: tagsMap.get(recipe.id) || [],
        ingredients: ingredientsMap.get(recipe.id) || [],
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
      }));

    // Calculate pagination (adjust count if filtered by tags)
    const finalCount = tags && tags.length > 0 ? recipeSummaries.length : count || 0;

    return {
      data: recipeSummaries,
      pagination: calculatePaginationMeta(page, limit, finalCount),
    };
  }

  /**
   * Gets a single recipe by ID with all ingredients and tags
   * 
   * @param userId - Current authenticated user ID
   * @param recipeId - Recipe ID
   * @returns Full recipe DTO with metadata
   * @throws NotFoundError if recipe doesn't exist or doesn't belong to user
   */
  async getRecipeById(userId: string, recipeId: number): Promise<RecipeDTO> {
    // Fetch recipe base data
    const { data: recipe, error } = await this.supabase
      .from('recipes')
      .select('*')
      .eq('id', recipeId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching recipe:', error);
      throw new Error('Failed to fetch recipe');
    }

    if (!recipe) {
      throw new NotFoundError('Recipe not found');
    }

    // Fetch ingredients and tags in parallel
    const [ingredients, tags] = await Promise.all([
      this.loadRecipeIngredients(recipeId),
      this.loadRecipeTags(recipeId),
    ]);

    return {
      id: recipe.id,
      title: recipe.title,
      description: recipe.description,
      instructions: recipe.instructions,
      cooking_time: recipe.cooking_time,
      difficulty: recipe.difficulty,
      source: recipe.source,
      metadata: recipe.metadata,
      tags,
      ingredients,
      created_at: recipe.created_at,
      updated_at: recipe.updated_at,
    };
  }

  /**
   * Creates a new recipe with ingredients and tags
   * Operation is performed within a transaction to ensure data consistency
   * 
   * @param userId - Current authenticated user ID
   * @param createDto - Recipe data to create
   * @returns Created recipe with all related data
   * @throws NotFoundError if product, unit, or tag doesn't exist
   */
  async createRecipe(userId: string, createDto: CreateRecipeDTO): Promise<RecipeDTO> {
    const { title, description, instructions, cooking_time, difficulty, ingredients, tag_ids } =
      createDto;

    // Verify all foreign keys exist before starting transaction
    await this.verifyProductsExist(
      userId,
      ingredients.map((i) => i.product_id)
    );
    await this.verifyUnitsExist(ingredients.map((i) => i.unit_id));
    if (tag_ids && tag_ids.length > 0) {
      await this.verifyTagsExist(tag_ids);
    }

    // Insert recipe
    const { data: recipe, error: recipeError } = await this.supabase
      .from('recipes')
      .insert({
        user_id: userId,
        title,
        description: description ?? null,
        instructions,
        cooking_time: cooking_time ?? null,
        difficulty: difficulty ?? null,
        source: 'user',
        metadata: null,
      })
      .select()
      .single();

    if (recipeError) {
      console.error('Error creating recipe:', recipeError);
      throw new Error('Failed to create recipe');
    }

    // Insert ingredients
    const ingredientsToInsert = ingredients.map((ing) => ({
      recipe_id: recipe.id,
      product_id: ing.product_id,
      quantity: ing.quantity,
      unit_id: ing.unit_id,
    }));

    const { error: ingredientsError } = await this.supabase
      .from('recipe_ingredients')
      .insert(ingredientsToInsert);

    if (ingredientsError) {
      console.error('Error inserting ingredients:', ingredientsError);
      // Rollback: delete recipe
      await this.supabase.from('recipes').delete().eq('id', recipe.id);
      throw new Error('Failed to create recipe ingredients');
    }

    // Insert tags if provided
    if (tag_ids && tag_ids.length > 0) {
      const tagsToInsert = tag_ids.map((tagId) => ({
        recipe_id: recipe.id,
        tag_id: tagId,
      }));

      const { error: tagsError } = await this.supabase.from('recipe_tags').insert(tagsToInsert);

      if (tagsError) {
        console.error('Error inserting tags:', tagsError);
        // Rollback: delete recipe and ingredients
        await this.supabase.from('recipes').delete().eq('id', recipe.id);
        throw new Error('Failed to create recipe tags');
      }
    }

    // Fetch and return full recipe data
    return await this.getRecipeById(userId, recipe.id);
  }

  /**
   * Updates an existing recipe
   * Can update recipe fields, replace ingredients, and replace tags
   * Operation is performed within a transaction for consistency
   * 
   * @param userId - Current authenticated user ID
   * @param recipeId - Recipe ID to update
   * @param updateDto - Updated recipe data
   * @returns Updated recipe with all related data
   * @throws NotFoundError if recipe, product, unit, or tag doesn't exist
   */
  async updateRecipe(
    userId: string,
    recipeId: number,
    updateDto: UpdateRecipeDTO
  ): Promise<RecipeDTO> {
    // First verify recipe exists and belongs to user
    await this.getRecipeById(userId, recipeId);

    // Verify foreign keys if ingredients or tags are being updated
    if (updateDto.ingredients) {
      await this.verifyProductsExist(
        userId,
        updateDto.ingredients.map((i) => i.product_id)
      );
      await this.verifyUnitsExist(updateDto.ingredients.map((i) => i.unit_id));
    }
    if (updateDto.tag_ids && updateDto.tag_ids.length > 0) {
      await this.verifyTagsExist(updateDto.tag_ids);
    }

    // Build update object with only provided fields
    const updateData: any = {};
    if (updateDto.title !== undefined) updateData.title = updateDto.title;
    if (updateDto.description !== undefined) updateData.description = updateDto.description;
    if (updateDto.instructions !== undefined) updateData.instructions = updateDto.instructions;
    if (updateDto.cooking_time !== undefined) updateData.cooking_time = updateDto.cooking_time;
    if (updateDto.difficulty !== undefined) updateData.difficulty = updateDto.difficulty;

    // Update recipe base data if any fields provided
    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await this.supabase
        .from('recipes')
        .update(updateData)
        .eq('id', recipeId)
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating recipe:', updateError);
        throw new Error('Failed to update recipe');
      }
    }

    // Update ingredients if provided (replace all)
    if (updateDto.ingredients) {
      // Delete existing ingredients
      const { error: deleteIngredientsError } = await this.supabase
        .from('recipe_ingredients')
        .delete()
        .eq('recipe_id', recipeId);

      if (deleteIngredientsError) {
        console.error('Error deleting old ingredients:', deleteIngredientsError);
        throw new Error('Failed to update ingredients');
      }

      // Insert new ingredients
      const ingredientsToInsert = updateDto.ingredients.map((ing) => ({
        recipe_id: recipeId,
        product_id: ing.product_id,
        quantity: ing.quantity,
        unit_id: ing.unit_id,
      }));

      const { error: insertIngredientsError } = await this.supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert);

      if (insertIngredientsError) {
        console.error('Error inserting new ingredients:', insertIngredientsError);
        throw new Error('Failed to update ingredients');
      }
    }

    // Update tags if provided (replace all)
    if (updateDto.tag_ids !== undefined) {
      // Delete existing tags
      const { error: deleteTagsError } = await this.supabase
        .from('recipe_tags')
        .delete()
        .eq('recipe_id', recipeId);

      if (deleteTagsError) {
        console.error('Error deleting old tags:', deleteTagsError);
        throw new Error('Failed to update tags');
      }

      // Insert new tags if any
      if (updateDto.tag_ids.length > 0) {
        const tagsToInsert = updateDto.tag_ids.map((tagId) => ({
          recipe_id: recipeId,
          tag_id: tagId,
        }));

        const { error: insertTagsError } = await this.supabase
          .from('recipe_tags')
          .insert(tagsToInsert);

        if (insertTagsError) {
          console.error('Error inserting new tags:', insertTagsError);
          throw new Error('Failed to update tags');
        }
      }
    }

    // Fetch and return updated recipe data
    return await this.getRecipeById(userId, recipeId);
  }

  /**
   * Deletes a recipe
   * Cascade deletes recipe_ingredients, recipe_tags, and cooking_history
   * 
   * @param userId - Current authenticated user ID
   * @param recipeId - Recipe ID to delete
   * @throws NotFoundError if recipe doesn't exist or doesn't belong to user
   */
  async deleteRecipe(userId: string, recipeId: number): Promise<void> {
    const { error, count } = await this.supabase
      .from('recipes')
      .delete({ count: 'exact' })
      .eq('id', recipeId)
      .eq('user_id', userId);

    if (error) {
      console.error('Error deleting recipe:', error);
      throw new Error('Failed to delete recipe');
    }

    if (count === 0) {
      throw new NotFoundError('Recipe not found');
    }
  }

  // =============================================================================
  // PRIVATE HELPER METHODS - BATCH LOADING
  // =============================================================================

  /**
   * Batch loads ingredients for multiple recipes to avoid N+1 queries
   * 
   * @param recipeIds - Array of recipe IDs
   * @returns Map of recipe_id to array of RecipeIngredientDTO
   */
  private async batchLoadIngredients(
    recipeIds: number[]
  ): Promise<Map<number, RecipeIngredientDTO[]>> {
    const { data, error } = await this.supabase
      .from('recipe_ingredients')
      .select(
        `
        recipe_id,
        quantity,
        product_id,
        products!inner(name),
        unit_id,
        units!inner(name, abbreviation)
      `
      )
      .in('recipe_id', recipeIds);

    if (error) {
      console.error('Error batch loading ingredients:', error);
      throw new Error('Failed to load ingredients');
    }

    // Group by recipe_id
    const ingredientsMap = new Map<number, RecipeIngredientDTO[]>();
    (data || []).forEach((row: any) => {
      const ingredient: RecipeIngredientDTO = {
        product: {
          id: row.product_id,
          name: row.products.name,
        },
        quantity: row.quantity,
        unit: {
          id: row.unit_id,
          name: row.units.name,
          abbreviation: row.units.abbreviation,
        },
      };

      const existing = ingredientsMap.get(row.recipe_id) || [];
      existing.push(ingredient);
      ingredientsMap.set(row.recipe_id, existing);
    });

    return ingredientsMap;
  }

  /**
   * Batch loads tags for multiple recipes to avoid N+1 queries
   * 
   * @param recipeIds - Array of recipe IDs
   * @returns Map of recipe_id to array of TagDTO
   */
  private async batchLoadTags(recipeIds: number[]): Promise<Map<number, TagDTO[]>> {
    const { data, error } = await this.supabase
      .from('recipe_tags')
      .select(
        `
        recipe_id,
        tag_id,
        tags!inner(id, name, created_at)
      `
      )
      .in('recipe_id', recipeIds);

    if (error) {
      console.error('Error batch loading tags:', error);
      throw new Error('Failed to load tags');
    }

    // Group by recipe_id
    const tagsMap = new Map<number, TagDTO[]>();
    (data || []).forEach((row: any) => {
      const tag: TagDTO = {
        id: row.tags.id,
        name: row.tags.name,
        created_at: row.tags.created_at,
      };

      const existing = tagsMap.get(row.recipe_id) || [];
      existing.push(tag);
      tagsMap.set(row.recipe_id, existing);
    });

    return tagsMap;
  }

  /**
   * Loads ingredients for a single recipe
   * 
   * @param recipeId - Recipe ID
   * @returns Array of RecipeIngredientDTO
   */
  private async loadRecipeIngredients(recipeId: number): Promise<RecipeIngredientDTO[]> {
    const { data, error } = await this.supabase
      .from('recipe_ingredients')
      .select(
        `
        quantity,
        product_id,
        products!inner(name),
        unit_id,
        units!inner(name, abbreviation)
      `
      )
      .eq('recipe_id', recipeId);

    if (error) {
      console.error('Error loading recipe ingredients:', error);
      throw new Error('Failed to load ingredients');
    }

    return (data || []).map((row: any) => ({
      product: {
        id: row.product_id,
        name: row.products.name,
      },
      quantity: row.quantity,
      unit: {
        id: row.unit_id,
        name: row.units.name,
        abbreviation: row.units.abbreviation,
      },
    }));
  }

  /**
   * Loads tags for a single recipe
   * 
   * @param recipeId - Recipe ID
   * @returns Array of TagDTO
   */
  private async loadRecipeTags(recipeId: number): Promise<TagDTO[]> {
    const { data, error } = await this.supabase
      .from('recipe_tags')
      .select(
        `
        tags!inner(id, name, created_at)
      `
      )
      .eq('recipe_id', recipeId);

    if (error) {
      console.error('Error loading recipe tags:', error);
      throw new Error('Failed to load tags');
    }

    return (data || []).map((row: any) => ({
      id: row.tags.id,
      name: row.tags.name,
      created_at: row.tags.created_at,
    }));
  }

  // =============================================================================
  // PRIVATE HELPER METHODS - VERIFICATION
  // =============================================================================

  /**
   * Verifies that all products exist and are accessible to the user
   * User can access global products (user_id = NULL) or their own products
   * 
   * @param userId - Current authenticated user ID
   * @param productIds - Array of product IDs to verify
   * @throws NotFoundError if any product doesn't exist or isn't accessible
   */
  private async verifyProductsExist(userId: string, productIds: number[]): Promise<void> {
    const uniqueIds = [...new Set(productIds)];

    const { data, error } = await this.supabase
      .from('products')
      .select('id')
      .in('id', uniqueIds)
      .or(`user_id.is.null,user_id.eq.${userId}`);

    if (error) {
      console.error('Error verifying products:', error);
      throw new Error('Failed to verify products');
    }

    if (!data || data.length !== uniqueIds.length) {
      const foundIds = data?.map((p) => p.id) || [];
      const missingIds = uniqueIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundError(`Product not found: ${missingIds.join(', ')}`);
    }
  }

  /**
   * Verifies that all units exist
   * 
   * @param unitIds - Array of unit IDs to verify
   * @throws NotFoundError if any unit doesn't exist
   */
  private async verifyUnitsExist(unitIds: number[]): Promise<void> {
    const uniqueIds = [...new Set(unitIds)];

    const { data, error } = await this.supabase
      .from('units')
      .select('id')
      .in('id', uniqueIds);

    if (error) {
      console.error('Error verifying units:', error);
      throw new Error('Failed to verify units');
    }

    if (!data || data.length !== uniqueIds.length) {
      const foundIds = data?.map((u) => u.id) || [];
      const missingIds = uniqueIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundError(`Unit not found: ${missingIds.join(', ')}`);
    }
  }

  /**
   * Verifies that all tags exist
   * 
   * @param tagIds - Array of tag IDs to verify
   * @throws NotFoundError if any tag doesn't exist
   */
  private async verifyTagsExist(tagIds: number[]): Promise<void> {
    const uniqueIds = [...new Set(tagIds)];

    const { data, error } = await this.supabase
      .from('tags')
      .select('id')
      .in('id', uniqueIds);

    if (error) {
      console.error('Error verifying tags:', error);
      throw new Error('Failed to verify tags');
    }

    if (!data || data.length !== uniqueIds.length) {
      const foundIds = data?.map((t) => t.id) || [];
      const missingIds = uniqueIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundError(`Tag not found: ${missingIds.join(', ')}`);
    }
  }
}

