/**
 * ManualConversionModal - Modal do ręcznego określania ilości składników z różnymi jednostkami
 */

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { IngredientWithAvailability } from "../../lib/types/recipe-view-models";
import { formatQuantity } from "../../lib/utils/recipe-utils";

interface ManualConversionModalProps {
  /** Czy modal jest otwarty */
  open: boolean;
  /** Składniki wymagające ręcznej konwersji */
  ingredients: IngredientWithAvailability[];
  /** Callback po zatwierdzeniu konwersji */
  onConfirm: (conversions: Record<number, number>) => void;
  /** Callback po anulowaniu */
  onCancel: () => void;
}

export default function ManualConversionModal({ open, ingredients, onConfirm, onCancel }: ManualConversionModalProps) {
  // Stan dla wartości wprowadzonych przez użytkownika
  // Klucz: product_id, Wartość: ilość w jednostce z lodówki
  const [conversions, setConversions] = useState<Record<number, string>>({});

  // Handler dla zmiany wartości w inpucie
  const handleChange = (productId: number, value: string) => {
    setConversions((prev) => ({
      ...prev,
      [productId]: value,
    }));
  };

  // Handler dla zatwierdzenia
  const handleConfirm = () => {
    // Konwertuj stringi na liczby
    const numericConversions: Record<number, number> = {};

    for (const ingredient of ingredients) {
      const value = conversions[ingredient.product.id];
      const numericValue = value ? parseFloat(value) : 0;

      // Jeśli wartość jest 0 lub NaN, użytkownik pominął ten składnik
      numericConversions[ingredient.product.id] = !isNaN(numericValue) && numericValue > 0 ? numericValue : 0;
    }

    onConfirm(numericConversions);
  };

  // Handler dla anulowania (wszystkie wartości = 0)
  const handleCancel = () => {
    setConversions({});
    onCancel();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Określ ilość składników</DialogTitle>
          <DialogDescription>
            Niektóre składniki mają różne jednostki w przepisie i lodówce. Określ ile chcesz użyć z lodówki (w
            jednostkach z lodówki). Jeśli pozostawisz puste, składnik nie zostanie odjęty z lodówki.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {ingredients.map((ingredient) => {
            const requiredFormatted = formatQuantity(
              ingredient.requiredQuantity,
              ingredient.unit.name,
              ingredient.unit.abbreviation
            );

            return (
              <div
                key={ingredient.product.id}
                className="space-y-2 p-3 bg-yellow-50 dark:bg-yellow-900/10 rounded-lg border border-yellow-200 dark:border-yellow-800"
              >
                <div className="font-medium text-gray-900 dark:text-gray-100">{ingredient.product.name}</div>

                <div className="text-sm text-gray-600 dark:text-gray-400">
                  <div>
                    W przepisie: <span className="font-semibold">{requiredFormatted}</span>
                  </div>
                  <div>
                    W lodówce:{" "}
                    <span className="font-semibold">
                      {ingredient.availableQuantity} {ingredient.fridgeUnit || ingredient.unit.abbreviation}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`ingredient-${ingredient.product.id}`} className="text-sm">
                    Ile użyć z lodówki? (w {ingredient.fridgeUnit || ingredient.unit.abbreviation})
                  </Label>
                  <Input
                    id={`ingredient-${ingredient.product.id}`}
                    type="number"
                    min="0"
                    step="0.1"
                    max={ingredient.availableQuantity}
                    placeholder="0"
                    value={conversions[ingredient.product.id] || ""}
                    onChange={(e) => handleChange(ingredient.product.id, e.target.value)}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-500">
                    Max: {ingredient.availableQuantity} {ingredient.fridgeUnit || ingredient.unit.abbreviation}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Anuluj
          </Button>
          <Button onClick={handleConfirm}>Potwierdź</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
