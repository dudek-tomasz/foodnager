/**
 * Date utility functions for expiry date handling in Virtual Fridge
 */

/**
 * Checks if a product is expired based on expiry date
 * @param expiryDate - ISO date string or null
 * @returns true if product is expired, false otherwise
 */
export function isExpired(expiryDate: string | null): boolean {
  if (!expiryDate) {
    return false; // No expiry date means product doesn't expire
  }

  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0); // Reset time to start of day in UTC

  return expiry < today;
}

/**
 * Checks if a product is expiring soon (within specified days)
 * @param expiryDate - ISO date string or null
 * @param days - Number of days threshold
 * @returns true if product expires within the specified days
 */
export function isExpiringSoon(expiryDate: string | null, days: number): boolean {
  if (!expiryDate) {
    return false; // No expiry date means product doesn't expire
  }

  const expiry = new Date(expiryDate);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const threshold = new Date(today);
  threshold.setUTCDate(threshold.getUTCDate() + days);

  return expiry >= today && expiry <= threshold;
}

/**
 * Formats a date to ISO date string (YYYY-MM-DD)
 * @param date - Date object
 * @returns ISO date string
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Validates if a string is a valid ISO date format (YYYY-MM-DD)
 * @param dateString - String to validate
 * @returns true if valid ISO date
 */
export function isValidISODate(dateString: string): boolean {
  const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoDateRegex.test(dateString)) {
    return false;
  }

  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    return false;
  }

  // Verify that the parsed date matches the input string
  // This catches invalid dates like 2023-02-29 (non-leap year) or 2024-04-31 (April has 30 days)
  const formattedDate = formatDate(date);
  return formattedDate === dateString;
}

/**
 * Gets the current date as ISO string (YYYY-MM-DD)
 * @returns Current date in ISO format
 */
export function getCurrentDate(): string {
  return formatDate(new Date());
}

