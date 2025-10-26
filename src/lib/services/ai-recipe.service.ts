/**
 * AIRecipeService
 * 
 * Dedicated service for direct AI recipe generation
 * Used by POST /api/recipes/generate endpoint
 * 
 * Differs from RecipeDiscoveryService:
 * - No hierarchical search (goes directly to AI)
 * - Can specify exact products (not based on fridge)
 * - Optional saving to database
 * - Support for custom cuisine preferences
 */

import type { SupabaseClient } from '../../db/supabase.client';
import type {
  GenerateRecipeDTO,
  GenerateRecipeResponseDTO,
  RecipeDTO,
  ProductReferenceDTO,
  CreateRecipeIngredientDTO,
} from '../../types';
import { NotFoundError } from '../errors';
import { OpenRouterClient } from './ai/openrouter.client';
import { RecipePromptBuilder } from './ai/prompt-builder';
import { AIResponseValidator } from './ai/response-validator';
import type { AIRecipe } from './ai/response-validator';
import { ExternalRecipeMapper } from '../mappers/external-recipe-mapper';
import { buildAICacheKey } from '../utils/hash.utils';

/**
 * AIRecipeService class
 */
export class AIRecipeService {
  private openRouterClient: OpenRouterClient;
  private promptBuilder: RecipePromptBuilder;
  private aiValidator: AIResponseValidator;
  private recipeMapper: ExternalRecipeMapper;

  constructor(private supabase: SupabaseClient) {
    this.openRouterClient = new OpenRouterClient();
    this.promptBuilder = new RecipePromptBuilder();
    this.aiValidator = new AIResponseValidator();
    this.recipeMapper = new ExternalRecipeMapper(supabase);
  }

  /**
   * Generate recipe with AI
   * 
   * @param userId - Current authenticated user ID
   * @param generateDto - Generation parameters
   * @returns Generated recipe (saved or unsaved based on save_to_recipes flag)
   */
  async generateRecipe(
    userId: string,
    generateDto: GenerateRecipeDTO
  ): Promise<GenerateRecipeResponseDTO> {
    if (!this.openRouterClient.isConfigured()) {
      throw new Error('AI service is not configured');
    }

    // Step 1: Verify and fetch products
    const products = await this.verifyAndFetchProducts(userId, generateDto.product_ids);

    // Step 2: Check cache (optional - skip for now to ensure fresh generations)
    // const cacheKey = buildAICacheKey(generateDto.product_ids, generateDto.preferences);
    // ... cache logic ...

    // Step 3: Build user prompt
    const userPrompt = this.buildPromptWithCuisine(products, generateDto.preferences);

    // Step 4: Build system message
    const systemMessage = this.buildSystemMessage(generateDto.preferences);

    // Step 5: Call AI API with enhanced options
    const aiResponse = await this.openRouterClient.generateRecipe(userPrompt, {
      systemMessage,
      temperature: 0.8, // Nieco więcej kreatywności dla przepisów
    });

    // Step 6: Validate response
    const validatedRecipe = this.aiValidator.validate(aiResponse);

    // Step 6: Save to database if requested
    let savedRecipe: RecipeDTO;
    
    if (generateDto.save_to_recipes !== false) {
      savedRecipe = await this.saveAIRecipe(
        userId,
        validatedRecipe,
        products,
        generateDto
      );
    } else {
      // Return unsaved recipe (no ID)
      savedRecipe = await this.buildUnsavedRecipeDTO(
        validatedRecipe,
        userId,
        products,
        generateDto
      );
    }

    return {
      recipe: savedRecipe,
    };
  }

  /**
   * Build system message based on preferences
   */
  private buildSystemMessage(preferences?: GenerateRecipeDTO['preferences']): string {
    let message = 'You are a professional chef with expertise in creating delicious and practical recipes.';
    
    if (preferences?.cuisine) {
      message += ` You specialize in ${preferences.cuisine} cuisine.`;
    }
    
    if (preferences?.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
      const restrictions = preferences.dietary_restrictions.join(', ');
      message += ` All recipes must be ${restrictions}.`;
    }
    
    message += ' Focus on clear instructions and accurate ingredient measurements.';
    
    return message;
  }

  /**
   * Build user prompt without system instructions (moved to system message)
   */
  private buildPromptWithCuisine(
    products: ProductReferenceDTO[],
    preferences?: GenerateRecipeDTO['preferences']
  ): string {
    const productList = products.map(p => `- ${p.name}`).join('\n');
    
    const preferenceParts: string[] = [];

    if (preferences?.max_cooking_time) {
      preferenceParts.push(`- Maximum cooking time: ${preferences.max_cooking_time} minutes`);
    }

    if (preferences?.difficulty) {
      preferenceParts.push(`- Difficulty: ${preferences.difficulty}`);
    }

    const preferencesText = preferenceParts.length > 0
      ? `Constraints:\n${preferenceParts.join('\n')}\n`
      : '';

    // Uproszczony prompt - instrukcje systemowe przeniesione do system message
    return `Generate a recipe using these ingredients:

${productList}

${preferencesText}

You may add common pantry items (salt, pepper, oil, water) if needed, but prioritize the provided ingredients.`;
  }

  /**
   * Verify that all products exist and are accessible to the user
   * 
   * @param userId - User ID
   * @param productIds - Array of product IDs
   * @returns Array of product references
   */
  private async verifyAndFetchProducts(
    userId: string,
    productIds: number[]
  ): Promise<ProductReferenceDTO[]> {
    const uniqueIds = [...new Set(productIds)];

    const { data, error } = await this.supabase
      .from('products')
      .select('id, name')
      .in('id', uniqueIds)
      .or(`user_id.is.null,user_id.eq.${userId}`);

    if (error) {
      console.error('Error fetching products:', error);
      throw new Error('Failed to fetch products');
    }

    if (!data || data.length !== uniqueIds.length) {
      const foundIds = data?.map((p) => p.id) || [];
      const missingIds = uniqueIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundError(`Product not found: ${missingIds.join(', ')}`);
    }

    return data.map((p) => ({
      id: p.id,
      name: p.name,
    }));
  }

  /**
   * Save AI-generated recipe to database
   * 
   * @param userId - User ID
   * @param aiRecipe - Validated AI recipe
   * @param originalProducts - Original products used for generation
   * @param generateDto - Original generation DTO
   * @returns Saved recipe as RecipeDTO
   */
  private async saveAIRecipe(
    userId: string,
    aiRecipe: AIRecipe,
    originalProducts: ProductReferenceDTO[],
    generateDto: GenerateRecipeDTO
  ): Promise<RecipeDTO> {
    // Map AI ingredients using ProductMatcher
    const mappedIngredients = await this.recipeMapper['mapIngredients'](
      aiRecipe.ingredients.map(ing => ({
        name: ing.product_name,
        quantity: ing.quantity,
        unit: ing.unit,
      })),
      userId
    );

    // Map tags
    const tagIds = await this.recipeMapper['mapTags'](aiRecipe.tags || []);

    // Insert recipe with source='ai' and metadata
    const { data: recipe, error: recipeError } = await this.supabase
      .from('recipes')
      .insert({
        user_id: userId,
        title: aiRecipe.title,
        description: aiRecipe.description || null,
        instructions: aiRecipe.instructions,
        cooking_time: aiRecipe.cooking_time || null,
        difficulty: aiRecipe.difficulty || null,
        source: 'ai',
        metadata: {
          ai_model: import.meta.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
          generation_timestamp: new Date().toISOString(),
          input_products: originalProducts.map(p => p.id),
          preferences: generateDto.preferences ? {
            cuisine: generateDto.preferences.cuisine,
            max_cooking_time: generateDto.preferences.max_cooking_time,
            difficulty: generateDto.preferences.difficulty,
            dietary_restrictions: generateDto.preferences.dietary_restrictions,
          } : {},
        } as any,
      })
      .select('*')
      .single();

    if (recipeError || !recipe) {
      console.error('Error creating AI recipe:', recipeError);
      throw new Error('Failed to create AI recipe');
    }

    // Insert ingredients
    if (mappedIngredients.length > 0) {
      const ingredientRows = mappedIngredients.map((ing) => ({
        recipe_id: recipe.id,
        product_id: ing.product_id,
        quantity: ing.quantity,
        unit_id: ing.unit_id,
      }));

      const { error: ingredientsError } = await this.supabase
        .from('recipe_ingredients')
        .insert(ingredientRows);

      if (ingredientsError) {
        console.error('Error inserting AI recipe ingredients:', ingredientsError);
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
        console.error('Error inserting AI recipe tags:', tagsError);
        throw new Error('Failed to insert tags');
      }
    }

    // Fetch complete recipe with all relations
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
      console.error('Error fetching complete AI recipe:', fetchError);
      throw new Error('Failed to fetch complete recipe');
    }

    // Transform to RecipeDTO
    return this.transformToRecipeDTO(completeRecipe);
  }

  /**
   * Build unsaved recipe DTO (when save_to_recipes = false)
   * This creates a RecipeDTO without saving to database
   */
  private async buildUnsavedRecipeDTO(
    aiRecipe: AIRecipe,
    userId: string,
    originalProducts: ProductReferenceDTO[],
    generateDto: GenerateRecipeDTO
  ): Promise<RecipeDTO> {
    // Map ingredients (this will create products/units if needed)
    const mappedIngredients = await this.recipeMapper['mapIngredients'](
      aiRecipe.ingredients.map(ing => ({
        name: ing.product_name,
        quantity: ing.quantity,
        unit: ing.unit,
      })),
      userId
    );

    // Map tags (this will create tags if needed)
    const tagIds = await this.recipeMapper['mapTags'](aiRecipe.tags || []);

    // Fetch tag details
    const { data: tags } = await this.supabase
      .from('tags')
      .select('id, name, created_at')
      .in('id', tagIds);

    // Fetch product and unit details for ingredients
    const ingredientDTOs = await Promise.all(
      mappedIngredients.map(async (ing) => {
        const { data: product } = await this.supabase
          .from('products')
          .select('id, name')
          .eq('id', ing.product_id)
          .single();

        const { data: unit } = await this.supabase
          .from('units')
          .select('id, name, abbreviation')
          .eq('id', ing.unit_id)
          .single();

        return {
          product: { id: product!.id, name: product!.name },
          quantity: ing.quantity,
          unit: { id: unit!.id, name: unit!.name, abbreviation: unit!.abbreviation },
        };
      })
    );

    // Return RecipeDTO without ID (indicating it's not saved)
    return {
      id: 0, // No ID = not saved
      title: aiRecipe.title,
      description: aiRecipe.description || null,
      instructions: aiRecipe.instructions,
      cooking_time: aiRecipe.cooking_time || null,
      difficulty: aiRecipe.difficulty || null,
      source: 'ai',
      metadata: {
        ai_model: import.meta.env.OPENROUTER_MODEL || 'anthropic/claude-3-haiku',
        generation_timestamp: new Date().toISOString(),
        input_products: originalProducts.map(p => p.id),
        preferences: generateDto.preferences ? {
          cuisine: generateDto.preferences.cuisine,
          max_cooking_time: generateDto.preferences.max_cooking_time,
          difficulty: generateDto.preferences.difficulty,
          dietary_restrictions: generateDto.preferences.dietary_restrictions,
        } : {},
        saved: false,
      } as any,
      tags: (tags || []).map(t => ({
        id: t.id,
        name: t.name,
        created_at: t.created_at,
      })),
      ingredients: ingredientDTOs,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
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
}

