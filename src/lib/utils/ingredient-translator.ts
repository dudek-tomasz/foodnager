/**
 * Ingredient Translator - Polish to English translation for API calls
 * 
 * Spoonacular API requires English ingredient names.
 * This utility provides translation for common Polish ingredients.
 */

/**
 * Dictionary of Polish to English ingredient translations
 */
const POLISH_TO_ENGLISH: Record<string, string> = {
  // Mięso i drób
  'mięso mielone': 'ground meat',
  'kurczak': 'chicken',
  'pierś z kurczaka': 'chicken breast',
  'udka z kurczaka': 'chicken thighs',
  'wołowina': 'beef',
  'wieprzowina': 'pork',
  'szynka': 'ham',
  'boczek': 'bacon',
  'kiełbasa': 'sausage',
  
  // Nabiał
  'mleko': 'milk',
  'śmietana': 'cream',
  'śmietanka': 'cream',
  'masło': 'butter',
  'ser': 'cheese',
  'ser żółty': 'cheese',
  'jogurt': 'yogurt',
  'jajko': 'egg',
  'jaja': 'eggs',
  
  // Warzywa
  'pomidor': 'tomato',
  'pomidory': 'tomatoes',
  'cebula': 'onion',
  'czosnek': 'garlic',
  'marchew': 'carrot',
  'marchewka': 'carrot',
  'ziemniak': 'potato',
  'ziemniaki': 'potatoes',
  'papryka': 'bell pepper',
  'ogórek': 'cucumber',
  'sałata': 'lettuce',
  'kapusta': 'cabbage',
  'brokuł': 'broccoli',
  'brokuły': 'broccoli',
  'kalafior': 'cauliflower',
  'szpinak': 'spinach',
  'pieczarka': 'mushroom',
  'pieczarki': 'mushrooms',
  'grzyby': 'mushrooms',
  'bakłażan': 'eggplant',
  'cukinia': 'zucchini',
  'dynia': 'pumpkin',
  'kukurydza': 'corn',
  'groszek': 'peas',
  'fasola': 'beans',
  'por': 'leek',
  
  // Owoce
  'jabłko': 'apple',
  'banan': 'banana',
  'pomarańcza': 'orange',
  'cytryna': 'lemon',
  'truskawka': 'strawberry',
  'truskawki': 'strawberries',
  'malina': 'raspberry',
  'maliny': 'raspberries',
  'borówka': 'blueberry',
  'borówki': 'blueberries',
  'winogrono': 'grape',
  'winogrona': 'grapes',
  'arbuz': 'watermelon',
  
  // Produkty zbożowe
  'makaron': 'pasta',
  'ryż': 'rice',
  'kasza': 'groats',
  'mąka': 'flour',
  'chleb': 'bread',
  'bułka': 'roll',
  'bagietka': 'baguette',
  'płatki owsiane': 'oatmeal',
  
  // Przyprawy i dodatki
  'sól': 'salt',
  'pieprz': 'pepper',
  'papryka mielona': 'paprika',
  'cukier': 'sugar',
  'olej': 'oil',
  'oliwa': 'olive oil',
  'ocet': 'vinegar',
  'musztarda': 'mustard',
  'ketchup': 'ketchup',
  'majonez': 'mayonnaise',
  'bazylia': 'basil',
  'oregano': 'oregano',
  'tymianek': 'thyme',
  'rozmaryn': 'rosemary',
  'pietruszka': 'parsley',
  'koper': 'dill',
  'cynamon': 'cinnamon',
  'wanilia': 'vanilla',
  'imbir': 'ginger',
  'kminek': 'cumin',
  'kumin': 'cumin',
  
  // Orzechy i nasiona
  'orzechy': 'nuts',
  'orzechy włoskie': 'walnuts',
  'orzechy laskowe': 'hazelnuts',
  'migdały': 'almonds',
  'orzeszki ziemne': 'peanuts',
  'pestki': 'seeds',
  
  // Słodycze i dodatki
  'czekolada': 'chocolate',
  'czekolada mleczna': 'milk chocolate',
  'czekolada gorzka': 'dark chocolate',
  'kakao': 'cocoa',
  'miód': 'honey',
  'dżem': 'jam',
  
  // Inne
  'woda': 'water',
  'herbata': 'tea',
  'kawa': 'coffee',
  'sok': 'juice',
  'tofu': 'tofu',
};

/**
 * Translate ingredient name from Polish to English
 * 
 * @param polishName - Polish ingredient name
 * @returns English ingredient name (or original if no translation found)
 */
export function translateIngredient(polishName: string): string {
  if (!polishName) {
    return polishName;
  }

  // Normalize input: lowercase and trim
  const normalized = polishName.toLowerCase().trim();

  // Direct match
  if (POLISH_TO_ENGLISH[normalized]) {
    return POLISH_TO_ENGLISH[normalized];
  }

  // Try to match partial name (e.g., "śmietanka 30%" -> "śmietanka")
  // Remove common suffixes like percentages, numbers, etc.
  const cleanedName = normalized
    .replace(/\d+%/, '') // Remove percentages
    .replace(/\d+g/, '') // Remove grams
    .replace(/\d+ml/, '') // Remove milliliters
    .replace(/\d+kg/, '') // Remove kilograms
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();

  if (cleanedName !== normalized && POLISH_TO_ENGLISH[cleanedName]) {
    return POLISH_TO_ENGLISH[cleanedName];
  }

  // Try to find translation by checking if normalized name starts with a key
  for (const [polish, english] of Object.entries(POLISH_TO_ENGLISH)) {
    if (normalized.startsWith(polish + ' ') || normalized === polish) {
      return english;
    }
  }

  // No translation found - return original
  // This allows English names to pass through unchanged
  console.warn(`⚠️ [TRANSLATOR] No translation found for: "${polishName}" - using original`);
  return polishName;
}

/**
 * Translate array of ingredient names from Polish to English
 * 
 * @param polishNames - Array of Polish ingredient names
 * @returns Array of English ingredient names
 */
export function translateIngredients(polishNames: string[]): string[] {
  const translated = polishNames.map(translateIngredient);
  
  console.log('🌍 [TRANSLATOR] Translating ingredients:');
  polishNames.forEach((polish, index) => {
    const english = translated[index];
    if (polish !== english) {
      console.log(`  "${polish}" → "${english}"`);
    } else {
      console.log(`  "${polish}" (no translation, using original)`);
    }
  });
  
  return translated;
}

/**
 * Check if translation is available for given ingredient
 * 
 * @param ingredientName - Ingredient name to check
 * @returns true if translation exists
 */
export function hasTranslation(ingredientName: string): boolean {
  const normalized = ingredientName.toLowerCase().trim();
  return POLISH_TO_ENGLISH[normalized] !== undefined;
}

/**
 * Translate ingredient name from English to Polish (reverse translation)
 * Uses dictionary first (fast), then falls back to LLM if needed
 * 
 * @param englishName - English ingredient name
 * @param useLLMFallback - Whether to use LLM for unknown ingredients (default: false for sync)
 * @returns Polish ingredient name (or original if no translation found)
 */
export function translateIngredientToPolish(englishName: string, useLLMFallback: boolean = false): string {
  if (!englishName) {
    return englishName;
  }

  // Normalize input: lowercase and trim
  const normalized = englishName.toLowerCase().trim();

  // Build reverse lookup (English → Polish)
  const ENGLISH_TO_POLISH: Record<string, string> = {};
  for (const [polish, english] of Object.entries(POLISH_TO_ENGLISH)) {
    ENGLISH_TO_POLISH[english.toLowerCase()] = polish;
  }

  // Direct match
  if (ENGLISH_TO_POLISH[normalized]) {
    return ENGLISH_TO_POLISH[normalized];
  }

  // Try to find translation by checking if normalized name contains an English key
  for (const [english, polish] of Object.entries(ENGLISH_TO_POLISH)) {
    if (normalized.includes(english) || english.includes(normalized)) {
      return polish;
    }
  }

  // No translation found in dictionary
  console.warn(`⚠️ [TRANSLATOR] No dictionary translation for: "${englishName}"`);
  
  // Return original (LLM fallback will be handled async in batch)
  return englishName;
}

/**
 * Translate ingredient using LLM (for ingredients not in dictionary)
 * This is async and should be used for batch translation
 * 
 * @param englishName - English ingredient name
 * @returns Polish ingredient name
 */
export async function translateIngredientWithLLM(englishName: string): Promise<string> {
  // Import dynamically to avoid circular dependency
  const { OpenRouterClient } = await import('../services/ai/openrouter.client');
  
  const client = new OpenRouterClient();
  
  if (!client.isConfigured()) {
    console.warn('⚠️ [TRANSLATOR] OpenRouter not configured, cannot translate ingredient');
    return englishName;
  }

  try {
    const prompt = `Przetłumacz nazwę składnika kulinarnego z angielskiego na polski. Zwróć TYLKO polską nazwę, bez żadnego dodatkowego tekstu.

Angielski: ${englishName}
Polski:`;

    const response = await client.generateText(prompt, {
      temperature: 0.1, // Very low for consistent translations
      max_tokens: 20,
    });

    const translated = response.trim();
    console.log(`🤖 [LLM] Translated ingredient: "${englishName}" → "${translated}"`);
    
    return translated;
    
  } catch (error) {
    console.error(`❌ [LLM] Failed to translate ingredient "${englishName}":`, error);
    return englishName;
  }
}

/**
 * Translate array of ingredient names from English to Polish
 * 
 * @param englishNames - Array of English ingredient names
 * @returns Array of Polish ingredient names
 */
export function translateIngredientsToPolish(englishNames: string[]): string[] {
  const translated = englishNames.map(name => translateIngredientToPolish(name));
  
  console.log('🌍 [TRANSLATOR] Translating ingredients to Polish:');
  englishNames.forEach((english, index) => {
    const polish = translated[index];
    if (english !== polish) {
      console.log(`  "${english}" → "${polish}"`);
    } else {
      console.log(`  "${english}" (no translation, using original)`);
    }
  });
  
  return translated;
}

