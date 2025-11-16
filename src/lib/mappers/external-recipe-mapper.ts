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
import { translateIngredientToPolish } from '../utils/ingredient-translator';
import { translateUnit } from '../utils/unit-translator';

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
      // Step 0: Check if recipe already exists (by external_id)
      console.log(`📦 [MAPPER] Checking if recipe already exists: ${externalRecipe.title} (external_id: ${externalRecipe.id})`);
      
      const existingRecipe = await this.findExistingRecipe(userId, externalRecipe.id);
      
      if (existingRecipe) {
        console.log(`📦 [MAPPER] ⚠️ Recipe already exists (id: ${existingRecipe.id})`);
        
        // Check if existing recipe needs translation update (title or ingredients are in English)
        const needsTranslationUpdate = this.isEnglishTitle(existingRecipe.title) || 
                                       this.hasEnglishIngredients(existingRecipe.ingredients);
        
        if (needsTranslationUpdate && this.isPolishTitle(externalRecipe.title)) {
          console.log(`📦 [MAPPER] 🔄 Recipe needs full translation update (title + ingredients + tags)`);
          console.log(`📦 [MAPPER] 🗑️ Deleting old recipe and creating new one...`);
          
          // Delete old recipe (will cascade delete ingredients and tags)
          await this.deleteRecipe(existingRecipe.id);
          console.log(`📦 [MAPPER] ✅ Old recipe deleted`);
          
          // Continue to create new recipe with Polish translation below
          console.log(`📦 [MAPPER] 📝 Creating new recipe with Polish translation...`);
        } else {
          console.log(`📦 [MAPPER] ✅ Returning existing recipe (already fully translated)`);
          return existingRecipe;
        }
      } else {
        console.log(`📦 [MAPPER] Recipe not found, creating new one...`);
      }

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

      console.log(`📦 [MAPPER] ✅ Recipe saved successfully (id: ${recipe.id})`);
      return recipe;
      
    } catch (error) {
      console.error('Error mapping external recipe:', error);
      throw new Error('Failed to map external recipe');
    }
  }

  /**
   * Find existing recipe by external_id
   * 
   * @param userId - User ID
   * @param externalId - External recipe ID
   * @returns Existing RecipeDTO or null
   */
  private async findExistingRecipe(userId: string, externalId: string): Promise<RecipeDTO | null> {
    try {
      const { data, error } = await this.supabase
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
        .eq('user_id', userId)
        .eq('source', 'api')
        .filter('metadata->>external_id', 'eq', externalId)
        .maybeSingle();

      if (error) {
        console.error('Error finding existing recipe:', error);
        return null;
      }

      if (!data) {
        return null;
      }

      return this.transformToRecipeDTO(data);
      
    } catch (error) {
      console.error('Error in findExistingRecipe:', error);
      return null;
    }
  }

  /**
   * Check if title is in English (simple heuristic)
   */
  private isEnglishTitle(title: string): boolean {
    // Common English recipe words
    const englishWords = ['with', 'and', 'the', 'bake', 'burger', 'ball', 'pie', 'stuffed'];
    const lowerTitle = title.toLowerCase();
    return englishWords.some(word => lowerTitle.includes(word));
  }

  /**
   * Check if title is in Polish (simple heuristic)
   */
  private isPolishTitle(title: string): boolean {
    // Common Polish recipe words
    const polishWords = ['z', 'i', 'na', 'pieczon', 'grillowany', 'nadziewan', 'zapiekanka', 'klopsik'];
    const lowerTitle = title.toLowerCase();
    return polishWords.some(word => lowerTitle.includes(word));
  }

  /**
   * Check if recipe has English ingredient names
   */
  private hasEnglishIngredients(ingredients: any[]): boolean {
    if (!ingredients || ingredients.length === 0) return false;
    
    // Check first few ingredients
    const sampleSize = Math.min(3, ingredients.length);
    for (let i = 0; i < sampleSize; i++) {
      const productName = ingredients[i].product?.name?.toLowerCase() || '';
      // Common English ingredient words
      if (productName.includes('ground') || 
          productName.includes('beef') ||
          productName.includes('pepper') ||
          productName === 'egg' ||
          productName === 'onion' ||
          productName === 'oil') {
        return true;
      }
    }
    return false;
  }

  /**
   * Delete recipe by ID (cascades to ingredients and tags)
   */
  private async deleteRecipe(recipeId: number): Promise<void> {
    const { error } = await this.supabase
      .from('recipes')
      .delete()
      .eq('id', recipeId);

    if (error) {
      console.error('Error deleting recipe:', error);
      throw new Error('Failed to delete recipe');
    }
  }

  /**
   * Check if a word is likely English (simple heuristic)
   */
  private isEnglishWord(word: string): boolean {
    // Skip if empty or very short
    if (!word || word.length < 3) return false;
    
    // Skip if it's a number or contains mostly numbers
    if (/^\d+$/.test(word)) return false;
    
    // Polish-specific characters - if present, it's likely Polish already
    const polishChars = /[ąćęłńóśźż]/i;
    if (polishChars.test(word)) return false;
    
    // If it contains common English patterns, it's likely English
    return true;
  }

  /**
   * Update existing recipe with Polish translation
   * 
   * @param recipeId - Recipe ID to update
   * @param externalRecipe - New recipe data with Polish translation
   * @returns Updated RecipeDTO
   */
  private async updateRecipeTranslation(recipeId: number, externalRecipe: ExternalRecipe): Promise<RecipeDTO> {
    // Update recipe title, description, and instructions
    const { error: updateError } = await this.supabase
      .from('recipes')
      .update({
        title: externalRecipe.title,
        description: externalRecipe.description || null,
        instructions: externalRecipe.instructions,
        updated_at: new Date().toISOString(),
      })
      .eq('id', recipeId);

    if (updateError) {
      console.error('Error updating recipe translation:', updateError);
      throw new Error('Failed to update recipe translation');
    }

    // Fetch updated recipe with all relations
    const { data, error: fetchError } = await this.supabase
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
      .eq('id', recipeId)
      .single();

    if (fetchError || !data) {
      console.error('Error fetching updated recipe:', fetchError);
      throw new Error('Failed to fetch updated recipe');
    }

    return this.transformToRecipeDTO(data);
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

    // First pass: translate using dictionary
    const ingredientsToTranslate: Array<{ original: typeof externalIngredients[0]; index: number; needsLLM: boolean }> = [];
    
    for (let i = 0; i < externalIngredients.length; i++) {
      const ingredient = externalIngredients[i];
      const dictionaryTranslation = translateIngredientToPolish(ingredient.name);
      const needsLLM = dictionaryTranslation === ingredient.name; // Still in English = not in dictionary
      
      ingredientsToTranslate.push({
        original: ingredient,
        index: i,
        needsLLM: needsLLM && this.isEnglishWord(ingredient.name)
      });
    }

    // Second pass: translate unknowns with LLM (batch)
    const llmTranslations = new Map<number, string>();
    const needsLLM = ingredientsToTranslate.filter(item => item.needsLLM);
    
    if (needsLLM.length > 0) {
      console.log(`🤖 [MAPPER] ${needsLLM.length} ingredients need LLM translation`);
      
      // Use dynamic import to avoid circular dependency
      const { translateIngredientWithLLM } = await import('../utils/ingredient-translator');
      
      for (const item of needsLLM) {
        try {
          const translated = await translateIngredientWithLLM(item.original.name);
          llmTranslations.set(item.index, translated);
        } catch (error) {
          console.error(`❌ Failed to translate "${item.original.name}":`, error);
        }
      }
    }

    // Third pass: create mapped ingredients with final translations
    for (let i = 0; i < externalIngredients.length; i++) {
      const ingredient = externalIngredients[i];
      
      // Get final Polish name (LLM translation if available, otherwise dictionary)
      let polishName = llmTranslations.get(i) || translateIngredientToPolish(ingredient.name);
      
      // Translate unit from English to Polish
      const polishUnit = translateUnit(ingredient.unit);
      
      console.log(`📦 [MAPPER] Ingredient: "${ingredient.name}" (${ingredient.unit}) → "${polishName}" (${polishUnit})`);
      
      // Find or create product using Polish name
      const product = await this.productMatcher.findOrCreate(polishName, userId);

      // Find or create unit using Polish name
      const unit = await this.findOrCreateUnit(polishUnit);

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

    // Insert ingredients (deduplicate and sum quantities for same product_id)
    if (ingredients.length > 0) {
      // Group by product_id and unit_id, sum quantities
      const ingredientMap = new Map<string, { product_id: number; quantity: number; unit_id: number }>();
      
      for (const ing of ingredients) {
        const key = `${ing.product_id}_${ing.unit_id}`;
        const existing = ingredientMap.get(key);
        
        if (existing) {
          // Sum quantities for duplicate ingredients
          existing.quantity += ing.quantity;
          console.log(`📦 [MAPPER] Duplicate ingredient detected, summing quantities: product_id=${ing.product_id}, new total=${existing.quantity}`);
        } else {
          ingredientMap.set(key, {
            product_id: ing.product_id,
            quantity: ing.quantity,
            unit_id: ing.unit_id,
          });
        }
      }
      
      // Convert map to rows
      const ingredientRows = Array.from(ingredientMap.values()).map((ing) => ({
        recipe_id: recipe.id,
        product_id: ing.product_id,
        quantity: ing.quantity,
        unit_id: ing.unit_id,
      }));

      console.log(`📦 [MAPPER] Inserting ${ingredientRows.length} unique ingredients (deduplicated from ${ingredients.length})`);

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

