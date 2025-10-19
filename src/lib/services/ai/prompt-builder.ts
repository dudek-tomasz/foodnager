/**
 * RecipePromptBuilder
 * 
 * Builds structured prompts for AI recipe generation
 * Ensures consistent output format and includes JSON schema for validation
 */

import type { 
  SearchRecipePreferencesDTO,
  ProductReferenceDTO 
} from '../../../types';

/**
 * RecipePromptBuilder class
 */
export class RecipePromptBuilder {
  /**
   * Build prompt for recipe generation
   * 
   * @param products - Available products
   * @param preferences - User preferences (optional)
   * @returns Structured prompt for AI
   */
  build(
    products: ProductReferenceDTO[],
    preferences?: SearchRecipePreferencesDTO
  ): string {
    const productList = products.map(p => `- ${p.name}`).join('\n');
    
    const preferencesText = this.buildPreferencesText(preferences);
    
    const prompt = `You are a professional chef. Generate a recipe using the following ingredients:

${productList}

${preferencesText}

IMPORTANT: Return ONLY a valid JSON object with this exact structure (no additional text, no markdown):
{
  "title": "Recipe title (concise and appetizing)",
  "description": "Brief one-sentence description of the dish",
  "instructions": "Step-by-step cooking instructions (numbered steps, detailed)",
  "cooking_time": 30,
  "difficulty": "easy",
  "ingredients": [
    {
      "product_name": "Tomato",
      "quantity": 4,
      "unit": "piece"
    }
  ],
  "tags": ["vegetarian", "quick meal"]
}

Requirements:
- Use primarily the provided ingredients
- You may add common pantry items (salt, pepper, oil, water) if needed
- Keep cooking_time realistic (in minutes)
- difficulty must be one of: "easy", "medium", "hard"
- Include all provided ingredients in the ingredients array
- Tags should include dietary information (vegetarian, vegan, gluten-free, etc.) and meal type
- Instructions should be clear, detailed, and numbered
- Return ONLY the JSON object, nothing else`;

    return prompt;
  }

  /**
   * Build preferences text for prompt
   */
  private buildPreferencesText(preferences?: SearchRecipePreferencesDTO): string {
    if (!preferences) {
      return '';
    }

    const parts: string[] = [];

    if (preferences.max_cooking_time) {
      parts.push(`- Maximum cooking time: ${preferences.max_cooking_time} minutes`);
    }

    if (preferences.difficulty) {
      parts.push(`- Difficulty: ${preferences.difficulty}`);
    }

    if (preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
      const restrictions = preferences.dietary_restrictions.join(', ');
      parts.push(`- Dietary restrictions: ${restrictions} (must be ${restrictions})`);
    }

    if (parts.length === 0) {
      return '';
    }

    return `User preferences:\n${parts.join('\n')}\n`;
  }
}

/**
 * Export singleton instance
 */
export const recipePromptBuilder = new RecipePromptBuilder();

