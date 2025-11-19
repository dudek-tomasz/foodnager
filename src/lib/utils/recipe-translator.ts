/**
 * Recipe Translator - Translate recipe content using OpenRouter LLM
 * 
 * Translates English recipe titles, descriptions, and instructions to Polish
 */

import { OpenRouterClient } from '../services/ai/openrouter.client';

export interface RecipeToTranslate {
  title: string;
  description?: string;
  instructions: string;
}

export interface TranslatedRecipe {
  title: string;
  description?: string;
  instructions: string;
}

/**
 * Translate recipe content from English to Polish using LLM
 */
export async function translateRecipe(recipe: RecipeToTranslate): Promise<TranslatedRecipe> {
  const openRouter = new OpenRouterClient();

  if (!openRouter.isConfigured()) {
    console.warn('🌍 [TRANSLATOR] OpenRouter not configured, skipping translation');
    return {
      title: recipe.title,
      description: recipe.description,
      instructions: recipe.instructions,
    };
  }

  try {
    console.log(`🌍 [TRANSLATOR] Translating recipe: "${recipe.title}"`);

    const prompt = buildTranslationPrompt(recipe);
    
    const response = await openRouter.generateText(prompt, {
      temperature: 0.3, // Low temperature for consistent translations
      max_tokens: 2000,
    });

    const translated = parseTranslationResponse(response);
    
    console.log(`🌍 [TRANSLATOR] ✅ Translated to: "${translated.title}"`);
    
    return translated;
    
  } catch (error) {
    console.error('🌍 [TRANSLATOR] ❌ Translation failed:', error);
    // Fallback to original if translation fails
    return {
      title: recipe.title,
      description: recipe.description,
      instructions: recipe.instructions,
    };
  }
}

/**
 * Build translation prompt for LLM
 */
function buildTranslationPrompt(recipe: RecipeToTranslate): string {
  return `Przetłumacz poniższy przepis kulinarny z języka angielskiego na język polski. Zachowaj profesjonalny styl kulinarny.

TYTUŁ (EN):
${recipe.title}

${recipe.description ? `OPIS (EN):
${recipe.description}

` : ''}INSTRUKCJE (EN):
${recipe.instructions}

---

Zwróć odpowiedź TYLKO w formacie JSON (bez żadnego dodatkowego tekstu):
{
  "title": "przetłumaczony tytuł po polsku",
  ${recipe.description ? '"description": "przetłumaczony opis po polsku",' : ''}
  "instructions": "przetłumaczone instrukcje po polsku (zachowaj numerację kroków jeśli istnieje)"
}`;
}

/**
 * Parse LLM response to extract translated content
 */
function parseTranslationResponse(response: string): TranslatedRecipe {
  try {
    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    return {
      title: parsed.title || '',
      description: parsed.description,
      instructions: parsed.instructions || '',
    };
    
  } catch (error) {
    console.error('Failed to parse translation response:', error);
    throw error;
  }
}

/**
 * Batch translate multiple recipes
 * Translates recipes one by one to avoid overwhelming the API
 */
export async function translateRecipes(recipes: RecipeToTranslate[]): Promise<TranslatedRecipe[]> {
  const translated: TranslatedRecipe[] = [];

  for (const recipe of recipes) {
    try {
      const result = await translateRecipe(recipe);
      translated.push(result);
    } catch (error) {
      console.error(`Failed to translate recipe "${recipe.title}":`, error);
      // Use original if translation fails
      translated.push({
        title: recipe.title,
        description: recipe.description,
        instructions: recipe.instructions,
      });
    }
  }

  return translated;
}

