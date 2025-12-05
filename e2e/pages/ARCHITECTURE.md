# Architektura Page Object Model - Fridge Module

## 🏗️ Struktura hierarchii POM

```
┌─────────────────────────────────────────────────────────────┐
│                        Test Suite                            │
│                 (fridge-add-product.spec.ts)                 │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            │ uses
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      FridgePage                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Properties:                                          │  │
│  │  - addProductButton                                  │  │
│  │  - searchInput                                       │  │
│  │  - sortDropdown                                      │  │
│  │  - fridgeItemsList                                   │  │
│  │  - emptyState                                        │  │
│  │  - statsSection                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Methods:                                             │  │
│  │  + goto()                                            │  │
│  │  + openAddProductModal()                             │  │
│  │  + search(query)                                     │  │
│  │  + editProduct(name)                                 │  │
│  │  + deleteProduct(name)                               │  │
│  │  + assertProductExists(name)                         │  │
│  │  + getTotalProductsCount()                           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Composition:                                         │  │
│  │  • addProductModal: AddProductModal ────────────┐   │  │
│  └──────────────────────────────────────────────────┼───┘  │
└──────────────────────────────────────────────────────┼──────┘
                                                       │
                                                       │ has-a
                                                       ▼
┌─────────────────────────────────────────────────────────────┐
│                   AddProductModal                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Properties:                                          │  │
│  │  - modal                                             │  │
│  │  - form                                              │  │
│  │  - quantityInput                                     │  │
│  │  - addAnotherCheckbox                                │  │
│  │  - submitButton                                      │  │
│  │  - cancelButton                                      │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Methods:                                             │  │
│  │  + waitForModal()                                    │  │
│  │  + fillQuantity(value)                               │  │
│  │  + setAddAnother(checked)                            │  │
│  │  + submit()                                          │  │
│  │  + cancel()                                          │  │
│  │  + fillAndSubmit(data)                               │  │
│  │  + quickAdd(name, qty, unit)                         │  │
│  │  + assertModalVisible()                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Composition:                                         │  │
│  │  • productAutocomplete: ProductAutocompleteComponent │  │
│  │  • unitSelect: UnitSelectComponent                   │  │
│  │  • expiryDatePicker: DatePickerComponent             │  │
│  └─────┬────────────────────────┬────────────────┬───────┘  │
└────────┼────────────────────────┼────────────────┼──────────┘
         │                        │                │
         │ has-a                  │ has-a          │ has-a
         ▼                        ▼                ▼
┌──────────────────┐   ┌──────────────────┐   ┌──────────────────┐
│ProductAutocomplete│   │  UnitSelect      │   │   DatePicker     │
│   Component       │   │  Component       │   │   Component      │
├──────────────────┤   ├──────────────────┤   ├──────────────────┤
│ Properties:      │   │ Properties:      │   │ Properties:      │
│  - trigger       │   │  - trigger       │   │  - input         │
│  - searchInput   │   │  - content       │   │  - clearButton   │
│  - createNew...  │   │                  │   │                  │
│  - newProduct... │   │ Methods:         │   │ Methods:         │
│                  │   │  + selectUnit()  │   │  + setDate()     │
│ Methods:         │   │  + selectBy...() │   │  + setToday()    │
│  + open()        │   │  + getAll...()   │   │  + setTomorrow() │
│  + search()      │   │  + getSelected() │   │  + clear()       │
│  + selectProduct()│   │  + hasUnit...()  │   │  + getValue()    │
│  + searchAndSel()│   │                  │   │  + hasValue()    │
│  + createNew...()│   │                  │   │                  │
│  + getSelected() │   │                  │   │                  │
│  + hasProduct()  │   │                  │   │                  │
└──────────────────┘   └──────────────────┘   └──────────────────┘
```

## 🔄 Przepływ interakcji

### Scenariusz 1: Dodanie produktu (Quick Add)

```
Test
  │
  ├─► FridgePage.goto()
  │     └─► Navigate to /fridge
  │
  ├─► FridgePage.openAddProductModal()
  │     └─► Click addProductButton
  │           └─► AddProductModal.waitForModal()
  │
  ├─► AddProductModal.quickAdd('Mleko', 1, 'litr')
  │     ├─► ProductAutocompleteComponent.searchAndSelect('Mleko')
  │     │     ├─► open()
  │     │     ├─► search('Mleko')
  │     │     └─► selectProduct(first)
  │     ├─► fillQuantity(1)
  │     ├─► UnitSelectComponent.selectUnitByText('litr')
  │     │     ├─► open()
  │     │     └─► click option
  │     └─► submit()
  │
  └─► FridgePage.assertSuccessToast('Produkt dodany pomyślnie')
```

### Scenariusz 2: Dodanie produktu (Full Control)

```
Test
  │
  ├─► FridgePage.goto()
  │
  ├─► FridgePage.openAddProductModal()
  │
  ├─► AddProductModal.fillAndSubmit({
  │     productName: 'Jogurt',
  │     quantity: 2,
  │     unitText: 'szt',
  │     expiryDate: '2025-12-31',
  │     addAnother: true
  │   })
  │     ├─► ProductAutocompleteComponent.searchAndSelect('Jogurt')
  │     ├─► fillQuantity(2)
  │     ├─► UnitSelectComponent.selectUnitByText('szt')
  │     ├─► DatePickerComponent.setDate('2025-12-31')
  │     ├─► setAddAnother(true)
  │     └─► submit()
  │
  └─► AddProductModal.assertModalVisible() // Still visible due to addAnother
```

### Scenariusz 3: Utworzenie nowego produktu

```
Test
  │
  ├─► FridgePage.openAddProductModal()
  │
  ├─► AddProductModal.fillAndSubmit({
  │     productName: 'Custom Product',
  │     createNewProduct: true,
  │     quantity: 5,
  │     unitText: 'kg'
  │   })
  │     ├─► ProductAutocompleteComponent.createNewProduct('Custom Product')
  │     │     ├─► open()
  │     │     ├─► search('Custom Product')
  │     │     ├─► click createNewButton
  │     │     ├─► fill newProductNameInput
  │     │     └─► click createSubmitButton
  │     ├─► fillQuantity(5)
  │     ├─► UnitSelectComponent.selectUnitByText('kg')
  │     └─► submit()
  │
  └─► FridgePage.assertProductExists('Custom Product')
```

## 📦 Enkapsulacja i odpowiedzialność

### FridgePage
**Odpowiedzialność:**
- Nawigacja do strony lodówki
- Zarządzanie globalnym stanem strony (search, filters)
- Delegowanie akcji modala do AddProductModal
- Weryfikacja listy produktów
- Operacje na produktach (edit, delete)

**NIE zarządza:**
- Wewnętrzną logiką modala
- Szczegółami komponentów formularza

### AddProductModal
**Odpowiedzialność:**
- Zarządzanie stanem modala (open/close)
- Koordynacja wypełniania formularza
- Walidacja formularza
- Delegowanie do sub-komponentów

**NIE zarządza:**
- Szczegółami autocomplete/select/datepicker
- Nawigacją po stronie

### ProductAutocompleteComponent
**Odpowiedzialność:**
- Wyszukiwanie produktów
- Wybór istniejącego produktu
- Tworzenie nowego produktu
- Zarządzanie stanem dropdown

### UnitSelectComponent
**Odpowiedzialność:**
- Wybór jednostki z listy
- Dostęp do wszystkich jednostek
- Stan dropdown

### DatePickerComponent
**Odpowiedzialność:**
- Wybór daty
- Pomocnicze metody (today, tomorrow, daysFromNow)
- Czyszczenie daty

## 🎯 Wzorce projektowe

### 1. Page Object Pattern
Każda strona/modal jest reprezentowany przez klasę enkapsulującą:
- Locatory (private)
- Akcje (public methods)
- Asercje (public methods)

### 2. Composition over Inheritance
```typescript
// AddProductModal zawiera komponenty jako właściwości
public readonly productAutocomplete: ProductAutocompleteComponent;
public readonly unitSelect: UnitSelectComponent;
```

### 3. Facade Pattern
```typescript
// Metoda quickAdd ukrywa szczegóły implementacji
async quickAdd(name: string, qty: number, unit: string) {
  await this.fillAndSubmit({ productName: name, quantity: qty, unitText: unit });
}
```

### 4. Builder Pattern (w fillAndSubmit)
```typescript
interface FillData {
  productName?: string;
  productId?: number;
  quantity: number | string;
  unitText?: string;
  // ...
}

await modal.fillAndSubmit({ ... });
```

## 🧪 Przykłady użycia w testach

### Poziom 1: Wysokopoziomowy (Recommended)
```typescript
test('add product', async ({ page }) => {
  const fridge = new FridgePage(page);
  await fridge.goto();
  await fridge.openAddProductModal();
  await fridge.addProductModal.quickAdd('Mleko', 1, 'litr');
  await fridge.assertProductExists('Mleko');
});
```

### Poziom 2: Średniopoziomowy
```typescript
test('add product with expiry', async ({ page }) => {
  const fridge = new FridgePage(page);
  await fridge.goto();
  await fridge.openAddProductModal();
  
  const modal = fridge.addProductModal;
  await modal.fillAndSubmit({
    productName: 'Jogurt',
    quantity: 2,
    unitText: 'szt',
    expiryDate: '2025-12-31'
  });
  
  await fridge.assertProductExists('Jogurt');
});
```

### Poziom 3: Niskopoziomowy (dla specjalnych przypadków)
```typescript
test('add product step by step', async ({ page }) => {
  const fridge = new FridgePage(page);
  await fridge.goto();
  await fridge.openAddProductModal();
  
  const modal = fridge.addProductModal;
  
  // Pełna kontrola nad każdym krokiem
  await modal.productAutocomplete.open();
  await modal.productAutocomplete.search('Ser');
  await modal.productAutocomplete.selectProduct(5);
  
  await modal.fillQuantity(0.5);
  
  await modal.unitSelect.open();
  await modal.unitSelect.selectUnit(2);
  
  await modal.expiryDatePicker.setDaysFromNow(14);
  
  await modal.submit();
});
```

## 📊 Metryki i statystyki

- **Liczba klas POM:** 5
- **Liczba komponentów wielokrotnego użytku:** 3
- **Liczba metod akcji:** ~30
- **Liczba metod asercji:** ~10
- **Pokrycie testami:** Scenariusz dodawania produktu w pełni pokryty

## 🔮 Przyszłe rozszerzenia

### Planowane komponenty:
- `EditProductModal.page.ts` - Modal edycji produktu
- `ConfirmDialog.page.ts` - Dialog potwierdzenia usunięcia
- `SearchBar.component.ts` - Komponent wyszukiwania (do reużycia)
- `SortDropdown.component.ts` - Komponent sortowania (do reużycia)

### Planowane strony:
- `RecipesPage.page.ts` - Strona przepisów
- `RecipeDetailsPage.page.ts` - Szczegóły przepisu
- `ShoppingListPage.page.ts` - Lista zakupów
- `CookingHistoryPage.page.ts` - Historia gotowania

