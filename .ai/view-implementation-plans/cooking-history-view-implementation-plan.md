# Plan implementacji widoku Historia Gotowania

## 1. Przegląd

Widok Historia Gotowania to komponent aplikacji Foodnager, który umożliwia użytkownikom przeglądanie chronologicznej historii przepisów, które zostały ugotowane. Widok prezentuje każde zdarzenie gotowania wraz z datą, czasem, użytymi przepisami oraz szczegółowymi informacjami o stanie lodówki przed i po gotowaniu. Użytkownik może przeglądać szczegóły historycznych wpisów, nawigować do przepisów i ponownie je gotować.

Widok realizuje User Story US-007 (Przeglądanie historii gotowania) z PRD oraz zapewnia transparentny audyt zmian w lodówce, co jest kluczowe dla zaufania użytkownika do aplikacji.

## 2. Routing widoku

- **Ścieżka:** `/history`
- **Plik:** `src/pages/history.astro`
- **Typ:** Strona Astro z zagnieżdżonymi React islands dla interaktywności
- **Wymagane uprawnienia:** Użytkownik musi być zalogowany (Bearer token)

## 3. Struktura komponentów

```
history.astro (Astro page)
│
├── Layout.astro (wrapper z nawigacją)
│
└── CookingHistoryView.tsx (React island, client:load)
    │
    ├── HistoryHeader (React component)
    │   ├── PageTitle
    │   ├── HistoryStats (liczba wpisów, zakres dat)
    │   └── FilterToolbar (filtry po przepisie, dacie)
    │
    ├── HistoryTimeline (React component)
    │   └── HistoryCard[] (lista kart wydarzeń)
    │       ├── DateTimeHeader
    │       ├── RecipeLink
    │       ├── UsedIngredientsPreview
    │       ├── ExpandableDetails (toggle)
    │       │   ├── FridgeStateBefore
    │       │   └── FridgeStateAfter
    │       └── HistoryActions (Ugotuj ponownie)
    │
    ├── PaginationControls (React component)
    │
    └── EmptyState (React component)
```

## 4. Szczegóły komponentów

### 4.1 CookingHistoryView.tsx

**Opis:** Główny komponent widoku, zarządzający stanem, fetching danych, filtrowaniem oraz wyświetlaniem historii gotowania.

**Główne elementy:**
- Container (`<main>`) z layoutem flex/column
- Header z tytułem i statystykami
- Toolbar z filtrami (przepis, zakres dat)
- Timeline lista kart historii
- Paginacja
- Empty state (conditional render)

**Obsługiwane interakcje:**
- Fetch historii przy montowaniu komponentu
- Filtrowanie po przepisie (dropdown)
- Filtrowanie po zakresie dat (date range picker)
- Przechodzenie między stronami paginacji
- Rozwijanie/zwijanie szczegółów karty
- Nawigacja do szczegółów przepisu
- Nawigacja do ponownego gotowania przepisu

**Obsługiwana walidacja:**
- Brak walidacji w tym komponencie (tylko wyświetlanie)
- Walidacja zakresów dat (from_date <= to_date)

**Typy:**
- `CookingHistoryListResponseDTO` - odpowiedź API
- `CookingHistoryDTO[]` - lista wpisów historii
- `PaginationMetaDTO` - metadane paginacji
- `HistoryFilters` (custom ViewModel) - stan filtrów

**Propsy:**
- `initialData?: CookingHistoryListResponseDTO` - dane z SSR (opcjonalne)

### 4.2 HistoryHeader

**Opis:** Header widoku z tytułem strony oraz statystykami historii (liczba wpisów, zakres dat).

**Główne elementy:**
- `<header>` z flexbox layout
- Tytuł "Historia gotowania" (`<h1>`)
- Statystyki: Liczba wpisów ogółem, najnowszy/najstarszy wpis
- Opis: "Przeglądaj przepisy, które ugotowałeś"

**Obsługiwane interakcje:**
- Brak (tylko wyświetlanie)

**Obsługiwana walidacja:**
- Brak

**Typy:**
- `HistoryStats` (custom ViewModel):
  ```typescript
  {
    totalEntries: number;
    newestDate: string | null;
    oldestDate: string | null;
  }
  ```

**Propsy:**
- `stats: HistoryStats`

### 4.3 FilterToolbar

**Opis:** Toolbar z narzędziami do filtrowania historii gotowania.

**Główne elementy:**
- Container (`<div>`) z flexbox layout (wrap na mobile)
- Dropdown filtrowania po przepisie (autocomplete)
- Date range picker (od - do)
- Button "Wyczyść filtry"

**Obsługiwane interakcje:**
- Wybór przepisu z dropdown → emit `onRecipeFilterChange`
- Wybór zakresu dat → emit `onDateRangeChange`
- Click "Wyczyść filtry" → emit `onClearFilters`

**Obsługiwana walidacja:**
- from_date <= to_date
- Daty w formacie ISO (YYYY-MM-DD)

**Typy:**
- `HistoryFilters` (custom ViewModel):
  ```typescript
  {
    recipeId?: number;
    fromDate?: string; // YYYY-MM-DD
    toDate?: string;   // YYYY-MM-DD
  }
  ```

**Propsy:**
- `filters: HistoryFilters`
- `onFilterChange: (filters: HistoryFilters) => void`
- `onClearFilters: () => void`
- `availableRecipes: RecipeReferenceDTO[]` - lista przepisów do filtrowania

### 4.4 HistoryTimeline

**Opis:** Lista chronologiczna wyświetlająca karty wydarzeń gotowania.

**Główne elementy:**
- Container (`<div>`) z flexbox column layout
- HistoryCard[] - lista kart historii
- EmptyState - gdy brak historii
- LoadingState - skeleton cards podczas ładowania

**Obsługiwane interakcje:**
- Click karty → expand/collapse szczegółów
- Click tytułu przepisu → nawigacja do `/recipes/:id`
- Click "Ugotuj ponownie" → nawigacja do `/recipes/:id`

**Obsługiwana walidacja:**
- Brak

**Typy:**
- `CookingHistoryDTO[]` - lista wpisów historii

**Propsy:**
- `historyEntries: CookingHistoryDTO[]`
- `loading: boolean`
- `onRecipeClick: (id: number) => void`
- `onCookAgain: (id: number) => void`

### 4.5 HistoryCard

**Opis:** Karta pojedynczego wydarzenia gotowania z datą, czasem, przepisem, składnikami i rozwijalnymi szczegółami stanu lodówki.

**Główne elementy:**
- Card container (Shadcn Card component)
- Header z datą i czasem (format relative dla <48h, absolute dla starszych)
- Link do przepisu (tytuł przepisu)
- Mini-lista użytych składników (max 3 + "i X więcej")
- Expandable section (collapse/expand button):
  - "Stan lodówki przed" (lista produktów z ilościami)
  - "Stan lodówki po" (lista produktów z ilościami)
  - Highlight changes (produkty, które zostały zużyte)
- Footer z akcjami:
  - "Ugotuj ponownie" (primary button)

**Obsługiwane interakcje:**
- Click header lub expand button → toggle expanded state
- Click tytuł przepisu → `onRecipeClick`
- Click "Ugotuj ponownie" → `onCookAgain`
- Hover effect: subtle shadow

**Obsługiwana walidacja:**
- Brak

**Typy:**
- `CookingHistoryDTO` - dane wpisu historii
- `ExpandedState` - boolean, lokalny stan karty

**Propsy:**
- `entry: CookingHistoryDTO`
- `onRecipeClick: (id: number) => void`
- `onCookAgain: (id: number) => void`

### 4.6 DateTimeHeader

**Opis:** Komponent wyświetlający datę i czas w czytelnym, relatywnym formacie.

**Główne elementy:**
- Container z ikoną zegara
- Tekst daty (format: "Dziś, 18:30" / "Wczoraj, 12:00" / "18.10.2025, 14:00")

**Obsługiwane interakcje:**
- Brak (pure display)

**Obsługiwana walidacja:**
- Brak

**Typy:**
- `DateTimeFormat` - string

**Propsy:**
- `date: string` - ISO timestamp
- `format?: 'relative' | 'absolute'` - domyślnie 'relative' dla <48h

**Logic formatowania:**
```typescript
function formatCookingDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 24) {
    return `Dziś, ${date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
  } else if (diffHours < 48) {
    return `Wczoraj, ${date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
  } else {
    return `${date.toLocaleDateString('pl-PL', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${date.toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}`;
  }
}
```

### 4.7 UsedIngredientsPreview

**Opis:** Komponent wyświetlający mini-listę składników użytych w przepisie (max 3 + "i X więcej").

**Główne elementy:**
- Lista (`<ul>`) z bullet points
- Każdy składnik: nazwa produktu + ilość + jednostka
- Tekst "i X więcej" jeśli jest więcej niż 3 składniki

**Obsługiwane interakcje:**
- Brak

**Obsługiwana walidacja:**
- Brak

**Typy:**
- `FridgeStateItemDTO[]` - lista składników

**Propsy:**
- `ingredients: FridgeStateItemDTO[]`
- `maxDisplay?: number` - domyślnie 3

### 4.8 FridgeStateDisplay

**Opis:** Komponent wyświetlający szczegółowy stan lodówki (przed lub po gotowaniu).

**Główne elementy:**
- Container z nagłówkiem ("Stan lodówki przed" / "po")
- Lista produktów (`<ul>`) jako grid (2 kolumny desktop, 1 mobile)
- Każdy produkt: nazwa + ilość + jednostka
- Highlight dla produktów zużytych (porównanie przed/po)

**Obsługiwane interakcje:**
- Brak

**Obsługiwana walidacja:**
- Brak

**Typy:**
- `FridgeStateDTO` - stan lodówki

**Propsy:**
- `state: FridgeStateDTO`
- `type: 'before' | 'after'`
- `changedProducts?: number[]` - IDs produktów, które się zmieniły (highlight)

### 4.9 ExpandableDetails

**Opis:** Sekcja zawierająca szczegóły stanu lodówki przed i po gotowaniu, z możliwością zwijania/rozwijania.

**Główne elementy:**
- Toggle button (Chevron icon + "Pokaż szczegóły" / "Ukryj szczegóły")
- Collapsible content (animated):
  - FridgeStateDisplay (before)
  - Visual separator (strzałka w dół)
  - FridgeStateDisplay (after)
  - Highlight changes section (opcjonalne)

**Obsługiwane interakcje:**
- Click toggle button → expand/collapse
- Animacja smooth height transition (300ms)

**Obsługiwana walidacja:**
- Brak

**Typy:**
- Brak specjalnych typów

**Propsy:**
- `fridgeStateBefore: FridgeStateDTO`
- `fridgeStateAfter: FridgeStateDTO`
- `isExpanded: boolean`
- `onToggle: () => void`

### 4.10 PaginationControls

**Opis:** Komponenty kontrolek paginacji (previous, page numbers, next).

**Główne elementy:**
- Container z flexbox
- Button "Poprzednia"
- Page numbers (current bold, clickable)
- Button "Następna"
- Info: "Strona X z Y"

**Obsługiwane interakcje:**
- Click "Poprzednia" → emit `onPageChange(page - 1)`
- Click numer strony → emit `onPageChange(pageNumber)`
- Click "Następna" → emit `onPageChange(page + 1)`

**Obsługiwana walidacja:**
- Brak (disabled states dla prev/next gdy na krańcach)

**Typy:**
- `PaginationMetaDTO`

**Propsy:**
- `pagination: PaginationMetaDTO`
- `onPageChange: (page: number) => void`

### 4.11 EmptyState

**Opis:** Stan pusty gdy użytkownik nie ma żadnej historii gotowania.

**Główne elementy:**
- Container centered
- Ikona (duża, 64px)
- Tytuł: "Nie ugotowałeś jeszcze żadnego przepisu"
- Opis: "Znajdź przepis dopasowany do Twojej lodówki i rozpocznij gotowanie"
- Przyciski: "Znajdź przepis" (primary)

**Obsługiwane interakcje:**
- Click "Znajdź przepis" → navigate to `/recipes/search`

**Obsługiwana walidacja:**
- Brak

**Typy:**
- Brak

**Propsy:**
- `onFindRecipe: () => void`

## 5. Typy

### 5.1 Istniejące typy z types.ts

Wykorzystywane bezpośrednio z `src/types.ts`:

```typescript
// Request/Response DTOs
CookingHistoryListResponseDTO {
  data: CookingHistoryDTO[];
  pagination: PaginationMetaDTO;
}

CookingHistoryDTO {
  id: number;
  recipe: RecipeReferenceDTO;
  cooked_at: string;
  fridge_state_before: FridgeStateDTO;
  fridge_state_after: FridgeStateDTO;
}

RecipeReferenceDTO {
  id: number;
  title: string;
}

FridgeStateDTO {
  items: FridgeStateItemDTO[];
}

FridgeStateItemDTO {
  product_id: number;
  product_name: string;
  quantity: number;
  unit: string;
}

PaginationMetaDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

ListCookingHistoryQueryDTO {
  recipe_id?: number;
  from_date?: string; // ISO date YYYY-MM-DD
  to_date?: string;   // ISO date YYYY-MM-DD
  page?: number;
  limit?: number;
}
```

### 5.2 Nowe typy ViewModel (do utworzenia)

Typy specyficzne dla widoku, używane w komponentach React:

```typescript
// src/components/cooking-history/types.ts

/**
 * Model widoku dla statystyk historii
 */
export interface HistoryStats {
  totalEntries: number;
  newestDate: string | null;
  oldestDate: string | null;
}

/**
 * Filtry dla widoku historii gotowania
 */
export interface HistoryFilters {
  recipeId?: number;
  fromDate?: string; // YYYY-MM-DD
  toDate?: string;   // YYYY-MM-DD
}

/**
 * Kompletny stan filtrów i paginacji dla widoku
 */
export interface HistoryListState {
  filters: HistoryFilters;
  page: number;
  limit: number;
}

/**
 * Rozszerzony wpis historii z computed properties
 */
export interface HistoryEntryViewModel extends CookingHistoryDTO {
  formattedDate: string; // Relative lub absolute date
  usedIngredientsCount: number;
  changedProductIds: number[]; // IDs produktów, które się zmieniły
  isExpanded: boolean; // Lokalny stan UI
}

/**
 * Zmiany w stanie lodówki (computed)
 */
export interface FridgeChanges {
  productId: number;
  productName: string;
  quantityBefore: number;
  quantityAfter: number;
  difference: number; // negative = consumed
  unit: string;
}

/**
 * Props dla głównego widoku (z SSR)
 */
export interface CookingHistoryPageProps {
  initialData?: CookingHistoryListResponseDTO;
}
```

### 5.3 Mapowanie DTO ↔ ViewModel

Funkcje transformacji między API DTOs a ViewModels:

```typescript
// src/lib/mappers/cooking-history-view.mapper.ts

export function mapHistoryDTOToViewModel(
  dto: CookingHistoryDTO,
  isExpanded: boolean = false
): HistoryEntryViewModel {
  return {
    ...dto,
    formattedDate: formatCookingDate(dto.cooked_at),
    usedIngredientsCount: dto.fridge_state_before.items.length,
    changedProductIds: calculateChangedProducts(
      dto.fridge_state_before,
      dto.fridge_state_after
    ),
    isExpanded
  };
}

export function calculateChangedProducts(
  before: FridgeStateDTO,
  after: FridgeStateDTO
): number[] {
  const changedIds: number[] = [];
  
  before.items.forEach(beforeItem => {
    const afterItem = after.items.find(
      item => item.product_id === beforeItem.product_id
    );
    
    if (!afterItem || afterItem.quantity !== beforeItem.quantity) {
      changedIds.push(beforeItem.product_id);
    }
  });
  
  return changedIds;
}

export function calculateFridgeChanges(
  before: FridgeStateDTO,
  after: FridgeStateDTO
): FridgeChanges[] {
  const changes: FridgeChanges[] = [];
  
  before.items.forEach(beforeItem => {
    const afterItem = after.items.find(
      item => item.product_id === beforeItem.product_id
    );
    
    const quantityAfter = afterItem ? afterItem.quantity : 0;
    const difference = quantityAfter - beforeItem.quantity;
    
    if (difference !== 0) {
      changes.push({
        productId: beforeItem.product_id,
        productName: beforeItem.product_name,
        quantityBefore: beforeItem.quantity,
        quantityAfter: quantityAfter,
        difference: difference,
        unit: beforeItem.unit
      });
    }
  });
  
  return changes;
}

export function calculateHistoryStats(
  entries: CookingHistoryDTO[]
): HistoryStats {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      newestDate: null,
      oldestDate: null
    };
  }
  
  const dates = entries.map(e => new Date(e.cooked_at));
  dates.sort((a, b) => b.getTime() - a.getTime());
  
  return {
    totalEntries: entries.length,
    newestDate: dates[0].toISOString(),
    oldestDate: dates[dates.length - 1].toISOString()
  };
}

export function formatCookingDate(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  if (diffHours < 24) {
    return `Dziś, ${date.toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  } else if (diffHours < 48) {
    return `Wczoraj, ${date.toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  } else {
    return `${date.toLocaleDateString('pl-PL', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric' 
    })}, ${date.toLocaleTimeString('pl-PL', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })}`;
  }
}
```

## 6. Zarządzanie stanem

### 6.1 Strategia

Widok wykorzystuje **lokalny stan komponentu React** (`useState`) bez zewnętrznych bibliotek state management. Zgodnie z architekturą Astro Islands, każdy island jest izolowany.

### 6.2 Stan w CookingHistoryView

```typescript
// Stan listy historii
const [historyEntries, setHistoryEntries] = useState<CookingHistoryDTO[]>(
  initialData?.data || []
);

// Stan paginacji
const [pagination, setPagination] = useState<PaginationMetaDTO>(
  initialData?.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 }
);

// Stan filtrów
const [filters, setFilters] = useState<HistoryFilters>({});

// Stan UI
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

// Stan rozwinięcia kart (per card)
const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
```

### 6.3 Custom Hook: useCookingHistory

Opcjonalnie można wydzielić logikę do custom hooka dla lepszej organizacji:

```typescript
// src/hooks/useCookingHistory.ts

interface UseCookingHistoryOptions {
  initialData?: CookingHistoryListResponseDTO;
}

interface UseCookingHistoryReturn {
  // Stan
  historyEntries: CookingHistoryDTO[];
  pagination: PaginationMetaDTO;
  loading: boolean;
  error: string | null;
  filters: HistoryFilters;
  expandedCards: Set<number>;
  
  // Akcje
  fetchHistory: () => Promise<void>;
  setFilters: (filters: HistoryFilters) => void;
  clearFilters: () => void;
  setPage: (page: number) => void;
  toggleCardExpansion: (cardId: number) => void;
  refreshList: () => Promise<void>;
}

export function useCookingHistory(
  options: UseCookingHistoryOptions = {}
): UseCookingHistoryReturn {
  const [historyEntries, setHistoryEntries] = useState<CookingHistoryDTO[]>(
    options.initialData?.data || []
  );
  const [pagination, setPagination] = useState<PaginationMetaDTO>(
    options.initialData?.pagination || { 
      page: 1, 
      limit: 20, 
      total: 0, 
      total_pages: 0 
    }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<HistoryFilters>({});
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: ListCookingHistoryQueryDTO = {
        page: pagination.page,
        limit: pagination.limit,
        recipe_id: filters.recipeId,
        from_date: filters.fromDate,
        to_date: filters.toDate
      };

      const response = await apiClient.get<CookingHistoryListResponseDTO>(
        '/api/cooking-history',
        params
      );

      setHistoryEntries(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Nie udało się pobrać historii gotowania. Spróbuj ponownie.');
      console.error('Fetch cooking history error:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filters]);

  // Fetch przy zmianie parametrów
  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const setFiltersHandler = (newFilters: HistoryFilters) => {
    setFilters(newFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset do strony 1
  };

  const clearFilters = () => {
    setFilters({});
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const setPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  const toggleCardExpansion = (cardId: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(cardId)) {
        newSet.delete(cardId);
      } else {
        newSet.add(cardId);
      }
      return newSet;
    });
  };

  const refreshList = async () => {
    await fetchHistory();
  };

  return {
    historyEntries,
    pagination,
    loading,
    error,
    filters,
    expandedCards,
    fetchHistory,
    setFilters: setFiltersHandler,
    clearFilters,
    setPage,
    toggleCardExpansion,
    refreshList
  };
}
```

### 6.4 Synchronizacja z URL (opcjonalnie)

Dla lepszego UX można synchronizować filtry z URL params:

```typescript
// Inicjalizacja z URL params
const searchParams = new URLSearchParams(window.location.search);
const [filters, setFilters] = useState<HistoryFilters>({
  recipeId: searchParams.get('recipe_id') 
    ? parseInt(searchParams.get('recipe_id')!) 
    : undefined,
  fromDate: searchParams.get('from_date') || undefined,
  toDate: searchParams.get('to_date') || undefined
});

// Update URL przy zmianie filtrów
useEffect(() => {
  const params = new URLSearchParams();
  if (filters.recipeId) params.set('recipe_id', String(filters.recipeId));
  if (filters.fromDate) params.set('from_date', filters.fromDate);
  if (filters.toDate) params.set('to_date', filters.toDate);
  
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
}, [filters]);
```

## 7. Integracja API

### 7.1 Lista historii gotowania (GET /api/cooking-history)

**Kiedy:** Przy montowaniu komponentu, zmianie filtrów, strony

**Request:**
```typescript
// Query parameters
interface ListCookingHistoryQuery {
  recipe_id?: number;
  from_date?: string; // YYYY-MM-DD
  to_date?: string;   // YYYY-MM-DD
  page?: number;
  limit?: number;
}

// Wywołanie
const response = await apiClient.get<CookingHistoryListResponseDTO>(
  '/api/cooking-history',
  {
    page: 1,
    limit: 20,
    recipe_id: 5,
    from_date: '2025-10-01',
    to_date: '2025-10-31'
  }
);
```

**Response:**
```typescript
CookingHistoryListResponseDTO {
  data: CookingHistoryDTO[];
  pagination: PaginationMetaDTO;
}
```

**Przykładowa odpowiedź:**
```json
{
  "data": [
    {
      "id": 1,
      "recipe": {
        "id": 1,
        "title": "Tomato Soup"
      },
      "cooked_at": "2025-10-18T18:00:00Z",
      "fridge_state_before": {
        "items": [
          {
            "product_id": 10,
            "product_name": "Tomato",
            "quantity": 8,
            "unit": "pc"
          },
          {
            "product_id": 15,
            "product_name": "Onion",
            "quantity": 3,
            "unit": "pc"
          }
        ]
      },
      "fridge_state_after": {
        "items": [
          {
            "product_id": 10,
            "product_name": "Tomato",
            "quantity": 3,
            "unit": "pc"
          },
          {
            "product_id": 15,
            "product_name": "Onion",
            "quantity": 1,
            "unit": "pc"
          }
        ]
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

**Obsługa błędów:**
- 401 Unauthorized → Redirect do `/login`
- 422 Unprocessable Entity → Toast z komunikatem błędu walidacji
- 500 Internal Server Error → Toast "Wystąpił błąd serwera"
- Network error → Toast "Brak połączenia z internetem"

### 7.2 API Client

Wykorzystanie wspólnego API client z error handling:

```typescript
// src/lib/api-client.ts

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = '') {
    this.baseURL = baseURL;
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(endpoint, window.location.origin);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.set(key, String(value));
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: this.getHeaders()
    });

    return this.handleResponse<T>(response);
  }

  private getHeaders(): HeadersInit {
    return {
      'Content-Type': 'application/json',
      // 'Authorization': `Bearer ${getToken()}` // TODO: implement auth
    };
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw await this.parseError(response);
    }

    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  private async parseError(response: Response): Promise<ApiError> {
    try {
      const errorData = await response.json();
      return new ApiError(
        response.status,
        errorData.error?.message || 'Wystąpił błąd',
        errorData.error?.code
      );
    } catch {
      return new ApiError(
        response.status,
        'Wystąpił nieoczekiwany błąd'
      );
    }
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const apiClient = new ApiClient();
```

## 8. Interakcje użytkownika

### 8.1 Przeglądanie historii gotowania

**Flow:**
1. Użytkownik wchodzi na `/history`
2. Widok ładuje się z danymi SSR (opcjonalnie) lub fetchuje dane client-side
3. Wyświetla timeline list kart historii (chronologicznie, najnowsze na górze)
4. Użytkownik scrolluje i przegląda historię

**Elementy UI:**
- Timeline layout z kartami
- Relative date formatting dla <48h
- Smooth scroll
- Subtle border left dla visual timeline

### 8.2 Filtrowanie po przepisie

**Flow:**
1. Użytkownik otwiera dropdown "Filtruj po przepisie"
2. Lista przepisów z autocomplete/search
3. Użytkownik wybiera przepis
4. Wywołanie API z parametrem `recipe_id`
5. Wyświetlenie przefiltrowanych wyników
6. Badge "Filtr: [nazwa przepisu]" + button "Wyczyść"

**Elementy UI:**
- Dropdown z autocomplete
- Loading state podczas filtrowania
- Info "Wyniki dla: [nazwa przepisu]"
- Badge z X button do usunięcia filtru

### 8.3 Filtrowanie po dacie

**Flow:**
1. Użytkownik otwiera date range picker
2. Wybiera datę początkową (from_date)
3. Wybiera datę końcową (to_date)
4. Walidacja: from_date <= to_date
5. Wywołanie API z parametrami `from_date`, `to_date`
6. Wyświetlenie przefiltrowanych wyników
7. Badge "Od [data] do [data]" + button "Wyczyść"

**Elementy UI:**
- Date range picker (2 date pickers: od - do)
- Validation feedback inline
- Badges pokazujące aktywne filtry
- Button "Wyczyść filtry" gdy są aktywne

### 8.4 Rozwijanie/zwijanie szczegółów karty

**Flow:**
1. Użytkownik klika header karty lub button "Pokaż szczegóły"
2. Smooth expand animation (300ms)
3. Wyświetlenie:
   - Stan lodówki przed (grid 2 kolumny)
   - Visual separator (strzałka w dół)
   - Stan lodówki po (grid 2 kolumny)
   - Highlight zmian (produkty zużyte)
4. Użytkownik może kliknąć ponownie aby zwinąć

**Elementy UI:**
- Chevron icon (rotate animation)
- Smooth height transition
- Highlight changed products (amber background)
- Grid layout dla czytelności

### 8.5 Nawigacja do przepisu

**Flow:**
1. Użytkownik klika tytuł przepisu w karcie
2. Nawigacja do `/recipes/:id`
3. Widok szczegółów przepisu (inny widok, poza scope tego planu)

**Elementy UI:**
- Link z hover effect (underline)
- Tytuł przepisu jako klikalne

### 8.6 Ponowne gotowanie przepisu

**Flow:**
1. Użytkownik klika "Ugotuj ponownie"
2. Nawigacja do `/recipes/:id`
3. (Opcjonalnie) Auto-scroll do "Ugotuj to" button
4. Użytkownik może wykonać przepis ponownie

**Elementy UI:**
- Primary button "Ugotuj ponownie"
- Icon (chef hat lub pot)
- Hover effect

### 8.7 Przechodzenie między stronami

**Flow:**
1. Użytkownik klika "Następna" lub numer strony
2. Wywołanie API z parametrem `page`
3. Scroll do góry strony
4. Wyświetlenie nowej strony wyników

**Elementy UI:**
- Pagination controls na dole timeline
- Disabled state dla prev/next gdy na końcu
- Current page bold/highlighted
- Info "Strona X z Y"

### 8.8 Czyszczenie filtrów

**Flow:**
1. Użytkownik klika "Wyczyść filtry" lub X na badge filtru
2. Reset filtrów do stanu początkowego
3. Wywołanie API bez parametrów filtrowania
4. Wyświetlenie pełnej listy historii

**Elementy UI:**
- Button "Wyczyść filtry" (visible tylko gdy są aktywne filtry)
- X button na każdym badge filtru
- Smooth transition

## 9. Warunki i walidacja

### 9.1 Walidacja w FilterToolbar

**Komponent:** FilterToolbar

**Filtr po przepisie:**
- **Warunek:** Opcjonalny, musi być valid recipe ID z listy
- **Weryfikacja:** Automatyczna przez dropdown (wybór z listy)
- **Komunikat:** Brak (nie może być błędu)
- **Wpływ na UI:** Dropdown z listą przepisów

**Filtr po dacie (from_date):**
- **Warunek:** Opcjonalny, format YYYY-MM-DD
- **Weryfikacja:** onChange (format validation), onBlur
- **Komunikat:** "Nieprawidłowy format daty (użyj YYYY-MM-DD)"
- **Moment walidacji:** Po wpisaniu/wyborze daty
- **Wpływ na UI:** Czerwone obramowanie date picker + komunikat

**Filtr po dacie (to_date):**
- **Warunek:** Opcjonalny, format YYYY-MM-DD, musi być >= from_date
- **Weryfikacja:** onChange, onBlur, przed submit
- **Komunikat:** 
  - "Nieprawidłowy format daty"
  - "Data końcowa musi być późniejsza lub równa dacie początkowej"
- **Moment walidacji:** Po wpisaniu/wyborze daty, przed filtrowaniem
- **Wpływ na UI:** Czerwone obramowanie + komunikat + disabled przycisk "Zastosuj"

**Walidacja zakresu dat (globalnie):**
- **Warunek:** from_date <= to_date
- **Weryfikacja:** Przed wywołaniem API
- **Komunikat:** "Data początkowa musi być wcześniejsza lub równa dacie końcowej"
- **Moment walidacji:** onClick "Zastosuj filtry"
- **Wpływ na UI:** Toast error, focus na to_date field

### 9.2 Walidacja server-side (odpowiedź API)

**Błędy 422 Unprocessable Entity:**
- Nieprawidłowy date format
- from_date > to_date
- Nieprawidłowy recipe_id

**Obsługa:**
- Toast z komunikatem błędu
- Reset filtrów do ostatniego prawidłowego stanu

### 9.3 Warunki wyświetlania elementów UI

**EmptyState:**
- **Warunek:** `historyEntries.length === 0 && !loading && !error`
- **UI:** Wyświetl empty state zamiast timeline

**Skeleton loading:**
- **Warunek:** `loading === true`
- **UI:** 5 skeleton cards zamiast prawdziwych kart

**Error state:**
- **Warunek:** `error !== null`
- **UI:** Error message z przyciskiem "Spróbuj ponownie"

**Pagination controls:**
- **Warunek:** `pagination.total_pages > 1`
- **UI:** Widoczne tylko gdy więcej niż 1 strona

**Button "Poprzednia":**
- **Warunek:** `pagination.page > 1`
- **UI:** Enabled gdy nie pierwsza strona, inaczej disabled

**Button "Następna":**
- **Warunek:** `pagination.page < pagination.total_pages`
- **UI:** Enabled gdy nie ostatnia strona, inaczej disabled

**Badge filtrów:**
- **Warunek:** `Object.keys(filters).length > 0`
- **UI:** Wyświetl badges z aktywnymi filtrami

**Button "Wyczyść filtry":**
- **Warunek:** `Object.keys(filters).length > 0`
- **UI:** Visible tylko gdy są aktywne filtry

**Expandable section:**
- **Warunek:** `isExpanded === true` dla danej karty
- **UI:** Expanded z animacją, inaczej collapsed

**Highlight changed products:**
- **Warunek:** Produkt w `changedProductIds` array
- **UI:** Amber background lub border

## 10. Obsługa błędów

### 10.1 Błędy API

**401 Unauthorized:**
- **Przyczyna:** Brak lub nieprawidłowy token
- **Obsługa:** Redirect do `/login` + toast "Sesja wygasła. Zaloguj się ponownie."

**422 Unprocessable Entity:**
- **Przyczyna:** Błędy walidacji parametrów
- **Obsługa:** Toast z komunikatem błędu szczegółowego
- **Przykłady:**
  - "Nieprawidłowy format daty (użyj YYYY-MM-DD)"
  - "Data początkowa musi być wcześniejsza od daty końcowej"
  - "Nieprawidłowy identyfikator przepisu"

**500 Internal Server Error:**
- **Przyczyna:** Błąd serwera
- **Obsługa:** Toast "Wystąpił błąd serwera. Spróbuj ponownie później."

**Network error:**
- **Przyczyna:** Brak internetu
- **Obsługa:** Toast "Brak połączenia z internetem. Sprawdź połączenie." + retry button

### 10.2 Błędy UI

**Empty state (brak historii):**
- **Przyczyna:** Użytkownik nie ugotował jeszcze żadnego przepisu
- **UI:** EmptyState z komunikatem "Nie ugotowałeś jeszcze żadnego przepisu" + CTA "Znajdź przepis"

**Empty state (brak wyników filtrowania):**
- **Przyczyna:** Filtrowanie nie zwróciło wyników
- **UI:** "Nie znaleziono wpisów pasujących do filtrów" + sugestia "Spróbuj zmienić filtry" + button "Wyczyść filtry"

**Failed to load history:**
- **Przyczyna:** Błąd podczas fetch
- **UI:** Error state z ikoną ostrzeżenia + "Nie udało się pobrać historii gotowania" + button "Spróbuj ponownie"

### 10.3 Error Boundary

**React Error Boundary dla całego widoku:**
```typescript
// src/components/ErrorBoundary.tsx

class CookingHistoryErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Cooking history view error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen">
          <h2>Coś poszło nie tak</h2>
          <p>Przepraszamy, wystąpił nieoczekiwany błąd.</p>
          <button onClick={() => window.location.reload()}>
            Odśwież stronę
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 10.4 Loading States

**Initial load:**
- **UI:** Skeleton timeline (5 skeleton cards)

**Filtering:**
- **UI:** Loading overlay na timeline (blur + spinner)

**Pagination:**
- **UI:** Disabled pagination buttons + spinner

### 10.5 Toast Notifications

Wszystkie toasty używają globalnego ToastContext:

**Typy toastów:**
- **Success:** zielony, ikona checkmark, 5s auto-dismiss
- **Error:** czerwony, ikona X, 7s auto-dismiss + manual dismiss
- **Info:** niebieski, ikona info, 5s auto-dismiss

**Przykłady komunikatów:**
- Error: "Nie udało się pobrać historii gotowania", "Brak połączenia z internetem"
- Info: "Brak wpisów dla wybranego filtru"

## 11. Kroki implementacji

### Krok 1: Struktura plików i podstawowe typy

1.1. Utworzenie struktury folderów:
```
src/
├── components/
│   └── cooking-history/
│       ├── CookingHistoryView.tsx
│       ├── HistoryHeader.tsx
│       ├── FilterToolbar.tsx
│       ├── HistoryTimeline.tsx
│       ├── HistoryCard.tsx
│       ├── DateTimeHeader.tsx
│       ├── UsedIngredientsPreview.tsx
│       ├── FridgeStateDisplay.tsx
│       ├── ExpandableDetails.tsx
│       ├── EmptyState.tsx
│       ├── PaginationControls.tsx
│       └── types.ts
├── hooks/
│   └── useCookingHistory.ts
├── lib/
│   └── mappers/
│       └── cooking-history-view.mapper.ts
└── pages/
    └── history.astro
```

1.2. Utworzenie pliku typów `src/components/cooking-history/types.ts`:
- Zdefiniowanie wszystkich ViewModels (HistoryStats, HistoryFilters, HistoryEntryViewModel, FridgeChanges)

1.3. Utworzenie mappera `src/lib/mappers/cooking-history-view.mapper.ts`:
- Funkcje transformacji DTO ↔ ViewModel
- Helper functions: formatCookingDate, calculateChangedProducts, calculateFridgeChanges

### Krok 2: Utility components (podstawowe komponenty UI)

2.1. **EmptyState.tsx**:
- Komponent z ikoną, tekstem, opisem i przyciskiem CTA
- Reużywalny dla różnych scenariuszy (brak historii, brak wyników filtrowania)

2.2. **PaginationControls.tsx**:
- Komponenty kontrolek paginacji
- Disabled states dla prev/next
- Click handlers

2.3. **DateTimeHeader.tsx**:
- Komponent formatujący datę (relative/absolute)
- Funkcja formatCookingDate

### Krok 3: Custom hook useCookingHistory

3.1. Implementacja `src/hooks/useCookingHistory.ts`:
- Stan: historyEntries, pagination, loading, error, filters, expandedCards
- Funkcje: fetchHistory, setFilters, clearFilters, setPage, toggleCardExpansion, refreshList
- useEffect do fetch przy zmianie parametrów

### Krok 4: FridgeStateDisplay component

4.1. Implementacja `src/components/cooking-history/FridgeStateDisplay.tsx`:
- Lista produktów jako grid (2 kolumny desktop, 1 mobile)
- Props: state (FridgeStateDTO), type ('before' | 'after'), changedProducts
- Highlight changed products

4.2. Stylowanie:
- Grid layout responsive
- Highlight styling (amber background dla zmian)

### Krok 5: UsedIngredientsPreview component

5.1. Implementacja `src/components/cooking-history/UsedIngredientsPreview.tsx`:
- Lista pierwszych 3 składników
- Tekst "i X więcej" jeśli więcej
- Compact layout

### Krok 6: ExpandableDetails component

6.1. Implementacja `src/components/cooking-history/ExpandableDetails.tsx`:
- Toggle button z chevron icon
- Collapsible content z animacją
- Osadzone FridgeStateDisplay (before i after)
- Visual separator (strzałka)

6.2. Animacja:
- Smooth height transition (300ms)
- Chevron rotate animation

### Krok 7: HistoryCard component

7.1. Implementacja `src/components/cooking-history/HistoryCard.tsx`:
- Card layout z Shadcn Card
- DateTimeHeader
- Link do przepisu
- UsedIngredientsPreview
- ExpandableDetails (conditional)
- Footer z "Ugotuj ponownie" button
- Lokalny stan expanded

7.2. Stylowanie:
- Responsive layout
- Hover effects (subtle shadow)
- Border left dla timeline visual

### Krok 8: FilterToolbar component

8.1. **RecipeFilter** (Dropdown):
- Dropdown z listą przepisów (może być autocomplete)
- Fetch listy przepisów użytkownika
- onChange handler

8.2. **DateRangeFilter** (Date pickers):
- 2 date pickers (od - do)
- Validation inline (from_date <= to_date)
- onChange handlers

8.3. **FilterToolbar**:
- Container łączący filtry
- Button "Wyczyść filtry"
- Badges pokazujące aktywne filtry
- Responsive layout (wrap na mobile)

### Krok 9: HistoryTimeline component

9.1. Implementacja `src/components/cooking-history/HistoryTimeline.tsx`:
- Flexbox column layout
- Map historyEntries do HistoryCard
- Conditional render: loading → skeleton, empty → EmptyState
- Przekazywanie event handlers do kart

9.2. Skeleton cards:
- 5 skeleton cards z shimmer animation
- Struktura podobna do HistoryCard

### Krok 10: HistoryHeader component

10.1. Implementacja `src/components/cooking-history/HistoryHeader.tsx`:
- Tytuł "Historia gotowania"
- Statystyki (liczba wpisów, zakres dat)
- Opis

10.2. Funkcja `calculateHistoryStats`:
- Zliczanie wpisów
- Znajdowanie najnowszego/najstarszego wpisu

### Krok 11: CookingHistoryView - główny komponent

11.1. Implementacja `src/components/cooking-history/CookingHistoryView.tsx`:
- Użycie useCookingHistory hook
- Layout:
  - HistoryHeader
  - FilterToolbar
  - HistoryTimeline
  - PaginationControls

11.2. Event handlers:
- onRecipeClick → nawigacja do `/recipes/:id`
- onCookAgain → nawigacja do `/recipes/:id`
- onFilterChange → fetch z nowymi parametrami
- onPageChange → fetch nowej strony

11.3. Przekazywanie props i callbacks do child components

### Krok 12: Strona Astro

12.1. Implementacja `src/pages/history.astro`:
- Użycie Layout.astro
- Opcjonalnie: fetch history SSR i przekaż jako initialData
- Render CookingHistoryView jako island z client:load

```astro
---
import Layout from '../layouts/Layout.astro';
import CookingHistoryView from '../components/cooking-history/CookingHistoryView.tsx';

// Opcjonalnie SSR fetch
const historyResponse = await fetch('http://localhost:4321/api/cooking-history');
const initialData = await historyResponse.json();
---

<Layout title="Historia gotowania">
  <CookingHistoryView 
    client:load
    initialData={initialData}
  />
</Layout>
```

### Krok 13: Stylowanie i responsywność

13.1. Tailwind classes:
- Timeline: `flex flex-col gap-4`
- Cards: responsive padding, hover effects
- Toolbar: flex wrap, responsive layout

13.2. Breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: >= 1024px

13.3. Animacje:
- Expand/collapse: smooth height transition
- Chevron rotate: transform rotate
- Skeleton: shimmer animation

### Krok 14: Accessibility

14.1. Semantic HTML:
- `<main>`, `<header>`, `<section>`, `<article>`
- Proper heading hierarchy (h1 → h2 → h3)
- `<ul>`/`<li>` dla list

14.2. ARIA attributes:
- `aria-label` dla icon buttons
- `aria-expanded` dla expandable sections
- `aria-live` dla loading states

14.3. Keyboard navigation:
- Tab order logiczny
- Enter dla expand/collapse
- Space dla buttons

14.4. Focus visible:
- Custom focus ring (Tailwind: `focus:ring-2 focus:ring-amber-500`)

### Krok 15: Testowanie manualne

15.1. Scenariusze testowe:
- [ ] Wyświetlenie listy historii
- [ ] Filtrowanie po przepisie
- [ ] Filtrowanie po zakresie dat (from, to, both)
- [ ] Validation date range (from_date > to_date → błąd)
- [ ] Czyszczenie filtrów
- [ ] Paginacja (next, prev, page numbers)
- [ ] Expand/collapse szczegółów karty
- [ ] Nawigacja do przepisu (click tytuł)
- [ ] Nawigacja do "Ugotuj ponownie"
- [ ] Empty state (brak historii)
- [ ] Empty state (brak wyników filtrowania)
- [ ] Loading states (skeleton, spinners)
- [ ] Error handling (401, 422, 500, network error)
- [ ] Responsywność (mobile, tablet, desktop)
- [ ] Keyboard navigation (tab, enter, space)
- [ ] Accessibility (screen reader, focus management)

15.2. Edge cases:
- [ ] Bardzo długi tytuł przepisu (truncate)
- [ ] Duża liczba składników w stanie lodówki (scrollable)
- [ ] Historia z wieloma stronami
- [ ] Pusty stan lodówki (before lub after)

### Krok 16: Optymalizacja wydajności

16.1. React.memo dla komponentów:
- HistoryCard (memo po entry.id)
- PaginationControls (memo po pagination)

16.2. useCallback dla handlers:
- fetchHistory, setFilters, setPage, toggleCardExpansion

16.3. useMemo dla computed values:
- calculateHistoryStats (memo po historyEntries)
- formatCookingDate (cache per date)

### Krok 17: Dokumentacja

17.1. JSDoc dla komponentów:
- Props interfaces
- Przykłady użycia

17.2. README dla widoku:
- Opis struktury
- Diagram komponentów
- Instrukcje development

### Krok 18: Code review i refactoring

18.1. Review checklist:
- [ ] Typy poprawne i kompletne
- [ ] Error handling wszędzie
- [ ] Loading states wszędzie
- [ ] Accessibility zgodne z WCAG AA
- [ ] Responsywność na wszystkich breakpointach
- [ ] Kod DRY (brak duplikacji)
- [ ] Komponenty reużywalne
- [ ] Performance (memo, callbacks)

18.2. Refactoring:
- Wydzielenie wspólnych utility functions
- Optymalizacja re-renders
- Cleanup console.logs

---

## Podsumowanie

Plan implementacji szczegółowo opisuje wszystkie aspekty widoku Historia Gotowania, od architektury komponentów, przez typy i zarządzanie stanem, po integrację API i obsługę błędów. Implementacja powinna być wykonywana krok po kroku, testując każdy element przed przejściem do następnego.

Kluczowe punkty:

- **Modularność:** Każdy komponent ma jasno określoną odpowiedzialność
- **Type safety:** Wszystkie typy są zdefiniowane i używane konsekwentnie
- **Accessibility:** Semantic HTML, ARIA, keyboard navigation
- **UX:** Czytelny format daty (relative/absolute), smooth animations, clear feedback
- **Walidacja:** Date range validation, proper error messages
- **Responsywność:** Mobile-first approach z breakpoints
- **Wydajność:** Memoization, selective renders
- **Zgodność z API:** Precyzyjne mapowanie na GET `/api/cooking-history` endpoint
- **Zgodność z PRD:** Realizacja US-007 (Przeglądanie historii gotowania)

Implementacja powinna zająć około 2-3 dni dla doświadczonego frontend developera, z dodatkowym czasem na testowanie i optymalizacje.

