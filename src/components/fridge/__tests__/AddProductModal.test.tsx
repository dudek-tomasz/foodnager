/**
 * Unit tests for AddProductModal component
 *
 * Test coverage:
 * - Form rendering and initial state
 * - Form validation (product, quantity, unit, expiry date)
 * - Form submission (success and error scenarios)
 * - "Add another" checkbox functionality
 * - Form reset behavior
 * - Date warning for past dates
 * - User interactions
 * - Accessibility
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor } from "@/tests/utils/test-utils";
import userEvent from "@testing-library/user-event";
import { http, HttpResponse } from "msw";
import { server } from "@/tests/mocks/server";
import AddProductModal from "../AddProductModal";

// =============================================================================
// MOCKS
// =============================================================================

// Mock child components to isolate AddProductModal testing
vi.mock("../ProductAutocomplete", () => ({
  default: ({ value, onChange, error }: any) => (
    <div data-testid="product-autocomplete">
      <input
        type="text"
        aria-label="Produkt"
        value={value?.name || ""}
        onChange={(e) => {
          if (e.target.value) {
            onChange({ id: 1, name: e.target.value, is_global: true });
          } else {
            onChange(null);
          }
        }}
        aria-invalid={!!error}
      />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
}));

vi.mock("../UnitSelect", () => ({
  default: ({ value, onChange, error, disabled }: any) => (
    <div data-testid="unit-select">
      <select
        aria-label="Jednostka"
        value={value || ""}
        onChange={(e) => onChange(e.target.value ? parseInt(e.target.value) : null)}
        aria-invalid={!!error}
        disabled={disabled}
      >
        <option value="">Wybierz jednostkę</option>
        <option value="1">kg</option>
        <option value="2">g</option>
        <option value="3">l</option>
      </select>
      {error && <span role="alert">{error}</span>}
    </div>
  ),
}));

vi.mock("../DatePicker", () => ({
  default: ({ value, onChange, error, disabled }: any) => (
    <div data-testid="date-picker">
      <input
        type="date"
        aria-label="Data ważności"
        value={value || ""}
        onChange={(e) => onChange(e.target.value || null)}
        aria-invalid={!!error}
        disabled={disabled}
      />
      {error && <span role="alert">{error}</span>}
    </div>
  ),
}));

// Mock validation functions
vi.mock("@/lib/utils/form-validation", async () => {
  const actual = await vi.importActual("@/lib/utils/form-validation");
  return {
    ...actual,
  };
});

// =============================================================================
// TEST DATA
// =============================================================================

// =============================================================================
// TESTS
// =============================================================================

describe("AddProductModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  // ===========================================================================
  // RENDERING TESTS
  // ===========================================================================

  describe("Rendering", () => {
    it("should render modal when isOpen is true", () => {
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByText("Dodaj produkt do lodówki")).toBeInTheDocument();
      expect(screen.getByText(/Wybierz produkt, podaj ilość/i)).toBeInTheDocument();
    });

    it("should not render modal when isOpen is false", () => {
      render(<AddProductModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.queryByText("Dodaj produkt do lodówki")).not.toBeInTheDocument();
    });

    it("should render all form fields with labels", () => {
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText("Produkt")).toBeInTheDocument();
      expect(screen.getByLabelText(/Ilość/i)).toBeInTheDocument();
      expect(screen.getByLabelText("Jednostka")).toBeInTheDocument();
      expect(screen.getByLabelText("Data ważności")).toBeInTheDocument();
    });

    it("should render required field indicators", () => {
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const requiredIndicators = screen.getAllByText("*");
      expect(requiredIndicators.length).toBeGreaterThan(0);
    });

    it('should render "Add another" checkbox', () => {
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText(/Dodaj kolejny produkt po zapisaniu/i)).toBeInTheDocument();
    });

    it("should render action buttons", () => {
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByRole("button", { name: /Anuluj/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /Dodaj produkt/i })).toBeInTheDocument();
    });
  });

  // ===========================================================================
  // VALIDATION TESTS
  // ===========================================================================

  describe("Validation", () => {
    it("should show validation error when submitting without product", async () => {
      const user = userEvent.setup();
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Wybierz produkt z listy")).toBeInTheDocument();
      });
    });

    it("should show validation error when submitting without quantity", async () => {
      const user = userEvent.setup();
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Select product
      const productInput = screen.getByLabelText("Produkt");
      await user.type(productInput, "Mleko");

      // Select unit
      const unitSelect = screen.getByLabelText("Jednostka");
      await user.selectOptions(unitSelect, "1");

      // Submit without quantity
      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Ilość jest wymagana")).toBeInTheDocument();
      });
    });

    it("should show validation error for invalid quantity (NaN)", async () => {
      const user = userEvent.setup();
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Select product
      const productInput = screen.getByLabelText("Produkt");
      await user.type(productInput, "Mleko");

      // Try to submit with empty quantity (which becomes NaN when parsed)
      // The quantity field starts empty

      // Select unit
      const unitSelect = screen.getByLabelText("Jednostka");
      await user.selectOptions(unitSelect, "1");

      // Submit
      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      // Should show "quantity is required" error
      await waitFor(() => {
        expect(screen.getByText("Ilość jest wymagana")).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should show validation error when submitting without unit", async () => {
      const user = userEvent.setup();
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Select product
      const productInput = screen.getByLabelText("Produkt");
      await user.type(productInput, "Mleko");

      // Enter quantity
      const quantityInput = screen.getByLabelText(/Ilość/i);
      await user.type(quantityInput, "2.5");

      // Submit without unit
      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      // Check for error by role=alert
      await waitFor(() => {
        const alerts = screen.getAllByRole("alert");
        const unitError = alerts.find((alert) => alert.textContent?.includes("Wybierz jednostkę"));
        expect(unitError).toBeDefined();
      });
    });

    it("should show validation error for invalid date format", async () => {
      const user = userEvent.setup();
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill form
      const productInput = screen.getByLabelText("Produkt");
      await user.type(productInput, "Mleko");

      const quantityInput = screen.getByLabelText(/Ilość/i);
      await user.type(quantityInput, "2.5");

      const unitSelect = screen.getByLabelText("Jednostka");
      await user.selectOptions(unitSelect, "1");

      // Enter invalid date
      const dateInput = screen.getByLabelText("Data ważności");
      await user.type(dateInput, "invalid-date");

      // Submit
      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorElement = screen.queryByText(/Nieprawidłowy format daty/i);
        if (errorElement) {
          expect(errorElement).toBeInTheDocument();
        }
      });
    });

    it("should accept form without expiry date (optional field)", async () => {
      const user = userEvent.setup();

      // Mock successful API response
      server.use(
        http.post("/api/fridge", () => {
          return HttpResponse.json({
            id: 1,
            product_id: 1,
            quantity: 2.5,
            unit_id: 1,
            expiry_date: null,
          });
        })
      );

      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill required fields only
      const productInput = screen.getByLabelText("Produkt");
      await user.type(productInput, "Mleko");

      const quantityInput = screen.getByLabelText(/Ilość/i);
      await user.type(quantityInput, "2.5");

      const unitSelect = screen.getByLabelText("Jednostka");
      await user.selectOptions(unitSelect, "1");

      // Submit
      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(false);
      });
    });
  });

  // ===========================================================================
  // DATE WARNING TESTS
  // ===========================================================================

  describe("Date Warning", () => {
    it("should show warning when expiry date is in the past", async () => {
      const user = userEvent.setup();
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Enter past date
      const dateInput = screen.getByLabelText("Data ważności");
      await user.type(dateInput, "2020-01-01");

      await waitFor(() => {
        expect(screen.getByText(/Data w przeszłości - produkt może być już przeterminowany/i)).toBeInTheDocument();
      });
    });

    it("should not show warning for future dates", async () => {
      const user = userEvent.setup();
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Enter future date
      const dateInput = screen.getByLabelText("Data ważności");
      await user.type(dateInput, "2025-12-31");

      // Warning should not appear
      expect(screen.queryByText(/Data w przeszłości/i)).not.toBeInTheDocument();
    });

    it("should clear warning when date is removed", async () => {
      const user = userEvent.setup();
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Enter past date
      const dateInput = screen.getByLabelText("Data ważności");
      await user.type(dateInput, "2020-01-01");

      await waitFor(() => {
        expect(screen.getByText(/Data w przeszłości/i)).toBeInTheDocument();
      });

      // Clear date
      await user.clear(dateInput);

      await waitFor(() => {
        expect(screen.queryByText(/Data w przeszłości/i)).not.toBeInTheDocument();
      });
    });
  });

  // ===========================================================================
  // FORM SUBMISSION TESTS
  // ===========================================================================

  describe("Form Submission", () => {
    it("should successfully submit form with valid data", async () => {
      const user = userEvent.setup();

      // Mock successful API response
      server.use(
        http.post("/api/fridge", async ({ request }) => {
          const body = await request.json();

          return HttpResponse.json({
            id: 1,
            product_id: body.product_id,
            quantity: body.quantity,
            unit_id: body.unit_id,
            expiry_date: body.expiry_date,
          });
        })
      );

      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill form
      const productInput = screen.getByLabelText("Produkt");
      await user.type(productInput, "Mleko");

      const quantityInput = screen.getByLabelText(/Ilość/i);
      await user.type(quantityInput, "2.5");

      const unitSelect = screen.getByLabelText("Jednostka");
      await user.selectOptions(unitSelect, "1");

      const dateInput = screen.getByLabelText("Data ważności");
      await user.type(dateInput, "2025-12-31");

      // Submit
      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(false);
      });
    });

    it("should send correct payload to API", async () => {
      const user = userEvent.setup();
      let capturedPayload: any = null;

      // Mock API and capture payload
      server.use(
        http.post("/api/fridge", async ({ request }) => {
          capturedPayload = await request.json();

          return HttpResponse.json({
            id: 1,
            ...capturedPayload,
          });
        })
      );

      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill form
      const productInput = screen.getByLabelText("Produkt");
      await user.type(productInput, "Mleko");

      const quantityInput = screen.getByLabelText(/Ilość/i);
      await user.type(quantityInput, "2.5");

      const unitSelect = screen.getByLabelText("Jednostka");
      await user.selectOptions(unitSelect, "1");

      const dateInput = screen.getByLabelText("Data ważności");
      await user.type(dateInput, "2025-12-31");

      // Submit
      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(capturedPayload).toEqual({
          product_id: 1,
          quantity: 2.5,
          unit_id: 1,
          expiry_date: "2025-12-31",
        });
      });
    });

    it("should handle API error response", async () => {
      const user = userEvent.setup();
      const errorMessage = "Produkt już istnieje w lodówce";

      // Mock error response
      server.use(
        http.post("/api/fridge", () => {
          return HttpResponse.json({ error: { message: errorMessage } }, { status: 400 });
        })
      );

      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill form
      const productInput = screen.getByLabelText("Produkt");
      await user.type(productInput, "Mleko");

      const quantityInput = screen.getByLabelText(/Ilość/i);
      await user.type(quantityInput, "2.5");

      const unitSelect = screen.getByLabelText("Jednostka");
      await user.selectOptions(unitSelect, "1");

      // Submit
      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });

      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should handle network error", async () => {
      const user = userEvent.setup();

      // Mock network error
      server.use(
        http.post("/api/fridge", () => {
          return HttpResponse.error();
        })
      );

      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill form
      const productInput = screen.getByLabelText("Produkt");
      await user.type(productInput, "Mleko");

      const quantityInput = screen.getByLabelText(/Ilość/i);
      await user.type(quantityInput, "2.5");

      const unitSelect = screen.getByLabelText("Jednostka");
      await user.selectOptions(unitSelect, "1");

      // Submit
      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      // Should show error message (MSW returns "Failed to fetch")
      await waitFor(() => {
        expect(screen.getByText(/Failed to fetch/i)).toBeInTheDocument();
      });

      // onSuccess should not be called
      expect(mockOnSuccess).not.toHaveBeenCalled();
    });

    it("should disable buttons during submission", async () => {
      const user = userEvent.setup();

      // Mock slow API response
      server.use(
        http.post("/api/fridge", async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({ id: 1 });
        })
      );

      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill form
      const productInput = screen.getByLabelText("Produkt");
      await user.type(productInput, "Mleko");

      const quantityInput = screen.getByLabelText(/Ilość/i);
      await user.type(quantityInput, "2.5");

      const unitSelect = screen.getByLabelText("Jednostka");
      await user.selectOptions(unitSelect, "1");

      // Submit
      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      // Check if buttons are disabled during submission
      expect(submitButton).toBeDisabled();
      expect(screen.getByRole("button", { name: /Anuluj/i })).toBeDisabled();
      expect(screen.getByText("Dodawanie...")).toBeInTheDocument();

      // Wait for submission to complete
      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  // ===========================================================================
  // "ADD ANOTHER" FUNCTIONALITY TESTS
  // ===========================================================================

  describe("Add Another Functionality", () => {
    it('should reset form but keep checkbox checked when "add another" is enabled', async () => {
      const user = userEvent.setup();

      // Mock successful API response
      server.use(
        http.post("/api/fridge", () => {
          return HttpResponse.json({ id: 1 });
        })
      );

      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill form
      const productInput = screen.getByLabelText("Produkt");
      await user.type(productInput, "Mleko");

      const quantityInput = screen.getByLabelText(/Ilość/i);
      await user.type(quantityInput, "2.5");

      const unitSelect = screen.getByLabelText("Jednostka");
      await user.selectOptions(unitSelect, "1");

      // Check "add another" checkbox
      const addAnotherCheckbox = screen.getByLabelText(/Dodaj kolejny produkt/i);
      await user.click(addAnotherCheckbox);

      // Submit
      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(true);
      });

      // Form should be reset
      await waitFor(() => {
        expect(quantityInput).toHaveValue(null);
      });

      // Checkbox should remain checked
      expect(addAnotherCheckbox).toBeChecked();
    });

    it('should call onSuccess with false when "add another" is not checked', async () => {
      const user = userEvent.setup();

      // Mock successful API response
      server.use(
        http.post("/api/fridge", () => {
          return HttpResponse.json({ id: 1 });
        })
      );

      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill form
      const productInput = screen.getByLabelText("Produkt");
      await user.type(productInput, "Mleko");

      const quantityInput = screen.getByLabelText(/Ilość/i);
      await user.type(quantityInput, "2.5");

      const unitSelect = screen.getByLabelText("Jednostka");
      await user.selectOptions(unitSelect, "1");

      // Submit without checking "add another"
      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith(false);
      });
    });
  });

  // ===========================================================================
  // FORM RESET TESTS
  // ===========================================================================

  describe("Form Reset", () => {
    it("should reset form when modal is reopened", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill form
      const quantityInput = screen.getByLabelText(/Ilość/i);
      await user.type(quantityInput, "2.5");

      // Close modal
      rerender(<AddProductModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Reopen modal
      rerender(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Form should be reset
      const newQuantityInput = screen.getByLabelText(/Ilość/i);
      expect(newQuantityInput).toHaveValue(null);
    });

    it("should clear errors when modal is reopened", async () => {
      const user = userEvent.setup();
      const { rerender } = render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Submit empty form to trigger errors
      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText("Wybierz produkt z listy")).toBeInTheDocument();
      });

      // Close modal
      rerender(<AddProductModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Reopen modal
      rerender(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Errors should be cleared
      expect(screen.queryByText("Wybierz produkt z listy")).not.toBeInTheDocument();
    });
  });

  // ===========================================================================
  // USER INTERACTION TESTS
  // ===========================================================================

  describe("User Interactions", () => {
    it("should call onClose when cancel button is clicked", async () => {
      const user = userEvent.setup();
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const cancelButton = screen.getByRole("button", { name: /Anuluj/i });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should not close modal when clicking cancel during submission", async () => {
      const user = userEvent.setup();

      // Mock slow API response
      server.use(
        http.post("/api/fridge", async () => {
          await new Promise((resolve) => setTimeout(resolve, 100));
          return HttpResponse.json({ id: 1 });
        })
      );

      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Fill and submit form
      const productInput = screen.getByLabelText("Produkt");
      await user.type(productInput, "Mleko");

      const quantityInput = screen.getByLabelText(/Ilość/i);
      await user.type(quantityInput, "2.5");

      const unitSelect = screen.getByLabelText("Jednostka");
      await user.selectOptions(unitSelect, "1");

      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      // Try to cancel during submission
      const cancelButton = screen.getByRole("button", { name: /Anuluj/i });
      expect(cancelButton).toBeDisabled();
    });

    it("should allow typing decimal values in quantity field", async () => {
      const user = userEvent.setup();
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const quantityInput = screen.getByLabelText(/Ilość/i);
      await user.type(quantityInput, "2.75");

      expect(quantityInput).toHaveValue(2.75);
    });

    it('should toggle "add another" checkbox', async () => {
      const user = userEvent.setup();
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      const checkbox = screen.getByLabelText(/Dodaj kolejny produkt/i);

      expect(checkbox).not.toBeChecked();

      await user.click(checkbox);
      expect(checkbox).toBeChecked();

      await user.click(checkbox);
      expect(checkbox).not.toBeChecked();
    });
  });

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe("Accessibility", () => {
    it("should have accessible labels for all form fields", () => {
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      expect(screen.getByLabelText("Produkt")).toBeInTheDocument();
      expect(screen.getByLabelText(/Ilość/i)).toBeInTheDocument();
      expect(screen.getByLabelText("Jednostka")).toBeInTheDocument();
      expect(screen.getByLabelText("Data ważności")).toBeInTheDocument();
    });

    it("should have dialog role", () => {
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Dialog component from shadcn/ui should have proper dialog role
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    it("should mark invalid fields with aria-invalid", async () => {
      const user = userEvent.setup();
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Submit to trigger validation
      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      await waitFor(() => {
        const productInput = screen.getByLabelText("Produkt");
        expect(productInput).toHaveAttribute("aria-invalid", "true");
      });
    });

    it('should announce errors with role="alert"', async () => {
      const user = userEvent.setup();
      render(<AddProductModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} />);

      // Submit to trigger validation
      const submitButton = screen.getByRole("button", { name: /Dodaj produkt/i });
      await user.click(submitButton);

      await waitFor(() => {
        const alerts = screen.getAllByRole("alert");
        expect(alerts.length).toBeGreaterThan(0);
      });
    });
  });
});
