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

      const requestedSource = searchDto.source || 'all';

      // If specific source requested, search only that tier
      if (requestedSource === 'user') {
        const tier1Results = await this.searchUserRecipes(userId, availableProducts, searchDto);
        const duration = Date.now() - startTime;
        return this.buildResponse(tier1Results, 'user_recipes', tier1Results.length, duration);
      }

      if (requestedSource === 'api') {
        try {
          const tier2Results = await this.searchExternalAPI(userId, availableProducts, searchDto);
          const duration = Date.now() - startTime;
          return this.buildResponse(tier2Results, 'external_api', tier2Results.length, duration);
        } catch (error) {
          console.error('External API search failed:', error);
          const duration = Date.now() - startTime;
          return this.buildResponse([], 'external_api', 0, duration);
        }
      }

      if (requestedSource === 'ai') {
        const isConfigured = this.openRouterClient.isConfigured();
        if (!isConfigured) {
          throw new ValidationError('AI service is not configured. Please set OPENROUTER_API_KEY.');
        }

        try {
          const tier3Results = await this.generateWithAI(userId, availableProducts, searchDto);
          const duration = Date.now() - startTime;
          return this.buildResponse(tier3Results, 'ai_generated', tier3Results.length, duration);
        } catch (error) {
          console.error('AI generation failed:', error);
          throw error;
        }
      }

      // Hierarchical search (source = 'all')
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
      const isConfigured = this.openRouterClient.isConfigured();
      console.log('🤖 [DEBUG] OpenRouter isConfigured:', isConfigured);
      console.log('🤖 [DEBUG] API Key exists:', !!import.meta.env.OPENROUTER_API_KEY);
      console.log('🤖 [DEBUG] API Key value:', import.meta.env.OPENROUTER_API_KEY ? `${import.meta.env.OPENROUTER_API_KEY.substring(0, 10)}...` : 'undefined');
      
      if (isConfigured) {
        console.log('🤖 [DEBUG] Attempting AI generation (Tier 3)...');
        try {
          const tier3Results = await this.generateWithAI(
            userId,
            availableProducts,
            searchDto
          );

          if (tier3Results.length > 0) {
            const duration = Date.now() - startTime;
            console.log('🤖 [DEBUG] AI generation SUCCESS! Recipe generated.');
            return this.buildResponse(tier3Results, 'ai_generated', tier3Results.length, duration);
          } else {
            console.log('🤖 [DEBUG] AI generation returned empty results');
          }
        } catch (error) {
          console.error('❌ [DEBUG] Tier 3 (AI Generation) failed:', error);
          // Continue to fallback
        }
      } else {
        console.log('⚠️ [DEBUG] OpenRouter NOT configured - skipping AI generation');
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
   * Tier 3: Generate multiple recipes with AI
   * 
   * @param userId - User ID
   * @param availableProducts - Products available in fridge
   * @param searchDto - Search parameters
   * @returns Array of recipe search results with match scores (sorted by match score)
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

    // Build user prompt
    const userPrompt = this.promptBuilder.build(products, searchDto.preferences);

    // Build system message based on preferences
    const systemMessage = this.buildSystemMessage(searchDto.preferences);

    console.log('🤖 [AI] Requesting 5 recipes from OpenRouter...');

    // Call AI API with enhanced options (increased max_tokens for 5 recipes)
    const aiResponse = await this.openRouterClient.generateRecipe(userPrompt, {
      systemMessage,
      temperature: 0.8, // Zwiększona kreatywność dla discovery
      maxTokens: 40000, // Zwiększone tokeny dla 5 przepisów
    });

    // Validate response - expects array of recipes
    const validatedRecipes = this.aiValidator.validateMultiple(aiResponse);

    console.log(`🤖 [AI] Received ${validatedRecipes.length} recipes, building temporary results...`);

    // Build temporary recipes WITHOUT saving to database
    const results: RecipeSearchResultDTO[] = [];

    for (const [index, validatedRecipe] of validatedRecipes.entries()) {
      try {
        console.log(`🔨 [AI] Building temporary recipe ${index + 1}/${validatedRecipes.length}: "${validatedRecipe.title}"`);
        
        // Build temporary AI recipe (NOT saved to database)
        const temporaryRecipe = await this.buildTemporaryAIRecipe(
          userId,
          validatedRecipe,
          products,
          searchDto
        );

        // Calculate match score
        const matchResult = this.matchScoreCalculator.calculate(
          temporaryRecipe.ingredients,
          availableProducts
        );

        results.push({
          recipe: temporaryRecipe,
          match_score: matchResult.score,
          available_ingredients: matchResult.available_ingredients,
          missing_ingredients: matchResult.missing_ingredients,
        });

        console.log(`✅ [AI] Recipe "${validatedRecipe.title}" built with match score: ${matchResult.score.toFixed(2)}`);
      } catch (error) {
        console.error(`❌ [AI] Failed to build recipe "${validatedRecipe.title}":`, error);
        // Continue with other recipes
      }
    }

    // Sort by match score (descending - best first)
    const sortedResults = results.sort((a, b) => b.match_score - a.match_score);

    console.log(`🎯 [AI] Successfully generated ${sortedResults.length} temporary recipes (not saved)`);

    return sortedResults;
  }

  /**
   * Build system message based on search preferences
   * 
   * @param preferences - Search preferences
   * @returns System message for AI model
   */
  private buildSystemMessage(preferences?: SearchRecipesByFridgeDTO['preferences']): string {
    let message = 'Jesteś profesjonalnym szefem kuchni z ekspertyzą w tworzeniu pysznych i praktycznych przepisów kulinarnych opartych na REALNYCH, zweryfikowanych, powszechnie uznanych tradycjach kulinarnych. Wszystkie przepisy generujesz WYŁĄCZNIE w języku polskim.';
    
    message += '\n\n⚠️ KRYTYCZNE ZASADY:';
    message += '\n1. PRIORYTET: Twórz SENSOWNE, REALNE przepisy oparte WYŁĄCZNIE na prawdziwych przepisach znalezionych online.';
    message += '\n2. Za każdym razem MUSISZ przeprowadzić WYSZUKIWANIE W INTERNECIE i bazować swoje danie TYLKO na przepisach z renomowanych serwisów kulinarnych (KwestiaSmaku, AniaGotuje, BBC Good Food, SeriousEats, TasteAtlas, AllRecipes).';
    message += '\n3. NIE musisz używać WSZYSTKICH podanych składników – tylko tych, które występują w autentycznym przepisie znalezionym online.';
    message += '\n4. ZAWSZE lepiej zrobić znane, sprawdzone danie używając 1-2 składników niż stworzyć dziwne lub wymyślone danie używając wszystkich składników.';
    message += '\n5. NIGDY nie mieszaj niezgodnych kategorii składników, chyba że takie połączenie ISTNIEJE w realnych, udokumentowanych przepisach.';
    message += '\n6. NIGDY nie twórz nietypowych, eksperymentalnych lub kreatywnych kombinacji – JEŚLI przepis nie może zostać potwierdzony online, NIE MOŻESZ go użyć.';
    message += '\n7. Szanuj profile smakowe dokładnie tak, jak są pokazane w REALNYCH przepisach z wyników wyszukiwania.';
    message += '\n8. Wytrawne z wytrawnym, słodkie ze słodkim – chyba że PRAWDZIWE danie z wyszukiwania stosuje inaczej.';
    message += '\n9. Jeśli składniki nie tworzą spójnego dania z prawdziwego świata, wybierz POPULARNY przepis, który używa TYLKO sensownego podzbioru.';
    message += '\n10. ZAWSZE myśl: "Jakie prawdziwe, znane danie istnieje online, które pasuje do tych składników?" Nigdy niczego nie wymyślaj.';
    
    if (preferences?.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
      const restrictions = preferences.dietary_restrictions.join(', ');
      message += `\n\n🥗 Wymagania dietetyczne: ${restrictions}`;
      message += `\n- Wszystkie przepisy MUSZĄ być zgodne I nadal muszą być oparte na realnych, udokumentowanych przepisach z internetu.`;
    }
    
    message += '\n\n📝 Wymagania formatu instrukcji:';
    message += '\n- Pisz szczegółowe instrukcje krok po kroku.';
    message += '\n- Każdy główny krok powinien mieć nagłówek ("Krok 1: Przygotowanie składników").';
    message += '\n- Zawieraj prawdziwe temperatury, czasy, techniki OPARTE NA wynikach wyszukiwania.';
    message += '\n- Dodaj realistyczne wskazówki, które pojawiają się w tradycyjnych lub dobrze znanych przepisach.';
    message += '\n- Opisuj teksturę, aromat i wizualne wskazówki dokładnie tak, jak robią to prawdziwe przepisy.';
    message += '\n- Pisz w JĘZYKU POLSKIM.';
    message += '\n- Ton: przyjazny, prowadzący, jak nauczanie przyjaciela.';
    message += '\n- ABSOLUTNIE ŻADNYCH WYMYŚLONYCH DAŃ. Tylko PRAWDZIWE z wyszukiwania.';
    
    message += '\n\n🌍 Źródła referencyjne dla REALNYCH przepisów (OBOWIĄZKOWE):';
    message += '\n- TasteAtlas (tradycyjne dania)';
    message += '\n- AniaGotuje (zweryfikowane polskie przepisy)';
    message += '\n- KwestiaSmaku (popularne, prawdziwe dania)';
    message += '\n- BBC Good Food';
    message += '\n- SeriousEats';
    message += '\n- AllRecipes';
    message += '\n- KAŻDY wynik z wyszukiwania internetowego, który jest prawdziwym przepisem';
    
    message += '\n\nWAŻNE: NIE MOŻESZ wygenerować ŻADNEGO przepisu, chyba że najpierw przeprowadzisz WYSZUKIWANIE W INTERNECIE i wybierzesz danie, które pojawia się w co najmniej JEDNYM zaufanym źródle z powyższej listy.';
    
    message += '\n\n📎 ŹRÓDŁA INSPIRACJI:';
    message += '\n- Pole "sources" może pozostać puste [] - NIE generuj fake linków!';
    message += '\n- Jeśli masz dostęp do citations z web search, użyj prawdziwych URL-i.';
    message += '\n- Jeśli NIE masz pewności co do URL-a - zostaw sources jako pustą tablicę.';
    message += '\n- LEPIEJ brak źródeł niż fake/wymyślone linki!';
    message += '\n- Bazuj na sprawdzonych, tradycyjnych przepisach z pamięci treningowej.';
    
    return message;
  }

  /**
   * Generate temporary ID for AI-generated recipe (not saved to database yet)
   * Range: 100000-1000000 to avoid conflicts with real database IDs
   * 
   * @returns Temporary ID for unsaved AI recipe
   */
  private generateTemporaryId(): number {
    return Math.floor(Math.random() * 900000) + 100000;
  }

  /**
   * Build temporary AI-generated recipe WITHOUT saving to database
   * User can save it later by clicking "Add to My Recipes" button
   * 
   * @param userId - User ID
   * @param aiRecipe - Validated AI recipe
   * @param originalProducts - Original products used for generation
   * @param searchDto - Original search DTO
   * @returns Temporary recipe as RecipeSummaryDTO (with temporary ID for React keys)
   */
  private async buildTemporaryAIRecipe(
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

    // Generate temporary ID for React keys (not saved to database)
    const temporaryId = this.generateTemporaryId();

    // Build description with sources appended
    let description = aiRecipe.description || '';
    
    if (aiRecipe.sources && aiRecipe.sources.length > 0) {
      const sourcesSection = '\n\n## 📚 Źródła inspiracji\n' + 
        aiRecipe.sources.map(s => `- [${s.name}](${s.url})`).join('\n');
      description = description ? `${description}${sourcesSection}` : sourcesSection;
    }

    // Return RecipeSummaryDTO without saving (temporary ID will be replaced on save)
    return {
      id: temporaryId, // Temporary ID in range 100000-1000000
      title: aiRecipe.title,
      description: description || null,
      instructions: aiRecipe.instructions,
      cooking_time: aiRecipe.cooking_time || null,
      difficulty: aiRecipe.difficulty || null,
      source: 'ai',
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

