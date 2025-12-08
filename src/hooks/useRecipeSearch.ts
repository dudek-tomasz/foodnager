/**
 * useRecipeSearch - Custom hook for managing recipe search state
 *
 * This hook manages the complete recipe search flow including:
 * - Source selection
 * - Search execution with AbortController support
 * - Result handling
 * - Error management
 * - Helper functions for formatting and labeling
 */

import { useState, useEffect } from "react";
import type {
  RecipeSearchViewState,
  UseRecipeSearchReturn,
  RecipeSource,
  FormattedMatchScore,
} from "@/types/recipe-search.types";
import type { FridgeItemDTO, RecipeIngredientDTO } from "@/types";
import { SEARCH_TIMEOUTS } from "@/types/recipe-search.types";

/**
 * Calculate match score between recipe ingredients and available fridge items
 * Frontend version of MatchScoreCalculator logic
 *
 * @param recipeIngredients - Recipe ingredients
 * @param fridgeItems - Available fridge items
 * @returns Match score (0.0 - 1.0)
 */
function calculateMatchScore(recipeIngredients: RecipeIngredientDTO[], fridgeItems: FridgeItemDTO[]): number {
  if (recipeIngredients.length === 0) {
    return 0;
  }

  // Create a map of fridge items by product ID for quick lookup
  const fridgeMap: Record<number, FridgeItemDTO> = {};
  for (const item of fridgeItems) {
    fridgeMap[item.product.id] = item;
  }

  let fullyAvailableCount = 0; // Ingredients with sufficient quantity
  let partiallyAvailableCount = 0; // Ingredients present but insufficient quantity

  // Check each recipe ingredient against fridge
  for (const ingredient of recipeIngredients) {
    const fridgeItem = fridgeMap[ingredient.product.id];
    const requiredQuantity = ingredient.quantity;

    if (fridgeItem) {
      // Product exists in fridge
      const availableQuantity = fridgeItem.quantity;

      // Check if units match (simple ID comparison)
      const unitsMatch = ingredient.unit.id === fridgeItem.unit.id;

      if (unitsMatch) {
        if (availableQuantity >= requiredQuantity) {
          // Sufficient quantity available
          fullyAvailableCount++;
        } else {
          // Insufficient quantity (partially available)
          partiallyAvailableCount++;
        }
      }
      // If units don't match, treat as missing (no credit)
    }
    // If product not in fridge, it's missing (no credit)
  }

  // Formula: (fully_available + 0.5 * partially_available) / total
  const score = (fullyAvailableCount + partiallyAvailableCount * 0.5) / recipeIngredients.length;

  return Math.max(0, Math.min(1, score)); // Clamp between 0 and 1
}

/**
 * Custom hook for recipe search functionality
 *
 * @returns State, actions, and helper functions for recipe search
 */
export function useRecipeSearch(): UseRecipeSearchReturn {
  // Initial state
  const [state, setState] = useState<RecipeSearchViewState>({
    step: "source_selection",
    source: null,
    isLoading: false,
    searchStartTime: null,
    searchDuration: 0,
    results: null,
    searchMetadata: null,
    error: null,
    abortController: null,
  });

  // Timer for search duration tracking
  useEffect(() => {
    if (state.isLoading && state.searchStartTime) {
      const interval = setInterval(() => {
        setState((prev) => ({
          ...prev,
          searchDuration: Date.now() - (prev.searchStartTime || 0),
        }));
      }, 100);

      return () => clearInterval(interval);
    }
  }, [state.isLoading, state.searchStartTime]);

  // Actions
  const selectSource = async (source: RecipeSource) => {
    // Create AbortController for this search
    const controller = new AbortController();

    setState((prev) => ({
      ...prev,
      step: "loading",
      source,
      isLoading: true,
      searchStartTime: Date.now(),
      searchDuration: 0,
      error: null,
      abortController: controller,
    }));

    try {
      // Map source to appropriate search parameters
      const searchDto = {
        use_all_fridge_items: true,
        max_results: 10,
        source: source, // Pass the selected source to the API
      };

      const { searchRecipesByFridge } = await import("@/lib/api/recipe-search.api");
      const data = await searchRecipesByFridge(searchDto, controller.signal);

      setState((prev) => ({
        ...prev,
        step: "results",
        isLoading: false,
        results: data.results,
        searchMetadata: data.search_metadata,
        abortController: null,
      }));
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        // User cancelled - return to source selection
        setState((prev) => ({
          ...prev,
          step: "source_selection",
          source: null,
          isLoading: false,
          searchStartTime: null,
          abortController: null,
        }));
      } else {
        // API error - show error state
        setState((prev) => ({
          ...prev,
          step: "results",
          isLoading: false,
          error: {
            code: "SEARCH_ERROR",
            message: error instanceof Error ? error.message : "Nie udało się wyszukać przepisów",
          },
          results: [],
          searchMetadata: null,
          abortController: null,
        }));
      }
    }
  };

  const cancelSearch = () => {
    if (state.abortController) {
      state.abortController.abort();
    }
  };

  const retrySearch = async () => {
    if (state.source) {
      await selectSource(state.source);
    }
  };

  const generateWithAI = async () => {
    // Create AbortController for AI generation
    const controller = new AbortController();

    setState((prev) => ({
      ...prev,
      step: "loading",
      source: "ai",
      isLoading: true,
      searchStartTime: Date.now(),
      searchDuration: 0,
      error: null,
      abortController: controller,
    }));

    try {
      // TODO: Get actual product IDs from fridge
      // For now, use empty array (API will use all fridge items)
      const generateDto = {
        product_ids: [], // Will be replaced with actual fridge product IDs
        save_to_recipes: false, // Don't auto-save, let user decide
      };

      const { generateRecipeWithAI } = await import("@/lib/api/recipe-search.api");
      const { fetchAllFridgeItems } = await import("@/lib/api/fridge-client");

      // Fetch fridge items to calculate real match score
      const fridgeItems = await fetchAllFridgeItems();
      const data = await generateRecipeWithAI(generateDto, controller.signal);

      // Calculate real match score based on fridge availability
      const realMatchScore = calculateMatchScore(data.recipe.ingredients, fridgeItems);

      // Convert generated recipe to search result format
      setState((prev) => ({
        ...prev,
        step: "results",
        isLoading: false,
        results: [
          {
            recipe: data.recipe,
            match_score: realMatchScore, // Use calculated match score instead of 1.0
            available_ingredients: [],
            missing_ingredients: [],
          },
        ],
        searchMetadata: {
          source: "ai_generated",
          total_results: 1,
          search_duration_ms: Date.now() - (prev.searchStartTime || Date.now()),
        },
        abortController: null,
      }));
    } catch (error: unknown) {
      if (error instanceof Error && error.name === "AbortError") {
        // User cancelled
        setState((prev) => ({
          ...prev,
          step: "source_selection",
          source: null,
          isLoading: false,
          searchStartTime: null,
          abortController: null,
        }));
      } else {
        // API error
        setState((prev) => ({
          ...prev,
          step: "results",
          isLoading: false,
          error: {
            code: "AI_GENERATION_ERROR",
            message: error instanceof Error ? error.message : "Nie udało się wygenerować przepisu",
          },
          results: [],
          searchMetadata: null,
          abortController: null,
        }));
      }
    }
  };

  const goBack = () => {
    setState((prev) => ({
      ...prev,
      step: "source_selection",
      source: null,
      isLoading: false,
      results: null,
      searchMetadata: null,
      error: null,
    }));
  };

  // Helper functions
  const formatMatchScore = (score: number): FormattedMatchScore => {
    const percentage = Math.round(score * 100);
    let colorClass = "text-red-600";
    let borderClass = "border-red-500";

    if (percentage >= 90) {
      colorClass = "text-green-600";
      borderClass = "border-green-500";
    } else if (percentage >= 70) {
      colorClass = "text-yellow-600";
      borderClass = "border-yellow-500";
    }

    return {
      percentage,
      label: `${percentage}%`,
      colorClass,
      borderClass,
    };
  };

  const getSourceLabel = (source: RecipeSource): string => {
    const labels: Record<RecipeSource, string> = {
      user: "Moje przepisy",
      api: "API przepisów",
      ai: "AI",
      all: "Wszystkie źródła",
    };
    return labels[source];
  };

  const isSearchTimedOut = (): boolean => {
    return state.searchDuration > SEARCH_TIMEOUTS.WARNING_THRESHOLD;
  };

  return {
    state,
    actions: {
      selectSource,
      cancelSearch,
      retrySearch,
      generateWithAI,
      goBack,
    },
    helpers: {
      formatMatchScore,
      getSourceLabel,
      isSearchTimedOut,
    },
  };
}
