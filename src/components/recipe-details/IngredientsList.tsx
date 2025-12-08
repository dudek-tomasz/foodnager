/**
 * IngredientsList - List of recipe ingredients with availability status
 */

import React from "react";
import IngredientItem from "./IngredientItem";
import type { IngredientWithAvailability } from "../../lib/types/recipe-view-models";

interface IngredientsListProps {
  ingredients: IngredientWithAvailability[];
}

export default function IngredientsList({ ingredients }: IngredientsListProps) {
  if (ingredients.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400 italic">Brak składników</p>;
  }

  return (
    <ul className="space-y-2">
      {ingredients.map((ingredient, index) => (
        <IngredientItem key={`${ingredient.product.id}-${ingredient.unit.id}-${index}`} ingredient={ingredient} />
      ))}
    </ul>
  );
}
