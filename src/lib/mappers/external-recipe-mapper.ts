/**
 * ExternalRecipeMapper
 * 
 * Maps external recipe formats to internal RecipeDTO format
 * Handles:
 * - Ingredient mapping (find or create products)
 * - Unit mapping (find or create units)
 * - Tag creation
 * - Recipe creation with source='api'
 */

import type { SupabaseClient } from '../../db/supabase.client';
import type {
  RecipeDTO,
  CreateRecipeIngredientDTO,
  ProductReferenceDTO,
  UnitReferenceDTO,
  TagDTO,
} from '../../types';
import type { ExternalRecipe } from '../services/external-api.service';
import { ProductMatcher } from '../utils/product-matcher';

/**
 * ExternalRecipeMapper class
 */
export class ExternalRecipeMapper {
  private productMatcher: ProductMatcher;

  constructor(private supabase: SupabaseClient) {
    this.productMatcher = new ProductMatcher(supabase);
  }

  /**
   * Map external recipe to internal format and save to database
   * 
   * @param externalRecipe - Recipe from external API
   * @param userId - User ID to associate the recipe with
   * @returns Saved RecipeDTO
   */
  async mapAndSave(externalRecipe: ExternalRecipe, userId: string): Promise<RecipeDTO> {
    try {
      // Step 1: Map ingredients (find or create products and units)
      const mappedIngredients = await this.mapIngredients(
        externalRecipe.ingredients,
        userId
      );

      // Step 2: Map tags (find or create)
      const tagIds = await this.mapTags(externalRecipe.tags || []);

      // Step 3: Save recipe to database
      const recipe = await this.saveRecipe(
        userId,
        externalRecipe,
        mappedIngredients,
        tagIds
      );

      return recipe;
      
    } catch (error) {
      console.error('Error mapping external recipe:', error);
      throw new Error('Failed to map external recipe');
    }
  }

  /**
   * Map external ingredients to internal CreateRecipeIngredientDTO format
   * 
   * @param externalIngredients - Array of external ingredients
   * @param userId - User ID for product ownership
   * @returns Array of mapped ingredients
   */
  private async mapIngredients(
    externalIngredients: Array<{ name: string; quantity: number; unit: string }>,
    userId: string
  ): Promise<CreateRecipeIngredientDTO[]> {
    const mapped: CreateRecipeIngredientDTO[] = [];

    for (const ingredient of externalIngredients) {
      // Find or create product
      const product = await this.productMatcher.findOrCreate(ingredient.name, userId);

      // Find or create unit
      const unit = await this.findOrCreateUnit(ingredient.unit);

      mapped.push({
        product_id: product.id,
        quantity: ingredient.quantity,
        unit_id: unit.id,
      });
    }

    return mapped;
  }

  /**
   * Map external tags to internal tag IDs
   * 
   * @param externalTags - Array of tag names
   * @returns Array of tag IDs
   */
  private async mapTags(externalTags: string[]): Promise<number[]> {
    const tagIds: number[] = [];

    for (const tagName of externalTags) {
      const tag = await this.findOrCreateTag(tagName);
      tagIds.push(tag.id);
    }

    return tagIds;
  }

  /**
   * Find existing unit or create new one
   * Searches by name first, then by abbreviation
   * 
   * @param unitName - Unit name or abbreviation (e.g., "cup", "ml", "tablespoon")
   * @returns Unit object
   */
  private async findOrCreateUnit(unitName: string): Promise<UnitReferenceDTO> {
    const normalizedName = unitName.toLowerCase().trim();

    // Step 1: Try to find existing unit by name (case-insensitive)
    const { data: unitsByName, error: nameSearchError } = await this.supabase
      .from('units')
      .select('id, name, abbreviation')
      .ilike('name', normalizedName)
      .limit(1);

    if (nameSearchError) {
      console.error('Error searching units by name:', nameSearchError);
      throw new Error('Failed to search units');
    }

    if (unitsByName && unitsByName.length > 0) {
      return {
        id: unitsByName[0].id,
        name: unitsByName[0].name,
        abbreviation: unitsByName[0].abbreviation,
      };
    }

    // Step 2: Try to find existing unit by abbreviation (case-insensitive)
    const abbreviation = this.generateUnitAbbreviation(unitName);
    
    const { data: unitsByAbbr, error: abbrSearchError } = await this.supabase
      .from('units')
      .select('id, name, abbreviation')
      .ilike('abbreviation', abbreviation)
      .limit(1);

    if (abbrSearchError) {
      console.error('Error searching units by abbreviation:', abbrSearchError);
      throw new Error('Failed to search units');
    }

    if (unitsByAbbr && unitsByAbbr.length > 0) {
      return {
        id: unitsByAbbr[0].id,
        name: unitsByAbbr[0].name,
        abbreviation: unitsByAbbr[0].abbreviation,
      };
    }

    // Step 3: Create new unit if not found by name or abbreviation
    const { data: newUnit, error: createError } = await this.supabase
      .from('units')
      .insert({
        name: normalizedName,
        abbreviation: abbreviation,
      })
      .select('id, name, abbreviation')
      .single();

    // Handle race condition: if unit was created by another concurrent request
    if (createError) {
      // Check if it's a duplicate key error (23505)
      if ((createError as any).code === '23505') {
        console.log(`⚠️ Unit with abbreviation "${abbreviation}" already exists (race condition), fetching...`);
        
        // Try to find it again (it was just created by another request)
        const { data: existingUnit, error: refetchError } = await this.supabase
          .from('units')
          .select('id, name, abbreviation')
          .or(`name.ilike.${normalizedName},abbreviation.ilike.${abbreviation}`)
          .limit(1);

        if (refetchError || !existingUnit || existingUnit.length === 0) {
          console.error('Error refetching unit after race condition:', refetchError);
          throw new Error('Failed to fetch unit after race condition');
        }

        return {
          id: existingUnit[0].id,
          name: existingUnit[0].name,
          abbreviation: existingUnit[0].abbreviation,
        };
      }

      // Other error - throw
      console.error('Error creating unit:', createError);
      throw new Error('Failed to create unit');
    }

    if (!newUnit) {
      throw new Error('Failed to create unit: no data returned');
    }

    return {
      id: newUnit.id,
      name: newUnit.name,
      abbreviation: newUnit.abbreviation,
    };
  }

  /**
   * Find existing tag or create new one
   * 
   * @param tagName - Tag name
   * @returns Tag object
   */
  private async findOrCreateTag(tagName: string): Promise<TagDTO> {
    const normalizedName = tagName.toLowerCase().trim();

    // Try to find existing tag (case-insensitive)
    const { data: existingTags, error: searchError } = await this.supabase
      .from('tags')
      .select('id, name, created_at')
      .ilike('name', normalizedName)
      .limit(1);

    if (searchError) {
      console.error('Error searching tags:', searchError);
      throw new Error('Failed to search tags');
    }

    if (existingTags && existingTags.length > 0) {
      return existingTags[0];
    }

    // Create new tag if not found
    const { data: newTag, error: createError } = await this.supabase
      .from('tags')
      .insert({
        name: normalizedName,
      })
      .select('id, name, created_at')
      .single();

    // Handle race condition: if tag was created by another concurrent request
    if (createError) {
      // Check if it's a duplicate key error (23505)
      if ((createError as any).code === '23505') {
        console.log(`⚠️ Tag "${normalizedName}" already exists (race condition), fetching...`);
        
        // Try to find it again (it was just created by another request)
        const { data: refetchedTag, error: refetchError } = await this.supabase
          .from('tags')
          .select('id, name, created_at')
          .ilike('name', normalizedName)
          .limit(1);

        if (refetchError || !refetchedTag || refetchedTag.length === 0) {
          console.error('Error refetching tag after race condition:', refetchError);
          throw new Error('Failed to fetch tag after race condition');
        }

        return refetchedTag[0];
      }

      // Other error - throw
      console.error('Error creating tag:', createError);
      throw new Error('Failed to create tag');
    }

    if (!newTag) {
      throw new Error('Failed to create tag: no data returned');
    }

    return newTag;
  }

  /**
   * Save recipe to database with source='api'
   * 
   * @param userId - User ID
   * @param externalRecipe - External recipe data
   * @param ingredients - Mapped ingredients
   * @param tagIds - Tag IDs
   * @returns Saved RecipeDTO
   */
  private async saveRecipe(
    userId: string,
    externalRecipe: ExternalRecipe,
    ingredients: CreateRecipeIngredientDTO[],
    tagIds: number[]
  ): Promise<RecipeDTO> {
    // Insert recipe
    const { data: recipe, error: recipeError } = await this.supabase
      .from('recipes')
      .insert({
        user_id: userId,
        title: externalRecipe.title,
        description: externalRecipe.description || null,
        instructions: externalRecipe.instructions,
        cooking_time: externalRecipe.cooking_time || null,
        difficulty: externalRecipe.difficulty || null,
        source: 'api',
        metadata: {
          external_id: externalRecipe.id,
          image_url: externalRecipe.image_url,
          source_url: externalRecipe.source_url,
          sources: externalRecipe.sources || [],
        },
      })
      .select('*')
      .single();

    if (recipeError || !recipe) {
      console.error('Error creating recipe:', recipeError);
      throw new Error('Failed to create recipe');
    }

    // Insert ingredients
    if (ingredients.length > 0) {
      const ingredientRows = ingredients.map((ing) => ({
        recipe_id: recipe.id,
        product_id: ing.product_id,
        quantity: ing.quantity,
        unit_id: ing.unit_id,
      }));

      const { error: ingredientsError } = await this.supabase
        .from('recipe_ingredients')
        .insert(ingredientRows);

      if (ingredientsError) {
        console.error('Error inserting ingredients:', ingredientsError);
        throw new Error('Failed to insert ingredients');
      }
    }

    // Insert tags
    if (tagIds.length > 0) {
      const tagRows = tagIds.map((tagId) => ({
        recipe_id: recipe.id,
        tag_id: tagId,
      }));

      const { error: tagsError } = await this.supabase
        .from('recipe_tags')
        .insert(tagRows);

      if (tagsError) {
        console.error('Error inserting tags:', tagsError);
        throw new Error('Failed to insert tags');
      }
    }

    // Fetch complete recipe with ingredients and tags
    const { data: completeRecipe, error: fetchError } = await this.supabase
      .from('recipes')
      .select(`
        *,
        recipe_ingredients (
          quantity,
          product_id,
          products!inner(id, name),
          unit_id,
          units!inner(id, name, abbreviation)
        ),
        recipe_tags (
          tags!inner(id, name, created_at)
        )
      `)
      .eq('id', recipe.id)
      .single();

    if (fetchError || !completeRecipe) {
      console.error('Error fetching complete recipe:', fetchError);
      throw new Error('Failed to fetch complete recipe');
    }

    // Transform to RecipeDTO
    return this.transformToRecipeDTO(completeRecipe);
  }

  /**
   * Transform database row to RecipeDTO
   */
  private transformToRecipeDTO(row: any): RecipeDTO {
    return {
      id: row.id,
      title: row.title,
      description: row.description,
      instructions: row.instructions,
      cooking_time: row.cooking_time,
      difficulty: row.difficulty,
      source: row.source,
      metadata: row.metadata,
      tags: (row.recipe_tags || []).map((rt: any) => ({
        id: rt.tags.id,
        name: rt.tags.name,
        created_at: rt.tags.created_at,
      })),
      ingredients: (row.recipe_ingredients || []).map((ri: any) => ({
        product: {
          id: ri.products.id,
          name: ri.products.name,
        },
        quantity: ri.quantity,
        unit: {
          id: ri.unit_id,
          name: ri.units.name,
          abbreviation: ri.units.abbreviation,
        },
      })),
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Generate unit abbreviation from unit name
   * Simple heuristic: take first 2-3 characters
   */
  private generateUnitAbbreviation(unitName: string): string {
    const name = unitName.toLowerCase().trim();
    
    // Common unit abbreviations
    const knownAbbreviations: Record<string, string> = {
      'tablespoon': 'tbsp',
      'teaspoon': 'tsp',
      'cup': 'cup',
      'ounce': 'oz',
      'pound': 'lb',
      'gram': 'g',
      'kilogram': 'kg',
      'milliliter': 'ml',
      'liter': 'l',
      'piece': 'pc',
      'clove': 'clove',
      'pinch': 'pinch',
    };

    return knownAbbreviations[name] || name.substring(0, 3);
  }
}

