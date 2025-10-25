/**
 * CookConfirmationDialog - Confirmation dialog before cooking a recipe
 */

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import IngredientsDeductionPreview from '../IngredientsDeductionPreview';
import type { IngredientWithAvailability } from '../../../lib/types/recipe-view-models';

interface CookConfirmationDialogProps {
  isOpen: boolean;
  recipeTitle: string;
  ingredients: IngredientWithAvailability[];
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function CookConfirmationDialog({
  isOpen,
  recipeTitle,
  ingredients,
  onConfirm,
  onCancel,
  isLoading = false,
}: CookConfirmationDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Potwierdź ugotowanie</DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz ugotować przepis "{recipeTitle}"?
          </DialogDescription>
        </DialogHeader>

        {/* Ingredients deduction preview */}
        <div className="py-4">
          <IngredientsDeductionPreview ingredients={ingredients} />
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Anuluj
          </Button>
          <Button
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? 'Gotowanie...' : 'Potwierdź'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

