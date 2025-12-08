# Plan implementacji widoku Lodówki

## 1. Przegląd

Widok Lodówki (Virtual Fridge) to kluczowy moduł aplikacji Foodnager, który umożliwia użytkownikowi zarządzanie posiadanymi produktami spożywczymi. Widok zapewnia kompleksową funkcjonalność przeglądania, dodawania, edycji i usuwania produktów wraz z ich ilościami, jednostkami miary oraz datami ważności. Implementacja obejmuje zaawansowane filtrowanie (wyszukiwanie, sortowanie, filtrowanie według statusu ważności), wizualne oznaczanie produktów według daty ważności oraz intuicyjne modalne formularze do zarządzania produktami.

## 2. Routing widoku

**Ścieżka:** `/fridge`

**Struktura plików:**

- `src/pages/fridge.astro` - Główna strona Astro z layoutem i kontenerem dla React komponentu
- `src/components/FridgeView.tsx` - Główny React komponent widoku (client:load)

## 3. Struktura komponentów

```
FridgeView (React - client:load)
├── FridgeToolbar
│   ├── SearchBar
│   └── SortDropdown
├── FridgeStats
│   ├── TotalCount
│   └── ExpiredCount
├── FridgeList
│   ├── FridgeItem (multiple)
│   │   ├── ProductInfo
│   │   ├── ExpiryDateBadge
│   │   └── QuickActions
│   │       ├── EditButton
│   │       └── DeleteButton
│   └── EmptyState (conditional)
├── AddProductModal (Dialog)
│   ├── ProductAutocomplete
│   ├── QuantityInput
│   ├── UnitSelect
│   ├── ExpiryDatePicker
│   └── ModalActions
└── EditProductModal (Dialog)
    ├── ProductDisplay (read-only)
    ├── QuantityInput
    ├── UnitSelect
    ├── ExpiryDatePicker
    └── ModalActions
```

## 4. Szczegóły komponentów

### 4.1 FridgeView (główny komponent kontenera)

**Opis:** Główny komponent React zarządzający całym widokiem lodówki. Koordynuje pobieranie danych, zarządzanie stanem, obsługę filtrowania i sortowania oraz wyświetlanie wszystkich podkomponentów.

**Główne elementy:**

- `<div>` container z głównym layoutem
- `<FridgeToolbar />` - pasek narzędzi z wyszukiwaniem i sortowaniem
- `<FridgeStats />` - statystyki lodówki
- `<FridgeList />` - lista produktów
- `<Button>` - przycisk "Dodaj produkt" (Floating Action Button lub w toolbarze)
- `<AddProductModal />` - modal do dodawania
- `<EditProductModal />` - modal do edycji
- `<ConfirmDialog />` - dialog potwierdzenia usunięcia
- `<Toast />` - powiadomienia toast

**Obsługiwane zdarzenia:**

- Inicjalizacja widoku: fetch listy produktów z API
- Zmiana filtrów/sortowania: refetch z nowymi parametrami
- Kliknięcie "Dodaj produkt": otwórz AddProductModal
- Kliknięcie "Edytuj" na produkcie: otwórz EditProductModal z danymi produktu
- Kliknięcie "Usuń" na produkcie: otwórz ConfirmDialog
- Potwierdzenie usunięcia: wywołaj DELETE API, refetch listy
- Sukces/błąd operacji: wyświetl toast
- Paginacja: fetch kolejnej strony

**Warunki walidacji:**

- Brak - komponent kontenera deleguje walidację do podkomponentów

**Typy:**

- `FridgeViewState` (ViewModel)
- `FridgeItemDTO` (z types.ts)
- `FridgeListResponseDTO` (z types.ts)
- `ListFridgeQueryDTO` (z types.ts)

**Propsy:**
Brak - komponent najwyższego poziomu

---

### 4.2 FridgeToolbar

**Opis:** Pasek narzędzi zawierający wyszukiwarkę i opcje sortowania/filtrowania.

**Główne elementy:**

- `<div>` flex container
- `<SearchBar />` - komponent wyszukiwania
- `<SortDropdown />` - dropdown z opcjami sortowania
- `<Button>` - przycisk "Dodaj produkt" (opcjonalnie, jeśli nie ma FAB)

**Obsługiwane zdarzenia:**

- Zmiana search query: przekaż do rodzica
- Zmiana sortowania: przekaż do rodzica
- Kliknięcie "Dodaj produkt": przekaż event do rodzica

**Warunki walidacji:**

- Brak - tylko UI dla kontrolek

**Typy:**

- `FridgeToolbarProps` (interfejs)

**Propsy:**

```typescript
interface FridgeToolbarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  sortBy: "name" | "quantity" | "expiry_date" | "created_at";
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: string, order: "asc" | "desc") => void;
  onAddProduct: () => void;
}
```

---

### 4.3 SearchBar

**Opis:** Pole wyszukiwania z debouncingiem do filtrowania produktów po nazwie.

**Główne elementy:**

- `<Input>` z Shadcn/ui
- `<SearchIcon>` - ikona lupy
- `<Button>` - przycisk clear (gdy jest wartość)

**Obsługiwane zdarzenia:**

- onChange: debounced (300ms) wywołanie callback
- onClear: wyczyszczenie wartości i wywołanie callback z pustym stringiem

**Warunki walidacji:**

- Brak - wszystkie wartości są akceptowalne

**Typy:**

- `SearchBarProps` (interfejs)

**Propsy:**

```typescript
interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}
```

---

### 4.4 SortDropdown

**Opis:** Dropdown do wyboru pola sortowania i kierunku (asc/desc).

**Główne elementy:**

- `<Select>` z Shadcn/ui dla pola sortowania
- `<Button>` toggle dla kierunku (ikona strzałki)

**Obsługiwane zdarzenia:**

- Zmiana pola sortowania: wywołaj callback
- Toggle kierunku: wywołaj callback z odwróconym kierunkiem

**Warunki walidacji:**

- Wartości ograniczone do enum: 'name' | 'quantity' | 'expiry_date' | 'created_at'

**Typy:**

- `SortDropdownProps` (interfejs)
- `SortField` type alias

**Propsy:**

```typescript
type SortField = "name" | "quantity" | "expiry_date" | "created_at";

interface SortDropdownProps {
  sortBy: SortField;
  sortOrder: "asc" | "desc";
  onChange: (sortBy: SortField, order: "asc" | "desc") => void;
}
```

---

### 4.5 FridgeStats

**Opis:** Komponent wyświetlający statystyki lodówki: całkowitą liczbę produktów i liczbę przeterminowanych.

**Główne elementy:**

- `<div>` flex container z dwoma kartami statystyk
- `<Card>` z Shadcn/ui dla każdej statystyki
- Ikony i liczby

**Obsługiwane zdarzenia:**

- Brak - tylko wyświetlanie

**Warunki walidacji:**

- Brak - tylko prezentacja danych

**Typy:**

- `FridgeStatsProps` (interfejs)

**Propsy:**

```typescript
interface FridgeStatsProps {
  totalCount: number;
  expiredCount: number;
}
```

---

### 4.6 FridgeList

**Opis:** Lista produktów w lodówce z obsługą pustego stanu.

**Główne elementy:**

- `<ul>` semantic list
- `<FridgeItem />` dla każdego produktu
- `<EmptyState />` gdy lista pusta
- `<Pagination />` z Shadcn/ui (na dole)

**Obsługiwane zdarzenia:**

- Kliknięcie "Edytuj": przekaż event do rodzica z ID produktu
- Kliknięcie "Usuń": przekaż event do rodzica z ID produktu
- Zmiana strony: przekaż do rodzica

**Warunki walidacji:**

- Brak - tylko prezentacja listy

**Typy:**

- `FridgeListProps` (interfejs)

**Propsy:**

```typescript
interface FridgeListProps {
  items: FridgeItemDTO[];
  isLoading: boolean;
  pagination: PaginationMetaDTO;
  onEdit: (itemId: number) => void;
  onDelete: (itemId: number) => void;
  onPageChange: (page: number) => void;
  onAddFirst?: () => void; // dla EmptyState
}
```

---

### 4.7 FridgeItem

**Opis:** Pojedynczy element listy produktów z informacjami i akcjami.

**Główne elementy:**

- `<li>` semantic list item
- `<div>` dla informacji produktu (nazwa, ilość, jednostka)
- `<ExpiryDateBadge />` - badge z datą ważności i color coding
- `<div>` dla quick actions (edytuj, usuń)
- `<Button>` ikony dla akcji

**Obsługiwane zdarzenia:**

- Kliknięcie "Edytuj": wywołaj callback z ID
- Kliknięcie "Usuń": wywołaj callback z ID

**Warunki walidacji:**

- Brak - tylko prezentacja

**Typy:**

- `FridgeItemProps` (interfejs)

**Propsy:**

```typescript
interface FridgeItemProps {
  item: FridgeItemDTO;
  onEdit: (itemId: number) => void;
  onDelete: (itemId: number) => void;
}
```

---

### 4.8 ExpiryDateBadge

**Opis:** Badge wyświetlający datę ważności z color coding: zielony (>3 dni), pomarańczowy (≤3 dni), czerwony (przeterminowany).

**Główne elementy:**

- `<Badge>` z Shadcn/ui z dynamicznym variant/className
- Tekst daty lub "Brak daty ważności"

**Obsługiwane zdarzenia:**

- Brak - tylko wyświetlanie

**Warunki walidacji:**

- Brak - tylko prezentacja

**Typy:**

- `ExpiryDateBadgeProps` (interfejs)
- `ExpiryStatus` type alias

**Propsy:**

```typescript
type ExpiryStatus = "expired" | "expiring-soon" | "fresh" | "no-expiry";

interface ExpiryDateBadgeProps {
  expiryDate: string | null;
}
```

---

### 4.9 EmptyState

**Opis:** Komponent wyświetlany gdy lodówka jest pusta.

**Główne elementy:**

- `<div>` container z centrowaniem
- Ilustracja/ikona pustej lodówki
- Nagłówek "Twoja lodówka jest pusta"
- Tekst opisujący korzyści
- `<Button>` "Dodaj pierwszy produkt"

**Obsługiwane zdarzenia:**

- Kliknięcie przycisku: wywołaj callback

**Warunki walidacji:**

- Brak

**Typy:**

- `EmptyStateProps` (interfejs)

**Propsy:**

```typescript
interface EmptyStateProps {
  onAddFirst: () => void;
}
```

---

### 4.10 AddProductModal

**Opis:** Modal dialog do dodawania nowego produktu do lodówki. Zawiera autocomplete dla wyboru produktu (z możliwością tworzenia nowego), pola ilości, jednostki i daty ważności.

**Główne elementy:**

- `<Dialog>` z Shadcn/ui
- `<DialogHeader>` z tytułem "Dodaj produkt"
- `<DialogContent>` z formularzem:
  - `<ProductAutocomplete />` - wybór produktu
  - `<div>` flex row: `<Input>` ilość + `<UnitSelect />` jednostka
  - `<DatePicker>` data ważności (opcjonalna)
- `<DialogFooter>` z przyciskami:
  - `<Button variant="secondary">` "Anuluj"
  - `<Button variant="primary">` "Dodaj produkt"
- Checkbox "Dodaj kolejny produkt"

**Obsługiwane zdarzenia:**

- Wybór produktu z autocomplete: ustaw product_id
- Kliknięcie "+ Dodaj nowy produkt" w autocomplete: otwórz inline form tworzenia produktu
- Zmiana ilości: waliduj i ustaw wartość
- Wybór jednostki: ustaw unit_id
- Wybór daty: waliduj i ustaw expiry_date
- Submit formularza: wywołaj POST API, po sukcesie zamknij lub wyczyść (zależnie od checkbox)
- Kliknięcie "Anuluj": zamknij modal

**Warunki walidacji:**

- `product_id` (required): musi być wybrany produkt
- `quantity` (required): musi być >= 0, number
- `unit_id` (required): musi być wybrana jednostka
- `expiry_date` (optional): musi być w formacie ISO (YYYY-MM-DD), może być w przeszłości (warning, ale nie błąd)

**Typy:**

- `AddProductModalProps` (interfejs)
- `CreateFridgeItemDTO` (z types.ts)
- `ProductDTO` (dla autocomplete)
- `UnitDTO` (dla select)

**Propsy:**

```typescript
interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (addAnother: boolean) => void; // addAnother z checkboxa
}
```

---

### 4.11 EditProductModal

**Opis:** Modal dialog do edycji istniejącego produktu w lodówce. Podobny do AddProductModal, ale bez możliwości zmiany produktu (tylko ilość, jednostka, data).

**Główne elementy:**

- `<Dialog>` z Shadcn/ui
- `<DialogHeader>` z tytułem "Edytuj produkt"
- `<DialogContent>` z formularzem:
  - `<div>` read-only display nazwy produktu
  - `<div>` flex row: `<Input>` ilość + `<UnitSelect />` jednostka
  - `<DatePicker>` data ważności (opcjonalna, z przyciskiem "Usuń datę")
- `<DialogFooter>` z przyciskami:
  - `<Button variant="secondary">` "Anuluj"
  - `<Button variant="primary">` "Zapisz zmiany"

**Obsługiwane zdarzenia:**

- Zmiana ilości: waliduj i ustaw wartość
- Wybór jednostki: ustaw unit_id
- Wybór daty: waliduj i ustaw expiry_date
- Kliknięcie "Usuń datę": ustaw expiry_date na null
- Submit formularza: wywołaj PATCH API, po sukcesie zamknij
- Kliknięcie "Anuluj": zamknij modal

**Warunki walidacji:**

- Przynajmniej jedno pole musi być zmienione (API requirement)
- `quantity` (optional): jeśli podana, musi być >= 0
- `unit_id` (optional): jeśli podana, musi istnieć
- `expiry_date` (optional): jeśli podana, musi być w formacie ISO (YYYY-MM-DD)

**Typy:**

- `EditProductModalProps` (interfejs)
- `UpdateFridgeItemDTO` (z types.ts)
- `FridgeItemDTO` (dla initial values)

**Propsy:**

```typescript
interface EditProductModalProps {
  isOpen: boolean;
  item: FridgeItemDTO | null;
  onClose: () => void;
  onSuccess: () => void;
}
```

---

### 4.12 ProductAutocomplete

**Opis:** Autocomplete/combobox do wyszukiwania i wyboru produktu z możliwością dodania nowego.

**Główne elementy:**

- `<Combobox>` z Shadcn/ui lub custom implementation
- `<Input>` do wpisywania query
- `<Popover>` z listą wyników
- `<CommandList>` z wynikami wyszukiwania
- Opcja "+ Dodaj nowy produkt [nazwa]" na dole listy
- Inline form tworzenia produktu (conditional)

**Obsługiwane zdarzenia:**

- onChange input: debounced fetch z GET /api/products?search=...&scope=all
- Wybór produktu z listy: wywołaj callback z ProductDTO
- Kliknięcie "+ Dodaj nowy": pokaż inline form
- Submit inline form: POST /api/products, dodaj do listy, wybierz automatycznie

**Warunki walidacji:**

- Query: dowolny string
- Nazwa nowego produktu: min 1 znak, max zgodnie z API

**Typy:**

- `ProductAutocompleteProps` (interfejs)
- `ProductDTO` (z types.ts)

**Propsy:**

```typescript
interface ProductAutocompleteProps {
  value: ProductDTO | null;
  onChange: (product: ProductDTO | null) => void;
  error?: string;
}
```

---

### 4.13 UnitSelect

**Opis:** Dropdown do wyboru jednostki miary.

**Główne elementy:**

- `<Select>` z Shadcn/ui
- Lista jednostek z `units.name` i `units.abbreviation`

**Obsługiwane zdarzenia:**

- Zmiana wartości: wywołaj callback z unit_id

**Warunki walidacji:**

- Wartość musi być z listy dostępnych jednostek

**Typy:**

- `UnitSelectProps` (interfejs)
- `UnitDTO` (z types.ts)

**Propsy:**

```typescript
interface UnitSelectProps {
  value: number | null;
  onChange: (unitId: number) => void;
  units: UnitDTO[];
  error?: string;
}
```

---

### 4.14 ConfirmDialog

**Opis:** Dialog potwierdzenia usunięcia produktu.

**Główne elementy:**

- `<AlertDialog>` z Shadcn/ui
- Tytuł "Usunąć produkt?"
- Opis "Czy na pewno chcesz usunąć [nazwa produktu]? Ta operacja jest nieodwracalna."
- Przyciski:
  - `<Button variant="secondary">` "Anuluj"
  - `<Button variant="destructive">` "Usuń"

**Obsługiwane zdarzenia:**

- Kliknięcie "Usuń": wywołaj callback onConfirm
- Kliknięcie "Anuluj": wywołaj callback onCancel

**Warunki walidacji:**

- Brak

**Typy:**

- `ConfirmDialogProps` (interfejs)

**Propsy:**

```typescript
interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

## 5. Typy

### 5.1 Typy z types.ts (istniejące)

```typescript
// Używane bezpośrednio z types.ts:
FridgeItemDTO;
FridgeListResponseDTO;
ListFridgeQueryDTO;
CreateFridgeItemDTO;
UpdateFridgeItemDTO;
ProductDTO;
UnitDTO;
PaginationMetaDTO;
ProductReferenceDTO;
UnitReferenceDTO;
```

### 5.2 Nowe typy ViewModel

```typescript
/**
 * Stan głównego widoku lodówki
 */
interface FridgeViewState {
  // Dane
  items: FridgeItemDTO[];
  pagination: PaginationMetaDTO;

  // Filtrowanie i sortowanie
  searchQuery: string;
  sortBy: "name" | "quantity" | "expiry_date" | "created_at";
  sortOrder: "asc" | "desc";
  expiredFilter: "yes" | "no" | "all";
  expiringSoonDays: number | undefined;

  // UI state
  isLoading: boolean;
  error: string | null;

  // Modals
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  editingItem: FridgeItemDTO | null;

  // Confirm dialog
  isConfirmDialogOpen: boolean;
  deletingItemId: number | null;
  deletingItemName: string | null;

  // Stats
  stats: {
    totalCount: number;
    expiredCount: number;
  };
}

/**
 * Status daty ważności produktu
 */
type ExpiryStatus = "expired" | "expiring-soon" | "fresh" | "no-expiry";

/**
 * Pole sortowania
 */
type SortField = "name" | "quantity" | "expiry_date" | "created_at";

/**
 * Stan formularza dodawania produktu
 */
interface AddProductFormState {
  product: ProductDTO | null;
  quantity: number | null;
  unit: UnitDTO | null;
  expiryDate: string | null;
  addAnother: boolean;

  // Validation errors
  errors: {
    product?: string;
    quantity?: string;
    unit?: string;
    expiryDate?: string;
  };
}

/**
 * Stan formularza edycji produktu
 */
interface EditProductFormState {
  quantity: number | null;
  unit: UnitDTO | null;
  expiryDate: string | null;

  // Validation errors
  errors: {
    quantity?: string;
    unit?: string;
    expiryDate?: string;
  };
}

/**
 * Opcje autocomplete produktów
 */
interface ProductAutocompleteState {
  query: string;
  results: ProductDTO[];
  isLoading: boolean;
  showCreateForm: boolean;
  newProductName: string;
}
```

### 5.3 Utility types

```typescript
/**
 * Helper do obliczania statusu daty ważności
 */
function getExpiryStatus(expiryDate: string | null): ExpiryStatus {
  if (!expiryDate) return "no-expiry";

  const today = new Date();
  const expiry = new Date(expiryDate);
  const diffDays = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "expired";
  if (diffDays <= 3) return "expiring-soon";
  return "fresh";
}

/**
 * Mapowanie statusu na klasy CSS/variant
 */
const EXPIRY_STATUS_CONFIG: Record<ExpiryStatus, { variant: string; color: string; label: string }> = {
  expired: { variant: "destructive", color: "text-red-600", label: "Przeterminowany" },
  "expiring-soon": { variant: "warning", color: "text-orange-600", label: "Wkrótce przeterminowany" },
  fresh: { variant: "success", color: "text-green-600", label: "Świeży" },
  "no-expiry": { variant: "secondary", color: "text-gray-600", label: "Brak daty" },
};
```

## 6. Zarządzanie stanem

### 6.1 Custom Hook: useFridge

Główny hook zarządzający stanem widoku lodówki.

```typescript
/**
 * Custom hook zarządzający stanem i logiką widoku lodówki
 */
function useFridge() {
  // State
  const [state, setState] = useState<FridgeViewState>({
    items: [],
    pagination: { page: 1, limit: 20, total: 0, total_pages: 0 },
    searchQuery: "",
    sortBy: "created_at",
    sortOrder: "desc",
    expiredFilter: "all",
    expiringSoonDays: undefined,
    isLoading: false,
    error: null,
    isAddModalOpen: false,
    isEditModalOpen: false,
    editingItem: null,
    isConfirmDialogOpen: false,
    deletingItemId: null,
    deletingItemName: null,
    stats: { totalCount: 0, expiredCount: 0 },
  });

  // Fetch items
  const fetchItems = useCallback(
    async (params?: Partial<ListFridgeQueryDTO>) => {
      setState((prev) => ({ ...prev, isLoading: true, error: null }));

      try {
        const queryParams = new URLSearchParams({
          page: String(params?.page ?? state.pagination.page),
          limit: String(params?.limit ?? state.pagination.limit),
          sort: params?.sort ?? state.sortBy,
          order: params?.order ?? state.sortOrder,
          expired: params?.expired ?? state.expiredFilter,
          ...(state.searchQuery && { search: state.searchQuery }),
          ...(state.expiringSoonDays && { expiring_soon: String(state.expiringSoonDays) }),
        });

        const response = await fetch(`/api/fridge?${queryParams}`);
        if (!response.ok) throw new Error("Failed to fetch items");

        const data: FridgeListResponseDTO = await response.json();

        setState((prev) => ({
          ...prev,
          items: data.data,
          pagination: data.pagination,
          stats: {
            totalCount: data.pagination.total,
            expiredCount: data.data.filter((item) => item.expiry_date && new Date(item.expiry_date) < new Date())
              .length,
          },
          isLoading: false,
        }));
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isLoading: false,
          error: "Nie udało się pobrać produktów",
        }));
      }
    },
    [
      state.pagination.page,
      state.sortBy,
      state.sortOrder,
      state.searchQuery,
      state.expiredFilter,
      state.expiringSoonDays,
    ]
  );

  // Initial fetch
  useEffect(() => {
    fetchItems();
  }, []);

  // Handlers
  const handleSearchChange = useDebouncedCallback((query: string) => {
    setState((prev) => ({ ...prev, searchQuery: query, pagination: { ...prev.pagination, page: 1 } }));
    fetchItems({ search: query, page: 1 });
  }, 300);

  const handleSortChange = (sortBy: SortField, order: "asc" | "desc") => {
    setState((prev) => ({ ...prev, sortBy, sortOrder: order }));
    fetchItems({ sort: sortBy, order });
  };

  const handlePageChange = (page: number) => {
    fetchItems({ page });
  };

  const openAddModal = () => setState((prev) => ({ ...prev, isAddModalOpen: true }));
  const closeAddModal = () => setState((prev) => ({ ...prev, isAddModalOpen: false }));

  const openEditModal = (item: FridgeItemDTO) => {
    setState((prev) => ({ ...prev, isEditModalOpen: true, editingItem: item }));
  };
  const closeEditModal = () => {
    setState((prev) => ({ ...prev, isEditModalOpen: false, editingItem: null }));
  };

  const openDeleteConfirm = (itemId: number, itemName: string) => {
    setState((prev) => ({
      ...prev,
      isConfirmDialogOpen: true,
      deletingItemId: itemId,
      deletingItemName: itemName,
    }));
  };
  const closeDeleteConfirm = () => {
    setState((prev) => ({
      ...prev,
      isConfirmDialogOpen: false,
      deletingItemId: null,
      deletingItemName: null,
    }));
  };

  const handleAddSuccess = async (addAnother: boolean) => {
    await fetchItems();
    if (!addAnother) closeAddModal();
  };

  const handleEditSuccess = async () => {
    await fetchItems();
    closeEditModal();
  };

  const handleDeleteConfirm = async () => {
    if (!state.deletingItemId) return;

    try {
      const response = await fetch(`/api/fridge/${state.deletingItemId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete item");

      await fetchItems();
      closeDeleteConfirm();
    } catch (error) {
      // Pokaż toast z błędem
    }
  };

  return {
    state,
    handlers: {
      handleSearchChange,
      handleSortChange,
      handlePageChange,
      openAddModal,
      closeAddModal,
      openEditModal,
      closeEditModal,
      openDeleteConfirm,
      closeDeleteConfirm,
      handleAddSuccess,
      handleEditSuccess,
      handleDeleteConfirm,
    },
  };
}
```

### 6.2 Dodatkowe hooki

```typescript
/**
 * Hook do obsługi autocomplete produktów
 */
function useProductAutocomplete() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchProducts = useDebouncedCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        search: searchQuery,
        scope: "all",
        limit: "10",
      });

      const response = await fetch(`/api/products?${params}`);
      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();
      setResults(data.data);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  useEffect(() => {
    fetchProducts(query);
  }, [query]);

  return { query, setQuery, results, isLoading };
}

/**
 * Hook do pobierania listy jednostek
 */
function useUnits() {
  const [units, setUnits] = useState<UnitDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUnits() {
      try {
        const response = await fetch("/api/units");
        if (!response.ok) throw new Error("Failed to fetch units");

        const data = await response.json();
        setUnits(data.data);
      } catch (error) {
        console.error("Failed to fetch units:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUnits();
  }, []);

  return { units, isLoading };
}
```

## 7. Integracja API

### 7.1 Endpointy i typy

**GET /api/fridge - Lista produktów w lodówce**

Request:

- Query params: `ListFridgeQueryDTO`
  - `expired?: 'yes' | 'no' | 'all'` (default: 'all')
  - `expiring_soon?: number` (dni do przeterminowania)
  - `search?: string` (wyszukiwanie w nazwie produktu)
  - `sort?: 'name' | 'quantity' | 'expiry_date' | 'created_at'` (default: 'created_at')
  - `order?: 'asc' | 'desc'` (default: 'desc')
  - `page?: number` (default: 1)
  - `limit?: number` (default: 20, max: 100)

Response: `FridgeListResponseDTO`

```typescript
{
  data: FridgeItemDTO[];
  pagination: PaginationMetaDTO;
}
```

---

**POST /api/fridge - Dodaj produkt do lodówki**

Request:

- Body: `CreateFridgeItemDTO`

```typescript
{
  product_id: number;
  quantity: number;
  unit_id: number;
  expiry_date?: string | null; // ISO format YYYY-MM-DD
}
```

Response: `FridgeItemDTO` (201 Created)

- Header `Location`: `/api/fridge/{id}`

---

**PATCH /api/fridge/:id - Edytuj produkt w lodówce**

Request:

- URL param: `id` (number)
- Body: `UpdateFridgeItemDTO`

```typescript
{
  quantity?: number;
  unit_id?: number;
  expiry_date?: string | null;
}
```

Response: `FridgeItemDTO` (200 OK)

Uwaga: Przynajmniej jedno pole musi być podane.

---

**DELETE /api/fridge/:id - Usuń produkt z lodówki**

Request:

- URL param: `id` (number)

Response: 204 No Content

---

**GET /api/products - Lista produktów (dla autocomplete)**

Request:

- Query params:
  - `search?: string`
  - `scope?: 'global' | 'private' | 'all'` (default: 'all')
  - `page?: number`
  - `limit?: number`

Response: `ProductsListResponseDTO`

---

**POST /api/products - Utwórz nowy produkt (z autocomplete)**

Request:

- Body: `CreateProductDTO`

```typescript
{
  name: string;
}
```

Response: `ProductDTO` (201 Created)

---

**GET /api/units - Lista jednostek**

Request: brak parametrów

Response: `UnitsListResponseDTO`

```typescript
{
  data: UnitDTO[];
}
```

### 7.2 Obsługa błędów API

Wszystkie endpointy mogą zwrócić następujące kody błędów:

- `400 Bad Request` - nieprawidłowe dane wejściowe
- `401 Unauthorized` - brak autoryzacji (gdy auth będzie aktywny)
- `404 Not Found` - zasób nie istnieje
- `422 Unprocessable Entity` - błąd walidacji
- `500 Internal Server Error` - błąd serwera

Format odpowiedzi błędu:

```typescript
{
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  }
}
```

## 8. Interakcje użytkownika

### 8.1 Przeglądanie listy produktów

**Flow:**

1. Użytkownik wchodzi na `/fridge`
2. Aplikacja automatycznie pobiera listę produktów (GET /api/fridge)
3. Wyświetlane są produkty z color coding daty ważności
4. Na górze widoczne są statystyki (łączna liczba, przeterminowane)

**Obsługa:**

- Loading state: skeleton/spinner podczas ładowania
- Empty state: gdy lista pusta, wyświetl EmptyState
- Error state: toast z błędem + przycisk "Spróbuj ponownie"

---

### 8.2 Wyszukiwanie produktu

**Flow:**

1. Użytkownik wpisuje tekst w SearchBar
2. Po 300ms debounce, aplikacja wysyła zapytanie z parametrem `search`
3. Lista odświeża się z wynikami wyszukiwania
4. Pagination resetuje się do strony 1

**Obsługa:**

- Loading indicator w SearchBar podczas wyszukiwania
- Przycisk X do czyszczenia wyszukiwania
- Brak wyników: komunikat "Nie znaleziono produktów"

---

### 8.3 Sortowanie i filtrowanie

**Flow:**

1. Użytkownik wybiera pole sortowania z dropdown
2. Użytkownik klika ikonę kierunku (asc/desc)
3. Lista odświeża się z nowymi parametrami

**Obsługa:**

- Animacja zmiany kierunku strzałki
- Highlight aktywnego pola sortowania

---

### 8.4 Dodawanie produktu

**Flow:**

1. Użytkownik klika "Dodaj produkt"
2. Otwiera się AddProductModal
3. Użytkownik zaczyna wpisywać nazwę w autocomplete
4. Wyświetlają się wyniki lub opcja "+ Dodaj nowy produkt"
5. Użytkownik wybiera produkt lub tworzy nowy
6. Użytkownik wypełnia ilość i jednostkę (wymagane)
7. Opcjonalnie wybiera datę ważności
8. Opcjonalnie zaznacza "Dodaj kolejny produkt"
9. Klika "Dodaj produkt"
10. Walidacja frontendowa
11. Jeśli OK: POST /api/fridge
12. Jeśli sukces:
    - Toast "Produkt dodany pomyślnie"
    - Odświeżenie listy
    - Zamknięcie modala (jeśli nie zaznaczono "Dodaj kolejny")
    - Lub wyczyszczenie formularza (jeśli zaznaczono)

**Obsługa błędów:**

- Inline validation: pokazuj błędy pod polami
- API errors: toast + highlight pól z błędami
- Network errors: toast + możliwość retry

---

### 8.5 Edycja produktu

**Flow:**

1. Użytkownik klika ikonę "Edytuj" przy produkcie
2. Otwiera się EditProductModal z prefilowanymi wartościami
3. Nazwa produktu jest tylko do odczytu
4. Użytkownik zmienia ilość, jednostkę lub datę ważności
5. Klika "Zapisz zmiany"
6. Walidacja frontendowa (przynajmniej jedno pole zmienione)
7. Jeśli OK: PATCH /api/fridge/:id
8. Jeśli sukces:
   - Toast "Produkt zaktualizowany pomyślnie"
   - Odświeżenie listy
   - Zamknięcie modala

**Obsługa błędów:**

- Inline validation
- API errors: toast + highlight pól
- Brak zmian: pokazuj tooltip "Wprowadź zmiany"

---

### 8.6 Usuwanie produktu

**Flow:**

1. Użytkownik klika ikonę "Usuń" przy produkcie
2. Otwiera się ConfirmDialog z nazwą produktu
3. Użytkownik klika "Usuń" (lub "Anuluj")
4. Jeśli "Usuń": DELETE /api/fridge/:id
5. Jeśli sukces:
   - Toast "Produkt usunięty pomyślnie"
   - Odświeżenie listy
   - Zamknięcie dialogu

**Obsługa błędów:**

- API errors: toast + możliwość retry
- 404: toast "Produkt już nie istnieje" + zamknij dialog + refetch

---

### 8.7 Paginacja

**Flow:**

1. Użytkownik klika numer strony lub Następna/Poprzednia
2. Aplikacja wysyła zapytanie z nowym parametrem `page`
3. Lista odświeża się z produktami z nowej strony
4. Scroll wraca na górę

**Obsługa:**

- Loading state podczas ładowania nowej strony
- Disabled state dla przycisków gdy nie ma więcej stron

---

### 8.8 Tworzenie produktu z autocomplete

**Flow:**

1. W AddProductModal, użytkownik wpisuje nazwę nieistniejącego produktu
2. W wynikach pojawia się "+ Dodaj nowy produkt [nazwa]"
3. Użytkownik klika tę opcję
4. Pokazuje się inline form z polem nazwy (prefilowane)
5. Użytkownik zatwierdza
6. POST /api/products
7. Jeśli sukces:
   - Nowy produkt pojawia się w autocomplete
   - Automatycznie zostaje wybrany
   - Toast "Produkt utworzony"

**Obsługa błędów:**

- API errors: inline error message
- Duplikat: "Produkt już istnieje" + zaznacz istniejący

## 9. Warunki i walidacja

### 9.1 Walidacja w AddProductModal

**Komponent:** AddProductModal

**Pole: product (ProductAutocomplete)**

- **Warunek:** Wymagane
- **Walidacja:** Musi być wybrane przed submitem
- **Komunikat błędu:** "Wybierz produkt z listy"
- **Moment walidacji:** Po kliknięciu "Dodaj produkt"
- **Wpływ na UI:** Czerwona obwódka autocomplete + komunikat pod polem

**Pole: quantity**

- **Warunek:** Wymagane, >= 0
- **Walidacja:**
  - Nie może być puste
  - Musi być liczbą
  - Musi być >= 0
- **Komunikaty błędów:**
  - "Ilość jest wymagana"
  - "Ilość musi być liczbą"
  - "Ilość nie może być ujemna"
- **Moment walidacji:** onChange (na bieżąco) + onBlur + submit
- **Wpływ na UI:** Czerwona obwódka + komunikat pod polem + disabled przycisk submit

**Pole: unit (UnitSelect)**

- **Warunek:** Wymagane
- **Walidacja:** Musi być wybrane z listy
- **Komunikat błędu:** "Wybierz jednostkę"
- **Moment walidacji:** Po kliknięciu "Dodaj produkt"
- **Wpływ na UI:** Czerwona obwódka select + komunikat pod polem

**Pole: expiry_date (DatePicker)**

- **Warunek:** Opcjonalne
- **Walidacja:**
  - Jeśli podane, musi być w formacie YYYY-MM-DD
  - Data w przeszłości: warning (nie błąd)
- **Komunikaty:**
  - "Nieprawidłowy format daty" (error)
  - "Data w przeszłości - produkt może być już przeterminowany" (warning, żółty)
- **Moment walidacji:** onBlur + submit
- **Wpływ na UI:** Żółta/pomarańczowa obwódka dla warning, czerwona dla error

---

### 9.2 Walidacja w EditProductModal

**Komponent:** EditProductModal

**Warunek globalny:**

- **Przynajmniej jedno pole musi być zmienione**
- **Walidacja:** Porównanie z initial values
- **Komunikat:** "Wprowadź przynajmniej jedną zmianę"
- **Moment walidacji:** Po kliknięciu "Zapisz zmiany"
- **Wpływ na UI:** Disabled przycisk submit gdy brak zmian + tooltip

**Pole: quantity**

- **Warunek:** Opcjonalne, >= 0
- **Walidacja:** Jeśli zmienione, musi być >= 0
- **Komunikat:** "Ilość nie może być ujemna"
- **Moment walidacji:** onChange + onBlur
- **Wpływ na UI:** Czerwona obwódka + komunikat

**Pole: unit**

- **Warunek:** Opcjonalne
- **Walidacja:** Jeśli zmienione, musi być z listy
- **Wpływ na UI:** Brak (select gwarantuje poprawną wartość)

**Pole: expiry_date**

- **Warunek:** Opcjonalne
- **Walidacja:** Jak w AddProductModal
- **Wpływ na UI:** Jak w AddProductModal

---

### 9.3 Walidacja API-side

Wszystkie walidacje są również wykonywane po stronie API. Frontend powinien:

1. Wykonać walidację przed wysłaniem requestu
2. Obsłużyć błędy walidacji z API (422)
3. Wyświetlić błędy z API w odpowiednich polach

**Mapowanie błędów API na pola:**

```typescript
// Przykład odpowiedzi błędu API:
{
  error: {
    code: "VALIDATION_ERROR",
    message: "Invalid request body",
    details: {
      quantity: ["quantity must be greater than or equal to 0"],
      product_id: ["product_id must be a positive integer"]
    }
  }
}

// Mapowanie na stan formularza:
errors: {
  quantity: "quantity must be greater than or equal to 0",
  product: "product_id must be a positive integer"
}
```

---

### 9.4 Walidacja SearchBar

**Komponent:** SearchBar

**Warunek:** Dowolny tekst

- **Walidacja:** Brak (wszystkie wartości akceptowalne)
- **Optymalizacja:** Debouncing 300ms
- **Wpływ na UI:** Loading indicator podczas wyszukiwania

---

### 9.5 Walidacja ProductAutocomplete (tworzenie nowego produktu)

**Komponent:** ProductAutocomplete (inline form)

**Pole: name**

- **Warunek:** Wymagane, min 1 znak
- **Walidacja:**
  - Nie może być puste
  - Min 1 znak, max zgodnie z API (prawdopodobnie 255)
- **Komunikaty:**
  - "Nazwa jest wymagana"
  - "Nazwa jest za długa"
- **Moment walidacji:** onBlur + submit
- **Wpływ na UI:** Czerwona obwódka + komunikat + disabled przycisk submit

## 10. Obsługa błędów

### 10.1 Błędy sieciowe

**Scenariusz:** Brak połączenia z internetem lub serwer nie odpowiada

**Obsługa:**

- Toast z komunikatem: "Błąd połączenia. Sprawdź połączenie z internetem."
- Przycisk "Spróbuj ponownie" w toast
- Opcjonalnie: Offline indicator w UI

**Komponenty dotknięte:** Wszystkie wywołania API

---

### 10.2 Błędy 404 Not Found

**Scenariusz:** Produkt/jednostka nie istnieje lub został usunięty

**Obsługa:**

- Toast z komunikatem: "Zasób nie został znaleziony"
- Automatyczne odświeżenie listy (może być już nieaktualny)
- Zamknięcie otwartego modala

**Komponenty dotknięte:**

- EditProductModal (produkt usunięty w międzyczasie)
- DeleteConfirm (produkt już usunięty)

---

### 10.3 Błędy 422 Validation Error

**Scenariusz:** Dane nie przeszły walidacji po stronie API

**Obsługa:**

- Mapowanie błędów API na pola formularza
- Wyświetlenie inline errors pod odpowiednimi polami
- Toast z ogólnym komunikatem: "Popraw błędy w formularzu"
- Focus na pierwsze pole z błędem

**Komponenty dotknięte:**

- AddProductModal
- EditProductModal

---

### 10.4 Błędy 500 Internal Server Error

**Scenariusz:** Błąd po stronie serwera

**Obsługa:**

- Toast z komunikatem: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Przycisk "Spróbuj ponownie"
- Logowanie błędu do console (dla developmentu)

**Komponenty dotknięte:** Wszystkie wywołania API

---

### 10.5 Błędy podczas ładowania danych

**Scenariusz:** Błąd podczas pobierania listy produktów/jednostek

**Obsługa:**

- Error state w FridgeView
- Placeholder z komunikatem błędu
- Przycisk "Spróbuj ponownie"
- Ilustracja błędu (opcjonalnie)

**Komponenty dotknięte:**

- FridgeView (główna lista)
- UnitSelect (ładowanie jednostek)

---

### 10.6 Pusta lista jednostek

**Scenariusz:** Endpoint `/api/units` zwraca pustą listę (seed nie wykonany)

**Obsługa:**

- Komunikat w UnitSelect: "Brak dostępnych jednostek"
- Toast z błędem: "Nie można załadować jednostek. Skontaktuj się z administratorem."
- Disabled AddProductModal

**Komponenty dotknięte:**

- AddProductModal
- EditProductModal
- UnitSelect

---

### 10.7 Timeout requestu

**Scenariusz:** Request trwa zbyt długo

**Obsługa:**

- Timeout po 30 sekundach
- Toast: "Operacja trwa zbyt długo. Spróbuj ponownie."
- Anulowanie requestu (AbortController)

**Komponenty dotknięte:** Wszystkie długotrwałe operacje

---

### 10.8 Błędy podczas usuwania

**Scenariusz:** Błąd podczas DELETE

**Obsługa:**

- Toast z komunikatem błędu
- Dialog pozostaje otwarty
- Przycisk "Spróbuj ponownie" w dialogu

**Komponenty dotknięte:** ConfirmDialog

---

### 10.9 Concurrent modification

**Scenariusz:** Użytkownik edytuje produkt, który został zmieniony/usunięty przez inny proces

**Obsługa:**

- 404 z API
- Toast: "Produkt został zmieniony lub usunięty. Odświeżam listę."
- Automatyczne zamknięcie modala
- Refetch listy

**Komponenty dotknięte:** EditProductModal

## 11. Kroki implementacji

### Krok 1: Setup projektu i struktura plików

1. Utwórz plik `src/pages/fridge.astro` z podstawowym layoutem
2. Utwórz folder `src/components/fridge/` dla wszystkich komponentów widoku
3. Utwórz plik `src/components/fridge/FridgeView.tsx` - główny komponent React
4. Dodaj niezbędne importy Shadcn/ui komponentów (Dialog, Button, Input, Select, Badge, etc.)

### Krok 2: Implementacja typów i utility functions

1. W `src/types.ts` dodaj nowe typy ViewModel (jeśli nie istnieją):
   - `FridgeViewState`
   - `ExpiryStatus`
   - `AddProductFormState`
   - `EditProductFormState`
   - `ProductAutocompleteState`
2. Utwórz `src/lib/utils/expiry-status.ts` z funkcją `getExpiryStatus()` i konfiguracją `EXPIRY_STATUS_CONFIG`
3. Utwórz `src/lib/utils/form-validation.ts` z funkcjami walidacji dla formularzy

### Krok 3: Implementacja custom hooks

1. Utwórz `src/components/fridge/hooks/useFridge.ts`:
   - Zaimplementuj podstawowy state
   - Dodaj funkcję `fetchItems()`
   - Dodaj handlery dla search, sort, pagination
   - Dodaj handlery dla modali
2. Utwórz `src/components/fridge/hooks/useProductAutocomplete.ts`
3. Utwórz `src/components/fridge/hooks/useUnits.ts`

### Krok 4: Implementacja podstawowych komponentów prezentacyjnych

1. `ExpiryDateBadge.tsx`:
   - Przyjmij `expiryDate` jako prop
   - Oblicz status używając `getExpiryStatus()`
   - Zastosuj odpowiedni variant Badge
2. `EmptyState.tsx`:
   - Statyczny komponent z ilustracją, tekstem i przyciskiem
3. `FridgeStats.tsx`:
   - Wyświetl dwie karty ze statystykami

### Krok 5: Implementacja SearchBar i SortDropdown

1. `SearchBar.tsx`:
   - Input z Shadcn/ui
   - Implementuj debouncing (useDebouncedCallback)
   - Przycisk clear
   - Loading indicator
2. `SortDropdown.tsx`:
   - Select dla pola sortowania
   - Button toggle dla kierunku
   - Ikona strzałki (animowana)

### Krok 6: Implementacja FridgeToolbar

1. `FridgeToolbar.tsx`:
   - Flex container
   - Osadź SearchBar i SortDropdown
   - Przycisk "Dodaj produkt"
   - Responsive layout (mobile: column, desktop: row)

### Krok 7: Implementacja FridgeItem i FridgeList

1. `FridgeItem.tsx`:
   - Layout z informacjami produktu
   - ExpiryDateBadge
   - Quick actions (edytuj, usuń)
   - Aria-labels dla accessibility
2. `FridgeList.tsx`:
   - `<ul>` semantic list
   - Mapowanie items do FridgeItem
   - Conditional rendering: EmptyState gdy pusta lista
   - Pagination z Shadcn/ui

### Krok 8: Implementacja ProductAutocomplete

1. `ProductAutocomplete.tsx`:
   - Użyj Combobox z Shadcn/ui lub Radix
   - Zintegruj hook `useProductAutocomplete`
   - Implementuj listę wyników
   - Dodaj opcję "+ Dodaj nowy produkt"
   - Inline form tworzenia produktu (conditional)
   - Obsługa POST /api/products

### Krok 9: Implementacja UnitSelect

1. `UnitSelect.tsx`:
   - Select z Shadcn/ui
   - Załaduj jednostki używając `useUnits`
   - Format wyświetlania: "name (abbreviation)"
   - Loading state

### Krok 10: Implementacja AddProductModal

1. `AddProductModal.tsx`:
   - Dialog z Shadcn/ui
   - Form z polami:
     - ProductAutocomplete
     - Quantity input
     - UnitSelect
     - DatePicker (opcjonalny)
     - Checkbox "Dodaj kolejny"
   - Walidacja inline i on-submit
   - Obsługa POST /api/fridge
   - Loading state podczas submitu
   - Error handling

### Krok 11: Implementacja EditProductModal

1. `EditProductModal.tsx`:
   - Podobna struktura do AddProductModal
   - Read-only display nazwy produktu
   - Prefilowane wartości z `item` prop
   - Sprawdzenie czy coś się zmieniło (disabled submit)
   - Obsługa PATCH /api/fridge/:id
   - Error handling

### Krok 12: Implementacja ConfirmDialog

1. `ConfirmDialog.tsx`:
   - AlertDialog z Shadcn/ui
   - Wyświetl nazwę produktu do usunięcia
   - Destructive button "Usuń"
   - Secondary button "Anuluj"

### Krok 13: Integracja FridgeView

1. `FridgeView.tsx`:
   - Użyj hook `useFridge()`
   - Osadź wszystkie podkomponenty
   - Przekaż odpowiednie propsy
   - Obsługa loading state (skeleton)
   - Obsługa error state
   - Toast notifications (Shadcn/ui Toaster)

### Krok 14: Implementacja strony Astro

1. `src/pages/fridge.astro`:
   - Użyj Layout
   - Osadź FridgeView z `client:load`
   - Meta tags (title, description)
   - Opcjonalnie: SSR preload dla units (optymalizacja)

### Krok 15: Stylowanie i responsywność

1. Dodaj Tailwind classes dla layoutu
2. Zaimplementuj responsive breakpoints:
   - Mobile: stacked layout, bottom sheet dla modali
   - Tablet/Desktop: side-by-side, center modals
3. Dodaj animacje:
   - Slide-in dla modali
   - Fade dla toast
   - Smooth scroll
4. Dark mode support (jeśli w roadmap)

### Krok 16: Accessibility

1. Dodaj aria-labels dla wszystkich interaktywnych elementów
2. Focus trap w modalach
3. Keyboard navigation:
   - Tab order
   - Enter dla submit
   - Escape dla zamknięcia modali
4. Screen reader announcements dla zmian stanu
5. Skip links (jeśli potrzebne)

### Krok 17: Testowanie i debugging

1. Test wszystkich ścieżek użytkownika:
   - Dodawanie produktu
   - Edycja produktu
   - Usuwanie produktu
   - Wyszukiwanie
   - Sortowanie
   - Paginacja
   - Tworzenie nowego produktu z autocomplete
2. Test edge cases:
   - Pusta lodówka
   - Brak jednostek
   - Network errors
   - Concurrent modifications
3. Test walidacji wszystkich pól
4. Test accessibility (keyboard, screen reader)
5. Test na różnych rozmiarach ekranu

### Krok 18: Optymalizacje wydajności

1. Memoizacja komponentów (React.memo gdzie potrzeba)
2. useMemo dla ciężkich obliczeń (np. filtrowanie expiredCount)
3. useCallback dla funkcji przekazywanych jako propsy
4. Lazy loading dla modali (dynamiczny import)
5. Debouncing dla search i autocomplete
6. Optimistic updates (opcjonalnie)

### Krok 19: Dokumentacja

1. Dodaj JSDoc comments do wszystkich komponentów
2. Dodaj README w folderze `src/components/fridge/` z:
   - Opisem struktury
   - Diagramem przepływu danych
   - Przykładami użycia
3. Dodaj komentarze do złożonych funkcji

### Krok 20: Code review i refactoring

1. Przejrzyj kod pod kątem:
   - DRY (Don't Repeat Yourself)
   - Spójności nazewnictwa
   - Proper error handling
   - Type safety
2. Refaktoruj długie komponenty/funkcje
3. Wydziel reusable logic do custom hooks
4. Sprawdź linter errors

---

## Podsumowanie

Plan implementacji pokrywa wszystkie aspekty widoku Lodówki zgodnie z PRD (US-002), opisem z ui-plan.md oraz implementacją API. Kluczowe punkty:

- **Modularność:** Każdy komponent ma jasno określoną odpowiedzialność
- **Type safety:** Wszystkie typy są zdefiniowane i używane konsekwentnie
- **Accessibility:** Semantic HTML, ARIA, keyboard navigation
- **UX:** Debouncing, loading states, error handling, toast notifications
- **Walidacja:** Inline i server-side, z jasnym feedbackiem dla użytkownika
- **Responsywność:** Mobile-first approach z breakpoints
- **Wydajność:** Memoization, debouncing, lazy loading

Implementacja powinna zająć około 3-5 dni dla doświadczonego frontend developera, z dodatkowym czasem na testowanie i optymalizacje.
