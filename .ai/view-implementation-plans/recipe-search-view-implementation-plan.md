# Plan implementacji widoku Wyszukiwania przepisów (Recipe Search)

## 1. Przegląd

Widok wyszukiwania przepisów umożliwia użytkownikom znalezienie przepisów na podstawie zawartości ich wirtualnej lodówki. Widok implementuje hierarchiczne wyszukiwanie w trzech źródłach: przepisy użytkownika, zewnętrzne API oraz generowanie AI. Proces dzieli się na trzy kroki: wybór źródła wyszukiwania, ładowanie wyników, oraz prezentację znalezionych przepisów z wynikami dopasowania (match score).

Widok jest kluczowy dla realizacji User Story US-004 (wyszukiwanie przepisu na podstawie dostępnych produktów) oraz US-006 (ręczne wyszukiwanie przepisu).

## 2. Routing widoku

Widok wykorzystuje dwie główne ścieżki:

- **`/recipes/search`** - Krok 1: Wybór źródła wyszukiwania (4 kafelki)
- **`/recipes/search?source=X&use_all_fridge_items=true`** - Kroki 2 i 3: Ładowanie i wyniki wyszukiwania

Parametry URL:
- `source` - źródło wyszukiwania: `user` | `api` | `ai` | `all` (wymagane dla kroków 2-3)
- `use_all_fridge_items` - czy użyć wszystkich produktów z lodówki: `true` | `false` (domyślnie `true`)

## 3. Struktura komponentów

Widok składa się z następującej hierarchii komponentów:

```
RecipeSearchPage (Astro page)
└── RecipeSearchView (React)
    ├── Step 1: SourceSelectionView
    │   ├── FridgeStatusBanner
    │   ├── EmptyFridgeWarning (warunkowo)
    │   └── SourceSelectionGrid
    │       └── SourceCard × 4
    │
    ├── Step 2: SearchLoadingView
    │   ├── SearchProgress
    │   ├── RecipeCardSkeleton × 6
    │   ├── TimeoutWarning (warunkowo, po 30s)
    │   └── CancelButton
    │
    └── Step 3: SearchResultsView
        ├── ResultsHeader
        │   ├── BackButton
        │   └── SearchMetadataBar
        ├── RecipeResultsGrid
        │   └── RecipeResultCard × N
        └── EmptyResults (warunkowo)
            ├── EmptyStateMessage
            └── FallbackActions
                ├── BackToSourceButton
                └── GenerateAIButton
```

## 4. Szczegóły komponentów

### 4.1 RecipeSearchPage (Astro page)

**Opis:** Główna strona Astro odpowiedzialna za routing i przekazanie kontroli do React view. Odpowiada za SSR oraz przekazanie początkowych danych (np. liczba produktów w lodówce).

**Główne elementy:**
- Import Layout.astro
- Import RecipeSearchView (React)
- Pobranie danych o lodówce na serwerze (opcjonalnie)
- Renderowanie `<RecipeSearchView client:load />`

**Obsługiwane zdarzenia:** Brak (strona Astro)

**Warunki walidacji:** Brak

**Typy:** Brak specyficznych

**Propsy:** Brak

**Lokalizacja:** `src/pages/recipes/search.astro`

---

### 4.2 RecipeSearchView (React)

**Opis:** Główny komponent React zarządzający logiką widoku, stanem wyszukiwania i przełączaniem między krokami. Obsługuje routing na poziomie klienta i wywołania API.

**Główne elementy:**
- Warunkowe renderowanie kroków na podstawie URL params i stanu
- Zarządzanie stanem wyszukiwania (loading, results, errors)
- Obsługa AbortController dla anulowania requestów
- Kontener z padding i max-width

**Obsługiwane zdarzenia:**
- Montowanie komponentu: odczyt URL params, decyzja o kroku
- Zmiana URL: przejście między krokami
- Rozpoczęcie wyszukiwania: wywołanie API
- Anulowanie wyszukiwania: abort request
- Retry po błędzie

**Warunki walidacji:**
- Sprawdzenie czy `source` param jest prawidłowy
- Walidacja czy użytkownik ma produkty w lodówce (dla `use_all_fridge_items=true`)

**Typy:**
- `SearchRecipesByFridgeDTO` (request)
- `SearchRecipesResponseDTO` (response)
- `GenerateRecipeDTO` (request dla AI)
- `GenerateRecipeResponseDTO` (response dla AI)
- `RecipeSearchViewState` (ViewModel - patrz sekcja 5)

**Propsy:**
```typescript
interface RecipeSearchViewProps {
  initialFridgeItemCount?: number; // liczba produktów w lodówce (opcjonalnie SSR)
}
```

---

### 4.3 SourceSelectionView (Step 1)

**Opis:** Widok wyboru źródła wyszukiwania. Prezentuje 4 kafelki reprezentujące różne źródła przepisów oraz ostrzeżenie jeśli lodówka jest pusta.

**Główne elementy:**
- Nagłówek (h1): "Wybierz źródło przepisów"
- `<FridgeStatusBanner>` - informacja o liczbie produktów
- `<EmptyFridgeWarning>` (jeśli lodówka pusta)
- `<SourceSelectionGrid>` - grid 2×2 (desktop) lub 1×4 (mobile)

**Obsługiwane zdarzenia:**
- Click na kafelek → nawigacja do `/recipes/search?source=X&use_all_fridge_items=true`
- Click na "Dodaj produkty" w warningu → nawigacja do `/fridge`

**Warunki walidacji:**
- Brak (widok tylko do wyboru)

**Typy:**
- `FridgeItemsCount` (ViewModel)

**Propsy:**
```typescript
interface SourceSelectionViewProps {
  fridgeItemCount: number;
  userRecipeCount: number;
  onSourceSelect: (source: RecipeSource) => void;
}
```

---

### 4.4 FridgeStatusBanner

**Opis:** Banner wyświetlający aktualny stan lodówki użytkownika (liczba produktów).

**Główne elementy:**
- Ikona lodówki
- Tekst: "W Twojej lodówce: X produktów"
- Styling: bg-blue-50, border-blue-200, text-blue-900

**Obsługiwane zdarzenia:** Brak

**Warunki walidacji:** Brak

**Typy:** `number` (fridgeItemCount)

**Propsy:**
```typescript
interface FridgeStatusBannerProps {
  itemCount: number;
}
```

---

### 4.5 EmptyFridgeWarning

**Opis:** Ostrzeżenie wyświetlane gdy lodówka użytkownika jest pusta. Informuje o mniej precyzyjnym wyszukiwaniu i zachęca do dodania produktów.

**Główne elementy:**
- Ikona ostrzeżenia (⚠️)
- Tekst: "Twoja lodówka jest pusta. Wyszukiwanie będzie mniej precyzyjne."
- Link/Button: "Dodaj produkty" → `/fridge`
- Styling: bg-yellow-50, border-yellow-300, text-yellow-900

**Obsługiwane zdarzenia:**
- Click na "Dodaj produkty" → nawigacja do `/fridge`

**Warunki walidacji:**
- Renderowany tylko gdy `fridgeItemCount === 0`

**Typy:** Brak

**Propsy:**
```typescript
interface EmptyFridgeWarningProps {
  onAddProducts: () => void;
}
```

---

### 4.6 SourceSelectionGrid

**Opis:** Grid zawierający 4 kafelki źródeł przepisów. Responsywny layout: 2×2 na desktop, 1×4 na mobile.

**Główne elementy:**
- CSS Grid container
- 4× `<SourceCard>` dla każdego źródła

**Obsługiwane zdarzenia:**
- Propagacja kliknięć z SourceCard

**Warunki walidacji:** Brak

**Typy:**
- `RecipeSource` - enum źródeł

**Propsy:**
```typescript
interface SourceSelectionGridProps {
  userRecipeCount: number;
  onSourceSelect: (source: RecipeSource) => void;
}
```

---

### 4.7 SourceCard

**Opis:** Kafelek reprezentujący pojedyncze źródło przepisów. Interaktywny element z hover effects i badge dla "Moje przepisy".

**Główne elementy:**
- Ikona źródła (64px)
- Tytuł (h3)
- Opis (2-3 zdania)
- Badge z liczbą (tylko dla "Moje przepisy")
- Hover: scale(1.02), shadow-lg
- Height: ~200px
- Border: border-2, rounded-xl

**Obsługiwane zdarzenia:**
- Click → wywołanie `onSourceSelect(source)`
- Hover → animacja scale i shadow
- Focus → keyboard accessibility

**Warunki walidacji:** Brak

**Typy:**
- `RecipeSource`
- `SourceCardData` (ViewModel)

**Propsy:**
```typescript
interface SourceCardProps {
  source: RecipeSource;
  title: string;
  description: string;
  icon: React.ReactNode;
  badge?: number; // liczba przepisów (tylko dla 'user')
  onClick: (source: RecipeSource) => void;
}
```

---

### 4.8 SearchLoadingView (Step 2)

**Opis:** Widok loading state podczas wyszukiwania przepisów. Wyświetla skeleton cards z shimmer animation oraz informację o postępie. Po 30 sekundach pokazuje timeout warning.

**Główne elementy:**
- `<SearchProgress>` - info o aktualnym źródle
- Grid 6× `<RecipeCardSkeleton>`
- `<TimeoutWarning>` (po 30s)
- `<CancelButton>`
- `aria-live="polite"` dla komunikatów

**Obsługiwane zdarzenia:**
- Click "Anuluj" → abort request, powrót do Step 1
- Timeout (30s) → pokazanie TimeoutWarning

**Warunki walidacji:**
- TimeoutWarning pokazywany tylko jeśli `searchDuration > 30000ms`

**Typy:**
- `SearchState` (ViewModel)

**Propsy:**
```typescript
interface SearchLoadingViewProps {
  currentSource: RecipeSource;
  searchDuration: number; // ms
  onCancel: () => void;
}
```

---

### 4.9 SearchProgress

**Opis:** Komponent pokazujący aktualny postęp wyszukiwania (w którym źródle aktualnie szukamy).

**Główne elementy:**
- Animated spinner
- Tekst: "Szukam w: [źródło]..."
- Progress bar (opcjonalnie)

**Obsługiwane zdarzenia:** Brak

**Warunki walidacji:** Brak

**Typy:**
- `RecipeSource`

**Propsy:**
```typescript
interface SearchProgressProps {
  currentSource: RecipeSource;
}
```

---

### 4.10 RecipeCardSkeleton

**Opis:** Skeleton loader dla karty przepisu. Shimmer animation (gradient linear, 1.5s loop).

**Główne elementy:**
- Badge placeholder (top-right)
- Title placeholder (2 linie)
- 3-4× ingredient line placeholders
- Footer (2 button placeholders)
- Shimmer gradient animation

**Obsługiwane zdarzenia:** Brak

**Warunki walidacji:** Brak

**Typy:** Brak

**Propsy:** Brak (statyczny skeleton)

---

### 4.11 TimeoutWarning

**Opis:** Ostrzeżenie wyświetlane gdy wyszukiwanie trwa dłużej niż 30 sekund.

**Główne elementy:**
- Animated spinner
- Tekst: "Generowanie trwa dłużej niż zwykle... Proszę czekać."
- Styling: bg-orange-50, border-orange-300

**Obsługiwane zdarzenia:** Brak (tylko informacja)

**Warunki walidacji:**
- Renderowany tylko gdy `searchDuration > 30000ms`

**Typy:** Brak

**Propsy:** Brak (controlled by parent)

---

### 4.12 SearchResultsView (Step 3)

**Opis:** Widok prezentujący wyniki wyszukiwania. Pokazuje listę przepisów z match scores oraz metadata wyszukiwania. Obsługuje empty state.

**Główne elementy:**
- `<ResultsHeader>`
- `<SearchMetadataBar>`
- `<RecipeResultsGrid>` lub `<EmptyResults>` (warunkowo)

**Obsługiwane zdarzenia:**
- Click na przepis → nawigacja do `/recipes/[id]`
- Click "Wróć" → powrót do Step 1
- Click "Generuj AI" (w EmptyResults) → wywołanie generate endpoint

**Warunki walidacji:**
- Renderowanie `<EmptyResults>` gdy `results.length === 0`

**Typy:**
- `SearchRecipesResponseDTO`
- `RecipeSearchResultDTO[]`

**Propsy:**
```typescript
interface SearchResultsViewProps {
  results: RecipeSearchResultDTO[];
  searchMetadata: SearchMetadataDTO;
  source: RecipeSource;
  onBack: () => void;
  onGenerateAI: () => void;
  onRecipeClick: (recipeId: number) => void;
}
```

---

### 4.13 ResultsHeader

**Opis:** Nagłówek wyników wyszukiwania z przyciskiem powrotu.

**Główne elementy:**
- `<BackButton>` → "Wróć do wyboru źródła"
- Tytuł (h1): "Wyniki wyszukiwania: [źródło]"

**Obsługiwane zdarzenia:**
- Click na BackButton → wywołanie `onBack()`

**Warunki walidacji:** Brak

**Typy:**
- `RecipeSource`

**Propsy:**
```typescript
interface ResultsHeaderProps {
  source: RecipeSource;
  onBack: () => void;
}
```

---

### 4.14 SearchMetadataBar

**Opis:** Bar z informacjami o wyszukiwaniu: liczba wyników, źródło, czas wyszukiwania.

**Główne elementy:**
- Ikona źródła
- Tekst: "Znaleziono X przepisów z [źródło] w Y ms"
- Styling: bg-gray-50, border-gray-200

**Obsługiwane zdarzenia:** Brak

**Warunki walidacji:** Brak

**Typy:**
- `SearchMetadataDTO`

**Propsy:**
```typescript
interface SearchMetadataBarProps {
  metadata: SearchMetadataDTO;
}
```

---

### 4.15 RecipeResultsGrid

**Opis:** Grid zawierający karty przepisów z wynikami wyszukiwania. Responsywny: 3 kolumny na desktop, 1 na mobile.

**Główne elementy:**
- CSS Grid container
- N× `<RecipeResultCard>`

**Obsługiwane zdarzenia:**
- Propagacja kliknięć z RecipeResultCard

**Warunki walidacji:** Brak

**Typy:**
- `RecipeSearchResultDTO[]`

**Propsy:**
```typescript
interface RecipeResultsGridProps {
  results: RecipeSearchResultDTO[];
  onRecipeClick: (recipeId: number) => void;
}
```

---

### 4.16 RecipeResultCard

**Opis:** Karta pojedynczego przepisu z wynikiem wyszukiwania. Podobna do standardowej karty przepisu, ale z match score badge i informacjami o brakujących składnikach.

**Główne elementy:**
- Match score badge (top-right): okrągły badge z % (np. "95%")
- Tytuł przepisu (h3)
- Opis (truncated, 2 linie max)
- Lista składników (dostępne: zielony, brakujące: czerwony)
- Czas gotowania + trudność
- Ikony statusu (✓ dostępne, ✗ brakujące)
- Footer z przyciskami:
  - "Zobacz przepis"
  - "Lista zakupów" (jeśli są brakujące składniki)
- Hover: scale(1.02), shadow-lg
- Border color zależny od match score:
  - > 90%: green
  - 70-90%: yellow  
  - < 70%: red

**Obsługiwane zdarzenia:**
- Click na kartę → `onRecipeClick(recipe.id)`
- Click "Zobacz przepis" → nawigacja do `/recipes/[id]`
- Click "Lista zakupów" → nawigacja do `/shopping-list?recipe_id=[id]`
- Hover → animacja

**Warunki walidacji:**
- "Lista zakupów" button wyświetlany tylko gdy `missing_ingredients.length > 0`
- Border color zależny od `match_score`

**Typy:**
- `RecipeSearchResultDTO`
- `AvailableIngredientDTO`

**Propsy:**
```typescript
interface RecipeResultCardProps {
  result: RecipeSearchResultDTO;
  onClick: (recipeId: number) => void;
}
```

---

### 4.17 EmptyResults

**Opis:** Komponent wyświetlany gdy wyszukiwanie nie zwróciło żadnych wyników. Zawiera sugestie i przyciski do dalszych akcji.

**Główne elementy:**
- `<EmptyStateMessage>`
- `<FallbackActions>`

**Obsługiwane zdarzenia:**
- Click "Wróć do wyboru źródła" → `onBack()`
- Click "Generuj AI" → `onGenerateAI()`

**Warunki walidacji:**
- Renderowany tylko gdy `results.length === 0`

**Typy:** Brak

**Propsy:**
```typescript
interface EmptyResultsProps {
  source: RecipeSource;
  onBack: () => void;
  onGenerateAI: () => void;
}
```

---

### 4.18 EmptyStateMessage

**Opis:** Komunikat informujący o braku wyników z sugestiami.

**Główne elementy:**
- Ikona pustego stanu (duża, centralna)
- Tytuł: "Nie znaleziono przepisów"
- Opis z sugestiami:
  - "Spróbuj dodać więcej produktów do lodówki"
  - "Wybierz inne źródło wyszukiwania"
  - "Wygeneruj przepis z AI"

**Obsługiwane zdarzenia:** Brak

**Warunki walidacji:** Brak

**Typy:** Brak

**Propsy:** Brak (statyczny komunikat)

---

### 4.19 FallbackActions

**Opis:** Przyciski akcji po pustym wyniku wyszukiwania.

**Główne elementy:**
- Button "Wróć do wyboru źródła" (secondary)
- Button "Generuj AI" (primary, jeśli source !== 'ai')

**Obsługiwane zdarzenia:**
- Click "Wróć" → `onBack()`
- Click "Generuj AI" → `onGenerateAI()`

**Warunki walidacji:**
- Button "Generuj AI" ukryty jeśli `source === 'ai'` (już próbowano AI)

**Typy:**
- `RecipeSource`

**Propsy:**
```typescript
interface FallbackActionsProps {
  source: RecipeSource;
  onBack: () => void;
  onGenerateAI: () => void;
}
```

---

### 4.20 CancelButton

**Opis:** Przycisk anulowania wyszukiwania podczas loading state.

**Główne elementy:**
- Button "Anuluj wyszukiwanie"
- Ikona X
- Styling: destructive variant

**Obsługiwane zdarzenia:**
- Click → wywołanie `onCancel()` → abort request

**Warunki walidacji:** Brak

**Typy:** Brak

**Propsy:**
```typescript
interface CancelButtonProps {
  onCancel: () => void;
  disabled?: boolean;
}
```

---

## 5. Typy

### 5.1 Typy DTO z API (zdefiniowane w types.ts)

Wykorzystywane typy request/response z types.ts:

```typescript
// Request dla search-by-fridge
SearchRecipesByFridgeDTO {
  use_all_fridge_items: boolean;
  custom_product_ids?: number[];
  max_results?: number; // default 10, range 1-50
  preferences?: SearchRecipePreferencesDTO;
}

SearchRecipePreferencesDTO {
  max_cooking_time?: number;
  difficulty?: DifficultyEnum;
  dietary_restrictions?: string[];
}

// Response dla search-by-fridge
SearchRecipesResponseDTO {
  results: RecipeSearchResultDTO[];
  search_metadata: SearchMetadataDTO;
}

RecipeSearchResultDTO {
  recipe: RecipeSummaryDTO;
  match_score: number; // 0.0 - 1.0
  available_ingredients: AvailableIngredientDTO[];
  missing_ingredients: AvailableIngredientDTO[];
}

AvailableIngredientDTO {
  product_id: number;
  product_name: string;
  required_quantity: number;
  available_quantity: number;
  unit: string;
}

SearchMetadataDTO {
  source: 'user_recipes' | 'external_api' | 'ai_generated';
  total_results: number;
  search_duration_ms: number;
}

// Request dla generate (AI fallback)
GenerateRecipeDTO {
  product_ids: number[];
  preferences?: GenerateRecipePreferencesDTO;
  save_to_recipes?: boolean; // default true
}

GenerateRecipePreferencesDTO {
  cuisine?: string;
  max_cooking_time?: number;
  difficulty?: DifficultyEnum;
  dietary_restrictions?: string[];
}

// Response dla generate
GenerateRecipeResponseDTO {
  recipe: RecipeDTO;
}
```

### 5.2 Nowe typy ViewModel (do utworzenia)

Typy pomocnicze dla widoku:

```typescript
// src/types/recipe-search.types.ts

/**
 * Enum reprezentujący źródła przepisów do wyboru
 */
export type RecipeSource = 'user' | 'api' | 'ai' | 'all';

/**
 * Stan widoku wyszukiwania
 */
export type SearchViewStep = 'source_selection' | 'loading' | 'results';

/**
 * Stan całego widoku
 */
export interface RecipeSearchViewState {
  step: SearchViewStep;
  source: RecipeSource | null;
  isLoading: boolean;
  searchStartTime: number | null; // timestamp
  searchDuration: number; // ms
  results: RecipeSearchResultDTO[] | null;
  searchMetadata: SearchMetadataDTO | null;
  error: SearchError | null;
  abortController: AbortController | null;
}

/**
 * Błąd wyszukiwania
 */
export interface SearchError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Dane kafelka źródła
 */
export interface SourceCardData {
  source: RecipeSource;
  title: string;
  description: string;
  icon: string; // nazwa ikony lub component
  badge?: number; // liczba przepisów (tylko dla 'user')
}

/**
 * Stan lodówki (do przekazania z SSR)
 */
export interface FridgeStatus {
  itemCount: number;
  isEmpty: boolean;
}

/**
 * Wynik formatowania match score dla UI
 */
export interface FormattedMatchScore {
  percentage: number; // 0-100
  label: string; // "95%"
  colorClass: string; // "text-green-600", "text-yellow-600", "text-red-600"
  borderClass: string; // "border-green-500", etc.
}

/**
 * Hook return type dla useRecipeSearch
 */
export interface UseRecipeSearchReturn {
  state: RecipeSearchViewState;
  actions: {
    selectSource: (source: RecipeSource) => Promise<void>;
    cancelSearch: () => void;
    retrySearch: () => Promise<void>;
    generateWithAI: () => Promise<void>;
    goBack: () => void;
  };
  helpers: {
    formatMatchScore: (score: number) => FormattedMatchScore;
    getSourceLabel: (source: RecipeSource) => string;
    isSearchTimedOut: () => boolean;
  };
}
```

### 5.3 Typy konfiguracyjne

```typescript
/**
 * Konfiguracja źródeł przepisów
 */
export const RECIPE_SOURCES: SourceCardData[] = [
  {
    source: 'user',
    title: 'Moje przepisy',
    description: 'Przeszukuj swoje zapisane przepisy',
    icon: 'BookOpen',
  },
  {
    source: 'api',
    title: 'API przepisów',
    description: 'Szukaj w bazie przepisów online',
    icon: 'Globe',
  },
  {
    source: 'ai',
    title: 'Generuj AI',
    description: 'Wygeneruj nowy przepis za pomocą AI',
    icon: 'Sparkles',
  },
  {
    source: 'all',
    title: 'Wszystkie źródła',
    description: 'Przeszukaj wszystkie dostępne źródła',
    icon: 'Search',
  },
];

/**
 * Timeouty dla wyszukiwania
 */
export const SEARCH_TIMEOUTS = {
  WARNING_THRESHOLD: 30000, // 30s - pokaż timeout warning
  MAX_DURATION: 45000, // 45s - maksymalny czas wyszukiwania
} as const;
```

## 6. Zarządzanie stanem

### 6.1 Custom Hook: useRecipeSearch

Główna logika zarządzania stanem widoku będzie zaimplementowana w custom hooku `useRecipeSearch`:

```typescript
// src/hooks/useRecipeSearch.ts

export function useRecipeSearch(initialFridgeItemCount?: number): UseRecipeSearchReturn {
  // Stan
  const [state, setState] = useState<RecipeSearchViewState>({
    step: 'source_selection',
    source: null,
    isLoading: false,
    searchStartTime: null,
    searchDuration: 0,
    results: null,
    searchMetadata: null,
    error: null,
    abortController: null,
  });
  
  // Timer dla search duration
  useEffect(() => {
    if (state.isLoading && state.searchStartTime) {
      const interval = setInterval(() => {
        setState(prev => ({
          ...prev,
          searchDuration: Date.now() - (prev.searchStartTime || 0),
        }));
      }, 100);
      
      return () => clearInterval(interval);
    }
  }, [state.isLoading, state.searchStartTime]);
  
  // Funkcje akcji
  const selectSource = async (source: RecipeSource) => {
    // Utworzenie AbortController
    const controller = new AbortController();
    
    setState(prev => ({
      ...prev,
      step: 'loading',
      source,
      isLoading: true,
      searchStartTime: Date.now(),
      searchDuration: 0,
      error: null,
      abortController: controller,
    }));
    
    try {
      // Wywołanie API
      const response = await fetch('/api/recipes/search-by-fridge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          use_all_fridge_items: true,
          max_results: 10,
          // TODO: mapowanie source na preferences
        }),
        signal: controller.signal,
      });
      
      if (!response.ok) {
        throw new Error('Search failed');
      }
      
      const data: SearchRecipesResponseDTO = await response.json();
      
      setState(prev => ({
        ...prev,
        step: 'results',
        isLoading: false,
        results: data.results,
        searchMetadata: data.search_metadata,
        abortController: null,
      }));
      
    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Użytkownik anulował - wróć do wyboru źródła
        setState(prev => ({
          ...prev,
          step: 'source_selection',
          source: null,
          isLoading: false,
          searchStartTime: null,
          abortController: null,
        }));
      } else {
        // Błąd API
        setState(prev => ({
          ...prev,
          step: 'results',
          isLoading: false,
          error: {
            code: 'SEARCH_ERROR',
            message: error.message || 'Nie udało się wyszukać przepisów',
          },
          results: [],
          searchMetadata: null,
          abortController: null,
        }));
      }
    }
  };
  
  const cancelSearch = () => {
    if (state.abortController) {
      state.abortController.abort();
    }
  };
  
  const retrySearch = async () => {
    if (state.source) {
      await selectSource(state.source);
    }
  };
  
  const generateWithAI = async () => {
    // TODO: implementacja generowania AI
    // Wywołanie POST /api/recipes/generate
  };
  
  const goBack = () => {
    setState(prev => ({
      ...prev,
      step: 'source_selection',
      source: null,
      isLoading: false,
      results: null,
      searchMetadata: null,
      error: null,
    }));
  };
  
  // Helper functions
  const formatMatchScore = (score: number): FormattedMatchScore => {
    const percentage = Math.round(score * 100);
    let colorClass = 'text-red-600';
    let borderClass = 'border-red-500';
    
    if (percentage >= 90) {
      colorClass = 'text-green-600';
      borderClass = 'border-green-500';
    } else if (percentage >= 70) {
      colorClass = 'text-yellow-600';
      borderClass = 'border-yellow-500';
    }
    
    return {
      percentage,
      label: `${percentage}%`,
      colorClass,
      borderClass,
    };
  };
  
  const getSourceLabel = (source: RecipeSource): string => {
    const labels: Record<RecipeSource, string> = {
      user: 'Moje przepisy',
      api: 'API przepisów',
      ai: 'AI',
      all: 'Wszystkie źródła',
    };
    return labels[source];
  };
  
  const isSearchTimedOut = (): boolean => {
    return state.searchDuration > SEARCH_TIMEOUTS.WARNING_THRESHOLD;
  };
  
  return {
    state,
    actions: {
      selectSource,
      cancelSearch,
      retrySearch,
      generateWithAI,
      goBack,
    },
    helpers: {
      formatMatchScore,
      getSourceLabel,
      isSearchTimedOut,
    },
  };
}
```

### 6.2 Struktura stanu

Stan widoku zarządzany jest w jednym miejscu (useRecipeSearch hook) i składa się z:

1. **step**: Aktualny krok widoku (source_selection, loading, results)
2. **source**: Wybrane źródło przepisów
3. **isLoading**: Czy trwa wyszukiwanie
4. **searchStartTime**: Timestamp rozpoczęcia wyszukiwania
5. **searchDuration**: Czas trwania wyszukiwania (ms, aktualizowany co 100ms)
6. **results**: Wyniki wyszukiwania
7. **searchMetadata**: Metadata wyszukiwania (źródło, liczba wyników, czas)
8. **error**: Błąd (jeśli wystąpił)
9. **abortController**: Controller do anulowania requestu

### 6.3 URL State Sync (opcjonalnie)

Można rozważyć synchronizację stanu z URL (za pomocą useSearchParams z React Router lub custom implementacji):

- URL: `/recipes/search` → step: 'source_selection'
- URL: `/recipes/search?source=user&loading=true` → step: 'loading'
- URL: `/recipes/search?source=user` → step: 'results'

Jednak dla uproszczenia MVP, można to pominąć i zarządzać stanem tylko w React state.

## 7. Integracja API

### 7.1 POST /api/recipes/search-by-fridge

**Endpoint:** `/api/recipes/search-by-fridge`  
**Metoda:** POST  
**Autoryzacja:** Bearer token (automatycznie przez Supabase client)

**Request type:** `SearchRecipesByFridgeDTO`

```typescript
// Przykładowy request body
{
  "use_all_fridge_items": true,
  "max_results": 10,
  "preferences": {
    "max_cooking_time": 60,
    "difficulty": "easy",
    "dietary_restrictions": ["vegetarian"]
  }
}
```

**Response type:** `SearchRecipesResponseDTO`

```typescript
// Przykładowa response
{
  "results": [
    {
      "recipe": {
        "id": 1,
        "title": "Zupa pomidorowa",
        "description": "Prosta zupa",
        "instructions": "...",
        "cooking_time": 30,
        "difficulty": "easy",
        "source": "user",
        "ingredients": [...],
        "tags": [...],
        "created_at": "2025-01-01T00:00:00Z",
        "updated_at": "2025-01-01T00:00:00Z"
      },
      "match_score": 0.95,
      "available_ingredients": [
        {
          "product_id": 10,
          "product_name": "Pomidor",
          "required_quantity": 5,
          "available_quantity": 8,
          "unit": "szt"
        }
      ],
      "missing_ingredients": []
    }
  ],
  "search_metadata": {
    "source": "user_recipes",
    "total_results": 3,
    "search_duration_ms": 45
  }
}
```

**Obsługa błędów:**

- `401` - Nieautoryzowany (redirect do /login)
- `422` - Błąd walidacji (wyświetl details)
- `500` - Błąd serwera (pokaż error message + retry)
- `AbortError` - Użytkownik anulował (wróć do wyboru źródła)

### 7.2 POST /api/recipes/generate

**Endpoint:** `/api/recipes/generate`  
**Metoda:** POST  
**Autoryzacja:** Bearer token

**Request type:** `GenerateRecipeDTO`

```typescript
// Przykładowy request body
{
  "product_ids": [10, 15, 20],
  "preferences": {
    "cuisine": "Italian",
    "max_cooking_time": 45,
    "difficulty": "easy",
    "dietary_restrictions": ["vegetarian"]
  },
  "save_to_recipes": true
}
```

**Response type:** `GenerateRecipeResponseDTO`

```typescript
// Przykładowa response (201 Created)
{
  "recipe": {
    "id": 25,
    "title": "Makaron z pomidorami",
    "description": "Szybki włoski makaron",
    "instructions": "...",
    "cooking_time": 25,
    "difficulty": "easy",
    "source": "ai",
    "metadata": {
      "ai_model": "anthropic/claude-3-sonnet",
      "generation_timestamp": "2025-10-18T12:00:00Z"
    },
    "ingredients": [...],
    "tags": [...],
    "created_at": "2025-10-18T12:00:00Z",
    "updated_at": "2025-10-18T12:00:00Z"
  }
}
```

**Obsługa błędów:**

- `400` - Błąd walidacji
- `401` - Nieautoryzowany
- `404` - Produkt nie znaleziony
- `429` - Rate limit exceeded (pokaż retry time)
- `500` - Błąd AI service
- `503` - AI service niedostępny

### 7.3 Fetch Helper Function

```typescript
// src/lib/api/recipe-search.api.ts

export async function searchRecipesByFridge(
  searchDto: SearchRecipesByFridgeDTO,
  signal?: AbortSignal
): Promise<SearchRecipesResponseDTO> {
  const response = await fetch('/api/recipes/search-by-fridge', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(searchDto),
    signal,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Search failed');
  }

  return response.json();
}

export async function generateRecipeWithAI(
  generateDto: GenerateRecipeDTO,
  signal?: AbortSignal
): Promise<GenerateRecipeResponseDTO> {
  const response = await fetch('/api/recipes/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(generateDto),
    signal,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Generation failed');
  }

  return response.json();
}
```

## 8. Interakcje użytkownika

### 8.1 Główny przepływ użytkownika (Happy Path)

1. **Wejście na stronę** `/recipes/search`
   - Załadowanie Step 1: Wybór źródła
   - Sprawdzenie liczby produktów w lodówce
   - Wyświetlenie ostrzeżenia jeśli lodówka pusta

2. **Wybór źródła**
   - Kliknięcie na jeden z 4 kafelków (user/api/ai/all)
   - Przejście do Step 2: Loading
   - Rozpoczęcie wyszukiwania (POST /api/recipes/search-by-fridge)

3. **Loading**
   - Wyświetlenie skeleton cards z shimmer animation
   - Aktualizacja czasu wyszukiwania co 100ms
   - Po 30s: wyświetlenie timeout warning
   - Możliwość anulowania (abort request)

4. **Wyniki**
   - Wyświetlenie listy przepisów z match scores
   - Wyświetlenie metadata (źródło, liczba wyników, czas)
   - Kliknięcie na przepis → nawigacja do `/recipes/[id]`
   - Kliknięcie "Lista zakupów" → nawigacja do `/shopping-list?recipe_id=[id]`

### 8.2 Przepływ alternatywny: Brak wyników

1. Wyszukiwanie zwraca pustą listę
2. Wyświetlenie EmptyResults component
3. Użytkownik ma opcje:
   - "Wróć do wyboru źródła" → powrót do Step 1
   - "Generuj AI" → wywołanie POST /api/recipes/generate

### 8.3 Przepływ błędu: Timeout/Error

1. Wyszukiwanie kończy się błędem
2. Wyświetlenie error message w Step 3
3. Opcje użytkownika:
   - "Spróbuj ponownie" → retry search
   - "Wróć" → powrót do Step 1
   - "Generuj AI" → fallback do AI

### 8.4 Przepływ anulowania

1. Użytkownik w Step 2 (loading) klika "Anuluj"
2. Wywołanie `abortController.abort()`
3. Request jest anulowany
4. Powrót do Step 1 (wybór źródła)

### 8.5 Szczegółowe interakcje

| Interakcja | Element | Akcja | Rezultat |
|------------|---------|-------|----------|
| Click kafelek "Moje przepisy" | SourceCard | selectSource('user') | Wywołanie API search-by-fridge z filtrem na user recipes |
| Click kafelek "API przepisów" | SourceCard | selectSource('api') | Wywołanie API search-by-fridge z preferencją API tier |
| Click kafelek "Generuj AI" | SourceCard | selectSource('ai') | Wywołanie API search-by-fridge z preferencją AI tier |
| Click kafelek "Wszystkie źródła" | SourceCard | selectSource('all') | Wywołanie API search-by-fridge bez preferencji (hierarchiczne) |
| Click "Dodaj produkty" | EmptyFridgeWarning | navigate('/fridge') | Nawigacja do widoku lodówki |
| Click "Anuluj wyszukiwanie" | CancelButton | cancelSearch() | Abort request, powrót do Step 1 |
| Click "Wróć do wyboru źródła" | BackButton | goBack() | Powrót do Step 1 |
| Click na kartę przepisu | RecipeResultCard | navigate(`/recipes/${id}`) | Nawigacja do szczegółów przepisu |
| Click "Zobacz przepis" | RecipeResultCard | navigate(`/recipes/${id}`) | Nawigacja do szczegółów przepisu |
| Click "Lista zakupów" | RecipeResultCard | navigate(`/shopping-list?recipe_id=${id}`) | Nawigacja do listy zakupów |
| Click "Generuj AI" (w EmptyResults) | FallbackActions | generateWithAI() | Wywołanie POST /api/recipes/generate |
| Hover na karcie przepisu | RecipeResultCard | CSS hover | Scale(1.02), shadow-lg |
| Timeout 30s podczas loading | automatyczne | setState | Wyświetlenie TimeoutWarning |

## 9. Warunki i walidacja

### 9.1 Warunki renderowania komponentów

| Komponent | Warunek renderowania | Zależność |
|-----------|---------------------|-----------|
| SourceSelectionView | `step === 'source_selection'` | state.step |
| SearchLoadingView | `step === 'loading'` | state.step |
| SearchResultsView | `step === 'results'` | state.step |
| EmptyFridgeWarning | `fridgeItemCount === 0` | fridgeItemCount |
| FridgeStatusBanner | zawsze | - |
| TimeoutWarning | `searchDuration > 30000 && isLoading` | state.searchDuration, state.isLoading |
| RecipeResultsGrid | `results.length > 0` | state.results |
| EmptyResults | `results.length === 0 && !error` | state.results, state.error |
| ErrorMessage | `error !== null` | state.error |
| Badge (liczba przepisów) | `source === 'user'` | source |
| "Lista zakupów" button | `missing_ingredients.length > 0` | result.missing_ingredients |
| "Generuj AI" button (EmptyResults) | `source !== 'ai'` | state.source |

### 9.2 Walidacja danych przed wysłaniem do API

**Przed wywołaniem POST /api/recipes/search-by-fridge:**

1. Sprawdzenie czy użytkownik jest zalogowany (token JWT w cookies)
2. Jeśli `use_all_fridge_items = true`:
   - Sprawdzenie czy lodówka nie jest pusta (opcjonalnie na poziomie UI)
3. `max_results` w zakresie 1-50 (domyślnie 10)
4. `preferences.max_cooking_time` > 0 (jeśli podane)
5. `preferences.difficulty` w ['easy', 'medium', 'hard'] (jeśli podane)

**Przed wywołaniem POST /api/recipes/generate:**

1. Sprawdzenie czy użytkownik jest zalogowany
2. `product_ids.length >= 1 && <= 20`
3. Wszystkie `product_ids` muszą być valid (> 0)
4. Preferencje: analogicznie jak wyżej

### 9.3 Walidacja po otrzymaniu odpowiedzi

1. Sprawdzenie czy response ma status 200/201
2. Sprawdzenie czy response body jest valid JSON
3. Sprawdzenie czy `results` jest tablicą
4. Dla każdego result:
   - `recipe` nie jest null
   - `match_score` w zakresie 0.0 - 1.0
   - `available_ingredients` i `missing_ingredients` są tablicami

### 9.4 Walidacja UI state

1. **Match score color validation:**
   - >= 90% → zielony
   - 70-89% → żółty
   - < 70% → czerwony

2. **Search duration validation:**
   - < 30s → normalny loading
   - >= 30s → pokazanie timeout warning
   - >= 45s → automatyczne przerwanie (opcjonalnie)

3. **Empty state validation:**
   - `results.length === 0 && error === null` → EmptyResults
   - `results.length === 0 && error !== null` → ErrorMessage

## 10. Obsługa błędów

### 10.1 Błędy API

| Kod | Typ błędu | Akcja UI |
|-----|-----------|----------|
| 401 | Nieautoryzowany | Redirect do `/login`, komunikat "Sesja wygasła, zaloguj się ponownie" |
| 422 | Błąd walidacji | Wyświetl details walidacji w toast/alert, zaznacz błędne pola |
| 404 | Nie znaleziono produktu | Komunikat "Wybrane produkty nie istnieją", przycisk "Wróć" |
| 429 | Rate limit | Komunikat "Zbyt wiele zapytań, spróbuj za X sekund", countdown timer |
| 500 | Błąd serwera | Komunikat "Wystąpił błąd serwera", przycisk "Spróbuj ponownie" |
| 503 | Service unavailable | Komunikat "Usługa AI jest niedostępna", przycisk "Wróć" lub "Spróbuj innego źródła" |

### 10.2 Błędy sieciowe

| Błąd | Scenariusz | Akcja UI |
|------|------------|----------|
| Network error | Brak połączenia | Komunikat "Brak połączenia z internetem", przycisk "Spróbuj ponownie" |
| Timeout | Request > 45s | Komunikat "Zapytanie trwa zbyt długo", przycisk "Anuluj" lub "Spróbuj ponownie" |
| AbortError | Użytkownik anulował | Powrót do Step 1, brak komunikatu błędu |

### 10.3 Błędy walidacji lokalnej

| Błąd | Scenariusz | Akcja UI |
|------|------------|----------|
| Pusta lodówka | `fridgeItemCount === 0 && use_all_fridge_items = true` | Wyświetl EmptyFridgeWarning, pozwól na kontynuację (mniej precyzyjne wyniki) |
| Invalid source | URL param `source` nie jest valid | Redirect do Step 1, komunikat "Nieprawidłowe źródło" |

### 10.4 Komponenty obsługi błędów

**ErrorBoundary (React):**
```typescript
// Owinąć RecipeSearchView w ErrorBoundary
<ErrorBoundary fallback={<ErrorFallback />}>
  <RecipeSearchView />
</ErrorBoundary>
```

**ErrorMessage component:**
```typescript
interface ErrorMessageProps {
  error: SearchError;
  onRetry?: () => void;
  onGoBack?: () => void;
}

// Wyświetla:
// - Ikona błędu
// - Tytuł: "Wystąpił błąd"
// - Message: error.message
// - Przyciski: "Spróbuj ponownie" (jeśli onRetry), "Wróć" (jeśli onGoBack)
```

**Toast notifications (Shadcn/ui):**
- Sukces wyszukiwania: "Znaleziono X przepisów"
- Błąd: komunikat z error.message
- Warning: "Wyszukiwanie trwa dłużej niż zwykle"

### 10.5 Logging błędów

Wszystkie błędy powinny być logowane do konsoli:

```typescript
console.error('Recipe search error:', {
  source: state.source,
  error: error.message,
  timestamp: new Date().toISOString(),
  userId: user?.id,
});
```

Opcjonalnie: integracja z zewnętrznym serwisem (np. Sentry) dla produkcji.

## 11. Kroki implementacji

### Faza 1: Setup projektu (1-2h)

1. **Utworzenie struktury plików:**
   ```
   src/
   ├── pages/
   │   └── recipes/
   │       └── search.astro
   ├── components/
   │   └── recipe-search/
   │       ├── RecipeSearchView.tsx
   │       ├── SourceSelectionView.tsx
   │       ├── SearchLoadingView.tsx
   │       └── SearchResultsView.tsx
   ├── hooks/
   │   └── useRecipeSearch.ts
   ├── types/
   │   └── recipe-search.types.ts
   └── lib/
       └── api/
           └── recipe-search.api.ts
   ```

2. **Utworzenie typów:**
   - Utworzyć `src/types/recipe-search.types.ts` z wszystkimi ViewModel types
   - Zaimportować typy DTO z `src/types.ts`

3. **Przygotowanie stałych konfiguracyjnych:**
   - `RECIPE_SOURCES` array
   - `SEARCH_TIMEOUTS` object

### Faza 2: Implementacja Astro page (0.5h)

4. **Utworzenie `search.astro`:**
   ```astro
   ---
   import Layout from '../../layouts/Layout.astro';
   import RecipeSearchView from '../../components/recipe-search/RecipeSearchView';
   
   // Opcjonalnie: pobranie liczby produktów w lodówce na serwerze
   // const fridgeItemCount = await getFridgeItemCount();
   ---
   
   <Layout title="Wyszukiwanie przepisów">
     <RecipeSearchView client:load />
   </Layout>
   ```

### Faza 3: Custom Hook (3-4h)

5. **Implementacja `useRecipeSearch` hook:**
   - Stan: `RecipeSearchViewState`
   - Akcje: selectSource, cancelSearch, retrySearch, generateWithAI, goBack
   - Helpers: formatMatchScore, getSourceLabel, isSearchTimedOut
   - Timer dla searchDuration (useEffect)
   - Obsługa AbortController

6. **Testy jednostkowe hooka:**
   - Test selectSource (mock fetch)
   - Test cancelSearch (abort)
   - Test timer dla searchDuration
   - Test formatMatchScore

### Faza 4: API Helper Functions (1h)

7. **Implementacja `recipe-search.api.ts`:**
   - `searchRecipesByFridge()` function
   - `generateRecipeWithAI()` function
   - Error handling
   - TypeScript types

### Faza 5: Step 1 - Wybór źródła (4-5h)

8. **Implementacja `SourceSelectionView`:**
   - Layout z nagłówkiem
   - Integracja z `useRecipeSearch` hook
   - Renderowanie FridgeStatusBanner
   - Warunkowe renderowanie EmptyFridgeWarning

9. **Implementacja `FridgeStatusBanner`:**
   - Ikona lodówki (lucide-react)
   - Tekst z liczba produktów
   - Styling Tailwind

10. **Implementacja `EmptyFridgeWarning`:**
    - Ikona ostrzeżenia
    - Tekst komunikatu
    - Link do `/fridge`
    - Styling: bg-yellow-50, border-yellow-300

11. **Implementacja `SourceSelectionGrid`:**
    - CSS Grid: 2×2 desktop, 1×4 mobile
    - Mapowanie `RECIPE_SOURCES`
    - Renderowanie `SourceCard` × 4

12. **Implementacja `SourceCard`:**
    - Layout karty
    - Ikona (lucide-react icons)
    - Tytuł i opis
    - Badge (warunkowe, tylko dla 'user')
    - Hover animation (scale, shadow)
    - onClick handler
    - Accessibility: focus state, ARIA labels

### Faza 6: Step 2 - Loading (3-4h)

13. **Implementacja `SearchLoadingView`:**
    - Layout z SearchProgress
    - Grid skeletonów
    - Warunkowe renderowanie TimeoutWarning
    - CancelButton
    - ARIA live region

14. **Implementacja `SearchProgress`:**
    - Animated spinner (lucide-react Loader2)
    - Tekst z aktualnym źródłem
    - Opcjonalnie: progress bar

15. **Implementacja `RecipeCardSkeleton`:**
    - Struktura: badge, title (2 linie), ingredients (3-4 linie), footer
    - Shimmer animation (CSS gradient keyframes)
    - Tailwind: animate-pulse, bg-gradient

16. **Implementacja `TimeoutWarning`:**
    - Ikona spinner
    - Tekst komunikatu
    - Styling: bg-orange-50, border-orange-300

17. **Implementacja `CancelButton`:**
    - Button z ikoną X
    - onClick → cancelSearch()
    - Styling: variant destructive

### Faza 7: Step 3 - Wyniki (5-6h)

18. **Implementacja `SearchResultsView`:**
    - Layout z ResultsHeader
    - SearchMetadataBar
    - Warunkowe renderowanie: RecipeResultsGrid vs EmptyResults
    - Integracja z useRecipeSearch

19. **Implementacja `ResultsHeader`:**
    - BackButton
    - Tytuł z nazwą źródła

20. **Implementacja `SearchMetadataBar`:**
    - Ikona źródła
    - Tekst: "Znaleziono X przepisów..."
    - Styling: bg-gray-50

21. **Implementacja `RecipeResultsGrid`:**
    - CSS Grid: 3 kolumny desktop, 1 mobile
    - Mapowanie results
    - Renderowanie RecipeResultCard

22. **Implementacja `RecipeResultCard`:**
    - Match score badge (top-right, okrągły)
    - Tytuł przepisu
    - Opis (truncated)
    - Lista składników z ikonami (✓ zielony, ✗ czerwony)
    - Czas gotowania + trudność
    - Footer z przyciskami:
      - "Zobacz przepis"
      - "Lista zakupów" (warunkowo)
    - Border color zależny od match_score
    - Hover animation
    - onClick handlers

23. **Implementacja `EmptyResults`:**
    - EmptyStateMessage
    - FallbackActions

24. **Implementacja `EmptyStateMessage`:**
    - Ikona pustego stanu
    - Tytuł i opis z sugestiami
    - Styling

25. **Implementacja `FallbackActions`:**
    - Button "Wróć do wyboru źródła"
    - Button "Generuj AI" (warunkowo)
    - onClick handlers

### Faza 8: Integracja i testowanie (3-4h)

26. **Implementacja `RecipeSearchView` (główny komponent):**
    - Integracja useRecipeSearch
    - Warunkowe renderowanie kroków
    - Error handling
    - URL state sync (opcjonalnie)

27. **Testowanie E2E:**
    - Happy path: wybór źródła → loading → wyniki
    - Anulowanie wyszukiwania
    - Puste wyniki → fallback do AI
    - Błędy API → retry
    - Timeout warning
    - Pusta lodówka warning

28. **Testowanie responsywności:**
    - Desktop: gridy 2×2, 3 kolumny
    - Tablet: adaptacja layoutu
    - Mobile: gridy 1×N, pojedyncza kolumna

### Faza 9: Styling i polish (2-3h)

29. **Finalizacja stylów:**
    - Konsystencja kolorów (Tailwind classes)
    - Spacing i padding
    - Fonts i typography
    - Shadows i borders

30. **Animacje:**
    - Shimmer dla skeletonów
    - Hover effects dla kart
    - Transitions
    - Loading spinner

31. **Accessibility:**
    - ARIA labels
    - ARIA live regions
    - Keyboard navigation
    - Focus states
    - Alt texts dla ikon

### Faza 10: Optymalizacja i dokumentacja (1-2h)

32. **Optymalizacje:**
    - Memoization komponentów (React.memo)
    - useMemo dla ciężkich obliczeń
    - useCallback dla callbacks
    - Code splitting (jeśli potrzebne)

33. **Dokumentacja:**
    - Komentarze JSDoc dla komponentów
    - README dla foldera recipe-search
    - Przykłady użycia

34. **Code review i cleanup:**
    - Usunięcie console.logs
    - Sprawdzenie lint errors
    - Formatting (Prettier)

---

## Podsumowanie

Plan implementacji widoku wyszukiwania przepisów obejmuje 34 kroki pogrupowane w 10 faz. Szacowany czas implementacji: **24-32 godziny** pracy programisty frontendowego.

Kluczowe aspekty implementacji:
- **Trzy kroki widoku:** wybór źródła, loading, wyniki
- **Custom hook** `useRecipeSearch` dla zarządzania stanem
- **Hierarchiczne wyszukiwanie:** user recipes → API → AI
- **Obsługa błędów i edge cases:** timeout, anulowanie, puste wyniki
- **Responsywność:** desktop (grids 2×2, 3 kolumny), mobile (pojedyncze kolumny)
- **Accessibility:** ARIA labels, keyboard navigation, live regions
- **UX:** skeleton loading, match scores, fallback actions

Najważniejsze zależności:
- Endpointy API: `/api/recipes/search-by-fridge`, `/api/recipes/generate` (już zaimplementowane)
- Typy: `types.ts` (już zdefiniowane)
- Shadcn/ui components: Button, Card (do wykorzystania)
- Lucide React icons: dla ikon

Po implementacji widok będzie w pełni funkcjonalny i gotowy do integracji z resztą aplikacji Foodnager.

