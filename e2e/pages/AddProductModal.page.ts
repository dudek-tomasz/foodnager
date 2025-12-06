import type { Locator, Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { ProductAutocompleteComponent } from './components/ProductAutocompleteComponent';
import { UnitSelectComponent } from './components/UnitSelectComponent';
import { DatePickerComponent } from './components/DatePickerComponent';

/**
 * AddProductModal - POM for the Add Product to Fridge modal
 * 
 * Handles the complete flow of adding a new product to the fridge:
 * - Opening/closing modal
 * - Filling product form
 * - Submitting the form
 * - Handling validation errors
 */
export class AddProductModal {
  private readonly page: Page;

  // Locators
  private readonly modal: Locator;
  private readonly form: Locator;
  private readonly quantityInput: Locator;
  private readonly addAnotherCheckbox: Locator;
  private readonly submitButton: Locator;
  private readonly cancelButton: Locator;

  // Component instances
  public readonly productAutocomplete: ProductAutocompleteComponent;
  public readonly unitSelect: UnitSelectComponent;
  public readonly expiryDatePicker: DatePickerComponent;

  constructor(page: Page) {
    this.page = page;

    // Initialize locators
    this.modal = page.getByTestId('add-product-modal');
    this.form = page.getByTestId('add-product-form');
    this.quantityInput = page.getByTestId('quantity-input');
    this.addAnotherCheckbox = page.getByTestId('add-another-checkbox');
    this.submitButton = page.getByTestId('submit-button');
    this.cancelButton = page.getByTestId('cancel-button');

    // Initialize components
    this.productAutocomplete = new ProductAutocompleteComponent(page, 'product-autocomplete');
    this.unitSelect = new UnitSelectComponent(page, 'unit-select');
    this.expiryDatePicker = new DatePickerComponent(page, 'expiry-date-picker');
  }

  /**
   * Waits for the modal to be visible
   */
  async waitForModal(): Promise<void> {
    await this.modal.waitFor({ state: 'visible' });
  }

  /**
   * Waits for the modal to be hidden
   */
  async waitForModalClose(): Promise<void> {
    await this.modal.waitFor({ state: 'hidden' });
  }

  /**
   * Fills the quantity field
   * @param quantity - The quantity value (can be decimal)
   */
  async fillQuantity(quantity: number | string): Promise<void> {
    await this.quantityInput.fill(quantity.toString());
  }

  /**
   * Toggles the "Add another product" checkbox
   * @param checked - True to check, false to uncheck
   */
  async setAddAnother(checked: boolean): Promise<void> {
    const isChecked = await this.addAnotherCheckbox.isChecked();
    if (isChecked !== checked) {
      await this.addAnotherCheckbox.click();
    }
  }

  /**
   * Submits the form by clicking the submit button
   */
  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  /**
   * Cancels the form by clicking the cancel button
   */
  async cancel(): Promise<void> {
    await this.cancelButton.click();
  }

  /**
   * Complete flow: Fill all required fields and submit
   * @param data - Product data to fill
   */
  async fillAndSubmit(data: {
    productName?: string;
    productId?: number;
    createNewProduct?: boolean;
    quantity: number | string;
    unitId?: number;
    unitText?: string;
    expiryDate?: string;
    addAnother?: boolean;
  }): Promise<void> {
    // Wait for modal to be ready
    await this.waitForModal();

    // Select or create product
    if (data.createNewProduct && data.productName) {
      await this.productAutocomplete.createNewProduct(data.productName);
    } else if (data.productName) {
      await this.productAutocomplete.searchAndSelect(data.productName);
    } else if (data.productId) {
      await this.productAutocomplete.open();
      await this.productAutocomplete.selectProduct(data.productId);
    }

    // Fill quantity
    await this.fillQuantity(data.quantity);

    // Select unit
    if (data.unitId) {
      await this.unitSelect.selectUnit(data.unitId);
    } else if (data.unitText) {
      await this.unitSelect.selectUnitByText(data.unitText);
    }

    // Set expiry date (optional)
    if (data.expiryDate) {
      await this.expiryDatePicker.setDate(data.expiryDate);
    }

    // Set add another checkbox (optional)
    if (data.addAnother !== undefined) {
      await this.setAddAnother(data.addAnother);
    }

    // Submit
    await this.submit();
  }

  /**
   * Quick add with minimal required data
   * @param productName - Product to search for
   * @param quantity - Quantity value
   * @param unitText - Unit to select (e.g., "kg", "szt")
   */
  async quickAdd(productName: string, quantity: number, unitText: string): Promise<void> {
    await this.fillAndSubmit({
      productName,
      quantity,
      unitText,
    });
  }

  /**
   * Assertions
   */

  /**
   * Asserts that the modal is visible
   */
  async assertModalVisible(): Promise<void> {
    await expect(this.modal).toBeVisible();
  }

  /**
   * Asserts that the modal is hidden
   */
  async assertModalHidden(): Promise<void> {
    await expect(this.modal).toBeHidden();
  }

  /**
   * Asserts that the submit button is disabled
   */
  async assertSubmitButtonDisabled(): Promise<void> {
    await expect(this.submitButton).toBeDisabled();
  }

  /**
   * Asserts that the submit button is enabled
   */
  async assertSubmitButtonEnabled(): Promise<void> {
    await expect(this.submitButton).toBeEnabled();
  }

  /**
   * Asserts that validation error is displayed
   * @param errorText - Expected error message text
   */
  async assertValidationError(errorText: string): Promise<void> {
    // Look specifically for error messages (small red text)
    const errorMessage = this.modal.locator('p.text-xs.text-red-600', { hasText: errorText });
    await expect(errorMessage).toBeVisible();
  }

  /**
   * Checks if modal is currently visible
   */
  async isVisible(): Promise<boolean> {
    return await this.modal.isVisible();
  }

  /**
   * Checks if submit button is loading
   */
  async isSubmitting(): Promise<boolean> {
    const buttonText = await this.submitButton.textContent();
    return buttonText?.includes('Dodawanie...') || false;
  }
}

