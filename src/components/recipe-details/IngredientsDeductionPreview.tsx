/**
 * IngredientsDeductionPreview - Preview of ingredients that will be deducted from fridge
 * Shown in CookConfirmationDialog
 */

import React from 'react';
import type { IngredientWithAvailability } from '../../lib/types/recipe-view-models';
import { formatQuantity } from '../../lib/utils/recipe-utils';

interface IngredientsDeductionPreviewProps {
  ingredients: IngredientWithAvailability[];
}

export default function IngredientsDeductionPreview({
  ingredients,
}: IngredientsDeductionPreviewProps) {
  // Pokazuj tylko składniki dostępne (full lub partial)
  const availableIngredients = ingredients.filter(
    (ing) => ing.availabilityStatus !== 'none'
  );

  if (availableIngredients.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Brak składników do odjęcia
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-600 dark:text-gray-400">
        Następujące składniki zostaną odjęte z Twojej lodówki:
      </p>

      <ul className="space-y-2 max-h-64 overflow-y-auto">
        {availableIngredients.map((ingredient, index) => {
          const deductQuantity =
            ingredient.availabilityStatus === 'full'
              ? ingredient.requiredQuantity
              : ingredient.availableQuantity;

          return (
            <li
              key={`${ingredient.product.id}-${ingredient.unit.id}-${index}`}
              className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded-md"
            >
              <span className="font-medium text-gray-900 dark:text-gray-100">
                {ingredient.product.name}
              </span>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                -{' '}
                {formatQuantity(
                  deductQuantity,
                  ingredient.unit.name,
                  ingredient.unit.abbreviation
                )}
              </span>
            </li>
          );
        })}
      </ul>

      {/* Warning for partial availability */}
      {availableIngredients.some((ing) => ing.availabilityStatus === 'partial') && (
        <div className="flex items-start gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Niektóre składniki są dostępne tylko częściowo. Przepis może wymagać
            dodatkowych produktów.
          </p>
        </div>
      )}
    </div>
  );
}

