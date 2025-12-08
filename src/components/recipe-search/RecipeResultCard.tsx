/**
 * RecipeResultCard - Card displaying single recipe search result
 *
 * Shows recipe with match score, available/missing ingredients, and actions
 */

import React from "react";
import { Clock, ChefHat, Check, X, ShoppingCart, Eye } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { RecipeSearchResultDTO } from "@/types/recipe-search.types";

interface RecipeResultCardProps {
  result: RecipeSearchResultDTO;
  onClick: (recipeId: number) => void;
}

export default function RecipeResultCard({ result, onClick }: RecipeResultCardProps) {
  const { recipe, match_score, available_ingredients, missing_ingredients } = result;

  // Calculate match percentage and styling
  const matchPercentage = Math.round(match_score * 100);
  const getBorderColor = () => {
    if (matchPercentage >= 90) return "border-l-green-500";
    if (matchPercentage >= 70) return "border-l-yellow-500";
    return "border-l-red-500";
  };

  const getScoreColor = () => {
    if (matchPercentage >= 90) return "bg-green-100 text-green-700";
    if (matchPercentage >= 70) return "bg-yellow-100 text-yellow-700";
    return "bg-red-100 text-red-700";
  };

  const hasMissingIngredients = missing_ingredients.length > 0;

  const handleViewRecipe = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(recipe.id);
  };

  const handleShoppingList = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `/shopping-list?recipe_id=${recipe.id}`;
  };

  return (
    <Card
      className={`h-full border-l-4 ${getBorderColor()} hover:shadow-lg hover:scale-[1.02] 
                  transition-all duration-200 cursor-pointer group`}
      onClick={handleViewRecipe}
    >
      <CardHeader className="relative pb-3">
        {/* Match score badge */}
        <div className="absolute top-4 right-4">
          <Badge className={`${getScoreColor()} font-bold px-3 py-1 text-sm`}>{matchPercentage}%</Badge>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 pr-16 group-hover:text-blue-700 transition-colors">
          {recipe.title}
        </h3>

        {/* Description */}
        {recipe.description && <p className="text-sm text-gray-600 line-clamp-2 mt-2">{recipe.description}</p>}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Cooking time and difficulty */}
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          {recipe.cooking_time && (
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              <span>{recipe.cooking_time} min</span>
            </div>
          )}
          {recipe.difficulty && (
            <div className="flex items-center gap-1.5">
              <ChefHat className="h-4 w-4" />
              <span className="capitalize">{recipe.difficulty}</span>
            </div>
          )}
        </div>

        {/* Ingredients summary */}
        <div className="space-y-2">
          {/* Available ingredients */}
          {available_ingredients.length > 0 && (
            <div className="flex items-start gap-2 text-sm">
              <Check className="h-4 w-4 text-green-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">
                {available_ingredients.length}{" "}
                {available_ingredients.length === 1 ? "dostępny składnik" : "dostępnych składników"}
              </span>
            </div>
          )}

          {/* Missing ingredients */}
          {hasMissingIngredients && (
            <div className="flex items-start gap-2 text-sm">
              <X className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-gray-700">
                {missing_ingredients.length}{" "}
                {missing_ingredients.length === 1 ? "brakujący składnik" : "brakujących składników"}
              </span>
            </div>
          )}
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {recipe.tags.slice(0, 3).map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
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

      <CardFooter className="flex gap-2 pt-4">
        <Button variant="default" className="flex-1 gap-2" onClick={handleViewRecipe}>
          <Eye className="h-4 w-4" />
          Zobacz przepis
        </Button>

        {hasMissingIngredients && (
          <Button variant="outline" size="icon" onClick={handleShoppingList} title="Lista zakupów">
            <ShoppingCart className="h-4 w-4" />
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
