/**
 * Utility functions for handling product expiry date status
 */

import type { ExpiryStatus } from "@/types";

/**
 * Configuration for expiry status display
 */
export const EXPIRY_STATUS_CONFIG: Record<ExpiryStatus, { variant: string; color: string; label: string }> = {
  expired: {
    variant: "destructive",
    color: "text-red-600",
    label: "Przeterminowany",
  },
  "expiring-soon": {
    variant: "warning",
    color: "text-orange-600",
    label: "Wkrótce przeterminowany",
  },
  fresh: {
    variant: "success",
    color: "text-green-600",
    label: "Świeży",
  },
  "no-expiry": {
    variant: "secondary",
    color: "text-gray-600",
    label: "Brak daty",
  },
};

/**
 * Helper do obliczania statusu daty ważności
 *
 * @param expiryDate - Data ważności w formacie ISO (YYYY-MM-DD) lub null
 * @returns Status daty ważności
 */
export function getExpiryStatus(expiryDate: string | null): ExpiryStatus {
  if (!expiryDate) {
    return "no-expiry";
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return "expired";
  }

  if (diffDays <= 3) {
    return "expiring-soon";
  }

  return "fresh";
}

/**
 * Formatuje datę ważności do wyświetlenia
 *
 * @param expiryDate - Data ważności w formacie ISO
 * @returns Sformatowana data w formacie DD.MM.YYYY
 */
export function formatExpiryDate(expiryDate: string | null): string {
  if (!expiryDate) {
    return "Brak daty ważności";
  }

  const date = new Date(expiryDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();

  return `${day}.${month}.${year}`;
}

/**
 * Oblicza liczbę dni do przeterminowania
 *
 * @param expiryDate - Data ważności w formacie ISO
 * @returns Liczba dni (ujemna jeśli przeterminowany) lub null jeśli brak daty
 */
export function getDaysUntilExpiry(expiryDate: string | null): number | null {
  if (!expiryDate) {
    return null;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}
