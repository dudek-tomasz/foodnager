import type { Locator, Page } from "@playwright/test";

/**
 * ProductAutocompleteComponent - POM for product autocomplete/combobox
 *
 * Handles:
 * - Searching for products
 * - Selecting existing products
 * - Creating new products
 */
export class ProductAutocompleteComponent {
  private readonly page: Page;
  private readonly testId: string;

  // Locators
  private readonly trigger: Locator;
  private readonly searchInput: Locator;
  private readonly createNewButton: Locator;
  private readonly newProductNameInput: Locator;
  private readonly createSubmitButton: Locator;
  private readonly createCancelButton: Locator;

  constructor(page: Page, testId = "product-autocomplete") {
    this.page = page;
    this.testId = testId;

    // Initialize locators
    this.trigger = page.getByTestId(`${testId}-trigger`);
    this.searchInput = page.getByTestId(`${testId}-search-input`);
    this.createNewButton = page.getByTestId(`${testId}-create-new-button`);
    this.newProductNameInput = page.getByTestId(`${testId}-new-product-name-input`);
    this.createSubmitButton = page.getByTestId(`${testId}-create-submit-button`);
    this.createCancelButton = page.getByTestId(`${testId}-create-cancel-button`);
  }

  /**
   * Opens the product dropdown
   */
  async open(): Promise<void> {
    await this.trigger.click();
    await this.searchInput.waitFor({ state: "visible" });
  }

  /**
   * Searches for a product by name
   * @param productName - The product name to search for
   */
  async search(productName: string): Promise<void> {
    await this.searchInput.fill(productName);
    // Wait for search results to update (debounce delay)
    await this.page.waitForTimeout(500);
  }

  /**
   * Selects an existing product by ID
   * @param productId - The ID of the product to select
   */
  async selectProduct(productId: number): Promise<void> {
    const option = this.page.getByTestId(`${this.testId}-option-${productId}`);
    await option.click();
  }

  /**
   * Selects a product by searching and clicking on the first result
   * @param productName - The product name to search for
   */
  async searchAndSelect(productName: string): Promise<void> {
    await this.open();
    await this.search(productName);

    // Click first result
    const firstOption = this.page.locator('[data-testid^="product-autocomplete-option-"]').first();
    await firstOption.waitFor({ state: "visible" });
    await firstOption.click();
  }

  /**
   * Creates a new product with the given name
   * @param productName - The name of the new product
   */
  async createNewProduct(productName: string): Promise<void> {
    await this.open();
    await this.search(productName);

    // Wait for "Create new" button to appear
    await this.createNewButton.waitFor({ state: "visible" });
    await this.createNewButton.click();

    // Fill in the new product name and submit
    await this.newProductNameInput.waitFor({ state: "visible" });
    await this.newProductNameInput.fill(productName);
    await this.createSubmitButton.click();

    // Wait for creation to complete
    await this.page.waitForTimeout(1000);
  }

  /**
   * Cancels the creation of a new product
   */
  async cancelCreateProduct(): Promise<void> {
    await this.createCancelButton.click();
  }

  /**
   * Gets the currently selected product text
   */
  async getSelectedProductText(): Promise<string> {
    return (await this.trigger.textContent()) || "";
  }

  /**
   * Checks if a product option exists
   * @param productId - The ID of the product to check
   */
  async hasProductOption(productId: number): Promise<boolean> {
    const option = this.page.getByTestId(`${this.testId}-option-${productId}`);
    return await option.isVisible().catch(() => false);
  }

  /**
   * Checks if the create new button is visible
   */
  async isCreateNewButtonVisible(): Promise<boolean> {
    return await this.createNewButton.isVisible().catch(() => false);
  }
}
