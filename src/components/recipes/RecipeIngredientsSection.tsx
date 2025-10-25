/**
 * RecipeIngredientsSection Component
 * 
 * Dynamic list of recipe ingredients with:
 * - Add/remove ingredient rows
 * - ProductAutocomplete for each ingredient
 * - Quantity input
 * - Unit select
 * - Validation (no duplicates, all fields required)
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import ProductAutocomplete from '@/components/fridge/ProductAutocomplete';
import type { RecipeIngredientFormData } from './types';
import type { ProductDTO, UnitDTO } from '@/types';
import { createEmptyIngredientFormData } from '@/lib/mappers/recipe-view.mapper';

interface RecipeIngredientsSectionProps {
  ingredients: RecipeIngredientFormData[];
  availableUnits: UnitDTO[];
  onChange: (ingredients: RecipeIngredientFormData[]) => void;
}

export function RecipeIngredientsSection({
  ingredients,
  availableUnits,
  onChange,
}: RecipeIngredientsSectionProps) {
  /**
   * Adds a new empty ingredient row
   */
  const handleAddIngredient = () => {
    const newIngredient = createEmptyIngredientFormData();
    onChange([...ingredients, newIngredient]);
  };

  /**
   * Removes an ingredient by index
   */
  const handleRemoveIngredient = (index: number) => {
    if (ingredients.length === 1) {
      toast.warning('Przepis musi mieć przynajmniej jeden składnik');
      return;
    }
    const updated = ingredients.filter((_, i) => i !== index);
    onChange(updated);
  };

  /**
   * Updates a specific ingredient field
   */
  const updateIngredient = (
    index: number,
    field: keyof RecipeIngredientFormData,
    value: any
  ) => {
    const updated = [...ingredients];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };

    // Check for duplicate products
    if (field === 'productId' && value) {
      const duplicateIndex = updated.findIndex(
        (ing, i) => i !== index && ing.productId === value
      );
      if (duplicateIndex !== -1) {
        toast.warning('Ten produkt już został dodany do listy składników');
        return;
      }
    }

    onChange(updated);
  };

  /**
   * Handles product selection
   */
  const handleProductChange = (index: number, product: ProductDTO | null) => {
    const updated = [...ingredients];
    updated[index] = {
      ...updated[index],
      productId: product?.id || null,
      productName: product?.name || '',
    };

    // Check for duplicates
    if (product) {
      const duplicateIndex = updated.findIndex(
        (ing, i) => i !== index && ing.productId === product.id
      );
      if (duplicateIndex !== -1) {
        toast.warning(`Produkt "${product.name}" już został dodany do listy składników`);
        return;
      }
    }

    onChange(updated);
  };

  /**
   * Validates if ingredient row is complete
   */
  const isIngredientComplete = (ingredient: RecipeIngredientFormData): boolean => {
    return (
      ingredient.productId !== null &&
      ingredient.quantity > 0 &&
      ingredient.unitId !== null
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>
          Składniki <span className="text-red-500">*</span>
        </Label>
        <span className="text-xs text-neutral-500">
          {ingredients.length} {ingredients.length === 1 ? 'składnik' : 'składników'}
        </span>
      </div>

      <div className="space-y-3">
        {ingredients.map((ingredient, index) => {
          // Convert productId to ProductDTO for autocomplete
          const selectedProduct = ingredient.productId
            ? ({
                id: ingredient.productId,
                name: ingredient.productName,
                is_global: false, // Will be determined by API
                user_id: null,
                created_at: '',
              } as ProductDTO)
            : null;

          // Find selected unit
          const selectedUnit = availableUnits.find(u => u.id === ingredient.unitId);

          return (
            <div
              key={ingredient.id}
              className="flex flex-col sm:flex-row gap-2 p-3 border rounded-lg bg-neutral-50 dark:bg-neutral-900"
            >
              {/* Product Autocomplete */}
              <div className="flex-1 min-w-0">
                <ProductAutocomplete
                  value={selectedProduct}
                  onChange={(product) => handleProductChange(index, product)}
                  error={
                    !ingredient.productId && ingredients.length > 1
                      ? undefined
                      : undefined
                  }
                />
              </div>

              {/* Quantity */}
              <div className="w-full sm:w-24">
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={ingredient.quantity || ''}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value);
                    updateIngredient(index, 'quantity', isNaN(value) ? 0 : value);
                  }}
                  placeholder="Ilość"
                  className={
                    ingredient.quantity <= 0 && ingredients.length > 1
                      ? 'border-red-500'
                      : ''
                  }
                />
              </div>

              {/* Unit Select */}
              <div className="w-full sm:w-32">
                <Select
                  value={ingredient.unitId?.toString() || ''}
                  onValueChange={(value) => {
                    updateIngredient(index, 'unitId', parseInt(value));
                  }}
                >
                  <SelectTrigger
                    className={
                      !ingredient.unitId && ingredients.length > 1
                        ? 'border-red-500'
                        : ''
                    }
                  >
                    <SelectValue placeholder="Jednostka" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUnits.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>
                        {unit.abbreviation} ({unit.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Remove Button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => handleRemoveIngredient(index)}
                disabled={ingredients.length === 1}
                aria-label="Usuń składnik"
                className="shrink-0"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          );
        })}
      </div>

      {/* Add Ingredient Button */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAddIngredient}
        className="w-full"
      >
        <Plus className="h-4 w-4 mr-2" />
        Dodaj składnik
      </Button>

      {/* Validation Message */}
      {ingredients.length === 0 && (
        <p className="text-sm text-red-500">
          Dodaj przynajmniej jeden składnik
        </p>
      )}

      {/* Incomplete Ingredients Warning */}
      {ingredients.some(ing => !isIngredientComplete(ing)) && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Upewnij się, że wszystkie składniki mają wypełnione pola: produkt, ilość i jednostkę
        </p>
      )}
    </div>
  );
}

