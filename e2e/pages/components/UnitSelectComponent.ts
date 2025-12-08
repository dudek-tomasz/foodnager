import type { Locator, Page } from "@playwright/test";

/**
 * UnitSelectComponent - POM for unit selection dropdown
 *
 * Handles:
 * - Opening unit dropdown
 * - Selecting a unit by ID or name
 */
export class UnitSelectComponent {
  private readonly page: Page;
  private readonly testId: string;

  // Locators
  private readonly trigger: Locator;
  private readonly content: Locator;

  constructor(page: Page, testId = "unit-select") {
    this.page = page;
    this.testId = testId;

    // Initialize locators
    this.trigger = page.getByTestId(`${testId}-trigger`);
    this.content = page.getByTestId(`${testId}-content`);
  }

  /**
   * Opens the unit dropdown
   */
  async open(): Promise<void> {
    await this.trigger.click();
    await this.content.waitFor({ state: "visible" });
  }

  /**
   * Selects a unit by its ID
   * @param unitId - The ID of the unit to select
   */
  async selectUnit(unitId: number): Promise<void> {
    await this.open();
    const option = this.page.getByTestId(`${this.testId}-option-${unitId}`);
    await option.click();
  }

  /**
   * Selects a unit by searching for text (e.g., "kilogram" or "kg")
   * @param unitText - The text to search for in unit options
   */
  async selectUnitByText(unitText: string): Promise<void> {
    await this.open();
    const option = this.content.getByText(unitText, { exact: false }).first();
    await option.click();
  }

  /**
   * Gets the currently selected unit text
   */
  async getSelectedUnitText(): Promise<string> {
    return (await this.trigger.textContent()) || "";
  }

  /**
   * Checks if a specific unit option exists
   * @param unitId - The ID of the unit to check
   */
  async hasUnitOption(unitId: number): Promise<boolean> {
    await this.open();
    const option = this.page.getByTestId(`${this.testId}-option-${unitId}`);
    const isVisible = await option.isVisible().catch(() => false);

    // Close dropdown
    await this.page.keyboard.press("Escape");

    return isVisible;
  }

  /**
   * Gets all available unit options
   */
  async getAllUnits(): Promise<string[]> {
    await this.open();
    const options = this.content.locator('[data-testid^="unit-select-option-"]');
    const count = await options.count();
    const units: string[] = [];

    for (let i = 0; i < count; i++) {
      const text = await options.nth(i).textContent();
      if (text) units.push(text.trim());
    }

    // Close dropdown
    await this.page.keyboard.press("Escape");

    return units;
  }
}
