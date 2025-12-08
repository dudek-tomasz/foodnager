/**
 * RecipeIngredientsSection - Complete ingredients section with availability and shopping list button
 */

import React from "react";
import IngredientsList from "./IngredientsList";
import { Button } from "@/components/ui/button";
import type { IngredientWithAvailability } from "../../lib/types/recipe-view-models";

interface RecipeIngredientsSectionProps {
  ingredients: IngredientWithAvailability[];
  hasMissingIngredients: boolean;
  onGenerateShoppingList: () => void;
  isGenerating?: boolean;
}

export default function RecipeIngredientsSection({
  ingredients,
  hasMissingIngredients,
  onGenerateShoppingList,
  isGenerating = false,
}: RecipeIngredientsSectionProps) {
  return (
    <section className="mb-8">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Składniki</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {ingredients.length} {ingredients.length === 1 ? "składnik" : "składników"}
        </span>
      </div>

      {/* Ingredients list */}
      <div className="mb-4">
        <IngredientsList ingredients={ingredients} />
      </div>

      {/* Generate shopping list button */}
      {hasMissingIngredients && (
        <div className="mt-4">
          <Button
            variant="secondary"
            size="default"
            onClick={onGenerateShoppingList}
            disabled={isGenerating}
            className="w-full sm:w-auto"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            {isGenerating ? "Generowanie..." : "Generuj listę zakupów"}
          </Button>
        </div>
      )}

      {/* Info message when all ingredients available */}
      {!hasMissingIngredients && ingredients.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-green-600 dark:text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-800 dark:text-green-200">
            Masz wszystkie składniki potrzebne do przygotowania tego przepisu!
          </p>
        </div>
      )}
    </section>
  );
}
