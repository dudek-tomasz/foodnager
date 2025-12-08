/**
 * RecipePromptBuilder
 *
 * Builds structured prompts for AI recipe generation
 * Ensures consistent output format and includes JSON schema for validation
 */

import type { SearchRecipePreferencesDTO, ProductReferenceDTO } from "../../../types";

/**
 * RecipePromptBuilder class
 */
export class RecipePromptBuilder {
  /**
   * Build user prompt for recipe generation
   * Contains specific task, format requirements, and examples
   * (System role/persona should be provided separately via systemMessage)
   *
   * @param products - Available products
   * @param preferences - User preferences (optional)
   * @returns Detailed user prompt with format specification
   */
  build(products: ProductReferenceDTO[], preferences?: SearchRecipePreferencesDTO): string {
    const productList = products.map((p) => `- ${p.name}`).join("\n");

    const preferencesText = this.buildPreferencesText(preferences);

    const prompt = `Wygeneruj 5 różnych przepisów kulinarnych używając następujących składników:

${productList}

${preferencesText}

WAŻNE: Zwróć TYLKO poprawny obiekt JSON o dokładnie tej strukturze (bez dodatkowego tekstu, bez markdown):
{
  "recipes": [
    {
      "title": "Nazwa przepisu (zwięzła i apetyczna)",
      "description": "Krótki opis dania w jednym zdaniu",
      "instructions": "Instrukcje gotowania krok po kroku (numerowane kroki, szczegółowe)",
      "cooking_time": 30,
      "difficulty": "easy",
      "ingredients": [
        {
          "product_name": "Pomidor",
          "quantity": 4,
          "unit": "sztuka"
        }
      ],
      "tags": ["wegetariańskie", "szybkie danie"],
      "sources": [
        {
          "name": "KwestiaSmaku",
          "url": "https://www.kwestiasmaku.com/przepis/pomidorowa"
        }
      ]
    }
  ]
}

Wymagania:
- Wygeneruj DOKŁADNIE 5 różnorodnych przepisów
- Pierwszy przepis powinien być NAJLEPSZYM dopasowaniem (wykorzystuje najwięcej składników, najprostszy, najsmaczniejszy)
- Kolejne przepisy powinny być też dobre, ale różnorodne (różne kuchnie, różne techniki gotowania)
- Używaj przede wszystkim podanych składników
- Możesz dodać podstawowe produkty spożywcze (sól, pieprz, olej, woda) jeśli potrzebne
- cooking_time musi być realistyczny (w minutach)
- difficulty musi być jednym z: "easy", "medium", "hard"
- Każdy przepis powinien wykorzystywać jak najwięcej z podanych składników
- Tags powinny zawierać informacje dietetyczne (wegetariańskie, wegańskie, bezglutenowe, itp.) oraz typ posiłku
- Instrukcje powinny być jasne, szczegółowe i numerowane
- Zwróć TYLKO obiekt JSON z tablicą "recipes" zawierającą 5 przepisów

⚠️ KRYTYCZNE - ŹRÓDŁA:
- Pole "sources" jest OPCJONALNE - może być pusta tablica []
- TYLKO jeśli masz dostęp do web search citations, dodaj prawdziwe linki
- NIGDY nie wymyślaj/nie generuj fake URL-i - to gorsze niż brak źródeł!
- Jeśli nie masz pewności co do URL-a - zostaw sources: []
- Bazuj na sprawdzonych, tradycyjnych przepisach, które znasz z treningu

KRYTYCZNE: Wszystkie przepisy (tytuły, opisy, instrukcje, nazwy składników, tagi) MUSZĄ BYĆ W JĘZYKU POLSKIM!`;

    return prompt;
  }

  /**
   * Build preferences text for prompt
   */
  private buildPreferencesText(preferences?: SearchRecipePreferencesDTO): string {
    if (!preferences) {
      return "";
    }

    const parts: string[] = [];

    if (preferences.max_cooking_time) {
      parts.push(`- Maximum cooking time: ${preferences.max_cooking_time} minutes`);
    }

    if (preferences.difficulty) {
      parts.push(`- Difficulty: ${preferences.difficulty}`);
    }

    if (preferences.dietary_restrictions && preferences.dietary_restrictions.length > 0) {
      const restrictions = preferences.dietary_restrictions.join(", ");
      parts.push(`- Dietary restrictions: ${restrictions} (recipe must be ${restrictions})`);
    }

    if (parts.length === 0) {
      return "";
    }

    return `User preferences:\n${parts.join("\n")}\n`;
  }
}

/**
 * Export singleton instance
 */
export const recipePromptBuilder = new RecipePromptBuilder();
