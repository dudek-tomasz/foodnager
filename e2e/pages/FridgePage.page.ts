import type { Locator, Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { AddProductModal } from "./AddProductModal.page";

/**
 * FridgePage - POM for the Fridge page
 *
 * Represents the main fridge view with:
 * - Navigation to fridge page
 * - Opening add product modal
 * - Viewing fridge items
 * - Searching and filtering
 * - Pagination
 */
export class FridgePage {
  private readonly page: Page;

  // Locators
  private readonly addProductButton: Locator;
  private readonly searchInput: Locator;
  private readonly sortDropdown: Locator;
  private readonly fridgeItemsList: Locator;
  private readonly emptyState: Locator;
  private readonly loadingSpinner: Locator;
  private readonly statsSection: Locator;
  private readonly successToast: Locator;

  // Modal instance
  public readonly addProductModal: AddProductModal;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators (use first() for buttons that appear twice - desktop/mobile)
    this.addProductButton = page.getByTestId("fridge-add-product-button").first();
    this.searchInput = page.getByPlaceholder("Szukaj produktów...");
    this.sortDropdown = page.getByLabel("Wybierz pole sortowania");
    this.fridgeItemsList = page.getByTestId("fridge-items-list");
    this.emptyState = page.getByText("Twoja lodówka jest pusta");
    this.loadingSpinner = page.getByTestId("fridge-loading");
    this.statsSection = page
      .locator("div")
      .filter({ hasText: /Wszystkie produkty/ })
      .first();
    this.successToast = page.locator("[data-sonner-toast]");

    // Initialize modal
    this.addProductModal = new AddProductModal(page);
  }

  /**
   * Navigation
   */

  /**
   * Navigates to the fridge page
   */
  async goto(): Promise<void> {
    await this.page.goto("/fridge", { waitUntil: "domcontentloaded" });
    // Wait for page to be interactive
    await this.page.waitForLoadState("domcontentloaded");
  }

  /**
   * Actions
   */

  /**
   * Opens the add product modal
   */
  async openAddProductModal(): Promise<void> {
    // Wait for button to be ready
    await this.addProductButton.waitFor({ state: "visible" });
    await this.page.waitForTimeout(500); // Small delay for React to hydrate
    await this.addProductButton.click();
    await this.addProductModal.waitForModal();
  }

  /**
   * Searches for products in the fridge
   * @param query - Search query
   */
  async search(query: string): Promise<void> {
    await this.searchInput.fill(query);

    // Wait for loading to complete (handle debounce + API call)
    // First, wait a bit for debounce to trigger (300ms in useFridge hook)
    await this.page.waitForTimeout(100);

    // Then wait for loading indicator to appear and disappear
    try {
      await this.loadingSpinner.waitFor({ state: "visible", timeout: 5000 });
      await this.loadingSpinner.waitFor({ state: "hidden", timeout: 10000 });
    } catch {
      // If loading doesn't appear, it means results were cached or very fast
      // Wait a bit more to ensure UI updated
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Clears the search input
   */
  async clearSearch(): Promise<void> {
    await this.searchInput.clear();

    // Wait for loading to complete (same as search)
    await this.page.waitForTimeout(100);

    try {
      await this.loadingSpinner.waitFor({ state: "visible", timeout: 5000 });
      await this.loadingSpinner.waitFor({ state: "hidden", timeout: 10000 });
    } catch {
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Changes the sort order
   * @param sortBy - Field to sort by (e.g., "Nazwa", "Ilość")
   */
  async sortBy(sortBy: string): Promise<void> {
    await this.sortDropdown.click();
    await this.page.getByText(sortBy, { exact: true }).click();
  }

  /**
   * Clicks the edit button for a specific product
   * @param productName - Name of the product to edit
   */
  async editProduct(productName: string): Promise<void> {
    const productRow = this.fridgeItemsList.locator("li").filter({ hasText: productName });
    const editButton = productRow.getByLabel(/Edytuj/);
    await editButton.click();
  }

  /**
   * Clicks the delete button for a specific product
   * @param productName - Name of the product to delete
   */
  async deleteProduct(productName: string): Promise<void> {
    const productRow = this.fridgeItemsList.locator("li").filter({ hasText: productName });
    const deleteButton = productRow.getByLabel(/Usuń/);
    await deleteButton.click();
  }

  /**
   * Navigates to a specific page
   * @param pageNumber - Page number to navigate to
   */
  async goToPage(pageNumber: number): Promise<void> {
    const pageLink = this.page.getByLabel(`Przejdź do strony ${pageNumber}`);
    await pageLink.click();
  }

  /**
   * Queries
   */

  /**
   * Gets the count of displayed fridge items
   */
  async getFridgeItemsCount(): Promise<number> {
    const items = this.fridgeItemsList.locator("li");
    return await items.count();
  }

  /**
   * Gets the total products count from stats
   */
  async getTotalProductsCount(): Promise<number> {
    const statsText = await this.statsSection.textContent();
    const match = statsText?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Gets the expired products count from stats
   */
  async getExpiredProductsCount(): Promise<number> {
    // Use more specific selector for stats section
    const expiredSection = this.page
      .locator("div.bg-white.dark\\:bg-gray-800")
      .filter({ hasText: /Przeterminowane/ })
      .first();
    const statsText = await expiredSection.textContent();
    const match = statsText?.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Checks if a specific product exists in the list
   * @param productName - Name of the product to check
   */
  async hasProduct(productName: string): Promise<boolean> {
    const productRow = this.fridgeItemsList.locator("li").filter({ hasText: productName });
    return await productRow.isVisible().catch(() => false);
  }

  /**
   * Gets product details by name
   * @param productName - Name of the product
   */
  async getProductDetails(productName: string): Promise<{
    name: string;
    quantity: string;
    unit: string;
    expiryDate?: string;
  } | null> {
    const productRow = this.fridgeItemsList.locator("li").filter({ hasText: productName });

    if (!(await productRow.isVisible())) {
      return null;
    }

    const text = await productRow.textContent();
    if (!text) return null;

    // Parse the text to extract details
    return {
      name: productName,
      quantity: "", // You can enhance this to parse actual quantity
      unit: "",
      expiryDate: undefined,
    };
  }

  /**
   * Assertions
   */

  /**
   * Asserts that the fridge page is loaded
   */
  async assertPageLoaded(): Promise<void> {
    await expect(this.page).toHaveURL(/\/fridge/, { timeout: 10000 });
    // Wait for main heading to be visible (use first() to avoid strict mode)
    const heading = this.page.getByRole("heading", { name: /Twoja lodówka/i }).first();
    await expect(heading).toBeVisible({ timeout: 10000 });
  }

  /**
   * Asserts that the add product button is visible
   */
  async assertAddButtonVisible(): Promise<void> {
    await expect(this.addProductButton).toBeVisible();
  }

  /**
   * Asserts that the fridge is empty
   */
  async assertFridgeEmpty(): Promise<void> {
    await expect(this.emptyState).toBeVisible();
  }

  /**
   * Asserts that the fridge has items
   */
  async assertFridgeHasItems(): Promise<void> {
    await expect(this.fridgeItemsList).toBeVisible();
    const count = await this.getFridgeItemsCount();
    expect(count).toBeGreaterThan(0);
  }

  /**
   * Asserts that a specific product exists in the list
   * @param productName - Name of the product
   */
  async assertProductExists(productName: string): Promise<void> {
    // Wait for loading to finish first
    await this.waitForLoading();

    // Wait a bit for React to re-render the list
    await this.page.waitForTimeout(500);

    const productRow = this.fridgeItemsList.locator("li").filter({ hasText: productName });
    await expect(productRow.first()).toBeVisible({ timeout: 10000 });
  }

  /**
   * Asserts that a specific product does not exist in the list
   * @param productName - Name of the product
   */
  async assertProductNotExists(productName: string): Promise<void> {
    const productRow = this.fridgeItemsList.locator("li").filter({ hasText: productName });
    await expect(productRow).not.toBeVisible();
  }

  /**
   * Asserts that success toast is displayed
   * @param message - Expected toast message
   */
  async assertSuccessToast(message: string): Promise<void> {
    const toast = this.page.getByText(message);
    await expect(toast).toBeVisible({ timeout: 10000 });
  }

  /**
   * Asserts that error toast is displayed
   * @param message - Expected error message
   */
  async assertErrorToast(message: string): Promise<void> {
    const toast = this.page.getByText(message);
    await expect(toast).toBeVisible();
  }

  /**
   * Waits for loading to complete
   */
  async waitForLoading(): Promise<void> {
    await this.loadingSpinner.waitFor({ state: "hidden" }).catch(() => {});
  }
}
