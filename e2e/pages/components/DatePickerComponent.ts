import type { Locator, Page } from "@playwright/test";

/**
 * DatePickerComponent - POM for date picker input
 *
 * Handles:
 * - Setting date value
 * - Clearing date
 * - Getting current date value
 */
export class DatePickerComponent {
  private readonly page: Page;
  private readonly testId: string;

  // Locators
  private readonly input: Locator;
  private readonly clearButton: Locator;

  constructor(page: Page, testId = "date-picker") {
    this.page = page;
    this.testId = testId;

    // Initialize locators
    this.input = page.getByTestId(`${testId}-input`);
    this.clearButton = page.getByTestId(`${testId}-clear-button`);
  }

  /**
   * Sets the date value
   * @param date - Date string in format YYYY-MM-DD
   */
  async setDate(date: string): Promise<void> {
    await this.input.fill(date);
  }

  /**
   * Sets date to today
   */
  async setToday(): Promise<void> {
    const today = new Date().toISOString().split("T")[0];
    await this.setDate(today);
  }

  /**
   * Sets date to tomorrow
   */
  async setTomorrow(): Promise<void> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().split("T")[0];
    await this.setDate(dateString);
  }

  /**
   * Sets date to X days from now
   * @param days - Number of days to add (can be negative for past dates)
   */
  async setDaysFromNow(days: number): Promise<void> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    const dateString = futureDate.toISOString().split("T")[0];
    await this.setDate(dateString);
  }

  /**
   * Clears the date value
   */
  async clear(): Promise<void> {
    if (await this.clearButton.isVisible()) {
      await this.clearButton.click();
    } else {
      // Fallback: clear input directly
      await this.input.clear();
    }
  }

  /**
   * Gets the current date value
   * @returns Date string in format YYYY-MM-DD or empty string if not set
   */
  async getValue(): Promise<string> {
    return await this.input.inputValue();
  }

  /**
   * Checks if the date picker has a value
   */
  async hasValue(): Promise<boolean> {
    const value = await this.getValue();
    return value.length > 0;
  }

  /**
   * Checks if the clear button is visible
   */
  async isClearButtonVisible(): Promise<boolean> {
    return await this.clearButton.isVisible().catch(() => false);
  }
}
