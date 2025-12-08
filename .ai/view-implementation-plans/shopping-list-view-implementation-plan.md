# Plan implementacji widoku Listy Zakupów (Shopping List Modal)

## 1. Przegląd

Widok listy zakupów to modalny komponent wywoływany z widoku szczegółów przepisu (Recipe Details). Jego głównym celem jest wygenerowanie i wyświetlenie listy brakujących składników potrzebnych do przygotowania wybranego przepisu. Użytkownik może edytować ilości, odznaczać niepotrzebne produkty oraz eksportować listę w różnych formatach (kopia do schowka, drukowanie, eksport do pliku .txt).

Modal wspiera User Story US-005: Generowanie listy zakupów, gdzie system porównuje składniki przepisu z zawartością wirtualnej lodówki użytkownika i prezentuje czytelną listę brakujących produktów wraz z wymaganymi ilościami.

## 2. Routing widoku

Modal nie posiada dedykowanej ścieżki URL. Jest wywoływany programatycznie z widoku `/recipes/:id` (Recipe Details) poprzez akcję użytkownika klikającego przycisk "Generuj listę zakupów".

**Trigger:** Przycisk w sekcji składników widoku Recipe Details, widoczny tylko gdy istnieją brakujące składniki.

## 3. Struktura komponentów

```
<ShoppingListModal>                    (React Island, client:idle)
├── <Dialog>                           (Shadcn/ui Dialog)
│   ├── <DialogOverlay>                (Backdrop)
│   ├── <DialogContent>
│   │   ├── <DialogHeader>
│   │   │   ├── <DialogTitle>         ("Lista zakupów: [nazwa przepisu]")
│   │   │   └── <DialogClose>         (X button)
│   │   ├── <ShoppingListContent>     (Main content area)
│   │   │   └── <EditableShoppingList>
│   │   │       └── <ShoppingListItem>[] (Multiple items)
│   │   │           ├── <Checkbox>
│   │   │           ├── <ProductName>
│   │   │           ├── <QuantityInput> (editable)
│   │   │           ├── <UnitLabel>
│   │   │           └── <RemoveButton>
│   │   └── <DialogFooter>
│   │       ├── <Button> ("Kopiuj do schowka")
│   │       ├── <Button> ("Drukuj")
│   │       ├── <Button> ("Eksportuj .txt")
│   │       └── <Button> ("Zamknij", secondary)
```

## 4. Szczegóły komponentów

### 4.1 ShoppingListModal

**Opis komponentu:**
Główny komponent modalny zarządzający całym widokiem listy zakupów. Odpowiada za generowanie listy (wywołanie API), zarządzanie stanem edytowanych pozycji oraz obsługę akcji eksportu.

**Główne elementy HTML i komponenty dzieci:**

- `<Dialog>` z Shadcn/ui jako wrapper modalny
- `<DialogHeader>` z tytułem i przyciskiem zamknięcia
- `<ShoppingListContent>` - obszar przewijany z listą
- `<DialogFooter>` - przyciski akcji

**Obsługiwane zdarzenia:**

- `onOpen` - wywołanie API POST `/api/shopping-list/generate` z `recipe_id`
- `onClose` - zamknięcie modala
- `onCopyToClipboard` - kopiowanie listy w formacie tekstowym
- `onPrint` - wywołanie `window.print()`
- `onExportTxt` - download pliku .txt
- Loading state podczas generowania listy

**Warunki walidacji:**

- `recipe_id` musi być numerem dodatnim
- Minimum 1 brakujący składnik do wyświetlenia
- Ilości muszą być liczbami dodatnimi (> 0)

**Typy:**

- Props: `ShoppingListModalProps`
- State: `ShoppingListState`
- API Request: `GenerateShoppingListDTO`
- API Response: `ShoppingListResponseDTO`

**Propsy (interfejs komponentu):**

```typescript
interface ShoppingListModalProps {
  recipeId: number;
  recipeTitle: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}
```

### 4.2 EditableShoppingList

**Opis komponentu:**
Komponent prezentujący listę edytowalnych pozycji zakupowych. Zarządza stanem lokalnym każdej pozycji (checked, quantity).

**Główne elementy HTML i komponenty dzieci:**

- `<div>` jako wrapper listy
- `<ShoppingListItem>` dla każdej pozycji z `missing_ingredients`

**Obsługiwane zdarzenia:**

- `onItemCheck` - toggle checkbox dla pozycji
- `onItemRemove` - usunięcie pozycji z listy
- `onQuantityChange` - zmiana ilości składnika

**Warunki walidacji:**

- Ilość musi być liczbą dodatnią
- Minimum 1 item z checked=true do eksportu

**Typy:**

- Props: `EditableShoppingListProps`
- Item: `EditableShoppingListItem`

**Propsy:**

```typescript
interface EditableShoppingListProps {
  items: ShoppingListItemDTO[];
  onItemsChange: (items: EditableShoppingListItem[]) => void;
}
```

### 4.3 ShoppingListItem

**Opis komponentu:**
Pojedynczy wiersz reprezentujący brakujący składnik. Zawiera checkbox, nazwę produktu, edytowalną ilość, jednostkę oraz przycisk usunięcia.

**Główne elementy HTML i komponenty dzieci:**

- `<div className="flex items-center gap-3">` - kontener wiersza
- `<Checkbox>` (Shadcn/ui)
- `<span>` - nazwa produktu
- `<Input type="number">` - edytowalna ilość
- `<span>` - jednostka
- `<Button variant="ghost">` - ikona X do usunięcia

**Obsługiwane zdarzenia:**

- `onCheckedChange` - zmiana stanu checkbox
- `onQuantityChange` - zmiana ilości (debounced)
- `onRemove` - usunięcie pozycji

**Warunki walidacji:**

- Ilość > 0
- Ilość jako liczba (nie NaN)

**Typy:**

- Props: `ShoppingListItemProps`

**Propsy:**

```typescript
interface ShoppingListItemProps {
  item: EditableShoppingListItem;
  onCheckedChange: (checked: boolean) => void;
  onQuantityChange: (quantity: number) => void;
  onRemove: () => void;
}
```

### 4.4 DialogHeader

**Opis komponentu:**
Nagłówek modala z tytułem i przyciskiem zamknięcia.

**Główne elementy:**

- `<DialogTitle>` - "Lista zakupów: [nazwa przepisu]"
- `<DialogClose asChild>` - przycisk X

**Obsługiwane zdarzenia:**

- `onClick` na close button - zamyka modal

**Typy:**

- Standard Shadcn/ui Dialog components

### 4.5 DialogFooter

**Opis komponentu:**
Stopka modala z przyciskami akcji.

**Główne elementy:**

- 4 przyciski w jednym wierszu (flex, gap-2):
  - "Kopiuj do schowka" (primary)
  - "Drukuj" (secondary)
  - "Eksportuj .txt" (secondary)
  - "Zamknij" (secondary)

**Obsługiwane zdarzenia:**

- `onCopy` - kopiowanie do clipboard
- `onPrint` - drukowanie
- `onExport` - download pliku
- `onClose` - zamknięcie modala

## 5. Typy

### 5.1 DTOs z API (z `src/types.ts`)

**GenerateShoppingListDTO** - Request body dla POST `/api/shopping-list/generate`:

```typescript
interface GenerateShoppingListDTO {
  recipe_id: number;
}
```

**ShoppingListResponseDTO** - Response z API:

```typescript
interface ShoppingListResponseDTO {
  recipe: RecipeReferenceDTO;
  missing_ingredients: ShoppingListItemDTO[];
  total_items: number;
}
```

**RecipeReferenceDTO**:

```typescript
interface RecipeReferenceDTO {
  id: number;
  title: string;
}
```

**ShoppingListItemDTO**:

```typescript
interface ShoppingListItemDTO {
  product: ProductReferenceDTO;
  required_quantity: number;
  available_quantity: number;
  missing_quantity: number;
  unit: UnitReferenceDTO;
}
```

**ProductReferenceDTO**:

```typescript
interface ProductReferenceDTO {
  id: number;
  name: string;
}
```

**UnitReferenceDTO**:

```typescript
interface UnitReferenceDTO {
  id: number;
  name: string;
  abbreviation: string;
}
```

### 5.2 ViewModels (nowe typy dla widoku)

**ShoppingListModalProps** - Props głównego komponentu:

```typescript
interface ShoppingListModalProps {
  recipeId: number; // ID przepisu do generowania listy
  recipeTitle: string; // Tytuł przepisu (do wyświetlenia w nagłówku)
  isOpen: boolean; // Kontrola widoczności modala
  onClose: () => void; // Callback zamknięcia modala
  onSuccess?: () => void; // Optional callback po sukcesie (do refresh w parent)
}
```

**ShoppingListState** - Stan wewnętrzny komponentu:

```typescript
interface ShoppingListState {
  loading: boolean; // Czy trwa ładowanie danych z API
  error: string | null; // Komunikat błędu (jeśli wystąpił)
  recipe: RecipeReferenceDTO | null; // Informacje o przepisie
  items: EditableShoppingListItem[]; // Edytowalna lista pozycji
  totalItems: number; // Liczba pozycji (z API)
}
```

**EditableShoppingListItem** - Rozszerzona wersja `ShoppingListItemDTO` z dodatkowymi polami UI:

```typescript
interface EditableShoppingListItem extends ShoppingListItemDTO {
  id: string; // Unikalny identyfikator (dla key w React)
  checked: boolean; // Czy item jest zaznaczony (domyślnie true)
  editedQuantity: number; // Edytowana ilość (początkowo = missing_quantity)
}
```

**ExportFormat** - Enum dla formatów eksportu:

```typescript
type ExportFormat = "clipboard" | "print" | "txt";
```

**FormattedShoppingListItem** - Format do eksportu:

```typescript
interface FormattedShoppingListItem {
  productName: string;
  quantity: number;
  unit: string;
}
```

### 5.3 Pomocnicze typy

**ApiError** - Reprezentacja błędu z API:

```typescript
interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
```

## 6. Zarządzanie stanem

### 6.1 Lokalny stan komponentu (useState)

Modal zarządza stanem lokalnie przy użyciu `useState` bez wykorzystania zewnętrznych bibliotek state management.

**Stan główny (`ShoppingListState`):**

```typescript
const [state, setState] = useState<ShoppingListState>({
  loading: false,
  error: null,
  recipe: null,
  items: [],
  totalItems: 0,
});
```

**Alternatywnie - osobne states dla lepszej granularności:**

```typescript
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);
const [recipe, setRecipe] = useState<RecipeReferenceDTO | null>(null);
const [items, setItems] = useState<EditableShoppingListItem[]>([]);
```

### 6.2 Efekty uboczne (useEffect)

**Generowanie listy zakupów przy otwarciu modala:**

```typescript
useEffect(() => {
  if (isOpen && recipeId) {
    generateShoppingList();
  }
}, [isOpen, recipeId]);
```

**Funkcja `generateShoppingList`:**

```typescript
const generateShoppingList = async () => {
  setLoading(true);
  setError(null);

  try {
    const response = await fetch("/api/shopping-list/generate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ recipe_id: recipeId }),
    });

    if (!response.ok) {
      throw new Error("Nie udało się wygenerować listy zakupów");
    }

    const data: ShoppingListResponseDTO = await response.json();

    // Przekształć dane API na EditableShoppingListItem
    const editableItems: EditableShoppingListItem[] = data.missing_ingredients.map((item, index) => ({
      ...item,
      id: `item-${index}-${item.product.id}`,
      checked: true,
      editedQuantity: item.missing_quantity,
    }));

    setRecipe(data.recipe);
    setItems(editableItems);
  } catch (error) {
    setError(error.message || "Wystąpił błąd");
  } finally {
    setLoading(false);
  }
};
```

### 6.3 Zarządzanie zmianami w liście

**Toggle checkbox:**

```typescript
const handleItemCheck = (itemId: string, checked: boolean) => {
  setItems((prevItems) => prevItems.map((item) => (item.id === itemId ? { ...item, checked } : item)));
};
```

**Zmiana ilości:**

```typescript
const handleQuantityChange = (itemId: string, newQuantity: number) => {
  if (newQuantity <= 0 || isNaN(newQuantity)) {
    return; // Walidacja
  }

  setItems((prevItems) =>
    prevItems.map((item) => (item.id === itemId ? { ...item, editedQuantity: newQuantity } : item))
  );
};
```

**Usunięcie pozycji:**

```typescript
const handleItemRemove = (itemId: string) => {
  setItems((prevItems) => prevItems.filter((item) => item.id !== itemId));
};
```

### 6.4 Custom hook (opcjonalnie)

Dla lepszej organizacji można wydzielić logikę do custom hooka:

```typescript
// hooks/useShoppingList.ts
function useShoppingList(recipeId: number, isOpen: boolean) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<RecipeReferenceDTO | null>(null);
  const [items, setItems] = useState<EditableShoppingListItem[]>([]);

  // ... logika z useEffect i funkcje

  return {
    loading,
    error,
    recipe,
    items,
    handleItemCheck,
    handleQuantityChange,
    handleItemRemove,
    regenerate: generateShoppingList,
  };
}
```

## 7. Integracja API

### 7.1 Endpoint

**Metoda:** POST  
**Ścieżka:** `/api/shopping-list/generate`  
**Nagłówki:**

- `Content-Type: application/json`
- `Authorization: Bearer {token}` (obsługiwane automatycznie przez middleware)

### 7.2 Request

**Typ:** `GenerateShoppingListDTO`

```json
{
  "recipe_id": 1
}
```

**Walidacja po stronie klienta:**

- `recipe_id` musi być liczbą dodatnią
- `recipe_id` jest wymagane

### 7.3 Response

**Sukces (200 OK):**

**Typ:** `ShoppingListResponseDTO`

```json
{
  "recipe": {
    "id": 1,
    "title": "Tomato Soup"
  },
  "missing_ingredients": [
    {
      "product": {
        "id": 15,
        "name": "Onion"
      },
      "required_quantity": 2,
      "available_quantity": 0,
      "missing_quantity": 2,
      "unit": {
        "id": 1,
        "name": "piece",
        "abbreviation": "pc"
      }
    },
    {
      "product": {
        "id": 10,
        "name": "Tomato"
      },
      "required_quantity": 5,
      "available_quantity": 3,
      "missing_quantity": 2,
      "unit": {
        "id": 1,
        "name": "piece",
        "abbreviation": "pc"
      }
    }
  ],
  "total_items": 2
}
```

**Sukces bez brakujących składników (200 OK):**

```json
{
  "recipe": {
    "id": 1,
    "title": "Tomato Soup"
  },
  "missing_ingredients": [],
  "total_items": 0
}
```

**Błędy:**

- **400 Bad Request** - Nieprawidłowy `recipe_id`

  ```json
  {
    "error": {
      "code": "VALIDATION_ERROR",
      "message": "Invalid recipe_id",
      "details": {
        "recipe_id": "must be a positive integer"
      }
    }
  }
  ```

- **401 Unauthorized** - Brak autoryzacji

  ```json
  {
    "error": {
      "code": "UNAUTHORIZED",
      "message": "Authentication required"
    }
  }
  ```

- **404 Not Found** - Przepis nie istnieje lub nie należy do użytkownika
  ```json
  {
    "error": {
      "code": "NOT_FOUND",
      "message": "Recipe not found"
    }
  }
  ```

### 7.4 Obsługa błędów API

```typescript
try {
  const response = await fetch("/api/shopping-list/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ recipe_id: recipeId }),
  });

  if (!response.ok) {
    const errorData = await response.json();

    switch (response.status) {
      case 400:
        throw new Error("Nieprawidłowe ID przepisu");
      case 401:
        throw new Error("Wymagane logowanie");
      case 404:
        throw new Error("Przepis nie został znaleziony");
      default:
        throw new Error(errorData.error?.message || "Wystąpił błąd");
    }
  }

  const data = await response.json();
  // Process data...
} catch (error) {
  setError(error.message);
  console.error("Shopping list generation error:", error);
}
```

## 8. Interakcje użytkownika

### 8.1 Otwieranie modala

**Trigger:** Kliknięcie przycisku "Generuj listę zakupów" w widoku Recipe Details

**Przepływ:**

1. Użytkownik klika przycisk w sekcji składników
2. Parent component (`RecipeDetails`) ustawia `isOpen={true}` na `ShoppingListModal`
3. Modal się otwiera i automatycznie wywołuje API
4. Wyświetlany jest loading spinner podczas generowania
5. Po otrzymaniu danych wyświetlana jest lista składników

**Warunki wstępne:**

- Użytkownik jest na widoku Recipe Details (`/recipes/:id`)
- Istnieją brakujące składniki (przycisk widoczny tylko wtedy)

### 8.2 Edycja pozycji

**Interakcja 1: Toggle checkbox**

- Kliknięcie checkbox zaznacza/odznacza pozycję
- Odznaczone pozycje są wizualnie wygaszone (opacity: 0.5)
- Odznaczone pozycje nie są uwzględniane w eksporcie

**Interakcja 2: Edycja ilości**

- Kliknięcie w pole input z ilością aktywuje edycję
- Użytkownik wpisuje nową wartość liczbową
- Walidacja na bieżąco: ilość > 0, tylko liczby
- Błędne wartości powodują czerwone obramowanie input
- Po zmianie focus lub Enter - wartość jest zapisywana

**Interakcja 3: Usunięcie pozycji**

- Kliknięcie ikony X usuwa pozycję z listy
- Brak confirmation dialog (szybkie działanie)
- Pozycja natychmiast znika z listy
- Jeśli wszystkie pozycje usunięte - wyświetlany komunikat "Lista jest pusta"

### 8.3 Kopiowanie do schowka

**Trigger:** Kliknięcie przycisku "Kopiuj do schowka"

**Przepływ:**

1. Zbierane są wszystkie zaznaczone pozycje (checked=true)
2. Formatowanie do plain text:

   ```
   Lista zakupów: [Nazwa przepisu]

   - 2 pc Pomidor
   - 100 g Mąka
   - 1 szt Cebula
   ```

3. Użycie Clipboard API: `navigator.clipboard.writeText(text)`
4. Wyświetlenie toast success: "Skopiowano do schowka"
5. Modal pozostaje otwarty

**Walidacja:**

- Minimum 1 zaznaczona pozycja (checked=true)
- Jeśli brak zaznaczonych: toast error "Zaznacz przynajmniej jeden składnik"

**Format eksportu:**

```typescript
const formatForClipboard = (items: EditableShoppingListItem[], recipeTitle: string): string => {
  const checkedItems = items.filter((item) => item.checked);

  const header = `Lista zakupów: ${recipeTitle}\n\n`;
  const itemsList = checkedItems
    .map((item) => `- ${item.editedQuantity} ${item.unit.abbreviation} ${item.product.name}`)
    .join("\n");

  return header + itemsList;
};
```

### 8.4 Drukowanie

**Trigger:** Kliknięcie przycisku "Drukuj"

**Przepływ:**

1. Przygotowanie zawartości do druku (tylko zaznaczone pozycje)
2. Wywołanie `window.print()` - otwiera natywny dialog drukowania
3. CSS `@media print` ukrywa niepotrzebne elementy (przyciski, checkbox)
4. Po zakończeniu drukowania modal pozostaje otwarty

**Style dla druku:**

```css
@media print {
  .shopping-list-modal-footer {
    display: none;
  }

  .shopping-list-checkbox,
  .shopping-list-remove-button {
    display: none;
  }

  .shopping-list-item {
    page-break-inside: avoid;
  }
}
```

### 8.5 Eksport do pliku .txt

**Trigger:** Kliknięcie przycisku "Eksportuj .txt"

**Przepływ:**

1. Formatowanie identyczne jak dla clipboard
2. Utworzenie Blob z tekstem
3. Utworzenie URL obiektu Blob
4. Programmatyczne kliknięcie linka download
5. Nazwa pliku: `lista-zakupow-[slug-nazwy-przepisu].txt`
6. Toast success: "Lista zakupów pobrana"

**Implementacja:**

```typescript
const handleExportTxt = () => {
  const checkedItems = items.filter((item) => item.checked);

  if (checkedItems.length === 0) {
    showToast("Zaznacz przynajmniej jeden składnik", "error");
    return;
  }

  const content = formatForClipboard(checkedItems, recipe.title);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `lista-zakupow-${slugify(recipe.title)}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
  showToast("Lista zakupów pobrana", "success");
};
```

### 8.6 Zamykanie modala

**Trigger:**

- Kliknięcie przycisku "Zamknij"
- Kliknięcie X w nagłówku
- Kliknięcie poza modalem (backdrop)
- Naciśnięcie klawisza Escape

**Przepływ:**

1. Wywołanie callback `onClose()` przekazanego z parent
2. Parent ustawia `isOpen={false}`
3. Modal animuje zamknięcie (fade out)
4. Stan wewnętrzny modala jest zachowany (dla szybkiego ponownego otwarcia)

**Brak confirmation:**

- Edycje są lokalne (nie zapisywane do bazy)
- Brak potrzeby potwierdzenia zamknięcia

## 9. Warunki i walidacja

### 9.1 Walidacja danych wejściowych (Props)

**Komponent: ShoppingListModal**

| Prop          | Warunek               | Wpływ na UI                      | Obsługa błędu               |
| ------------- | --------------------- | -------------------------------- | --------------------------- |
| `recipeId`    | Liczba dodatnia (> 0) | Brak wywołania API jeśli invalid | Console.error + close modal |
| `recipeTitle` | Niepusty string       | Wyświetlony w nagłówku           | Fallback: "Przepis"         |
| `isOpen`      | Boolean               | Kontrola widoczności modala      | -                           |
| `onClose`     | Function              | Wywołanie przy zamknięciu        | Wymagane (brak fallback)    |

**Przykład walidacji:**

```typescript
useEffect(() => {
  if (!isOpen) return;

  if (!recipeId || recipeId <= 0) {
    console.error("Invalid recipeId:", recipeId);
    showToast("Błąd: nieprawidłowe ID przepisu", "error");
    onClose();
    return;
  }

  generateShoppingList();
}, [isOpen, recipeId]);
```

### 9.2 Walidacja edycji ilości

**Komponent: ShoppingListItem**

| Pole             | Warunki          | Komunikat błędu               | Działanie UI               |
| ---------------- | ---------------- | ----------------------------- | -------------------------- |
| `editedQuantity` | > 0              | "Ilość musi być większa od 0" | Czerwone obramowanie input |
| `editedQuantity` | Liczba (not NaN) | "Wprowadź poprawną liczbę"    | Czerwone obramowanie input |
| `editedQuantity` | Max 9999         | "Maksymalna ilość to 9999"    | Czerwone obramowanie input |

**Implementacja walidacji inline:**

```typescript
const [quantityError, setQuantityError] = useState<string | null>(null);

const validateQuantity = (value: number): boolean => {
  if (isNaN(value)) {
    setQuantityError("Wprowadź poprawną liczbę");
    return false;
  }

  if (value <= 0) {
    setQuantityError("Ilość musi być większa od 0");
    return false;
  }

  if (value > 9999) {
    setQuantityError("Maksymalna ilość to 9999");
    return false;
  }

  setQuantityError(null);
  return true;
};

const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  const newValue = parseFloat(e.target.value);

  if (validateQuantity(newValue)) {
    onQuantityChange(newValue);
  }
};
```

**Wizualizacja błędu:**

```tsx
<Input
  type="number"
  value={item.editedQuantity}
  onChange={handleQuantityChange}
  className={cn("w-20", quantityError && "border-red-500 focus:ring-red-500")}
  min={0}
  max={9999}
  step={0.1}
/>;
{
  quantityError && <span className="text-xs text-red-500">{quantityError}</span>;
}
```

### 9.3 Walidacja akcji eksportu

**Warunek: Minimum 1 zaznaczona pozycja**

```typescript
const canExport = items.some((item) => item.checked);

const handleCopyToClipboard = () => {
  if (!canExport) {
    showToast("Zaznacz przynajmniej jeden składnik do skopiowania", "error");
    return;
  }

  // Proceed with export...
};
```

**UI feedback:**

- Przyciski eksportu disabled gdy `!canExport`
- Tooltip: "Zaznacz przynajmniej jeden składnik"

```tsx
<Button
  onClick={handleCopyToClipboard}
  disabled={!canExport}
  title={!canExport ? "Zaznacz przynajmniej jeden składnik" : undefined}
>
  Kopiuj do schowka
</Button>
```

### 9.4 Warunki stanu komponentu

**Loading state:**

- `loading === true`
- UI: Skeleton loader w miejscu listy
- Wszystkie przyciski akcji disabled
- Komunikat: "Generowanie listy zakupów..."

**Error state:**

- `error !== null`
- UI: Komunikat błędu w centrum modala
- Przycisk "Spróbuj ponownie" → wywołuje ponownie `generateShoppingList()`
- Przycisk "Zamknij" → zamyka modal

**Empty state:**

- `items.length === 0` po załadowaniu
- UI: Komunikat "Wszystkie składniki dostępne! 🎉"
- Opis: "Masz wszystko co potrzebne do przygotowania tego przepisu."
- Przycisk "Zamknij" (primary)

**Normal state:**

- `items.length > 0`
- Wyświetlenie listy pozycji
- Wszystkie akcje dostępne

### 9.5 Walidacja obsługiwana przez API

API endpoint `/api/shopping-list/generate` waliduje:

- `recipe_id` istnieje w bazie
- Przepis należy do użytkownika
- Użytkownik jest zaautentykowany

Frontend obsługuje błędy API poprzez:

1. Wyświetlenie komunikatu błędu z API w toast
2. Pokazanie error state w modalu
3. Umożliwienie ponownego wywołania lub zamknięcia

## 10. Obsługa błędów

### 10.1 Błędy API

| Scenariusz              | Kod HTTP      | Akcja UI                                                                        |
| ----------------------- | ------------- | ------------------------------------------------------------------------------- |
| Brak autoryzacji        | 401           | Toast error: "Wymagane logowanie. Zaloguj się ponownie." + Redirect do `/login` |
| Nieprawidłowy recipe_id | 400           | Toast error: "Nieprawidłowe ID przepisu" + Zamknięcie modala                    |
| Przepis nie znaleziony  | 404           | Toast error: "Przepis nie został znaleziony" + Zamknięcie modala                |
| Błąd serwera            | 500           | Error state w modalu + przycisk "Spróbuj ponownie"                              |
| Błąd sieci              | Network error | Error state: "Brak połączenia z internetem" + przycisk retry                    |

**Implementacja error handling:**

```typescript
const handleApiError = (error: any, response?: Response) => {
  let errorMessage = "Wystąpił nieoczekiwany błąd";

  if (!response) {
    // Network error
    errorMessage = "Brak połączenia z internetem. Sprawdź połączenie i spróbuj ponownie.";
  } else {
    switch (response.status) {
      case 400:
        errorMessage = "Nieprawidłowe dane przepisu";
        setTimeout(() => onClose(), 2000); // Auto-close po 2s
        break;
      case 401:
        errorMessage = "Wymagane logowanie";
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
        break;
      case 404:
        errorMessage = "Przepis nie został znaleziony";
        setTimeout(() => onClose(), 2000);
        break;
      case 500:
      default:
        errorMessage = "Błąd serwera. Spróbuj ponownie za chwilę.";
    }
  }

  setError(errorMessage);
  showToast(errorMessage, "error");
};
```

### 10.2 Błędy walidacji

**Nieprawidłowa ilość w input:**

- **Trigger:** Użytkownik wpisuje wartość <= 0 lub NaN
- **Akcja:** Czerwone obramowanie input + komunikat pod polem
- **Recovery:** Automatyczna walidacja onChange, użytkownik poprawia wartość

**Brak zaznaczonych pozycji przy eksporcie:**

- **Trigger:** Kliknięcie "Kopiuj"/"Drukuj"/"Eksportuj" gdy wszystkie unchecked
- **Akcja:** Toast warning: "Zaznacz przynajmniej jeden składnik"
- **Recovery:** Użytkownik zaznacza checkbox i ponawia akcję

### 10.3 Błędy Clipboard API

**Scenariusz:** `navigator.clipboard.writeText()` nie działa (permissions, HTTPS requirement)

```typescript
const copyToClipboard = async (text: string) => {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      showToast("Skopiowano do schowka", "success");
    } else {
      // Fallback: textarea trick
      fallbackCopyToClipboard(text);
    }
  } catch (error) {
    console.error("Clipboard error:", error);
    showToast("Nie udało się skopiować. Spróbuj ponownie.", "error");
  }
};

const fallbackCopyToClipboard = (text: string) => {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand("copy");
    showToast("Skopiowano do schowka", "success");
  } catch (error) {
    showToast("Nie udało się skopiować", "error");
  }

  document.body.removeChild(textarea);
};
```

### 10.4 Empty state scenarios

**Scenariusz 1: Brak brakujących składników**

- API zwraca `missing_ingredients: []`
- UI: Empty state z pozytywnym komunikatem

  ```
  ✅ Wszystkie składniki dostępne!
  Masz wszystko co potrzebne do przygotowania tego przepisu.

  [Zamknij]
  ```

**Scenariusz 2: Użytkownik usunął wszystkie pozycje**

- `items.length === 0` po edycji
- UI: Empty state

  ```
  📋 Lista jest pusta
  Wszystkie składniki zostały usunięte z listy.

  [Regeneruj listę] [Zamknij]
  ```

### 10.5 Edge cases

**Case 1: Modal otwarty podczas refresh**

- Modal automatycznie zamknięty przy unmount
- Parent zarządza stanem `isOpen`

**Case 2: Slow API response**

- Loading state z timeout message po 5s: "Generowanie trwa dłużej niż zwykle..."
- Możliwość anulowania przez zamknięcie modala

**Case 3: Bardzo długa lista (>50 pozycji)**

- Scrollowalny kontener z max-height
- Sticky header i footer

## 11. Kroki implementacji

### Krok 1: Setup struktury i typów

1. Utworzenie folderu `src/components/shopping-list/`
2. Utworzenie pliku `ShoppingListModal.tsx`
3. Definicja wszystkich typów ViewModels w pliku (lub osobnym `types.ts`)
4. Import typów DTO z `src/types.ts`
5. Setup podstawowej struktury komponentu z Shadcn/ui Dialog

### Krok 2: Implementacja stanu i logiki API

1. Zaimplementowanie `useState` dla wszystkich stanów komponentu
2. Implementacja `useEffect` do wywoływania API przy otwierciu
3. Napisanie funkcji `generateShoppingList()`:
   - Wywołanie POST `/api/shopping-list/generate`
   - Obsługa loading state
   - Parsowanie response do `EditableShoppingListItem[]`
   - Error handling
4. Testowanie integracji z API (console.log responses)

### Krok 3: Budowa UI - Layout i struktura

1. Implementacja `DialogHeader`:
   - Dynamiczny tytuł z `recipeTitle`
   - Close button (X icon)
2. Implementacja `DialogContent`:
   - Scrollowalny kontener
   - Max-height: `calc(90vh - 200px)`
3. Implementacja `DialogFooter`:
   - 4 przyciski w układzie flex
   - Responsywność (stack na mobile)
4. Stylowanie z Tailwind classes

### Krok 4: Implementacja EditableShoppingList

1. Utworzenie komponentu `EditableShoppingList.tsx`
2. Mapowanie `items` na `ShoppingListItem` komponenty
3. Przekazywanie callbacks: `onItemCheck`, `onQuantityChange`, `onItemRemove`
4. Empty state handling

### Krok 5: Implementacja ShoppingListItem

1. Utworzenie komponentu `ShoppingListItem.tsx`
2. Layout wiersza:
   - Checkbox (Shadcn/ui)
   - Nazwa produktu (text-base, font-medium)
   - Input quantity (number, w-20)
   - Jednostka (text-sm, text-gray-500)
   - Remove button (icon X, ghost variant)
3. Implementacja walidacji inline dla quantity
4. Stylowanie stanów: checked, unchecked (opacity), error (red border)

### Krok 6: Loading i Error states

1. Implementacja skeleton loader:
   - 5 skeleton rows mimikujących ShoppingListItem
   - Shimmer animation
   - Komunikat: "Generowanie listy zakupów..."
2. Implementacja error state:
   - Ikona error (⚠️)
   - Komunikat błędu
   - Przycisk "Spróbuj ponownie"
   - Przycisk "Zamknij"
3. Implementacja empty state:
   - Dwie wersje: wszystkie dostępne vs. lista pusta po edycji
   - Odpowiednie ikony i komunikaty

### Krok 7: Funkcje eksportu

1. **Kopiowanie do schowka:**
   - Funkcja `formatForClipboard(items, recipeTitle)`
   - Implementacja `copyToClipboard()` z fallback
   - Toast success/error feedback
2. **Drukowanie:**
   - Funkcja `handlePrint()` wywołująca `window.print()`
   - CSS `@media print` dla ukrycia elementów UI
   - Testowanie wyglądu wydruku
3. **Eksport .txt:**
   - Funkcja `handleExportTxt()`
   - Tworzenie Blob i download
   - Generowanie nazwy pliku (slugify recipe title)
   - Toast feedback

### Krok 8: Walidacja i Edge Cases

1. Walidacja props w `useEffect`
2. Walidacja quantity w `ShoppingListItem`
3. Walidacja przed eksportem (min 1 checked)
4. Implementacja wszystkich edge cases z sekcji 10.5
5. Dodanie tooltipów dla disabled buttons

### Krok 9: Accessibility i UX improvements

1. **Keyboard navigation:**
   - Tab order: checkbox → quantity input → remove button → next item
   - Enter na quantity input = zapisz i przejdź dalej
   - Escape w modalu = zamknij
2. **ARIA labels:**
   - `aria-label` na remove buttons: "Usuń [nazwa produktu]"
   - `aria-describedby` dla quantity inputs z błędami
   - `role="dialog"`, `aria-modal="true"` na Dialog
3. **Focus management:**
   - Focus trap w modalu
   - Pierwszy focusable element po otwarciu: pierwszy checkbox
   - Focus wraca do trigger button po zamknięciu
4. **Visual feedback:**
   - Hover states na wszystkich interaktywnych elementach
   - Loading spinners z odpowiednimi aria-live regions
   - Transition animations (subtle)

### Krok 10: Integracja z Recipe Details

1. Dodanie state `isShoppingListOpen` w `RecipeDetails.tsx`
2. Dodanie przycisku "Generuj listę zakupów" w sekcji składników:
   - Widoczny tylko gdy istnieją missing ingredients
   - Icon: 🛒 lub shopping cart SVG
   - Wariant: secondary
3. Renderowanie `<ShoppingListModal>`:
   ```tsx
   <ShoppingListModal
     recipeId={recipe.id}
     recipeTitle={recipe.title}
     isOpen={isShoppingListOpen}
     onClose={() => setIsShoppingListOpen(false)}
   />
   ```
4. Przekazanie `client:idle` directive dla lazy loading

### Krok 11: Testing i Debugging

1. **Testy manualne:**
   - Otwieranie/zamykanie modala
   - Generowanie listy dla różnych przepisów
   - Edycja ilości (valid/invalid values)
   - Toggle checkboxes
   - Usuwanie pozycji
   - Kopiowanie do schowka
   - Drukowanie
   - Eksport .txt
2. **Testy edge cases:**
   - Empty list (wszystkie składniki dostępne)
   - Bardzo długa lista (>20 pozycji)
   - Slow API response
   - API errors (404, 500)
   - Network error
3. **Testy responsive:**
   - Desktop (≥1024px) - centered modal 600px
   - Tablet (768-1023px) - centered modal 90% width
   - Mobile (<768px) - full-screen modal
4. **Debugging:**
   - Console logs dla API responses
   - React DevTools dla state inspection
   - Network tab dla API calls

### Krok 12: Optymalizacje i polish

1. **Performance:**
   - Memoizacja funkcji eksportu (`useCallback`)
   - Memoizacja formatowania (`useMemo`)
   - Debouncing quantity input (300ms)
2. **Animacje:**
   - Fade in/out dla modala (Shadcn/ui defaults)
   - Smooth transitions dla checkbox toggle
   - Subtle hover effects
3. **Code cleanup:**
   - Usunięcie console.logs
   - Dodanie JSDoc comments
   - Code review i refactoring
4. **Documentation:**
   - README dla komponentu
   - Przykłady użycia
   - Props documentation

### Krok 13: Code review i finalizacja

1. Przegląd kodu pod kątem:
   - Zgodność z PRD i User Stories
   - Best practices React i TypeScript
   - Accessibility standards
   - Error handling completeness
2. Testy finalne na różnych urządzeniach
3. Merge do głównej gałęzi
4. Deploy i monitoring

---

## Dodatkowe uwagi implementacyjne

### Struktura plików (finalna)

```
src/
├── components/
│   └── shopping-list/
│       ├── ShoppingListModal.tsx          # Główny komponent
│       ├── EditableShoppingList.tsx       # Lista pozycji
│       ├── ShoppingListItem.tsx           # Pojedyncza pozycja
│       ├── ShoppingListSkeleton.tsx       # Loading state
│       ├── ShoppingListEmptyState.tsx     # Empty state
│       ├── ShoppingListErrorState.tsx     # Error state
│       ├── types.ts                       # ViewModels
│       └── utils.ts                       # Funkcje formatowania i eksportu
├── lib/
│   └── utils/
│       └── clipboard.ts                   # Clipboard utilities z fallback
└── pages/
    └── recipes/
        └── [id].astro                     # Parent - Recipe Details
```

### Zależności zewnętrzne

**Już dostępne w projekcie:**

- React 19
- Shadcn/ui (Dialog, Button, Input, Checkbox)
- Tailwind 4
- TypeScript 5

**Opcjonalne (jeśli potrzebne):**

- `slugify` lub własna funkcja slugify dla nazw plików
- `clsx` lub `cn` utility dla conditional classes (prawdopodobnie już w projekcie)

### Uwagi dot. Astro Islands

Modal powinien być lazy-loaded jako React Island:

```astro
<ShoppingListModal
  client:idle
  recipeId={recipe.id}
  recipeTitle={recipe.title}
  isOpen={isShoppingListOpen}
  onClose={() => setIsShoppingListOpen(false)}
/>
```

Directive `client:idle` zapewnia, że komponent jest hydratowany dopiero gdy przeglądarka jest w stanie idle, co optymalizuje początkowe ładowanie strony.

### Metryki sukcesu

**Funkcjonalne:**

- ✅ Użytkownik może wygenerować listę zakupów dla przepisu
- ✅ Użytkownik może edytować ilości składników
- ✅ Użytkownik może odznaczać niepotrzebne składniki
- ✅ Użytkownik może skopiować listę do schowka
- ✅ Użytkownik może wydrukować listę
- ✅ Użytkownik może wyeksportować listę do pliku .txt

**Jakościowe:**

- Czas ładowania listy < 500ms (normalnie)
- Brak crashów przy edge cases
- 100% accessibility score dla modala
- Responsywność na wszystkich breakpointach
- Intuicyjne UX - użytkownik wie co robić bez instrukcji

**Zgodność z PRD:**

- ✅ US-005 w pełni zrealizowane
- ✅ Walidacja i bezpieczeństwo zgodne z wymaganiami
- ✅ Format listy zgodny z specyfikacją

---

**Koniec planu implementacji**
