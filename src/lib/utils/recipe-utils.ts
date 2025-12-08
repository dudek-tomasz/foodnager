/**
 * Utility functions for Recipe Details view
 * Handles availability checking, instructions parsing, and data transformations
 */

import type {
  RecipeDTO,
  RecipeIngredientDTO,
  FridgeItemDTO,
  DifficultyEnum,
  CreateRecipeDTO,
  CreateRecipeIngredientDTO,
} from "../../types";

import type {
  IngredientAvailabilityCheckResult,
  IngredientWithAvailability,
  RecipeAvailabilityResult,
  RecipeViewModel,
  ParsedInstructions,
  CookingValidationResult,
} from "../types/recipe-view-models";

import { checkAvailabilityWithConversion } from "./unit-conversion.utils";

// =============================================================================
// AVAILABILITY CHECKING
// =============================================================================

/**
 * Sprawdza dostępność pojedynczego składnika w lodówce z obsługą konwersji jednostek
 * @param ingredient - składnik z przepisu
 * @param fridgeItems - lista produktów w lodówce
 * @returns rezultat sprawdzenia dostępności
 */
export function checkIngredientAvailability(
  ingredient: RecipeIngredientDTO,
  fridgeItems: FridgeItemDTO[]
): IngredientAvailabilityCheckResult & { fridgeUnit?: string; requiresManualConversion?: boolean } {
  const requiredQuantity = ingredient.quantity;
  const requiredUnit = ingredient.unit.abbreviation;

  // Znajdź matching product w lodówce (tylko po ID produktu, nie po jednostce!)
  const fridgeItem = fridgeItems.find((item) => item.product.id === ingredient.product.id);

  // Jeśli nie ma produktu w lodówce
  if (!fridgeItem) {
    return {
      status: "none",
      availableQuantity: 0,
      missingQuantity: requiredQuantity,
    };
  }

  const availableQuantity = fridgeItem.quantity;
  const availableUnit = fridgeItem.unit.abbreviation;

  // Sprawdź konwersję jednostek
  const conversionResult = checkAvailabilityWithConversion(
    requiredQuantity,
    requiredUnit,
    availableQuantity,
    availableUnit
  );

  // Jeśli wymaga ręcznej konwersji
  if (conversionResult.requiresManual) {
    return {
      status: "unknown",
      availableQuantity: availableQuantity,
      missingQuantity: 0, // Nieznana wartość
      fridgeUnit: availableUnit,
      requiresManualConversion: true,
    };
  }

  // Jeśli konwersja jest możliwa
  if (conversionResult.compatible && conversionResult.availableInRequiredUnit !== null) {
    const convertedAvailable = conversionResult.availableInRequiredUnit;
    const missingQuantity = Math.max(0, requiredQuantity - convertedAvailable);

    let status: "full" | "partial" | "none";
    if (convertedAvailable >= requiredQuantity) {
      status = "full";
    } else if (convertedAvailable > 0) {
      status = "partial";
    } else {
      status = "none";
    }

    return {
      status,
      availableQuantity: convertedAvailable,
      missingQuantity,
      fridgeUnit: availableUnit !== requiredUnit ? availableUnit : undefined,
    };
  }

  // Fallback - jednostki niekompatybilne
  return {
    status: "unknown",
    availableQuantity: availableQuantity,
    missingQuantity: 0,
    fridgeUnit: availableUnit,
    requiresManualConversion: true,
  };
}

/**
 * Oblicza dostępność składników dla całego przepisu
 * @param recipe - przepis do sprawdzenia
 * @param fridgeItems - lista produktów w lodówce
 * @returns rezultat z wzbogaconymi składnikami i flagami
 */
export function calculateRecipeAvailability(recipe: RecipeDTO, fridgeItems: FridgeItemDTO[]): RecipeAvailabilityResult {
  // Wzbogać każdy składnik o informacje o dostępności
  const enrichedIngredients: IngredientWithAvailability[] = recipe.ingredients.map((ingredient) => {
    const availabilityCheck = checkIngredientAvailability(ingredient, fridgeItems);

    return {
      ...ingredient,
      availabilityStatus: availabilityCheck.status,
      availableQuantity: availabilityCheck.availableQuantity,
      requiredQuantity: ingredient.quantity,
      missingQuantity: availabilityCheck.missingQuantity,
      fridgeUnit: availabilityCheck.fridgeUnit,
      requiresManualConversion: availabilityCheck.requiresManualConversion,
    };
  });

  // Sprawdź czy wszystkie składniki są w pełni dostępne
  const hasAllIngredients = enrichedIngredients.every((ing) => ing.availabilityStatus === "full");

  // Sprawdź czy są jakieś brakujące składniki (none lub unknown)
  const hasMissingIngredients = enrichedIngredients.some((ing) => ing.availabilityStatus !== "full");

  return {
    enrichedIngredients,
    hasAllIngredients,
    hasMissingIngredients,
  };
}

/**
 * Transformuje RecipeDTO do RecipeViewModel z informacjami o dostępności
 * @param recipe - bazowy przepis
 * @param fridgeItems - lista produktów w lodówce
 * @param matchScore - opcjonalny wynik dopasowania
 * @returns RecipeViewModel
 */
export function createRecipeViewModel(
  recipe: RecipeDTO,
  fridgeItems: FridgeItemDTO[],
  matchScore?: number
): RecipeViewModel {
  const availability = calculateRecipeAvailability(recipe, fridgeItems);

  return {
    ...recipe,
    enrichedIngredients: availability.enrichedIngredients,
    hasAllIngredients: availability.hasAllIngredients,
    hasMissingIngredients: availability.hasMissingIngredients,
    matchScore,
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Waliduje czy użytkownik może ugotować przepis
 * @param ingredients - składniki z informacją o dostępności
 * @returns rezultat walidacji
 */
export function validateIngredientsAvailability(ingredients: IngredientWithAvailability[]): CookingValidationResult {
  const missingIngredients = ingredients.filter((ing) => ing.availabilityStatus !== "full");

  const canCook = missingIngredients.length === 0;

  let message: string | undefined;
  if (!canCook) {
    message = `Brakuje ${missingIngredients.length} składników do ugotowania tego przepisu.`;
  }

  return {
    canCook,
    missingIngredients,
    message,
  };
}

// =============================================================================
// INSTRUCTIONS PARSING
// =============================================================================

/**
 * Parsuje instrukcje z surowego tekstu do listy kroków
 * Obsługuje instrukcje numerowane lub rozdzielane znakami nowej linii
 * @param instructions - surowy tekst instrukcji
 * @returns sparsowane kroki
 */
export function parseInstructions(instructions: string): ParsedInstructions {
  if (!instructions || instructions.trim().length === 0) {
    return { steps: [], isNumbered: false };
  }

  // Sprawdź czy instrukcje są numerowane (np. "1.", "1)", "1 -")
  const numberedPattern = /^\s*\d+[.)\-:]\s+/m;
  const isNumbered = numberedPattern.test(instructions);

  let steps: string[];

  if (isNumbered) {
    // Split po numerach i wyczyść
    steps = instructions
      .split(/\n/)
      .map((line) => line.replace(/^\s*\d+[.)\-:]\s+/, "").trim())
      .filter((line) => line.length > 0);
  } else {
    // Split po znakach nowej linii
    steps = instructions
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
  }

  // Jeśli po splicie jest tylko jeden krok, być może instrukcje są w jednym bloku
  // W takim przypadku zwróć jako pojedynczy krok
  if (steps.length === 0) {
    steps = [instructions.trim()];
  }

  return { steps, isNumbered };
}

// =============================================================================
// DIFFICULTY LABELS
// =============================================================================

/**
 * Mapuje enum trudności na czytelny label po polsku
 * @param difficulty - enum trudności
 * @returns polski label
 */
export function getDifficultyLabel(difficulty: DifficultyEnum): string {
  const labels: Record<DifficultyEnum, string> = {
    easy: "Łatwy",
    medium: "Średni",
    hard: "Trudny",
  };

  return labels[difficulty] || difficulty;
}

/**
 * Zwraca kolor dla trudności (do użycia w UI)
 * @param difficulty - enum trudności
 * @returns klasa Tailwind dla koloru
 */
export function getDifficultyColor(difficulty: DifficultyEnum): string {
  const colors: Record<DifficultyEnum, string> = {
    easy: "text-green-600",
    medium: "text-yellow-600",
    hard: "text-red-600",
  };

  return colors[difficulty] || "text-gray-600";
}

// =============================================================================
// MATCH SCORE HELPERS
// =============================================================================

/**
 * Zwraca kolor dla match score badge
 * @param score - wynik dopasowania (0-100)
 * @returns klasa Tailwind dla koloru
 */
export function getMatchScoreColor(score: number): string {
  if (score >= 80) return "bg-green-100 text-green-800 border-green-200";
  if (score >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200";
  return "bg-red-100 text-red-800 border-red-200";
}

// =============================================================================
// AVAILABILITY COLOR HELPERS
// =============================================================================

/**
 * Zwraca klasy Tailwind dla koloru statusu dostępności
 * @param status - status dostępności
 * @returns obiekt z klasami dla różnych elementów
 */
export function getAvailabilityColors(status: "full" | "partial" | "none" | "unknown"): {
  text: string;
  bg: string;
  icon: string;
} {
  const colorMap = {
    full: {
      text: "text-green-700",
      bg: "bg-green-50",
      icon: "text-green-600",
    },
    partial: {
      text: "text-yellow-700",
      bg: "bg-yellow-50",
      icon: "text-yellow-600",
    },
    none: {
      text: "text-red-700",
      bg: "bg-red-50",
      icon: "text-red-600",
    },
    unknown: {
      text: "text-yellow-700",
      bg: "bg-yellow-50",
      icon: "text-yellow-600",
    },
  };

  return colorMap[status];
}

// =============================================================================
// DATA TRANSFORMATION
// =============================================================================

/**
 * Transformuje RecipeDTO do CreateRecipeDTO (dla funkcji "Zapisz przepis")
 * Używane przy kopiowaniu przepisu z zewnętrznego źródła
 * @param recipe - przepis do skopiowania
 * @returns DTO do utworzenia nowego przepisu
 */
export function recipeToCreateDto(recipe: RecipeDTO): CreateRecipeDTO {
  const ingredients: CreateRecipeIngredientDTO[] = recipe.ingredients.map((ing) => ({
    product_id: ing.product.id,
    quantity: ing.quantity,
    unit_id: ing.unit.id,
  }));

  const tag_ids = recipe.tags.map((tag) => tag.id);

  return {
    title: recipe.title,
    description: recipe.description,
    instructions: recipe.instructions,
    cooking_time: recipe.cooking_time,
    difficulty: recipe.difficulty,
    ingredients,
    tag_ids,
  };
}

// =============================================================================
// FORMATTING HELPERS
// =============================================================================

/**
 * Formatuje czas gotowania do czytelnej formy
 * @param minutes - czas w minutach
 * @returns sformatowany string
 */
export function formatCookingTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (remainingMinutes === 0) {
    return `${hours} godz`;
  }

  return `${hours} godz ${remainingMinutes} min`;
}

/**
 * Formatuje ilość z jednostką
 * @param quantity - ilość
 * @param unitName - nazwa jednostki
 * @param unitAbbreviation - skrót jednostki
 * @returns sformatowany string
 */
export function formatQuantity(quantity: number, unitName: string, unitAbbreviation: string): string {
  // Użyj skrótu dla krótszej formy
  return `${quantity} ${unitAbbreviation}`;
}
