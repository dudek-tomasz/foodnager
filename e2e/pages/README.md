# Page Object Model (POM) - Foodnager E2E Tests

## Struktura

```
e2e/
├── pages/
│   ├── components/              # Komponenty wielokrotnego użytku
│   │   ├── ProductAutocompleteComponent.ts
│   │   ├── UnitSelectComponent.ts
│   │   └── DatePickerComponent.ts
│   ├── FridgePage.page.ts      # Strona główna lodówki
│   ├── AddProductModal.page.ts # Modal dodawania produktu
│   └── index.ts                 # Centralny punkt eksportu
├── fixtures/                    # Test fixtures
├── helpers/                     # Pomocnicze funkcje
└── *.spec.ts                    # Pliki testowe
```

## Konwencje

### Nazewnictwo

- **Pages**: `{PageName}.page.ts` - główne strony aplikacji
- **Modals/Dialogs**: `{ComponentName}.page.ts` - modalne okna i dialogi
- **Components**: `{ComponentName}Component.ts` - komponenty wielokrotnego użytku

### Struktura klasy POM

```typescript
export class ExamplePage {
  private readonly page: Page;

  // Locators (private)
  private readonly someButton: Locator;

  // Sub-components (public dla dostępu w testach)
  public readonly subComponent: SubComponent;

  constructor(page: Page) {
    this.page = page;
    this.someButton = page.getByTestId("some-button");
    this.subComponent = new SubComponent(page);
  }

  // Actions (public methods)
  async doSomething(): Promise<void> {}

  // Queries (public methods returning data)
  async getSomething(): Promise<string> {}

  // Assertions (public methods for verification)
  async assertSomething(): Promise<void> {}
}
```

## Klasy POM

### FridgePage

Główna strona zarządzania lodówką.

**Metody:**

- `goto()` - Nawigacja do strony
- `openAddProductModal()` - Otwiera modal dodawania produktu
- `search(query)` - Wyszukiwanie produktów
- `editProduct(name)` - Edycja produktu
- `deleteProduct(name)` - Usuwanie produktu
- `assertProductExists(name)` - Weryfikacja istnienia produktu

**Przykład:**

```typescript
const fridgePage = new FridgePage(page);
await fridgePage.goto();
await fridgePage.openAddProductModal();
await fridgePage.assertProductExists("Mleko");
```

### AddProductModal

Modal dodawania produktu do lodówki z zagnieżdżonymi komponentami.

**Komponenty:**

- `productAutocomplete` - Komponent wyboru produktu
- `unitSelect` - Komponent wyboru jednostki
- `expiryDatePicker` - Komponent wyboru daty

**Metody:**

- `fillAndSubmit(data)` - Wypełnia formularz i wysyła
- `quickAdd(name, quantity, unit)` - Szybkie dodanie produktu
- `submit()` - Wysłanie formularza
- `cancel()` - Anulowanie
- `assertModalVisible()` - Weryfikacja widoczności modala

**Przykład:**

```typescript
await modal.fillAndSubmit({
  productName: "Mleko",
  quantity: 1.5,
  unitText: "litr",
  expiryDate: "2025-12-31",
});

// Lub szybkie dodanie:
await modal.quickAdd("Chleb", 2, "szt");
```

### ProductAutocompleteComponent

Komponent autocomplete do wyboru lub utworzenia produktu.

**Metody:**

- `open()` - Otwiera dropdown
- `search(productName)` - Wyszukuje produkt
- `selectProduct(id)` - Wybiera produkt po ID
- `searchAndSelect(name)` - Wyszukuje i wybiera pierwszy wynik
- `createNewProduct(name)` - Tworzy nowy produkt
- `getSelectedProductText()` - Zwraca wybrany produkt

**Przykład:**

```typescript
await autocomplete.searchAndSelect("Mleko");

// Lub utworzenie nowego:
await autocomplete.createNewProduct("Mój Produkt");
```

### UnitSelectComponent

Komponent wyboru jednostki miary.

**Metody:**

- `selectUnit(id)` - Wybiera jednostkę po ID
- `selectUnitByText(text)` - Wybiera jednostkę po tekście
- `getAllUnits()` - Zwraca listę wszystkich jednostek
- `getSelectedUnitText()` - Zwraca wybraną jednostkę

**Przykład:**

```typescript
await unitSelect.selectUnitByText("kg");
// lub
await unitSelect.selectUnit(1);
```

### DatePickerComponent

Komponent wyboru daty.

**Metody:**

- `setDate(date)` - Ustawia datę (format: YYYY-MM-DD)
- `setToday()` - Ustawia dzisiaj
- `setTomorrow()` - Ustawia jutro
- `setDaysFromNow(days)` - Ustawia X dni od teraz
- `clear()` - Czyści datę
- `getValue()` - Zwraca aktualną wartość

**Przykład:**

```typescript
await datePicker.setTomorrow();
// lub
await datePicker.setDaysFromNow(7); // Za tydzień
// lub
await datePicker.setDate("2025-12-31");
```

## Przykłady testów

### Prosty test dodawania produktu

```typescript
test("should add a product to fridge", async ({ page }) => {
  const fridgePage = new FridgePage(page);

  await fridgePage.goto();
  await fridgePage.openAddProductModal();

  await fridgePage.addProductModal.quickAdd("Mleko", 1, "litr");

  await fridgePage.assertSuccessToast("Produkt dodany pomyślnie");
  await fridgePage.assertProductExists("Mleko");
});
```

### Test z pełną kontrolą

```typescript
test("should add product with all fields", async ({ page }) => {
  const fridgePage = new FridgePage(page);

  await fridgePage.goto();
  await fridgePage.openAddProductModal();

  const modal = fridgePage.addProductModal;

  // Krok po kroku
  await modal.productAutocomplete.searchAndSelect("Jogurt");
  await modal.fillQuantity(2);
  await modal.unitSelect.selectUnitByText("szt");
  await modal.expiryDatePicker.setDaysFromNow(7);
  await modal.setAddAnother(false);
  await modal.submit();

  await modal.waitForModalClose();
  await fridgePage.assertProductExists("Jogurt");
});
```

### Test tworzenia nowego produktu

```typescript
test("should create new custom product", async ({ page }) => {
  const fridgePage = new FridgePage(page);

  await fridgePage.goto();
  await fridgePage.openAddProductModal();

  await fridgePage.addProductModal.fillAndSubmit({
    productName: "Mój Własny Produkt",
    createNewProduct: true,
    quantity: 5,
    unitText: "kg",
  });

  await fridgePage.assertProductExists("Mój Własny Produkt");
});
```

## Dobre praktyki

### 1. Używaj testId zamiast selektorów CSS

❌ **Źle:**

```typescript
await page.locator(".btn-primary").click();
```

✅ **Dobrze:**

```typescript
await page.getByTestId("submit-button").click();
```

### 2. Enkapsulacja logiki w POM

❌ **Źle:**

```typescript
// W teście
await page.getByTestId("product-autocomplete-trigger").click();
await page.getByTestId("product-autocomplete-search-input").fill("Mleko");
await page.getByTestId("product-autocomplete-option-1").click();
```

✅ **Dobrze:**

```typescript
// W teście
await modal.productAutocomplete.searchAndSelect("Mleko");
```

### 3. Asercje w POM

```typescript
// W klasie POM
async assertModalVisible(): Promise<void> {
  await expect(this.modal).toBeVisible();
}

// W teście
await modal.assertModalVisible();
```

### 4. Kompozycja komponentów

```typescript
// Modal zawiera sub-komponenty
public readonly productAutocomplete: ProductAutocompleteComponent;
public readonly unitSelect: UnitSelectComponent;

// W teście dostęp do sub-komponentów
await modal.productAutocomplete.search('Test');
await modal.unitSelect.selectUnit(1);
```

## Uruchamianie testów

```bash
# Wszystkie testy E2E
npm run test:e2e

# Konkretny plik
npx playwright test e2e/fridge-add-product.spec.ts

# Z UI mode
npx playwright test --ui

# Z debug mode
npx playwright test --debug

# Tylko chromium
npx playwright test --project=chromium
```

## Debugowanie

### Trace Viewer

```bash
# Uruchom testy z trace
npx playwright test --trace on

# Zobacz trace
npx playwright show-trace trace.zip
```

### Codegen

```bash
# Generuj testy
npx playwright codegen http://localhost:4321/fridge
```

## Troubleshooting

### Problem: Element nie znaleziony

**Rozwiązanie:** Sprawdź czy:

1. `data-testid` jest poprawnie ustawiony w komponencie
2. Element jest widoczny (nie ukryty przez CSS/conditional rendering)
3. Używasz `waitFor()` dla dynamicznych elementów

### Problem: Test niestabilny (flaky)

**Rozwiązanie:**

1. Dodaj `waitFor()` przed akcjami
2. Użyj `waitForLoadState('networkidle')`
3. Zwiększ timeout dla wolnych operacji
4. Unikaj `waitForTimeout()` - użyj `waitFor()` zamiast tego

### Problem: Modal się nie otwiera

**Rozwiązanie:**

```typescript
// Upewnij się, że button jest klikalny
await button.waitFor({ state: "visible" });
await button.click();
await modal.waitFor({ state: "visible" });
```
