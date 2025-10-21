/**
 * AddProductModal - Modal for adding new product to fridge
 * 
 * Features:
 * - Product selection with autocomplete
 * - Quantity and unit selection
 * - Optional expiry date
 * - Checkbox "Add another product"
 * - Validation
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
import { Checkbox } from '@/components/ui/checkbox';
import ProductAutocomplete from './ProductAutocomplete';
import UnitSelect from './UnitSelect';
import DatePicker from './DatePicker';
import {
  validateQuantity,
  validateExpiryDate,
  validateProductSelection,
  validateUnitSelection,
  isDateInPast,
} from '@/lib/utils/form-validation';
import type { ProductDTO, CreateFridgeItemDTO } from '@/types';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (addAnother: boolean) => void;
}

interface FormState {
  product: ProductDTO | null;
  quantity: string;
  unitId: number | null;
  expiryDate: string | null;
  addAnother: boolean;
}

interface FormErrors {
  product?: string;
  quantity?: string;
  unit?: string;
  expiryDate?: string;
}

const initialFormState: FormState = {
  product: null,
  quantity: '',
  unitId: null,
  expiryDate: null,
  addAnother: false,
};

export default function AddProductModal({
  isOpen,
  onClose,
  onSuccess,
}: AddProductModalProps) {
  const [formState, setFormState] = useState<FormState>(initialFormState);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dateWarning, setDateWarning] = useState<string | null>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormState(initialFormState);
      setErrors({});
      setSubmitError(null);
      setDateWarning(null);
    }
  }, [isOpen]);

  // Check for date warning
  useEffect(() => {
    if (formState.expiryDate && isDateInPast(formState.expiryDate)) {
      setDateWarning('Data w przeszłości - produkt może być już przeterminowany');
    } else {
      setDateWarning(null);
    }
  }, [formState.expiryDate]);

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Validate product
    const productValidation = validateProductSelection(formState.product?.id || null);
    if (!productValidation.isValid) {
      newErrors.product = productValidation.error;
    }

    // Validate quantity
    const quantityValidation = validateQuantity(formState.quantity);
    if (!quantityValidation.isValid) {
      newErrors.quantity = quantityValidation.error;
    }

    // Validate unit
    const unitValidation = validateUnitSelection(formState.unitId);
    if (!unitValidation.isValid) {
      newErrors.unit = unitValidation.error;
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

    // Validate form
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: CreateFridgeItemDTO = {
        product_id: formState.product!.id,
        quantity: parseFloat(formState.quantity),
        unit_id: formState.unitId!,
        expiry_date: formState.expiryDate || null,
      };

      const response = await fetch('/api/fridge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to add product');
      }

      // Success!
      await response.json();

      // If "add another" is checked, reset form but keep modal open
      if (formState.addAnother) {
        setFormState({
          ...initialFormState,
          addAnother: true, // Keep checkbox checked
        });
        setErrors({});
        setDateWarning(null);
      }

      onSuccess(formState.addAnother);
    } catch (error) {
      console.error('Failed to add product:', error);
      setSubmitError(
        error instanceof Error ? error.message : 'Nie udało się dodać produktu'
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

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Dodaj produkt do lodówki</DialogTitle>
          <DialogDescription>
            Wybierz produkt, podaj ilość i opcjonalnie datę ważności
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Product Selection */}
            <div className="space-y-2">
              <Label htmlFor="product">
                Produkt <span className="text-red-500">*</span>
              </Label>
              <ProductAutocomplete
                value={formState.product}
                onChange={(product) =>
                  setFormState((prev) => ({ ...prev, product }))
                }
                error={errors.product}
              />
            </div>

            {/* Quantity and Unit */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quantity">
                  Ilość <span className="text-red-500">*</span>
                </Label>
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
                <Label htmlFor="unit">
                  Jednostka <span className="text-red-500">*</span>
                </Label>
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
              <Label htmlFor="expiryDate">Data ważności (opcjonalnie)</Label>
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

            {/* Add Another Checkbox */}
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="addAnother"
                checked={formState.addAnother}
                onCheckedChange={(checked) =>
                  setFormState((prev) => ({ ...prev, addAnother: !!checked }))
                }
                disabled={isSubmitting}
              />
              <Label
                htmlFor="addAnother"
                className="text-sm font-normal cursor-pointer"
              >
                Dodaj kolejny produkt po zapisaniu
              </Label>
            </div>

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
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Dodawanie...' : 'Dodaj produkt'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

