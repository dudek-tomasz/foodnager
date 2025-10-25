import type { FridgeStateItemDTO } from '../../types';

interface UsedIngredientsPreviewProps {
  ingredients: FridgeStateItemDTO[];
  maxDisplay?: number;
}

/**
 * Komponent wyświetlający mini-listę składników użytych w przepisie (max 3 + "i X więcej")
 */
export function UsedIngredientsPreview({ ingredients, maxDisplay = 3 }: UsedIngredientsPreviewProps) {
  if (ingredients.length === 0) {
    return null;
  }

  const displayedIngredients = ingredients.slice(0, maxDisplay);
  const remainingCount = ingredients.length - maxDisplay;

  return (
    <div className="text-sm text-muted-foreground">
      <span className="font-medium text-foreground">Użyte składniki: </span>
      <ul className="inline">
        {displayedIngredients.map((ingredient, index) => (
          <li key={ingredient.product_id} className="inline">
            {ingredient.product_name} ({ingredient.quantity} {ingredient.unit})
            {index < displayedIngredients.length - 1 && ', '}
          </li>
        ))}
        {remainingCount > 0 && (
          <li className="inline"> i {remainingCount} więcej</li>
        )}
      </ul>
    </div>
  );
}

