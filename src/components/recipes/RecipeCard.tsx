/**
 * RecipeCard Component
 * 
 * Displays a single recipe card with:
 * - Source badge (positioned absolute)
 * - Recipe title (truncated to 2 lines)
 * - Ingredients preview (first 3-4 items)
 * - Meta info (cooking time, difficulty)
 * - Action buttons (Details, Cook)
 * - Dropdown menu for USER recipes (Edit, Delete)
 * 
 * Performance: Memoized to prevent unnecessary re-renders
 */

import { memo } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Clock, ChefHat, MoreVertical, Edit, Trash2 } from 'lucide-react';
import { SourceBadge } from './SourceBadge';
import type { RecipeSummaryDTO, DifficultyEnum } from '@/types';

interface RecipeCardProps {
  recipe: RecipeSummaryDTO;
  onRecipeClick: () => void;
  onDetailsClick: () => void;
  onCookClick: () => void;
  onEditClick?: () => void;
  onDeleteClick?: () => void;
}

const DIFFICULTY_LABELS: Record<DifficultyEnum, string> = {
  easy: 'Łatwy',
  medium: 'Średni',
  hard: 'Trudny',
};

const RecipeCardComponent = ({
  recipe,
  onRecipeClick,
  onDetailsClick,
  onCookClick,
  onEditClick,
  onDeleteClick,
}: RecipeCardProps) => {
  const isUserRecipe = recipe.source === 'user';
  const canEdit = isUserRecipe && (onEditClick || onDeleteClick);

  // Get first 3 ingredients for preview
  const previewIngredients = recipe.ingredients.slice(0, 3);
  const remainingCount = recipe.ingredients.length - 3;

  return (
    <Card 
      className="group relative overflow-hidden transition-all duration-200 hover:shadow-lg hover:scale-[1.02] cursor-pointer"
      onClick={onRecipeClick}
      role="article"
      aria-label={`Przepis: ${recipe.title}`}
    >
      {/* Source Badge - Position Absolute */}
      <div className="absolute top-3 right-3 z-10">
        <SourceBadge source={recipe.source} />
      </div>

      <CardHeader className="pb-3">
        {/* Recipe Title - 2 line clamp */}
        <h3 
          className="text-lg font-semibold leading-tight line-clamp-2 pr-16"
          title={recipe.title}
        >
          {recipe.title}
        </h3>

        {/* Description if available - 2 line clamp */}
        {recipe.description && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1">
            {recipe.description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pb-3">
        {/* Ingredients Preview */}
        <div className="space-y-1">
          <p className="text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase">
            Składniki:
          </p>
          <ul className="text-sm text-neutral-700 dark:text-neutral-300 space-y-0.5">
            {previewIngredients.map((ing, index) => (
              <li 
                key={index}
                className="line-clamp-1"
                title={`${ing.product.name} - ${ing.quantity} ${ing.unit.abbreviation}`}
              >
                {ing.product.name} - {ing.quantity} {ing.unit.abbreviation}
              </li>
            ))}
            {remainingCount > 0 && (
              <li className="text-xs text-neutral-500 dark:text-neutral-400 italic">
                i {remainingCount} więcej...
              </li>
            )}
          </ul>
        </div>

        {/* Tags */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {recipe.tags.slice(0, 3).map((tag) => (
              <Badge 
                key={tag.id} 
                variant="secondary"
                className="text-xs"
              >
                {tag.name}
              </Badge>
            ))}
            {recipe.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{recipe.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-between border-t pt-3">
        {/* Meta Info */}
        <div className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400">
          {recipe.cooking_time && (
            <div 
              className="flex items-center gap-1"
              title={`Czas gotowania: ${recipe.cooking_time} min`}
            >
              <Clock className="w-4 h-4" />
              <span>{recipe.cooking_time} min</span>
            </div>
          )}
          {recipe.difficulty && (
            <div 
              className="flex items-center gap-1"
              title={`Trudność: ${DIFFICULTY_LABELS[recipe.difficulty]}`}
            >
              <ChefHat className="w-4 h-4" />
              <span>{DIFFICULTY_LABELS[recipe.difficulty]}</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            size="sm"
            onClick={onDetailsClick}
            aria-label="Zobacz szczegóły"
          >
            Szczegóły
          </Button>
          <Button
            size="sm"
            onClick={onCookClick}
            aria-label="Ugotuj przepis"
          >
            Ugotuj
          </Button>

          {/* Dropdown Menu - Only for USER recipes */}
          {canEdit && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  aria-label="Więcej opcji"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onEditClick && (
                  <DropdownMenuItem onClick={onEditClick}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edytuj
                  </DropdownMenuItem>
                )}
                {onDeleteClick && (
                  <DropdownMenuItem 
                    onClick={onDeleteClick}
                    className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Usuń
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};

// Export memoized component for better performance
export const RecipeCard = memo(RecipeCardComponent);

