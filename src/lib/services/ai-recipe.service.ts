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
      temperature: 0.5, // Niska temperatura = bardziej konserwatywne, realistyczne przepisy
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
    let message = 'You are a professional chef with expertise in creating delicious and practical recipes based on REAL, verified, widely recognized culinary traditions. You MUST rely on internet search results, not imagination.';

    message += '\n\n⚠️ CRITICAL RULES - YOU MUST FOLLOW THESE:';
    message += '\n1. PRIORITY: Create a SENSIBLE, REAL recipe based STRICTLY on real-world recipes found online.';
    message += '\n2. Every time, you MUST perform an INTERNET SEARCH and base your dish ONLY on recipes that appear on reputable cooking sites (KwestiaSmaku, AniaGotuje, BBC Good Food, SeriousEats, TasteAtlas, AllRecipes).';
    message += '\n3. You DO NOT need to use ALL provided ingredients – only those found in the authentic recipe you discover online.';
    message += '\n4. It is ALWAYS better to make a known, established dish using 1–2 ingredients than to produce a weird or invented dish using all ingredients.';
    message += '\n5. NEVER mix incompatible ingredient categories unless this combination EXISTS in real, documented recipes.';
    message += '\n6. NEVER create unusual, experimental, or creative combinations – IF a recipe cannot be confirmed online, you MUST NOT use it.';
    message += '\n7. Respect flavor profiles exactly as demonstrated in REAL recipes from the search results.';
    message += '\n8. Savory with savory, sweet with sweet – unless a REAL dish from the search uses otherwise.';
    message += '\n9. If ingredients do not form a coherent real-world dish, choose a POPULAR recipe that uses ONLY a sensible subset.';
    message += '\n10. ALWAYS think: "Which real, famous dish exists online that fits these ingredients?" Never invent anything.';
    
    if (preferences?.cuisine) {
      message += `\n\n🍴 Cuisine specialization: ${preferences.cuisine}`;
      message += `\n- Focus ONLY on authentic, real ${preferences.cuisine} dishes found in online searches.`;
    }
    
    if (preferences?.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
      const restrictions = preferences.dietary_restrictions.join(', ');
      message += `\n\n🥗 Dietary requirements: ${restrictions}`;
      message += `\n- All recipes MUST comply AND must still be based on real, documented recipes from the internet.`;
    }
    
    message += '\n\n📝 Instructions format requirements:';
    message += '\n- Write detailed, step-by-step instructions.';
    message += '\n- Each main step should have a heading ("Krok 1: Przygotowanie składników").';
    message += '\n- Include real temperatures, times, techniques BASED ON search results.';
    message += '\n- Add realistic tips that appear in traditional or well-known recipes.';
    message += '\n- Describe texture, aroma, and visual cues exactly as real recipes do.';
    message += '\n- Write in POLISH language.';
    message += '\n- Tone: friendly, guiding, like teaching a friend.';
    message += '\n- ABSOLUTELY NO INVENTED DISHES. Only REAL ones from search.';
    
    message += '\n\n🌍 Reference sources for REAL recipes (MANDATORY):';
    message += '\n- TasteAtlas (traditional dishes)';
    message += '\n- AniaGotuje (verified Polish recipes)';
    message += '\n- KwestiaSmaku (popular, real dishes)';
    message += '\n- BBC Good Food';
    message += '\n- SeriousEats';
    message += '\n- AllRecipes';
    message += '\n- ANY result from the web search that is a real recipe';
    
    message += '\n\nIMPORTANT: You MUST NOT generate ANY recipe unless you first perform a WEB SEARCH and select a dish that appears in at least ONE trusted source from the list above.';
    
    message += '\n\n✅ Good examples (real dishes, selective ingredient use):';
    message += '\n- Have: chicken, rice, random sweet items → Make: Chicken stir-fry (ignore sweet items).';
    message += '\n- Have: cream cheese, meat, sugar, eggs → Make: Classic cheesecake (ignore meat).';
    message += '\n- Have: tomatoes, pasta, beef, chocolate → Make: Bolognese (ignore chocolate).';
    message += '\n- Have: potatoes, onions, cheese → Make: Classic gratin.'
    
    message += '\n\n❌ BAD examples (NEVER DO THIS):';
    message += '\n- Dishes that DO NOT appear online.';
    message += '\n- Forcing all ingredients: "Cheesecake with ground beef layer".';
    message += '\n- Inventing combinations no one makes: "Zupa z orzechów i czekolady".';
    message += '\n- Random fusion: "Sweet and savory surprise casserole".';
    
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
      preferenceParts.push(`- Difficulty level: ${preferences.difficulty}`);
    }

    const preferencesText = preferenceParts.length > 0
      ? `\nConstraints:\n${preferenceParts.join('\n')}`
      : '';

    return `I have these ingredients available:

${productList}
${preferencesText}

YOUR TASK:
You MUST perform an INTERNET SEARCH before generating ANY recipe.
Use the search results to identify ONE REAL, WELL-KNOWN dish from reputable sources (TasteAtlas, AniaGotuje, KwestiaSmaku, BBC Good Food, SeriousEats, AllRecipes, cookbooks).

⚠️ ABSOLUTE RULES (DO NOT BREAK):
- Only choose recipes that appear in REAL online sources.
- NEVER invent dishes.
- NEVER create unusual combinations that do not exist online.
- NEVER force incompatible ingredients together.
- If ingredients do not fit a real dish, use ONLY the subset that fits.

Forbidden outputs include:
❌ "zupa z orzechów i czekolady"
❌ any experimental fusion
❌ anything not appearing online.

PROCESS (mandatory):
1. Analyze provided ingredients.
2. Determine the MAIN ingredients (meat/vegetables/sweets).
3. **USE YOUR WEB SEARCH CAPABILITY** to find real dishes using those main ingredients.
4. Select ONE famous, documented dish that appears in the search.
5. Use only ingredients from the list that actually belong to this real dish.
6. Ignore everything else.
7. Include ONLY real steps, temperatures, times, and methods from real recipes.

🌐 CRITICAL - SOURCES REQUIREMENT:
You MUST return your response as a JSON object with the following exact structure:

{
  "title": "Nazwa przepisu",
  "description": "Krótki opis dania",
  "instructions": "Szczegółowe instrukcje krok po kroku...",
  "cooking_time": 30,
  "difficulty": "easy",
  "ingredients": [
    {
      "product_name": "Pomidor",
      "quantity": 4,
      "unit": "sztuka"
    }
  ],
  "tags": ["wegetariańskie", "szybkie"],
  "sources": [
    {
      "name": "KwestiaSmaku",
      "url": "https://www.kwestiasmaku.com/przepis/nazwa-przepisu"
    },
    {
      "name": "AniaGotuje",
      "url": "https://aniagotuje.pl/przepis/nazwa-przepisu"
    }
  ]
}

⚠️ SOURCES FIELD IS **MANDATORY** AND **CANNOT BE EMPTY**:
- You MUST include at least 1-3 real sources in the 'sources' array
- Each source MUST have: "name" (site name) and "url" (full URL to the recipe page)
- Sources must be REAL URLs from your web search - cite the actual pages you found
- NEVER leave sources empty [] - this is unacceptable
- If you cannot find sources, DO NOT generate a recipe at all

Return ONLY the JSON object, no additional text, no markdown, no explanations.
All text (title, description, instructions, ingredient names, tags) MUST be in POLISH.
`;
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
          ai_model: import.meta.env.OPENROUTER_MODEL || 'perplexity/sonar-pro',
          generation_timestamp: new Date().toISOString(),
          input_products: originalProducts.map(p => p.id),
          preferences: generateDto.preferences ? {
            cuisine: generateDto.preferences.cuisine,
            max_cooking_time: generateDto.preferences.max_cooking_time,
            difficulty: generateDto.preferences.difficulty,
            dietary_restrictions: generateDto.preferences.dietary_restrictions,
          } : {},
          sources: aiRecipe.sources || [],
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
        ai_model: import.meta.env.OPENROUTER_MODEL || 'perplexity/sonar-pro',
        generation_timestamp: new Date().toISOString(),
        input_products: originalProducts.map(p => p.id),
        preferences: generateDto.preferences ? {
          cuisine: generateDto.preferences.cuisine,
          max_cooking_time: generateDto.preferences.max_cooking_time,
          difficulty: generateDto.preferences.difficulty,
          dietary_restrictions: generateDto.preferences.dietary_restrictions,
        } : {},
        sources: aiRecipe.sources || [],
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

