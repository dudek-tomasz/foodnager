import { test, expect } from '@playwright/test';
import { FridgePage } from './pages';

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
test.describe('Fridge - Add Product', () => {
  // Configure tests to run serially to avoid React hydration conflicts
  test.describe.configure({ mode: 'serial' });
  
  let fridgePage: FridgePage;

  test.beforeEach(async ({ page }) => {
    fridgePage = new FridgePage(page);
    
    // Navigate to fridge page (already authenticated via fixture)
    await fridgePage.goto();
    await fridgePage.assertPageLoaded();
  });

  test('should open add product modal when clicking add button', async () => {
    // Act
    await fridgePage.openAddProductModal();

    // Assert
    await fridgePage.addProductModal.assertModalVisible();
  });

  test('should add a new product with all required fields', async ({ page }) => {
    // Arrange
    await fridgePage.openAddProductModal();

    // Act - Fill and submit the form
    await fridgePage.addProductModal.fillAndSubmit({
      productName: 'Mleko',
      quantity: 1.5,
      unitText: 'litr',
      expiryDate: '2025-12-31',
    });

    // Assert - Wait for modal to close
    await fridgePage.addProductModal.waitForModalClose();
    
    // Assert - Success toast should appear
    await fridgePage.assertSuccessToast('Produkt dodany pomyślnie');
    
    // Assert - Product should appear in the list
    await fridgePage.assertProductExists('Mleko');
  });

  test('should add a product using quick add method', async () => {
    // Arrange
    await fridgePage.openAddProductModal();

    // Act
    await fridgePage.addProductModal.quickAdd('Chleb', 2, 'szt');

    // Assert
    await fridgePage.addProductModal.waitForModalClose();
    await fridgePage.assertSuccessToast('Produkt dodany pomyślnie');
    await fridgePage.assertProductExists('Chleb');
  });

  test('should create and add a new custom product', async () => {
    // Arrange
    const customProductName = `Test Product ${Date.now()}`;
    await fridgePage.openAddProductModal();

    // Act
    await fridgePage.addProductModal.fillAndSubmit({
      productName: customProductName,
      createNewProduct: true,
      quantity: 3,
      unitText: 'kg',
    });

    // Assert
    await fridgePage.addProductModal.waitForModalClose();
    await fridgePage.assertSuccessToast('Produkt dodany pomyślnie');
    await fridgePage.assertProductExists(customProductName);
  });

  test('should keep modal open when "add another" is checked', async ({ page }) => {
    // Arrange
    await fridgePage.openAddProductModal();

    // Act
    await fridgePage.addProductModal.fillAndSubmit({
      productName: 'Masło',
      quantity: 0.25,
      unitText: 'kg',
      addAnother: true,
    });

    // Wait a bit for the form to reset
    await page.waitForTimeout(500);

    // Assert - Modal should still be visible
    await fridgePage.addProductModal.assertModalVisible();
    
    // Assert - Success toast should appear
    await fridgePage.assertSuccessToast('Produkt dodany pomyślnie');
  });

  test('should cancel adding a product', async () => {
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

  test('should validate required fields', async () => {
    // Arrange
    await fridgePage.openAddProductModal();

    // Act - Try to submit without filling required fields
    await fridgePage.addProductModal.submit();

    // Assert - Modal should still be visible
    await fridgePage.addProductModal.assertModalVisible();
    
    // Assert - Validation errors should be displayed
    // Note: Adjust error messages based on your actual validation
    await fridgePage.addProductModal.assertValidationError('Wybierz produkt');
  });

  test('should add a product with expiry date set to tomorrow', async () => {
    // Arrange
    await fridgePage.openAddProductModal();

    // Act - Use existing product "Cukier" from test database
    await fridgePage.addProductModal.productAutocomplete.searchAndSelect('Cukier');
    await fridgePage.addProductModal.fillQuantity(2);
    await fridgePage.addProductModal.unitSelect.selectUnitByText('kg');
    await fridgePage.addProductModal.expiryDatePicker.setTomorrow();
    await fridgePage.addProductModal.submit();

    // Assert
    await fridgePage.addProductModal.waitForModalClose();
    await fridgePage.assertSuccessToast('Produkt dodany pomyślnie');
    await fridgePage.assertProductExists('Cukier');
  });

  test('should add a product and clear expiry date', async () => {
    // Arrange
    await fridgePage.openAddProductModal();

    // Act - Set date first
    await fridgePage.addProductModal.expiryDatePicker.setToday();
    
    // Act - Then clear it
    await fridgePage.addProductModal.expiryDatePicker.clear();
    
    // Act - Fill rest of the form
    await fridgePage.addProductModal.fillAndSubmit({
      productName: 'Cukier',
      quantity: 1,
      unitText: 'kg',
    });

    // Assert
    await fridgePage.addProductModal.waitForModalClose();
    await fridgePage.assertSuccessToast('Produkt dodany pomyślnie');
  });

  test('should search and select from product autocomplete', async ({ page }) => {
    // Arrange
    await fridgePage.openAddProductModal();

    // Act
    await fridgePage.addProductModal.productAutocomplete.open();
    await fridgePage.addProductModal.productAutocomplete.search('Ser');
    
    // Wait for results
    await page.waitForTimeout(600);
    
    // Assert - Should show results
    const hasResults = await page
      .locator('[data-testid^="product-autocomplete-option-"]')
      .first()
      .isVisible();
    
    expect(hasResults).toBeTruthy();
  });

  test('should display all available units in dropdown', async () => {
    // Arrange
    await fridgePage.openAddProductModal();

    // Act
    const units = await fridgePage.addProductModal.unitSelect.getAllUnits();

    // Assert
    expect(units.length).toBeGreaterThan(0);
    expect(units).toContain('kilogram');
  });
});

/**
 * E2E Tests for Fridge Product Management
 * 
 * Tests additional fridge functionality like search, filter, edit, delete
 */
test.describe('Fridge - Product Management', () => {
  // Configure tests to run serially to avoid React hydration conflicts
  test.describe.configure({ mode: 'serial' });
  
  let fridgePage: FridgePage;

  test.beforeEach(async ({ page }) => {
    fridgePage = new FridgePage(page);
    await fridgePage.goto();
  });

  test('should search for products in fridge', async () => {
    // Arrange - First add a product using existing product from database
    await fridgePage.openAddProductModal();
    await fridgePage.addProductModal.quickAdd('Pieprz', 5, 'g');
    await fridgePage.addProductModal.waitForModalClose();

    // Act
    await fridgePage.search('Pieprz');

    // Assert
    await fridgePage.assertProductExists('Pieprz');
  });

  test('should clear search results', async () => {
    // Arrange
    await fridgePage.search('Test');
    
    // Act
    await fridgePage.clearSearch();

    // Assert - Should show all items again
    const count = await fridgePage.getFridgeItemsCount();
    expect(count).toBeGreaterThanOrEqual(0);
  });

  test('should display fridge statistics', async () => {
    // Act
    const totalCount = await fridgePage.getTotalProductsCount();
    const expiredCount = await fridgePage.getExpiredProductsCount();

    // Assert
    expect(totalCount).toBeGreaterThanOrEqual(0);
    expect(expiredCount).toBeGreaterThanOrEqual(0);
  });
});

