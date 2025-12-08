/**
 * Form validation utilities for fridge view
 */

/**
 * Validation result interface
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Waliduje pole ilości produktu
 *
 * @param quantity - Ilość do walidacji
 * @returns Wynik walidacji
 */
export function validateQuantity(quantity: number | null | string): ValidationResult {
  // Check if empty
  if (quantity === null || quantity === undefined || quantity === "") {
    return {
      isValid: false,
      error: "Ilość jest wymagana",
    };
  }

  // Convert to number if string
  const numQuantity = typeof quantity === "string" ? parseFloat(quantity) : quantity;

  // Check if valid number
  if (isNaN(numQuantity)) {
    return {
      isValid: false,
      error: "Ilość musi być liczbą",
    };
  }

  // Check if negative
  if (numQuantity < 0) {
    return {
      isValid: false,
      error: "Ilość nie może być ujemna",
    };
  }

  return { isValid: true };
}

/**
 * Waliduje datę ważności
 *
 * @param expiryDate - Data ważności w formacie ISO (YYYY-MM-DD) lub null
 * @returns Wynik walidacji
 */
export function validateExpiryDate(expiryDate: string | null): ValidationResult {
  // Optional field - null is valid
  if (!expiryDate) {
    return { isValid: true };
  }

  // Check ISO format (YYYY-MM-DD)
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(expiryDate)) {
    return {
      isValid: false,
      error: "Nieprawidłowy format daty (wymagany: YYYY-MM-DD)",
    };
  }

  // Check if valid date
  const date = new Date(expiryDate);
  if (isNaN(date.getTime())) {
    return {
      isValid: false,
      error: "Nieprawidłowa data",
    };
  }

  return { isValid: true };
}

/**
 * Sprawdza czy data jest w przeszłości (warning, nie błąd)
 *
 * @param expiryDate - Data ważności w formacie ISO
 * @returns true jeśli data jest w przeszłości
 */
export function isDateInPast(expiryDate: string | null): boolean {
  if (!expiryDate) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  return expiry < today;
}

/**
 * Waliduje nazwę produktu (dla tworzenia nowego produktu)
 *
 * @param name - Nazwa produktu
 * @returns Wynik walidacji
 */
export function validateProductName(name: string | null | undefined): ValidationResult {
  if (!name || name.trim() === "") {
    return {
      isValid: false,
      error: "Nazwa jest wymagana",
    };
  }

  if (name.length > 255) {
    return {
      isValid: false,
      error: "Nazwa jest za długa (maksymalnie 255 znaków)",
    };
  }

  return { isValid: true };
}

/**
 * Waliduje czy wybrano produkt w autocomplete
 *
 * @param productId - ID wybranego produktu
 * @returns Wynik walidacji
 */
export function validateProductSelection(productId: number | null): ValidationResult {
  if (!productId) {
    return {
      isValid: false,
      error: "Wybierz produkt z listy",
    };
  }

  return { isValid: true };
}

/**
 * Waliduje czy wybrano jednostkę
 *
 * @param unitId - ID wybranej jednostki
 * @returns Wynik walidacji
 */
export function validateUnitSelection(unitId: number | null): ValidationResult {
  if (!unitId) {
    return {
      isValid: false,
      error: "Wybierz jednostkę",
    };
  }

  return { isValid: true };
}

/**
 * Sprawdza czy przynajmniej jedno pole zostało zmienione (dla edycji)
 *
 * @param original - Oryginalne wartości
 * @param updated - Zaktualizowane wartości
 * @returns true jeśli coś się zmieniło
 */
export function hasChanges(original: Record<string, unknown>, updated: Record<string, unknown>): boolean {
  return Object.keys(updated).some((key) => {
    return updated[key] !== original[key];
  });
}
