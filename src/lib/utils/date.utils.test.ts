/**
 * Unit tests for date utility functions
 *
 * Tests cover:
 * - Expiry date validation (isExpired)
 * - Expiring soon detection (isExpiringSoon)
 * - Date formatting (formatDate)
 * - ISO date validation (isValidISODate)
 * - Current date retrieval (getCurrentDate)
 * - Edge cases (null values, timezone handling, boundary conditions)
 * - Business rules (products without expiry date don't expire)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { isExpired, isExpiringSoon, formatDate, isValidISODate, getCurrentDate } from "./date.utils";

describe("date.utils", () => {
  // ==========================================================================
  // SETUP & TEARDOWN
  // ==========================================================================

  beforeEach(() => {
    // Reset time to a known state before each test
    vi.useFakeTimers();
  });

  afterEach(() => {
    // Restore real timers after each test
    vi.useRealTimers();
  });

  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================

  /**
   * Creates an ISO date string for a date relative to today
   * @param daysOffset - Number of days to offset from today (negative for past, positive for future)
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const createDateOffset = (daysOffset: number): string => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split("T")[0];
  };

  /**
   * Sets the system time to a specific date at noon UTC
   * @param dateString - ISO date string (YYYY-MM-DD)
   */
  const setSystemDate = (dateString: string): void => {
    // Use UTC to avoid timezone issues in tests
    vi.setSystemTime(new Date(`${dateString}T12:00:00.000Z`));
  };

  // ==========================================================================
  // isExpired() - Core Functionality
  // ==========================================================================

  describe("isExpired()", () => {
    beforeEach(() => {
      // Set a consistent date for testing: 2024-06-15
      setSystemDate("2024-06-15");
    });

    it("should return false for null expiry date (business rule: no expiry = never expires)", () => {
      // Arrange & Act
      const result = isExpired(null);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for today's date (not yet expired)", () => {
      // Arrange
      const today = "2024-06-15";

      // Act
      const result = isExpired(today);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for future date (not expired)", () => {
      // Arrange
      const futureDate = "2024-06-20";

      // Act
      const result = isExpired(futureDate);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true for yesterday (expired)", () => {
      // Arrange
      const yesterday = "2024-06-14";

      // Act
      const result = isExpired(yesterday);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for date in the past (expired)", () => {
      // Arrange
      const pastDate = "2024-01-01";

      // Act
      const result = isExpired(pastDate);

      // Assert
      expect(result).toBe(true);
    });

    it("should handle date with time component correctly (ignore time)", () => {
      // Arrange - ISO string with time component
      const todayWithTime = "2024-06-15T23:59:59.999Z";

      // Act
      const result = isExpired(todayWithTime);

      // Assert
      expect(result).toBe(false);
    });

    it("should handle edge case: year boundary (New Year's Eve)", () => {
      // Arrange
      setSystemDate("2024-01-01");
      const lastYearDate = "2023-12-31";

      // Act
      const result = isExpired(lastYearDate);

      // Assert
      expect(result).toBe(true);
    });

    it("should handle edge case: leap year date", () => {
      // Arrange
      setSystemDate("2024-03-01"); // 2024 is a leap year
      const leapDayDate = "2024-02-29";

      // Act
      const result = isExpired(leapDayDate);

      // Assert
      expect(result).toBe(true);
    });
  });

  // ==========================================================================
  // isExpiringSoon() - Core Functionality
  // ==========================================================================

  describe("isExpiringSoon()", () => {
    beforeEach(() => {
      // Set a consistent date for testing: 2024-06-15
      setSystemDate("2024-06-15");
    });

    it("should return false for null expiry date (business rule: no expiry = never expires)", () => {
      // Arrange & Act
      const result = isExpiringSoon(null, 7);

      // Assert
      expect(result).toBe(false);
    });

    it("should return true for date expiring today (within 0 days threshold)", () => {
      // Arrange
      const today = getCurrentDate();

      // Act
      const result = isExpiringSoon(today, 0);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for date expiring tomorrow (within 7 days threshold)", () => {
      // Arrange
      const tomorrow = "2024-06-16";

      // Act
      const result = isExpiringSoon(tomorrow, 7);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for date exactly at threshold boundary", () => {
      // Arrange
      const currentDate = new Date();
      const exactlyInSevenDays = new Date(currentDate);
      exactlyInSevenDays.setDate(currentDate.getDate() + 7);
      const dateString = formatDate(exactlyInSevenDays);

      // Act
      const result = isExpiringSoon(dateString, 7);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for date beyond threshold", () => {
      // Arrange
      const currentDate = new Date();
      const eightDaysFromNow = new Date(currentDate);
      eightDaysFromNow.setDate(currentDate.getDate() + 8);
      const dateString = formatDate(eightDaysFromNow);

      // Act
      const result = isExpiringSoon(dateString, 7);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for date in the past (already expired)", () => {
      // Arrange
      const yesterday = "2024-06-14";

      // Act
      const result = isExpiringSoon(yesterday, 7);

      // Assert
      expect(result).toBe(false);
    });

    it("should handle threshold of 1 day correctly", () => {
      // Arrange
      const currentDate = new Date();
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(currentDate.getDate() + 1);
      const dayAfterTomorrow = new Date(currentDate);
      dayAfterTomorrow.setDate(currentDate.getDate() + 2);

      // Act & Assert
      expect(isExpiringSoon(formatDate(tomorrow), 1)).toBe(true);
      expect(isExpiringSoon(formatDate(dayAfterTomorrow), 1)).toBe(false);
    });

    it("should handle large threshold values (30 days)", () => {
      // Arrange
      const currentDate = new Date();
      const in29Days = new Date(currentDate);
      in29Days.setDate(currentDate.getDate() + 29);
      const in30Days = new Date(currentDate);
      in30Days.setDate(currentDate.getDate() + 30);
      const in31Days = new Date(currentDate);
      in31Days.setDate(currentDate.getDate() + 31);

      // Act & Assert
      expect(isExpiringSoon(formatDate(in29Days), 30)).toBe(true);
      expect(isExpiringSoon(formatDate(in30Days), 30)).toBe(true);
      expect(isExpiringSoon(formatDate(in31Days), 30)).toBe(false);
    });

    it("should handle edge case: date with time component", () => {
      // Arrange
      const tomorrowWithTime = "2024-06-16T23:59:59.999Z";

      // Act
      const result = isExpiringSoon(tomorrowWithTime, 7);

      // Assert
      expect(result).toBe(true);
    });

    it("should handle edge case: month boundary", () => {
      // Arrange
      setSystemDate("2024-06-30"); // Last day of June
      const nextMonthDate = "2024-07-05"; // 5 days into next month

      // Act
      const result = isExpiringSoon(nextMonthDate, 7);

      // Assert
      expect(result).toBe(true);
    });

    it("should handle edge case: year boundary", () => {
      // Arrange
      setSystemDate("2024-12-28");
      const nextYearDate = "2025-01-02"; // 5 days into next year

      // Act
      const result = isExpiringSoon(nextYearDate, 7);

      // Assert
      expect(result).toBe(true);
    });
  });

  // ==========================================================================
  // formatDate() - Core Functionality
  // ==========================================================================

  describe("formatDate()", () => {
    it("should format a date to ISO string (YYYY-MM-DD)", () => {
      // Arrange
      const date = new Date("2024-06-15T12:30:45.123Z");

      // Act
      const result = formatDate(date);

      // Assert
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toBe("2024-06-15");
    });

    it("should format date with single-digit day and month correctly", () => {
      // Arrange
      const date = new Date("2024-01-05T00:00:00.000Z");

      // Act
      const result = formatDate(date);

      // Assert
      expect(result).toBe("2024-01-05");
    });

    it("should format date at year boundary", () => {
      // Arrange
      const date = new Date("2024-12-31T23:59:59.999Z");

      // Act
      const result = formatDate(date);

      // Assert
      expect(result).toBe("2024-12-31");
    });

    it("should format leap year date correctly", () => {
      // Arrange
      const date = new Date("2024-02-29T12:00:00.000Z");

      // Act
      const result = formatDate(date);

      // Assert
      expect(result).toBe("2024-02-29");
    });

    it("should strip time component from date", () => {
      // Arrange
      const morningDate = new Date("2024-06-15T08:30:00.000Z");
      const eveningDate = new Date("2024-06-15T20:45:00.000Z");

      // Act
      const morningResult = formatDate(morningDate);
      const eveningResult = formatDate(eveningDate);

      // Assert
      expect(morningResult).toBe(eveningResult);
      expect(morningResult).toBe("2024-06-15");
    });

    it("should handle Date object at Unix epoch", () => {
      // Arrange
      const epochDate = new Date("1970-01-01T00:00:00.000Z");

      // Act
      const result = formatDate(epochDate);

      // Assert
      expect(result).toBe("1970-01-01");
    });
  });

  // ==========================================================================
  // isValidISODate() - Core Functionality
  // ==========================================================================

  describe("isValidISODate()", () => {
    it("should return true for valid ISO date string (YYYY-MM-DD)", () => {
      // Arrange
      const validDate = "2024-06-15";

      // Act
      const result = isValidISODate(validDate);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for valid date with single-digit month and day", () => {
      // Arrange
      const validDate = "2024-01-05";

      // Act
      const result = isValidISODate(validDate);

      // Assert
      expect(result).toBe(true);
    });

    it("should return true for leap year date (Feb 29)", () => {
      // Arrange
      const leapYearDate = "2024-02-29";

      // Act
      const result = isValidISODate(leapYearDate);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for invalid leap year date (non-leap year)", () => {
      // Arrange
      const invalidLeapDate = "2023-02-29";

      // Act
      const result = isValidISODate(invalidLeapDate);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for invalid month (13)", () => {
      // Arrange
      const invalidMonth = "2024-13-15";

      // Act
      const result = isValidISODate(invalidMonth);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for invalid day (32)", () => {
      // Arrange
      const invalidDay = "2024-06-32";

      // Act
      const result = isValidISODate(invalidDay);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for invalid day in month (April has 30 days)", () => {
      // Arrange
      const invalidDay = "2024-04-31";

      // Act
      const result = isValidISODate(invalidDay);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for wrong format (DD-MM-YYYY)", () => {
      // Arrange
      const wrongFormat = "15-06-2024";

      // Act
      const result = isValidISODate(wrongFormat);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for wrong format (MM/DD/YYYY)", () => {
      // Arrange
      const wrongFormat = "06/15/2024";

      // Act
      const result = isValidISODate(wrongFormat);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for ISO datetime string", () => {
      // Arrange
      const dateTimeString = "2024-06-15T12:30:45.123Z";

      // Act
      const result = isValidISODate(dateTimeString);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for empty string", () => {
      // Arrange
      const emptyString = "";

      // Act
      const result = isValidISODate(emptyString);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for random text", () => {
      // Arrange
      const randomText = "not a date";

      // Act
      const result = isValidISODate(randomText);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for partial date (year only)", () => {
      // Arrange
      const partialDate = "2024";

      // Act
      const result = isValidISODate(partialDate);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for partial date (year-month only)", () => {
      // Arrange
      const partialDate = "2024-06";

      // Act
      const result = isValidISODate(partialDate);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for date with extra characters", () => {
      // Arrange
      const dateWithExtra = "2024-06-15 extra";

      // Act
      const result = isValidISODate(dateWithExtra);

      // Assert
      expect(result).toBe(false);
    });

    it("should return false for date with single-digit year", () => {
      // Arrange
      const invalidYear = "24-06-15";

      // Act
      const result = isValidISODate(invalidYear);

      // Assert
      expect(result).toBe(false);
    });
  });

  // ==========================================================================
  // getCurrentDate() - Core Functionality
  // ==========================================================================

  describe("getCurrentDate()", () => {
    it("should return current date in ISO format (YYYY-MM-DD)", () => {
      // Arrange
      setSystemDate("2024-06-15");

      // Act
      const result = getCurrentDate();

      // Assert
      expect(result).toBe("2024-06-15");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should return correct date when mocked to different dates", () => {
      // Arrange & Act & Assert
      setSystemDate("2024-01-01");
      expect(getCurrentDate()).toBe("2024-01-01");

      setSystemDate("2024-12-31");
      expect(getCurrentDate()).toBe("2024-12-31");

      setSystemDate("2024-02-29");
      expect(getCurrentDate()).toBe("2024-02-29");
    });

    it("should return date without time component", () => {
      // Arrange
      setSystemDate("2024-06-15");

      // Act
      const result = getCurrentDate();

      // Assert
      expect(result).not.toContain("T");
      expect(result).not.toContain(":");
      expect(result.length).toBe(10);
    });

    it("should be consistent across multiple calls in same moment", () => {
      // Arrange
      setSystemDate("2024-06-15");

      // Act
      const result1 = getCurrentDate();
      const result2 = getCurrentDate();
      const result3 = getCurrentDate();

      // Assert
      expect(result1).toBe(result2);
      expect(result2).toBe(result3);
      expect(result1).toBe("2024-06-15");
    });
  });

  // ==========================================================================
  // INTEGRATION TESTS - Combined Functionality
  // ==========================================================================

  describe("Integration - Combined functionality", () => {
    beforeEach(() => {
      setSystemDate("2024-06-15");
    });

    it("should work together: getCurrentDate + isExpired", () => {
      // Arrange
      const currentDate = getCurrentDate();

      // Act & Assert
      expect(isExpired(currentDate)).toBe(false);
    });

    it("should work together: formatDate + isValidISODate", () => {
      // Arrange
      const date = new Date("2024-06-15T12:00:00.000Z");

      // Act
      const formatted = formatDate(date);

      // Assert
      expect(isValidISODate(formatted)).toBe(true);
    });

    it("should work together: getCurrentDate + isExpiringSoon", () => {
      // Arrange
      const currentDate = getCurrentDate();

      // Act & Assert
      expect(isExpiringSoon(currentDate, 0)).toBe(true);
      expect(isExpiringSoon(currentDate, 7)).toBe(true);
    });

    it("should handle workflow: create date, format, validate, check expiry", () => {
      // Arrange
      const futureDate = new Date("2024-06-20T00:00:00.000Z");

      // Act
      const formatted = formatDate(futureDate);
      const isValid = isValidISODate(formatted);
      const expired = isExpired(formatted);
      const expiringSoon = isExpiringSoon(formatted, 7);

      // Assert
      expect(formatted).toBe("2024-06-20");
      expect(isValid).toBe(true);
      expect(expired).toBe(false);
      expect(expiringSoon).toBe(true); // 5 days from now
    });
  });

  // ==========================================================================
  // EDGE CASES - Business Rules
  // ==========================================================================

  describe("Edge Cases - Business Rules", () => {
    beforeEach(() => {
      setSystemDate("2024-06-15");
    });

    it("should treat products without expiry date as never expiring", () => {
      // Arrange & Act & Assert
      expect(isExpired(null)).toBe(false);
      expect(isExpiringSoon(null, 7)).toBe(false);
      expect(isExpiringSoon(null, 0)).toBe(false);
      expect(isExpiringSoon(null, 365)).toBe(false);
    });

    it("should consider product expiring today as not expired but expiring soon", () => {
      // Arrange
      const today = getCurrentDate();

      // Act & Assert
      expect(isExpired(today)).toBe(false);
      expect(isExpiringSoon(today, 0)).toBe(true);
      expect(isExpiringSoon(today, 7)).toBe(true);
    });

    it("should consider yesterday as expired and not expiring soon", () => {
      // Arrange
      const yesterday = "2024-06-14";

      // Act & Assert
      expect(isExpired(yesterday)).toBe(true);
      expect(isExpiringSoon(yesterday, 7)).toBe(false);
    });

    it("should handle timezone-independent date comparison", () => {
      // Arrange - dates with different timezone indicators
      const dateUTC = "2024-06-20T00:00:00.000Z";
      const datePST = "2024-06-20T08:00:00.000-08:00";

      // Act & Assert - both should be treated as same date (2024-06-20)
      expect(isExpired(dateUTC)).toBe(isExpired(datePST));
      expect(isExpiringSoon(dateUTC, 7)).toBe(isExpiringSoon(datePST, 7));
    });
  });

  // ==========================================================================
  // EDGE CASES - Boundary Conditions
  // ==========================================================================

  describe("Edge Cases - Boundary Conditions", () => {
    it("should handle very old dates (year 1000)", () => {
      // Arrange
      setSystemDate("2024-06-15");
      const ancientDate = "1000-01-01";

      // Act & Assert
      expect(isExpired(ancientDate)).toBe(true);
      expect(isExpiringSoon(ancientDate, 7)).toBe(false);
    });

    it("should handle far future dates (year 9999)", () => {
      // Arrange
      setSystemDate("2024-06-15");
      const futureDate = "9999-12-31";

      // Act & Assert
      expect(isExpired(futureDate)).toBe(false);
      expect(isExpiringSoon(futureDate, 7)).toBe(false);
    });

    it("should handle zero days threshold in isExpiringSoon", () => {
      // Arrange
      setSystemDate("2024-06-15");
      const today = getCurrentDate();
      const currentDate = new Date();
      const tomorrow = new Date(currentDate);
      tomorrow.setDate(currentDate.getDate() + 1);

      // Act & Assert
      expect(isExpiringSoon(today, 0)).toBe(true);
      expect(isExpiringSoon(formatDate(tomorrow), 0)).toBe(false);
    });

    it("should handle large threshold in isExpiringSoon (365 days)", () => {
      // Arrange
      setSystemDate("2024-06-15");
      const currentDate = new Date();
      const in364Days = new Date(currentDate);
      in364Days.setDate(currentDate.getDate() + 364);
      const in365Days = new Date(currentDate);
      in365Days.setDate(currentDate.getDate() + 365);
      const in366Days = new Date(currentDate);
      in366Days.setDate(currentDate.getDate() + 366);

      // Act & Assert
      expect(isExpiringSoon(formatDate(in364Days), 365)).toBe(true);
      expect(isExpiringSoon(formatDate(in365Days), 365)).toBe(true);
      expect(isExpiringSoon(formatDate(in366Days), 365)).toBe(false);
    });
  });
});
