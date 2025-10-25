/**
 * EditProductModal - Modal for editing existing fridge item
 * 
 * Features:
 * - Read-only product name display
 * - Edit quantity, unit, and expiry date
 * - Validation (at least one field must be changed)
 * - Remove expiry date option
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import UnitSelect from './UnitSelect';
import DatePicker from './DatePicker';
import {
  validateQuantity,
  validateExpiryDate,
  isDateInPast,
  hasChanges,
} from '@/lib/utils/form-validation';
import type { FridgeItemDTO, UpdateFridgeItemDTO } from '@/types';

interface EditProductModalProps {
  isOpen: boolean;
  item: FridgeItemDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  quantity: string;
  unitId: number | null;
  expiryDate: string | null;
}

interface FormErrors {
  quantity?: string;
  unit?: string;
  expiryDate?: string;
}

export default function EditProductModal({
  isOpen,
  item,
  onClose,
  onSuccess,
}: EditProductModalProps) {
  const [formState, setFormState] = useState<FormState>({
    quantity: '',
    unitId: null,
    expiryDate: null,
  });
  const [initialState, setInitialState] = useState<FormState>({
    quantity: '',
    unitId: null,
    expiryDate: null,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dateWarning, setDateWarning] = useState<string | null>(null);

  // Initialize form with item data
  useEffect(() => {
    if (isOpen && item) {
      const initial: FormState = {
        quantity: item.quantity.toString(),
        unitId: item.unit.id,
        expiryDate: item.expiry_date,
      };
      setFormState(initial);
      setInitialState(initial);
      setErrors({});
      setSubmitError(null);
      setDateWarning(null);
    }
  }, [isOpen, item]);

  // Check for date warning
  useEffect(() => {
    if (formState.expiryDate && isDateInPast(formState.expiryDate)) {
      setDateWarning('Data w przeszłości - produkt może być już przeterminowany');
    } else {
      setDateWarning(null);
    }
  }, [formState.expiryDate]);

  // Check if form has changes
  const formHasChanges = hasChanges(
    {
      quantity: initialState.quantity,
      unitId: initialState.unitId,
      expiryDate: initialState.expiryDate,
    },
    {
      quantity: formState.quantity,
      unitId: formState.unitId,
      expiryDate: formState.expiryDate,
    }
  );

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate quantity (optional but must be valid if changed)
    if (formState.quantity !== initialState.quantity) {
      const quantityValidation = validateQuantity(formState.quantity);
      if (!quantityValidation.isValid) {
        newErrors.quantity = quantityValidation.error;
      }
    }

    // Validate expiry date (optional but must be valid if provided)
    const dateValidation = validateExpiryDate(formState.expiryDate);
    if (!dateValidation.isValid) {
      newErrors.expiryDate = dateValidation.error;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // Check if at least one field changed
    if (!formHasChanges) {
      setSubmitError('Wprowadź przynajmniej jedną zmianę');
      return;
    }

    // Validate form
    if (!validateForm()) {
      return;
    }

    if (!item) return;

    setIsSubmitting(true);

    try {
      // Build payload with only changed fields
      const payload: UpdateFridgeItemDTO = {};

      if (formState.quantity !== initialState.quantity) {
        payload.quantity = parseFloat(formState.quantity);
      }

      if (formState.unitId !== initialState.unitId && formState.unitId !== null) {
        payload.unit_id = formState.unitId;
      }

      if (formState.expiryDate !== initialState.expiryDate) {
        payload.expiry_date = formState.expiryDate;
      }

      const response = await fetch(`/api/fridge/${item.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update product');
      }

      // Success!
      await response.json();
      onSuccess();
    } catch (error) {
      console.error('Failed to update product:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Nie udało się zaktualizować produktu'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edytuj produkt</DialogTitle>
          <DialogDescription>
            Zmień ilość, jednostkę lub datę ważności produktu
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Product Name (Read-only) */}
            <div className="space-y-2">
              <Label>Produkt</Label>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md">
                <span className="text-sm font-medium">{item.product.name}</span>
                {item.product.id && (
                  <span className="ml-2 text-xs text-gray-500">
                    (nie można zmienić)
                  </span>
                )}
              </div>
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">Ilość</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formState.quantity}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, quantity: e.target.value }))
                  }
                  placeholder="0"
                  className={errors.quantity ? 'border-red-500' : ''}
                  disabled={isSubmitting}
                />
                {errors.quantity && (
                  <p className="text-xs text-red-600">{errors.quantity}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit">Jednostka</Label>
                <UnitSelect
                  value={formState.unitId}
                  onChange={(unitId) =>
                    setFormState((prev) => ({ ...prev, unitId }))
                  }
                  error={errors.unit}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Expiry Date */}
            <div className="space-y-2">
              <Label htmlFor="expiryDate">Data ważności</Label>
              <DatePicker
                value={formState.expiryDate}
                onChange={(expiryDate) =>
                  setFormState((prev) => ({ ...prev, expiryDate }))
                }
                error={errors.expiryDate}
                disabled={isSubmitting}
                showClearButton
              />
              {dateWarning && (
                <p className="text-xs text-orange-600 flex items-center gap-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3 w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  {dateWarning}
                </p>
              )}
            </div>

            {/* No Changes Warning */}
            {!formHasChanges && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-md p-3">
                <p className="text-sm text-orange-800 dark:text-orange-200">
                  Wprowadź przynajmniej jedną zmianę aby zapisać
                </p>
              </div>
            )}

            {/* Submit Error */}
            {submitError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3">
                <p className="text-sm text-red-800 dark:text-red-200">
                  {submitError}
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Anuluj
            </Button>
            <Button type="submit" disabled={isSubmitting || !formHasChanges}>
              {isSubmitting ? 'Zapisywanie...' : 'Zapisz zmiany'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


