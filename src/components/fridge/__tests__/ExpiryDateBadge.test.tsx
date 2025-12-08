/**
 * Unit tests for ExpiryDateBadge component
 *
 * Test coverage:
 * - Rendering with different expiry statuses (expired, expiring-soon, fresh, no-expiry)
 * - Status-to-variant mapping (Badge component variants)
 * - Status-to-class mapping (custom CSS classes)
 * - Date formatting (DD.MM.YYYY)
 * - showDaysCount functionality with different scenarios
 * - Edge cases (null dates, invalid dates, boundary dates)
 * - Accessibility (aria-label)
 * - Business logic validation
 *
 * Business Rules:
 * - Green (fresh): > 3 days until expiry
 * - Orange (expiring-soon): <= 3 days until expiry (1-3 days)
 * - Red (expired): past expiry date (< 0 days)
 * - Gray (no-expiry): no expiry date set (null)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@/tests/utils/test-utils";
import ExpiryDateBadge from "../ExpiryDateBadge";
import * as expiryStatusUtils from "@/lib/utils/expiry-status";

// =============================================================================
// MOCKS
// =============================================================================

// Mock Badge component to test props passed to it
vi.mock("@/components/ui/badge", () => ({
  Badge: ({ variant, className, children, "aria-label": ariaLabel }: any) => (
    <div data-testid="badge" data-variant={variant} data-classname={className} aria-label={ariaLabel}>
      {children}
    </div>
  ),
}));

// =============================================================================
// TEST UTILITIES
// =============================================================================

/**
 * Helper function to get a date string relative to today
 * Uses the same logic as the component to avoid timezone issues
 * @param daysOffset - Number of days to add (positive) or subtract (negative) from today
 * @returns ISO date string (YYYY-MM-DD)
 */
function getRelativeDate(daysOffset: number): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + daysOffset);

  // Format to YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

/**
 * Helper function to format date to DD.MM.YYYY
 */
function formatTestDate(isoDate: string): string {
  const date = new Date(isoDate);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
}

// =============================================================================
// TESTS
// =============================================================================

describe("ExpiryDateBadge", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ===========================================================================
  // RENDERING TESTS - BASIC
  // ===========================================================================

  describe("Basic Rendering", () => {
    it("should render badge component", () => {
      const futureDate = getRelativeDate(10);
      render(<ExpiryDateBadge expiryDate={futureDate} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toBeInTheDocument();
    });

    it("should render with formatted date text when expiryDate is provided", () => {
      const futureDate = getRelativeDate(10);
      const formattedDate = formatTestDate(futureDate);

      render(<ExpiryDateBadge expiryDate={futureDate} />);

      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

    it('should render "Brak daty ważności" when expiryDate is null', () => {
      render(<ExpiryDateBadge expiryDate={null} />);

      expect(screen.getByText("Brak daty ważności")).toBeInTheDocument();
    });

    it("should have accessible aria-label with formatted date", () => {
      const futureDate = getRelativeDate(10);
      const formattedDate = formatTestDate(futureDate);

      render(<ExpiryDateBadge expiryDate={futureDate} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("aria-label", `Data ważności: ${formattedDate}`);
    });

    it("should have accessible aria-label when no expiry date", () => {
      render(<ExpiryDateBadge expiryDate={null} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("aria-label", "Data ważności: Brak daty ważności");
    });
  });

  // ===========================================================================
  // STATUS TESTS - EXPIRED (< 0 days)
  // ===========================================================================

  describe("Expired Status (< 0 days)", () => {
    it('should show "destructive" variant for expired product (-1 day)', () => {
      const expiredDate = getRelativeDate(-1);
      render(<ExpiryDateBadge expiryDate={expiredDate} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-variant", "destructive");
    });

    it('should show "destructive" variant for expired product (-5 days)', () => {
      const expiredDate = getRelativeDate(-5);
      render(<ExpiryDateBadge expiryDate={expiredDate} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-variant", "destructive");
    });

    it('should show "destructive" variant for expired product (-30 days)', () => {
      const expiredDate = getRelativeDate(-30);
      render(<ExpiryDateBadge expiryDate={expiredDate} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-variant", "destructive");
    });

    it("should not apply custom class for expired status", () => {
      const expiredDate = getRelativeDate(-1);
      render(<ExpiryDateBadge expiryDate={expiredDate} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-classname", "");
    });

    it('should show "(przeterminowany)" text when showDaysCount is true and expired', () => {
      const expiredDate = getRelativeDate(-5);
      const formattedDate = formatTestDate(expiredDate);

      render(<ExpiryDateBadge expiryDate={expiredDate} showDaysCount={true} />);

      expect(screen.getByText(`${formattedDate} (przeterminowany)`)).toBeInTheDocument();
    });

    it('should not show "(przeterminowany)" text when showDaysCount is false', () => {
      const expiredDate = getRelativeDate(-5);
      const formattedDate = formatTestDate(expiredDate);

      render(<ExpiryDateBadge expiryDate={expiredDate} showDaysCount={false} />);

      expect(screen.getByText(formattedDate)).toBeInTheDocument();
      expect(screen.queryByText(/przeterminowany/i)).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // STATUS TESTS - EXPIRING SOON (0-3 days)
  // ===========================================================================

  describe("Expiring Soon Status (0-3 days)", () => {
    it('should show "outline" variant for product expiring today (0 days)', () => {
      const todayDate = getRelativeDate(0);
      render(<ExpiryDateBadge expiryDate={todayDate} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-variant", "outline");
    });

    it('should show "outline" variant for product expiring tomorrow (1 day)', () => {
      const tomorrowDate = getRelativeDate(1);
      render(<ExpiryDateBadge expiryDate={tomorrowDate} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-variant", "outline");
    });

    it('should show "outline" variant for product expiring in 2 days', () => {
      const date = getRelativeDate(2);
      render(<ExpiryDateBadge expiryDate={date} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-variant", "outline");
    });

    it('should show "outline" variant for product expiring in 3 days (boundary)', () => {
      const date = getRelativeDate(3);
      render(<ExpiryDateBadge expiryDate={date} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-variant", "outline");
    });

    it("should apply orange custom classes for expiring-soon status", () => {
      const date = getRelativeDate(2);
      render(<ExpiryDateBadge expiryDate={date} />);

      const badge = screen.getByTestId("badge");
      const className = badge.getAttribute("data-classname");
      expect(className).toContain("border-orange-500");
      expect(className).toContain("bg-orange-50");
      expect(className).toContain("text-orange-700");
      expect(className).toContain("dark:bg-orange-950");
      expect(className).toContain("dark:text-orange-300");
    });

    it('should show "(dzisiaj)" when expiring today and showDaysCount is true', () => {
      const todayDate = getRelativeDate(0);
      const formattedDate = formatTestDate(todayDate);

      render(<ExpiryDateBadge expiryDate={todayDate} showDaysCount={true} />);

      expect(screen.getByText(`${formattedDate} (dzisiaj)`)).toBeInTheDocument();
    });

    it('should show "(jutro)" when expiring tomorrow and showDaysCount is true', () => {
      const tomorrowDate = getRelativeDate(1);
      const formattedDate = formatTestDate(tomorrowDate);

      render(<ExpiryDateBadge expiryDate={tomorrowDate} showDaysCount={true} />);

      expect(screen.getByText(`${formattedDate} (jutro)`)).toBeInTheDocument();
    });

    it('should show "(2 dni)" when expiring in 2 days and showDaysCount is true', () => {
      const date = getRelativeDate(2);
      const formattedDate = formatTestDate(date);

      render(<ExpiryDateBadge expiryDate={date} showDaysCount={true} />);

      expect(screen.getByText(`${formattedDate} (2 dni)`)).toBeInTheDocument();
    });

    it('should show "(3 dni)" when expiring in 3 days and showDaysCount is true', () => {
      const date = getRelativeDate(3);
      const formattedDate = formatTestDate(date);

      render(<ExpiryDateBadge expiryDate={date} showDaysCount={true} />);

      expect(screen.getByText(`${formattedDate} (3 dni)`)).toBeInTheDocument();
    });

    it("should not show days count when showDaysCount is false", () => {
      const date = getRelativeDate(2);
      const formattedDate = formatTestDate(date);

      render(<ExpiryDateBadge expiryDate={date} showDaysCount={false} />);

      expect(screen.getByText(formattedDate)).toBeInTheDocument();
      expect(screen.queryByText(/dni/i)).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // STATUS TESTS - FRESH (> 3 days)
  // ===========================================================================

  describe("Fresh Status (> 3 days)", () => {
    it('should show "default" variant for product expiring in 4 days (boundary)', () => {
      const date = getRelativeDate(4);
      render(<ExpiryDateBadge expiryDate={date} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-variant", "default");
    });

    it('should show "default" variant for product expiring in 10 days', () => {
      const date = getRelativeDate(10);
      render(<ExpiryDateBadge expiryDate={date} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-variant", "default");
    });

    it('should show "default" variant for product expiring in 30 days', () => {
      const date = getRelativeDate(30);
      render(<ExpiryDateBadge expiryDate={date} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-variant", "default");
    });

    it('should show "default" variant for product expiring in 365 days', () => {
      const date = getRelativeDate(365);
      render(<ExpiryDateBadge expiryDate={date} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-variant", "default");
    });

    it("should apply green custom classes for fresh status", () => {
      const date = getRelativeDate(10);
      render(<ExpiryDateBadge expiryDate={date} />);

      const badge = screen.getByTestId("badge");
      const className = badge.getAttribute("data-classname");
      expect(className).toContain("border-green-500");
      expect(className).toContain("bg-green-50");
      expect(className).toContain("text-green-700");
      expect(className).toContain("dark:bg-green-950");
      expect(className).toContain("dark:text-green-300");
    });

    it("should not show days count for fresh products even when showDaysCount is true", () => {
      const date = getRelativeDate(10);
      const formattedDate = formatTestDate(date);

      render(<ExpiryDateBadge expiryDate={date} showDaysCount={true} />);

      // Should only show formatted date without days count
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
      expect(screen.queryByText(/dni/i)).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // STATUS TESTS - NO EXPIRY (null)
  // ===========================================================================

  describe("No Expiry Status (null)", () => {
    it('should show "secondary" variant when expiryDate is null', () => {
      render(<ExpiryDateBadge expiryDate={null} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-variant", "secondary");
    });

    it("should not apply custom classes for no-expiry status", () => {
      render(<ExpiryDateBadge expiryDate={null} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-classname", "");
    });

    it('should display "Brak daty ważności" text', () => {
      render(<ExpiryDateBadge expiryDate={null} />);

      expect(screen.getByText("Brak daty ważności")).toBeInTheDocument();
    });

    it("should not show days count when expiryDate is null even if showDaysCount is true", () => {
      render(<ExpiryDateBadge expiryDate={null} showDaysCount={true} />);

      expect(screen.getByText("Brak daty ważności")).toBeInTheDocument();
      expect(screen.queryByText(/dni/i)).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // SHOWDAYSCOUNT PROP TESTS
  // ===========================================================================

  describe("showDaysCount Prop", () => {
    it("should default to false when not provided", () => {
      const date = getRelativeDate(2);
      const formattedDate = formatTestDate(date);

      render(<ExpiryDateBadge expiryDate={date} />);

      expect(screen.getByText(formattedDate)).toBeInTheDocument();
      expect(screen.queryByText(/dni/i)).not.toBeInTheDocument();
    });

    it("should show days count when showDaysCount is explicitly true", () => {
      const date = getRelativeDate(2);
      const formattedDate = formatTestDate(date);

      render(<ExpiryDateBadge expiryDate={date} showDaysCount={true} />);

      expect(screen.getByText(`${formattedDate} (2 dni)`)).toBeInTheDocument();
    });

    it("should not show days count when showDaysCount is explicitly false", () => {
      const date = getRelativeDate(2);
      const formattedDate = formatTestDate(date);

      render(<ExpiryDateBadge expiryDate={date} showDaysCount={false} />);

      expect(screen.getByText(formattedDate)).toBeInTheDocument();
      expect(screen.queryByText(/dni/i)).not.toBeInTheDocument();
    });

    it("should only show days count for expiring-soon and expired products", () => {
      // Fresh product (> 3 days) should not show days count
      const freshDate = getRelativeDate(10);
      const { rerender } = render(<ExpiryDateBadge expiryDate={freshDate} showDaysCount={true} />);
      expect(screen.queryByText(/dni/i)).not.toBeInTheDocument();

      // Expiring soon product should show days count
      const expiringSoonDate = getRelativeDate(2);
      rerender(<ExpiryDateBadge expiryDate={expiringSoonDate} showDaysCount={true} />);
      expect(screen.getByText(/2 dni/i)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // EDGE CASES & BOUNDARY CONDITIONS
  // ===========================================================================

  describe("Edge Cases & Boundary Conditions", () => {
    it("should handle date exactly 3 days in future (boundary between expiring-soon and fresh)", () => {
      const date = getRelativeDate(3);
      render(<ExpiryDateBadge expiryDate={date} />);

      const badge = screen.getByTestId("badge");
      // Should be expiring-soon (3 days is still <= 3)
      expect(badge).toHaveAttribute("data-variant", "outline");
    });

    it("should handle date exactly 4 days in future (boundary between expiring-soon and fresh)", () => {
      const date = getRelativeDate(4);
      render(<ExpiryDateBadge expiryDate={date} />);

      const badge = screen.getByTestId("badge");
      // Should be fresh (4 days is > 3)
      expect(badge).toHaveAttribute("data-variant", "default");
    });

    it("should handle today date (0 days)", () => {
      const date = getRelativeDate(0);
      render(<ExpiryDateBadge expiryDate={date} showDaysCount={true} />);

      expect(screen.getByText(/dzisiaj/i)).toBeInTheDocument();
    });

    it("should handle tomorrow date (1 day)", () => {
      const date = getRelativeDate(1);
      render(<ExpiryDateBadge expiryDate={date} showDaysCount={true} />);

      expect(screen.getByText(/jutro/i)).toBeInTheDocument();
    });

    it("should handle yesterday date (-1 day)", () => {
      const date = getRelativeDate(-1);
      render(<ExpiryDateBadge expiryDate={date} showDaysCount={true} />);

      expect(screen.getByText(/przeterminowany/i)).toBeInTheDocument();
    });

    it("should handle far future date (1000 days)", () => {
      const date = getRelativeDate(1000);
      render(<ExpiryDateBadge expiryDate={date} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-variant", "default");
    });

    it("should handle far past date (-1000 days)", () => {
      const date = getRelativeDate(-1000);
      render(<ExpiryDateBadge expiryDate={date} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("data-variant", "destructive");
    });

    it("should handle specific date string format (YYYY-MM-DD)", () => {
      const specificDate = "2025-12-31";
      const formattedDate = "31.12.2025";

      render(<ExpiryDateBadge expiryDate={specificDate} />);

      // Should format correctly
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // DATE FORMATTING TESTS
  // ===========================================================================

  describe("Date Formatting", () => {
    it("should format date to DD.MM.YYYY format", () => {
      const date = "2025-06-15";
      render(<ExpiryDateBadge expiryDate={date} />);

      expect(screen.getByText("15.06.2025")).toBeInTheDocument();
    });

    it("should pad single-digit day with leading zero", () => {
      const date = "2025-12-05";
      render(<ExpiryDateBadge expiryDate={date} />);

      expect(screen.getByText("05.12.2025")).toBeInTheDocument();
    });

    it("should pad single-digit month with leading zero", () => {
      const date = "2025-01-15";
      render(<ExpiryDateBadge expiryDate={date} />);

      expect(screen.getByText("15.01.2025")).toBeInTheDocument();
    });

    it("should handle end of year date", () => {
      const date = "2025-12-31";
      render(<ExpiryDateBadge expiryDate={date} />);

      expect(screen.getByText("31.12.2025")).toBeInTheDocument();
    });

    it("should handle start of year date", () => {
      const date = "2025-01-01";
      render(<ExpiryDateBadge expiryDate={date} />);

      expect(screen.getByText("01.01.2025")).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // INTEGRATION WITH UTILITY FUNCTIONS
  // ===========================================================================

  describe("Integration with Utility Functions", () => {
    it("should call getExpiryStatus with correct date", () => {
      const spy = vi.spyOn(expiryStatusUtils, "getExpiryStatus");
      const date = getRelativeDate(10);

      render(<ExpiryDateBadge expiryDate={date} />);

      expect(spy).toHaveBeenCalledWith(date);
      spy.mockRestore();
    });

    it("should call formatExpiryDate with correct date", () => {
      const spy = vi.spyOn(expiryStatusUtils, "formatExpiryDate");
      const date = getRelativeDate(10);

      render(<ExpiryDateBadge expiryDate={date} />);

      expect(spy).toHaveBeenCalledWith(date);
      spy.mockRestore();
    });

    it("should call getDaysUntilExpiry with correct date", () => {
      const spy = vi.spyOn(expiryStatusUtils, "getDaysUntilExpiry");
      const date = getRelativeDate(10);

      render(<ExpiryDateBadge expiryDate={date} />);

      expect(spy).toHaveBeenCalledWith(date);
      spy.mockRestore();
    });

    it("should handle null date in all utility functions", () => {
      const getExpiryStatusSpy = vi.spyOn(expiryStatusUtils, "getExpiryStatus");
      const formatExpiryDateSpy = vi.spyOn(expiryStatusUtils, "formatExpiryDate");
      const getDaysUntilExpirySpy = vi.spyOn(expiryStatusUtils, "getDaysUntilExpiry");

      render(<ExpiryDateBadge expiryDate={null} />);

      expect(getExpiryStatusSpy).toHaveBeenCalledWith(null);
      expect(formatExpiryDateSpy).toHaveBeenCalledWith(null);
      expect(getDaysUntilExpirySpy).toHaveBeenCalledWith(null);

      getExpiryStatusSpy.mockRestore();
      formatExpiryDateSpy.mockRestore();
      getDaysUntilExpirySpy.mockRestore();
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe("Accessibility", () => {
    it("should have aria-label with formatted date", () => {
      const date = getRelativeDate(10);
      const formattedDate = formatTestDate(date);

      render(<ExpiryDateBadge expiryDate={date} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("aria-label", `Data ważności: ${formattedDate}`);
    });

    it("should have aria-label when no expiry date", () => {
      render(<ExpiryDateBadge expiryDate={null} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toHaveAttribute("aria-label", "Data ważności: Brak daty ważności");
    });

    it("should maintain consistent aria-label regardless of showDaysCount", () => {
      const date = getRelativeDate(2);
      const formattedDate = formatTestDate(date);

      const { rerender } = render(<ExpiryDateBadge expiryDate={date} showDaysCount={false} />);

      let badge = screen.getByTestId("badge");
      const ariaLabelWithoutDays = badge.getAttribute("aria-label");

      rerender(<ExpiryDateBadge expiryDate={date} showDaysCount={true} />);

      badge = screen.getByTestId("badge");
      const ariaLabelWithDays = badge.getAttribute("aria-label");

      // aria-label should be the same, only visual text changes
      expect(ariaLabelWithoutDays).toBe(ariaLabelWithDays);
      expect(ariaLabelWithoutDays).toBe(`Data ważności: ${formattedDate}`);
    });

    it("should have appropriate semantic structure", () => {
      const date = getRelativeDate(10);
      render(<ExpiryDateBadge expiryDate={date} />);

      const badge = screen.getByTestId("badge");
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveAttribute("aria-label");
    });
  });

  // ===========================================================================
  // BUSINESS LOGIC VALIDATION
  // ===========================================================================

  describe("Business Logic Validation", () => {
    it("should correctly categorize products by expiry timeline", () => {
      // Test the complete business logic flow
      const testCases = [
        { offset: -10, expectedVariant: "destructive", status: "expired" },
        { offset: -1, expectedVariant: "destructive", status: "expired" },
        { offset: 0, expectedVariant: "outline", status: "expiring-soon" },
        { offset: 1, expectedVariant: "outline", status: "expiring-soon" },
        { offset: 2, expectedVariant: "outline", status: "expiring-soon" },
        { offset: 3, expectedVariant: "outline", status: "expiring-soon" },
        { offset: 4, expectedVariant: "default", status: "fresh" },
        { offset: 10, expectedVariant: "default", status: "fresh" },
        { offset: 100, expectedVariant: "default", status: "fresh" },
      ];

      testCases.forEach(({ offset, expectedVariant }) => {
        const date = getRelativeDate(offset);
        const { unmount } = render(<ExpiryDateBadge expiryDate={date} />);

        const badge = screen.getByTestId("badge");
        expect(badge).toHaveAttribute("data-variant", expectedVariant);

        unmount();
      });
    });

    it("should apply correct visual styling based on status", () => {
      const testCases = [
        {
          offset: -1,
          expectedClass: "",
          shouldContainOrange: false,
          shouldContainGreen: false,
        },
        {
          offset: 2,
          expectedClass: "orange",
          shouldContainOrange: true,
          shouldContainGreen: false,
        },
        {
          offset: 10,
          expectedClass: "green",
          shouldContainOrange: false,
          shouldContainGreen: true,
        },
      ];

      testCases.forEach(({ offset, shouldContainOrange, shouldContainGreen }) => {
        const date = getRelativeDate(offset);
        const { unmount } = render(<ExpiryDateBadge expiryDate={date} />);

        const badge = screen.getByTestId("badge");
        const className = badge.getAttribute("data-classname") || "";

        if (shouldContainOrange) {
          expect(className).toContain("orange");
        } else {
          expect(className).not.toContain("orange");
        }

        if (shouldContainGreen) {
          expect(className).toContain("green");
        } else {
          expect(className).not.toContain("green");
        }

        unmount();
      });
    });

    it("should display contextual information with showDaysCount", () => {
      const testCases = [
        { offset: -5, expectedText: "przeterminowany" },
        { offset: 0, expectedText: "dzisiaj" },
        { offset: 1, expectedText: "jutro" },
        { offset: 2, expectedText: "2 dni" },
        { offset: 3, expectedText: "3 dni" },
      ];

      testCases.forEach(({ offset, expectedText }) => {
        const date = getRelativeDate(offset);
        const { unmount } = render(<ExpiryDateBadge expiryDate={date} showDaysCount={true} />);

        expect(screen.getByText(new RegExp(expectedText, "i"))).toBeInTheDocument();

        unmount();
      });
    });
  });
});
