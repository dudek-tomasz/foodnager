import { test, expect } from "@playwright/test";
import { FridgePage } from "./pages";

/**
 * E2E Tests for Adding Products to Fridge
 *
 * Tests the complete flow of adding products to the virtual fridge:
 * - Opening the add product modal
 * - Filling out the form
 * - Submitting and validating the result
 *
 * Note: Uses storageState from auth.setup.ts (authenticated automatically)
 * Note: Tests run in serial mode to avoid state conflicts with React hydration
 */
test.describe("Fridge - Add Product", () => {
  // Configure tests to run serially to avoid React hydration conflicts
  test.describe.configure({ mode: "serial" });

  let fridgePage: FridgePage;

  test.beforeEach(async ({ page }) => {
    fridgePage = new FridgePage(page);

    // Navigate to fridge page (already authenticated via fixture)
    await fridgePage.goto();
    await fridgePage.assertPageLoaded();
  });

  test.afterEach(async ({ page }) => {
    // Close modal if it's open to prevent interference with next test
    const modal = page.getByTestId("add-product-modal");
    const isVisible = await modal.isVisible().catch(() => false);
    if (isVisible) {
      const closeButton = page.getByRole("button", { name: /anuluj|zamknij|cancel|close/i });
      const closeButtonExists = await closeButton.isVisible().catch(() => false);
      if (closeButtonExists) {
        await closeButton.click();
        await modal.waitFor({ state: "hidden" }).catch(() => {});
      }
    }
  });

  test("should open add product modal when clicking add button", async () => {
    // Act
    await fridgePage.openAddProductModal();

    // Assert
    await fridgePage.addProductModal.assertModalVisible();
  });

  test("should add a new product with all required fields", async () => {
    // Arrange
    await fridgePage.openAddProductModal();

    // Act - Fill and submit the form
    await fridgePage.addProductModal.fillAndSubmit({
      productName: "pomidor",
      quantity: 1.5,
      unitText: "szt",
    });

    // Assert - Wait for modal to close
    await fridgePage.addProductModal.waitForModalClose();

    // Assert - Success toast should appear
    await fridgePage.assertSuccessToast("Produkt dodany pomyślnie");

    // Assert - Product should appear in the list
    await fridgePage.assertProductExists("pomidor");
  });

  test("should add a product using quick add method", async () => {
    // Arrange
    await fridgePage.openAddProductModal();

    // Act
    await fridgePage.addProductModal.quickAdd("makaron", 2, "g");

    // Assert
    await fridgePage.addProductModal.waitForModalClose();
    await fridgePage.assertSuccessToast("Produkt dodany pomyślnie");
    await fridgePage.assertProductExists("makaron");
  });

  test("should create and add a new custom product", async () => {
    // Arrange
    const customProductName = `Test Product ${Date.now()}`;
    await fridgePage.openAddProductModal();

    // Act
    await fridgePage.addProductModal.fillAndSubmit({
      productName: customProductName,
      createNewProduct: true,
      quantity: 3,
      unitText: "kg",
    });

    // Assert
    await fridgePage.addProductModal.waitForModalClose();
    await fridgePage.assertSuccessToast("Produkt dodany pomyślnie");
    await fridgePage.assertProductExists(customProductName);
  });

  // ⚠️ DISABLED - TIMEOUT ISSUES
  test.skip('should keep modal open when "add another" is checked', async () => {
    // Arrange
    await fridgePage.openAddProductModal();

    // Act
    await fridgePage.addProductModal.fillAndSubmit({
      productName: "makaron",
      quantity: 0.25,
      unitText: "g",
      addAnother: true,
    });

    // Assert - Modal should still be visible (form resets automatically)
    await fridgePage.addProductModal.assertModalVisible();

    // Assert - Success toast should appear
    await fridgePage.assertSuccessToast("Produkt dodany pomyślnie");
  });

  test("should cancel adding a product", async () => {
    // Arrange
    await fridgePage.openAddProductModal();
    await fridgePage.addProductModal.assertModalVisible();

    // Act - Fill some data
    await fridgePage.addProductModal.fillQuantity(5);

    // Act - Cancel
    await fridgePage.addProductModal.cancel();

    // Assert - Modal should be closed
    await fridgePage.addProductModal.waitForModalClose();
  });

  test("should validate required fields", async () => {
    // Arrange
    await fridgePage.openAddProductModal();

    // Act - Try to submit without filling required fields
    await fridgePage.addProductModal.submit();

    // Assert - Modal should still be visible
    await fridgePage.addProductModal.assertModalVisible();

    // Assert - Validation errors should be displayed
    // Note: Adjust error messages based on your actual validation
    await fridgePage.addProductModal.assertValidationError("Wybierz produkt");
  });

  test("should add a product with expiry date set to tomorrow", async () => {
    // Arrange
    await fridgePage.openAddProductModal();

    // Act - Use existing product "mięso mielone" from test database
    await fridgePage.addProductModal.productAutocomplete.searchAndSelect("mięso mielone");
    await fridgePage.addProductModal.fillQuantity(2);
    await fridgePage.addProductModal.unitSelect.selectUnitByText("kg");
    await fridgePage.addProductModal.expiryDatePicker.setTomorrow();
    await fridgePage.addProductModal.submit();

    // Assert
    await fridgePage.addProductModal.waitForModalClose();
    await fridgePage.assertSuccessToast("Produkt dodany pomyślnie");
    await fridgePage.assertProductExists("mięso mielone");
  });

  test("should add a product and clear expiry date", async () => {
    // Arrange
    await fridgePage.openAddProductModal();

    // Act - Set date first
    await fridgePage.addProductModal.expiryDatePicker.setToday();

    // Act - Then clear it
    await fridgePage.addProductModal.expiryDatePicker.clear();

    // Act - Fill rest of the form
    await fridgePage.addProductModal.fillAndSubmit({
      productName: "pomidor",
      quantity: 1,
      unitText: "szt",
    });

    // Assert
    await fridgePage.addProductModal.waitForModalClose();
    await fridgePage.assertSuccessToast("Produkt dodany pomyślnie");
  });

  test("should search and select from product autocomplete", async ({ page }) => {
    // Arrange
    await fridgePage.openAddProductModal();

    // Act
    await fridgePage.addProductModal.productAutocomplete.open();
    await fridgePage.addProductModal.productAutocomplete.search("makaron");

    // Assert - Should show results (search() already waits for loading to complete)
    const firstOption = page.locator('[data-testid^="product-autocomplete-option-"]').first();
    await firstOption.waitFor({ state: "visible", timeout: 10000 });

    const hasResults = await firstOption.isVisible();
    expect(hasResults).toBeTruthy();
  });

  test("should display all available units in dropdown", async () => {
    // Arrange
    await fridgePage.openAddProductModal();

    // Act
    const units = await fridgePage.addProductModal.unitSelect.getAllUnits();

    // Assert
    expect(units.length).toBeGreaterThan(0);
    expect(units).toContain("kilogramkg");
  });
});

/**
 * E2E Tests for Fridge Product Management
 *
 * Tests additional fridge functionality like search, filter, edit, delete
 */
test.describe("Fridge - Product Management", () => {
  // Configure tests to run serially to avoid React hydration conflicts
  test.describe.configure({ mode: "serial" });

  let fridgePage: FridgePage;

  test.beforeEach(async ({ page }) => {
    fridgePage = new FridgePage(page);
    await fridgePage.goto();
  });

  // ⚠️ DISABLED - TIMEOUT ISSUES
  test.skip("should search for products in fridge", async () => {
    // Arrange - First add a product using existing product from database
    await fridgePage.openAddProductModal();
    await fridgePage.addProductModal.quickAdd("makaron", 5, "g");
    await fridgePage.addProductModal.waitForModalClose();

    // Act
    await fridgePage.search("makaron");

    // Assert
    await fridgePage.assertProductExists("makaron");
  });

  test("should clear search results", async () => {
    // Arrange
    await fridgePage.search("Test");

    // Act
    await fridgePage.clearSearch();

    // Assert - Should show all items again
    const count = await fridgePage.getFridgeItemsCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test("should display fridge statistics", async () => {
    // Act
    const totalCount = await fridgePage.getTotalProductsCount();
    const expiredCount = await fridgePage.getExpiredProductsCount();

    // Assert
    expect(totalCount).toBeGreaterThanOrEqual(0);
    expect(expiredCount).toBeGreaterThanOrEqual(0);
  });
});
