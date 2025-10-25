/**
 * IngredientItem - Single ingredient with checkbox, availability status and color coding
 */

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { IngredientWithAvailability } from '../../lib/types/recipe-view-models';
import { getAvailabilityColors, formatQuantity } from '../../lib/utils/recipe-utils';

interface IngredientItemProps {
  ingredient: IngredientWithAvailability;
}

export default function IngredientItem({ ingredient }: IngredientItemProps) {
  const colors = getAvailabilityColors(ingredient.availabilityStatus);
  const isAvailable = ingredient.availabilityStatus === 'full';
  const isPartial = ingredient.availabilityStatus === 'partial';

  // Icon depending on availability status
  const AvailabilityIcon = () => {
    if (ingredient.availabilityStatus === 'full') {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 ${colors.icon}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      );
    }

    if (ingredient.availabilityStatus === 'partial') {
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 ${colors.icon}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      );
    }

    // none
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className={`h-5 w-5 ${colors.icon}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6 18L18 6M6 6l12 12"
        />
      </svg>
    );
  };

  const formattedQuantity = formatQuantity(
    ingredient.requiredQuantity,
    ingredient.unit.name,
    ingredient.unit.abbreviation
  );

  return (
    <li
      className={`flex items-start gap-3 py-3 px-4 rounded-lg transition-colors ${colors.bg}`}
      role="listitem"
    >
      {/* Checkbox (disabled, tylko wizualizacja) */}
      <div className="pt-0.5">
        <Checkbox
          checked={isAvailable}
          disabled={true}
          aria-hidden="true"
          className="pointer-events-none"
        />
      </div>

      {/* Availability icon */}
      <div className="pt-0.5">
        <AvailabilityIcon />
      </div>

      {/* Ingredient info */}
      <div className="flex-1 min-w-0">
        <div className={`font-medium ${colors.text}`}>
          {ingredient.product.name}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">
          {formattedQuantity}
        </div>

        {/* Availability label dla partial */}
        {isPartial && (
          <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            Dostępne: {formatQuantity(
              ingredient.availableQuantity,
              ingredient.unit.name,
              ingredient.unit.abbreviation
            )}
            {' '}/{' '}
            Wymagane: {formattedQuantity}
          </div>
        )}
      </div>
    </li>
  );
}

