/**
 * RecipeDiscoveryService - Business logic for Recipe Discovery & Search
 * 
 * Implements hierarchical recipe search (Tier 1: User Recipes)
 * - Tier 1: Search user's own recipes
 * - Tier 2: Search external API (to be implemented)
 * - Tier 3: AI generation (to be implemented)
 * 
 * This service orchestrates the search across all tiers with fallback logic.
 */

import type { SupabaseClient } from '../../db/supabase.client';
import type {
  SearchRecipesByFridgeDTO,
  SearchRecipesResponseDTO,
  RecipeSearchResultDTO,
  RecipeSummaryDTO,
  RecipeIngredientDTO,
  TagDTO,
  FridgeItemDTO,
  SearchMetadataDTO,
  ProductReferenceDTO,
} from '../../types';
import { NotFoundError, ValidationError } from '../errors';
import { MatchScoreCalculator } from '../utils/match-score.calculator';
import { filterByPreferences } from '../utils/preferences-filter';
import { ExternalAPIService } from './external-api.service';
import { ExternalRecipeMapper } from '../mappers/external-recipe-mapper';
import { OpenRouterClient } from './ai/openrouter.client';
import { RecipePromptBuilder } from './ai/prompt-builder';
import { AIResponseValidator } from './ai/response-validator';
import type { AIRecipe } from './ai/response-validator';

/**
 * Default match score threshold for considering a recipe as "good match"
 */
const DEFAULT_MATCH_THRESHOLD = 0.7;

/**
 * RecipeDiscoveryService class
 * Requires SupabaseClient instance with authenticated user context
 */
export class RecipeDiscoveryService {
  private matchScoreCalculator: MatchScoreCalculator;
  private externalAPIService: ExternalAPIService;
  private externalRecipeMapper: ExternalRecipeMapper;
  private openRouterClient: OpenRouterClient;
  private promptBuilder: RecipePromptBuilder;
  private aiValidator: AIResponseValidator;

  constructor(private supabase: SupabaseClient) {
    this.matchScoreCalculator = new MatchScoreCalculator();
    this.externalAPIService = new ExternalAPIService();
    this.externalRecipeMapper = new ExternalRecipeMapper(supabase);
    this.openRouterClient = new OpenRouterClient();
    this.promptBuilder = new RecipePromptBuilder();
    this.aiValidator = new AIResponseValidator();
  }

  /**
   * Main search method - orchestrates hierarchical search across all tiers
   * 
   * @param userId - Current authenticated user ID
   * @param searchDto - Search parameters
   * @returns Search results with metadata
   */
  async searchByFridge(
    userId: string,
    searchDto: SearchRecipesByFridgeDTO
  ): Promise<SearchRecipesResponseDTO> {
    const startTime = Date.now();

    try {
      // Step 1: Get available products from fridge
      const availableProducts = await this.getAvailableProducts(userId, searchDto);

      if (availableProducts.length === 0) {
        throw new ValidationError('No products available in fridge');
      }

      // Step 2: Tier 1 - Search user recipes
      const tier1Results = await this.searchUserRecipes(
        userId,
        availableProducts,
        searchDto
      );

      // Check if we have good matches in Tier 1
      if (this.hasGoodMatches(tier1Results)) {
        const duration = Date.now() - startTime;
        return this.buildResponse(tier1Results, 'user_recipes', tier1Results.length, duration);
      }

      // Step 3: Tier 2 - External API search (if Tier 1 not sufficient)
      try {
        const tier2Results = await this.searchExternalAPI(
          userId,
          availableProducts,
          searchDto
        );

        if (tier2Results.length > 0) {
          const duration = Date.now() - startTime;
          return this.buildResponse(tier2Results, 'external_api', tier2Results.length, duration);
        }
      } catch (error) {
        console.error('Tier 2 (External API) failed, continuing...', error);
        // Continue to next tier or return Tier 1 results
      }

      // Step 4: Tier 3 - AI generation (last resort)
      if (this.openRouterClient.isConfigured()) {
        try {
          const tier3Results = await this.generateWithAI(
            userId,
            availableProducts,
            searchDto
          );

          if (tier3Results.length > 0) {
            const duration = Date.now() - startTime;
            return this.buildResponse(tier3Results, 'ai_generated', tier3Results.length, duration);
          }
        } catch (error) {
          console.error('Tier 3 (AI Generation) failed:', error);
          // Continue to fallback
        }
      }

      // Fallback: Return Tier 1 results even if not "good" matches
      const duration = Date.now() - startTime;
      return this.buildResponse(tier1Results, 'user_recipes', tier1Results.length, duration);

    } catch (error) {
      console.error('Error in searchByFridge:', error);
      throw error;
    }
  }

  /**
   * Tier 1: Search in user's own recipes
   * 
   * @param userId - User ID
   * @param availableProducts - Products available in fridge
   * @param searchDto - Search parameters
   * @returns Array of recipe search results with match scores
   */
  async searchUserRecipes(
    userId: string,
    availableProducts: FridgeItemDTO[],
    searchDto: SearchRecipesByFridgeDTO
  ): Promise<RecipeSearchResultDTO[]> {
    // Fetch all user recipes with ingredients and tags
    const recipes = await this.fetchUserRecipesWithDetails(userId);

    if (recipes.length === 0) {
      return [];
    }

    // Calculate match scores for each recipe
    const results: RecipeSearchResultDTO[] = recipes.map((recipe) => {
      const matchResult = this.matchScoreCalculator.calculate(
        recipe.ingredients,
        availableProducts
      );

      return {
        recipe,
        match_score: matchResult.score,
        available_ingredients: matchResult.available_ingredients,
        missing_ingredients: matchResult.missing_ingredients,
      };
    });

    // Filter by preferences (cooking time, difficulty, dietary restrictions)
    const filteredResults = results.filter((result) =>
      filterByPreferences([result.recipe], searchDto.preferences).length > 0
    );

    // Sort by match score (descending - best matches first)
    const sortedResults = filteredResults.sort((a, b) => b.match_score - a.match_score);

    // Limit results to max_results
    const maxResults = searchDto.max_results || 10;
    return sortedResults.slice(0, maxResults);
  }

  /**
   * Tier 2: Search external recipe API
   * 
   * @param userId - User ID
   * @param availableProducts - Products available in fridge
   * @param searchDto - Search parameters
   * @returns Array of recipe search results with match scores
   */
  async searchExternalAPI(
    userId: string,
    availableProducts: FridgeItemDTO[],
    searchDto: SearchRecipesByFridgeDTO
  ): Promise<RecipeSearchResultDTO[]> {
    // Convert fridge items to product names for API search
    const productNames = this.extractProductNames(availableProducts);

    if (productNames.length === 0) {
      return [];
    }

    // Call external API
    const externalRecipes = await this.externalAPIService.searchRecipes(
      productNames,
      searchDto.preferences
    );

    if (externalRecipes.length === 0) {
      return [];
    }

    // Map and save top recipes (limit to 3 to avoid spam)
    const recipesToSave = externalRecipes.slice(0, 3);
    const savedRecipes: RecipeSummaryDTO[] = [];

    for (const externalRecipe of recipesToSave) {
      try {
        const saved = await this.externalRecipeMapper.mapAndSave(externalRecipe, userId);
        
        // Convert RecipeDTO to RecipeSummaryDTO (remove metadata)
        const { metadata, ...summary } = saved;
        savedRecipes.push(summary);
      } catch (error) {
        console.error('Error saving external recipe:', error);
        // Continue with other recipes
      }
    }

    if (savedRecipes.length === 0) {
      return [];
    }

    // Calculate match scores for saved recipes
    const results: RecipeSearchResultDTO[] = savedRecipes.map((recipe) => {
      const matchResult = this.matchScoreCalculator.calculate(
        recipe.ingredients,
        availableProducts
      );

      return {
        recipe,
        match_score: matchResult.score,
        available_ingredients: matchResult.available_ingredients,
        missing_ingredients: matchResult.missing_ingredients,
      };
    });

    // Sort by match score
    const sortedResults = results.sort((a, b) => b.match_score - a.match_score);

    // Limit results to max_results
    const maxResults = searchDto.max_results || 10;
    return sortedResults.slice(0, maxResults);
  }

  /**
   * Tier 3: Generate recipe with AI
   * 
   * @param userId - User ID
   * @param availableProducts - Products available in fridge
   * @param searchDto - Search parameters
   * @returns Array of recipe search results with match scores
   */
  async generateWithAI(
    userId: string,
    availableProducts: FridgeItemDTO[],
    searchDto: SearchRecipesByFridgeDTO
  ): Promise<RecipeSearchResultDTO[]> {
    // Extract product references for AI
    const products: ProductReferenceDTO[] = availableProducts.map(item => ({
      id: item.product.id,
      name: item.product.name,
    }));

    if (products.length === 0) {
      return [];
    }

    // Build prompt
    const prompt = this.promptBuilder.build(products, searchDto.preferences);

    // Call AI API
    const aiResponse = await this.openRouterClient.generateRecipe(prompt);

    // Validate response
    const validatedRecipe = this.aiValidator.validate(aiResponse);

    // Map and save AI recipe to database
    const savedRecipe = await this.saveAIRecipe(
      userId,
      validatedRecipe,
      products,
      searchDto
    );

    // Calculate match score
    const matchResult = this.matchScoreCalculator.calculate(
      savedRecipe.ingredients,
      availableProducts
    );

    return [
      {
        recipe: savedRecipe,
        match_score: matchResult.score,
        available_ingredients: matchResult.available_ingredients,
        missing_ingredients: matchResult.missing_ingredients,
      },
    ];
  }

  /**
   * Save AI-generated recipe to database
   * 
   * @param userId - User ID
   * @param aiRecipe - Validated AI recipe
   * @param originalProducts - Original products used for generation
   * @param searchDto - Original search DTO
   * @returns Saved recipe as RecipeSummaryDTO
   */
  private async saveAIRecipe(
    userId: string,
    aiRecipe: AIRecipe,
    originalProducts: ProductReferenceDTO[],
    searchDto: SearchRecipesByFridgeDTO
  ): Promise<RecipeSummaryDTO> {
    // Map AI ingredients using ProductMatcher (from ExternalRecipeMapper)
    const mappedIngredients = await this.externalRecipeMapper['mapIngredients'](
      aiRecipe.ingredients.map(ing => ({
        name: ing.product_name,
        quantity: ing.quantity,
        unit: ing.unit,
      })),
      userId
    );

    // Map tags
    const tagIds = await this.externalRecipeMapper['mapTags'](aiRecipe.tags || []);

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
          preferences: searchDto.preferences ? {
            max_cooking_time: searchDto.preferences.max_cooking_time,
            difficulty: searchDto.preferences.difficulty,
            dietary_restrictions: searchDto.preferences.dietary_restrictions,
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

    // Fetch complete recipe
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

    // Transform to RecipeSummaryDTO
    return {
      id: completeRecipe.id,
      title: completeRecipe.title,
      description: completeRecipe.description,
      instructions: completeRecipe.instructions,
      cooking_time: completeRecipe.cooking_time,
      difficulty: completeRecipe.difficulty,
      source: completeRecipe.source,
      tags: (completeRecipe.recipe_tags || []).map((rt: any) => ({
        id: rt.tags.id,
        name: rt.tags.name,
        created_at: rt.tags.created_at,
      })),
      ingredients: (completeRecipe.recipe_ingredients || []).map((ri: any) => ({
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
      created_at: completeRecipe.created_at,
      updated_at: completeRecipe.updated_at,
    };
  }

  /**
   * Extract product names from fridge items
   * 
   * @param fridgeItems - Array of fridge items
   * @returns Array of product names
   */
  private extractProductNames(fridgeItems: FridgeItemDTO[]): string[] {
    return fridgeItems.map(item => item.product.name);
  }

  /**
   * Get available products from user's fridge
   * 
   * @param userId - User ID
   * @param searchDto - Search parameters
   * @returns Array of fridge items
   */
  private async getAvailableProducts(
    userId: string,
    searchDto: SearchRecipesByFridgeDTO
  ): Promise<FridgeItemDTO[]> {
    if (searchDto.use_all_fridge_items) {
      // Fetch all products from user's fridge
      return await this.fetchAllFridgeItems(userId);
    } else {
      // Fetch only specified products
      if (!searchDto.custom_product_ids || searchDto.custom_product_ids.length === 0) {
        throw new ValidationError('custom_product_ids required when use_all_fridge_items is false');
      }
      return await this.fetchSpecificFridgeItems(userId, searchDto.custom_product_ids);
    }
  }

  /**
   * Fetch all items from user's fridge
   * 
   * @param userId - User ID
   * @returns Array of fridge items
   */
  private async fetchAllFridgeItems(userId: string): Promise<FridgeItemDTO[]> {
    const { data, error } = await this.supabase
      .from('user_products')
      .select(`
        id,
        product_id,
        quantity,
        unit_id,
        expiry_date,
        created_at,
        products!inner(id, name),
        units!inner(id, name, abbreviation)
      `)
      .eq('user_id', userId);

    if (error) {
      console.error('Error fetching fridge items:', error);
      throw new Error('Failed to fetch fridge items');
    }

    return (data || []).map((row: any) => this.transformFridgeItem(row));
  }

  /**
   * Fetch specific items from user's fridge by product IDs
   * 
   * @param userId - User ID
   * @param productIds - Array of product IDs
   * @returns Array of fridge items
   */
  private async fetchSpecificFridgeItems(
    userId: string,
    productIds: number[]
  ): Promise<FridgeItemDTO[]> {
    const { data, error } = await this.supabase
      .from('user_products')
      .select(`
        id,
        product_id,
        quantity,
        unit_id,
        expiry_date,
        created_at,
        products!inner(id, name),
        units!inner(id, name, abbreviation)
      `)
      .eq('user_id', userId)
      .in('product_id', productIds);

    if (error) {
      console.error('Error fetching specific fridge items:', error);
      throw new Error('Failed to fetch fridge items');
    }

    if (!data || data.length === 0) {
      throw new NotFoundError('No fridge items found for specified product IDs');
    }

    // Verify all requested products were found
    const foundProductIds = data.map((row: any) => row.product_id);
    const missingIds = productIds.filter(id => !foundProductIds.includes(id));
    
    if (missingIds.length > 0) {
      throw new NotFoundError(`Products not found in fridge: ${missingIds.join(', ')}`);
    }

    return (data || []).map((row: any) => this.transformFridgeItem(row));
  }

  /**
   * Transform raw database row to FridgeItemDTO
   */
  private transformFridgeItem(row: any): FridgeItemDTO {
    return {
      id: row.id,
      product: {
        id: row.products.id,
        name: row.products.name,
      },
      quantity: row.quantity,
      unit: {
        id: row.unit_id,
        name: row.units.name,
        abbreviation: row.units.abbreviation,
      },
      expiry_date: row.expiry_date,
      created_at: row.created_at,
    };
  }

  /**
   * Fetch all user recipes with ingredients and tags
   * 
   * @param userId - User ID
   * @returns Array of recipe summaries
   */
  private async fetchUserRecipesWithDetails(userId: string): Promise<RecipeSummaryDTO[]> {
    // Fetch base recipe data
    const { data: recipes, error } = await this.supabase
      .from('recipes')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching recipes:', error);
      throw new Error('Failed to fetch recipes');
    }

    if (!recipes || recipes.length === 0) {
      return [];
    }

    const recipeIds = recipes.map((r: any) => r.id);

    // Batch load ingredients and tags
    const [ingredientsMap, tagsMap] = await Promise.all([
      this.batchLoadIngredients(recipeIds),
      this.batchLoadTags(recipeIds),
    ]);

    // Transform to RecipeSummaryDTO
    return recipes.map((recipe: any) => ({
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
  }

  /**
   * Batch load ingredients for multiple recipes
   * 
   * @param recipeIds - Array of recipe IDs
   * @returns Map of recipe_id to ingredients array
   */
  private async batchLoadIngredients(
    recipeIds: number[]
  ): Promise<Map<number, RecipeIngredientDTO[]>> {
    const { data, error } = await this.supabase
      .from('recipe_ingredients')
      .select(`
        recipe_id,
        quantity,
        product_id,
        products!inner(id, name),
        unit_id,
        units!inner(id, name, abbreviation)
      `)
      .in('recipe_id', recipeIds);

    if (error) {
      console.error('Error batch loading ingredients:', error);
      throw new Error('Failed to load ingredients');
    }

    const ingredientsMap = new Map<number, RecipeIngredientDTO[]>();
    (data || []).forEach((row: any) => {
      const ingredient: RecipeIngredientDTO = {
        product: {
          id: row.products.id,
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
   * Batch load tags for multiple recipes
   * 
   * @param recipeIds - Array of recipe IDs
   * @returns Map of recipe_id to tags array
   */
  private async batchLoadTags(recipeIds: number[]): Promise<Map<number, TagDTO[]>> {
    const { data, error } = await this.supabase
      .from('recipe_tags')
      .select(`
        recipe_id,
        tags!inner(id, name, created_at)
      `)
      .in('recipe_id', recipeIds);

    if (error) {
      console.error('Error batch loading tags:', error);
      throw new Error('Failed to load tags');
    }

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
   * Check if results contain at least one "good match"
   * Good match = score >= threshold
   */
  private hasGoodMatches(
    results: RecipeSearchResultDTO[],
    threshold: number = DEFAULT_MATCH_THRESHOLD
  ): boolean {
    return results.some((result) => result.match_score >= threshold);
  }

  /**
   * Build final response with metadata
   */
  private buildResponse(
    results: RecipeSearchResultDTO[],
    source: 'user_recipes' | 'external_api' | 'ai_generated',
    totalResults: number,
    durationMs: number
  ): SearchRecipesResponseDTO {
    const metadata: SearchMetadataDTO = {
      source,
      total_results: totalResults,
      search_duration_ms: durationMs,
    };

    return {
      results,
      search_metadata: metadata,
    };
  }
}

