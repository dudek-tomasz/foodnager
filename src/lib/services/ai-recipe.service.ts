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
    let message = 'You are a professional chef with expertise in creating delicious and practical recipes based on REAL, established culinary traditions.';
    
    // CRITICAL: Walidacja kulinarna
    message += '\n\n⚠️ CRITICAL RULES - YOU MUST FOLLOW THESE:';
    message += '\n1. PRIORITY: Create a SENSIBLE, REAL recipe over forcing all ingredients together';
    message += '\n2. Base your recipe on POPULAR, WELL-KNOWN dishes (like those from TasteAtlas, AllRecipes, traditional cookbooks)';
    message += '\n3. You DO NOT need to use ALL provided ingredients - only use those that make sense for the dish';
    message += '\n4. Better to make authentic "Spaghetti Carbonara" using 50% of ingredients than a nonsensical dish using 100%';
    message += '\n5. NEVER mix incompatible ingredient categories (e.g., no sweet desserts with meat, no cheesecake with ground beef)';
    message += '\n6. NEVER create absurd or nonsensical combinations - if ingredients don\'t traditionally go together, DON\'T force them';
    message += '\n7. Respect flavor profiles: sweet ingredients (sugar, cream cheese, fruits) go with other sweet ingredients';
    message += '\n8. Savory ingredients (meat, vegetables, herbs) go with other savory ingredients';
    message += '\n9. If the provided ingredients don\'t make a coherent dish together, choose the most sensible subset and note this in the description';
    message += '\n10. Think: "What popular dish could I make with SOME of these ingredients?" not "How can I force ALL ingredients together?"';
    
    if (preferences?.cuisine) {
      message += `\n\n🍴 Cuisine specialization: ${preferences.cuisine}`;
      message += `\n- Focus on authentic ${preferences.cuisine} recipes and techniques`;
      message += `\n- Use traditional ${preferences.cuisine} flavor combinations`;
    }
    
    if (preferences?.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
      const restrictions = preferences.dietary_restrictions.join(', ');
      message += `\n\n🥗 Dietary requirements: ${restrictions}`;
      message += `\n- All recipes MUST be compatible with these restrictions`;
    }
    
    message += '\n\n📝 Instructions format requirements:';
    message += '\n- Write detailed, step-by-step instructions';
    message += '\n- Each main step should have a clear heading (e.g., "Krok 1: Przygotowanie składników")';
    message += '\n- Include specific details like temperatures, times, and techniques';
    message += '\n- Add helpful tips and advice after relevant steps';
    message += '\n- Describe what the food should look like at each stage';
    message += '\n- Include sensory details (texture, color, aroma) when relevant';
    message += '\n- Explain WHY certain steps are important when it adds value';
    message += '\n- End with serving suggestions and what pairs well with the dish';
    message += '\n- Write instructions in POLISH language';
    message += '\n- Write in a friendly, encouraging tone as if teaching a friend';
    
    message += '\n\n🌍 Reference sources for REAL recipes:';
    message += '\n- TasteAtlas (traditional dishes from around the world)';
    message += '\n- Classic cookbooks (Julia Child, Gordon Ramsay, Jamie Oliver)';
    message += '\n- National cuisines (Italian pasta, French sauces, Asian stir-fries, Polish pierogi)';
    message += '\n- Restaurant menus and popular home cooking';
    
    message += '\n\n✅ Good examples (real dishes, selective ingredient use):';
    message += '\n- Have: chicken, rice, random sweet items → Make: Chicken stir-fry with rice (ignore sweet items)';
    message += '\n- Have: cream cheese, meat, sugar, eggs → Make: Cheesecake with cream cheese, sugar, eggs (ignore meat!)';
    message += '\n- Have: tomatoes, pasta, beef, chocolate → Make: Bolognese with beef, tomatoes, pasta (ignore chocolate!)';
    message += '\n- Have: potatoes, onions, cheese → Make: Classic potato gratin';
    
    message += '\n\n❌ BAD examples (forced combinations - NEVER do this):';
    message += '\n- Using ALL ingredients when they don\'t fit: "Cheesecake with ground beef layer"';
    message += '\n- Creating non-existent dishes: "Chocolate chicken curry with ice cream"';
    message += '\n- Mixing incompatible categories to "use everything": "Sweet and savory surprise casserole"';
    
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
Think of a POPULAR, WELL-KNOWN dish (from TasteAtlas, cookbooks, restaurants, or traditional cuisines) that can be made using SOME or ALL of these ingredients.

🎯 PRIORITY: Make a SENSIBLE, REAL recipe that exists in culinary practice
⚠️ You DO NOT have to use all ingredients if they don't fit the dish!

DECISION PROCESS (follow in order):
1. Identify ingredient categories (sweet/savory, meat/veg, etc.)
2. Think: "What POPULAR dish matches the main ingredients?"
   Examples: Carbonara, Pad Thai, Tacos, Cheesecake, Chicken Tikka, Pierogi, etc.
3. Choose ONE well-known dish
4. Use only ingredients from the list that fit this dish
5. Ignore ingredients that don't belong in this dish
6. Add basic pantry staples (salt, pepper, oil) if needed for authenticity
7. Write the recipe as you would find it in a real cookbook

Example decisions:
❌ BAD: "I'll force all ingredients together in one dish"
✅ GOOD: "I have chicken, pasta, cream, and chocolate. I'll make Chicken Alfredo Pasta (ignore chocolate)"

❌ BAD: "Cheesecake with meat surprise layer"
✅ GOOD: "I have cream cheese, beef, and eggs. I'll make classic Cheesecake (ignore beef)"

❌ BAD: "Creative fusion surprise using everything"
✅ GOOD: "I'll make authentic Spaghetti Bolognese that actually exists"

Now decide on ONE popular dish and create its recipe. In the description, briefly mention which ingredients you used and which you omitted (if any).`;
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

