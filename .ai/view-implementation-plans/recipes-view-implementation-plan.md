# Plan implementacji widoku Przepisy

## 1. Przegląd

Widok Przepisy to kluczowy komponent aplikacji Foodnager, umożliwiający użytkownikom przeglądanie, wyszukiwanie i zarządzanie swoimi przepisami kulinarnymi. Widok wspiera przepisy z trzech źródeł: utworzone przez użytkownika (USER), pobrane z zewnętrznego API (API) oraz wygenerowane przez AI (AI). Interfejs oferuje zaawansowane możliwości filtrowania, sortowania, wyszukiwania pełnotekstowego oraz zarządzania przepisami (tworzenie, edycja, usuwanie).

Widok realizuje User Story US-003 (Zarządzanie przepisami) z PRD, zapewniając intuicyjny i responsywny interfejs zgodny z architekturą Astro Islands oraz wytycznymi dostępności.

## 2. Routing widoku

- **Ścieżka:** `/recipes`
- **Plik:** `src/pages/recipes.astro`
- **Typ:** Strona Astro z zagnieżdżonymi React islands dla interaktywności
- **Wymagane uprawnienia:** Użytkownik musi być zalogowany (Bearer token)

## 3. Struktura komponentów

```
recipes.astro (Astro page)
│
├── Layout.astro (wrapper z nawigacją)
│
└── RecipeListView.tsx (React island, client:load)
    │
    ├── RecipeListHeader (React component)
    │   ├── PageTitle
    │   ├── RecipeStats (liczniki przepisów według źródeł)
    │   └── AddRecipeButton
    │
    ├── RecipeToolbar (React component)
    │   ├── SearchBar
    │   ├── SortDropdown
    │   ├── FilterMultiSelect
    │   └── AddRecipeButton (duplikat dla mobile)
    │
    ├── RecipeGrid (React component)
    │   └── RecipeCard[] (lista kart przepisów)
    │       ├── SourceBadge
    │       ├── RecipeTitle
    │       ├── IngredientsList (preview)
    │       ├── RecipeMeta (czas, trudność)
    │       └── RecipeActions (Szczegóły, Ugotuj)
    │
    ├── PaginationControls (React component)
    │
    ├── RecipeFormModal (React island, lazy load)
    │   ├── ModalHeader
    │   ├── BasicInfoSection
    │   ├── IngredientsSection (dynamic list)
    │   ├── InstructionsSection
    │   ├── MetaSection (czas, trudność, tagi)
    │   └── ModalFooter (Anuluj, Zapisz)
    │
    ├── DeleteConfirmDialog (React component, lazy)
    │
    └── EmptyState (React component)
```

## 4. Szczegóły komponentów

### 4.1 RecipeListView.tsx

**Opis:** Główny komponent widoku, zarządzający stanem, fetching danych, filtrowaniem, sortowaniem oraz wyświetlaniem przepisów.

**Główne elementy:**
- Container (`<main>`) z layoutem flex/grid
- Header z tytułem i statystykami
- Toolbar z wyszukiwarką i filtrami
- Grid kart przepisów (3 kolumny desktop, 2 tablet, 1 mobile)
- Paginacja
- Modal dodawania/edycji przepisu (conditional render)

**Obsługiwane interakcje:**
- Fetch przepisów przy montowaniu komponentu
- Wyszukiwanie z debouncing (300ms)
- Zmiana filtrów (źródło, trudność, tagi, czas gotowania)
- Zmiana sortowania
- Przechodzenie między stronami paginacji
- Otwieranie modalu dodawania/edycji przepisu
- Usuwanie przepisu z potwierdzeniem
- Nawigacja do szczegółów przepisu

**Obsługiwana walidacja:**
- Brak walidacji w tym komponencie (tylko wyświetlanie)

**Typy:**
- `RecipesListResponseDTO` - odpowiedź API
- `RecipeSummaryDTO[]` - lista przepisów
- `PaginationMetaDTO` - metadane paginacji
- `RecipeListFilters` (custom ViewModel) - stan filtrów

**Propsy:**
- `initialData?: RecipesListResponseDTO` - dane z SSR (opcjonalne)

### 4.2 RecipeListHeader

**Opis:** Header widoku z tytułem strony oraz statystykami przepisów (liczba ogółem i według źródeł).

**Główne elementy:**
- `<header>` z flexbox layout
- Tytuł "Moje przepisy" (`<h1>`)
- Liczniki: Ogółem, USER, API, AI (badges z kolorami)
- Przycisk "Dodaj przepis" (primary button, desktop)

**Obsługiwane interakcje:**
- Click "Dodaj przepis" → emit callback `onAddRecipe`

**Obsługiwana walidacja:**
- Brak

**Typy:**
- `RecipeStats` (custom ViewModel):
  ```typescript
  {
    total: number;
    userCount: number;
    apiCount: number;
    aiCount: number;
  }
  ```

**Propsy:**
- `stats: RecipeStats`
- `onAddRecipe: () => void`

### 4.3 RecipeToolbar

**Opis:** Toolbar z narzędziami do wyszukiwania, filtrowania i sortowania przepisów.

**Główne elementy:**
- Container (`<div>`) z flexbox layout (wrap na mobile)
- SearchBar (40% szerokości desktop, full mobile)
- SortDropdown
- FilterMultiSelect (z opcjami: źródło, trudność, tagi, max czas)
- Przycisk "Dodaj przepis" (mobile only, floated)

**Obsługiwane interakcje:**
- Wpisywanie w search bar → emit `onSearchChange` (debounced 300ms)
- Wybór sortowania → emit `onSortChange`
- Wybór filtrów → emit `onFilterChange`
- Click "Dodaj przepis" → emit `onAddRecipe`

**Obsługiwana walidacja:**
- Search: trim, max 100 znaków
- Max cooking time: number >= 0

**Typy:**
- `SortOption`: `{ field: 'title' | 'cooking_time' | 'difficulty' | 'created_at'; order: 'asc' | 'desc' }`
- `RecipeFilters` (custom ViewModel):
  ```typescript
  {
    source?: 'user' | 'api' | 'ai';
    difficulty?: 'easy' | 'medium' | 'hard';
    tagIds?: number[];
    maxCookingTime?: number;
  }
  ```

**Propsy:**
- `searchValue: string`
- `sortOption: SortOption`
- `filters: RecipeFilters`
- `availableTags: TagDTO[]` - z GET `/api/tags`
- `onSearchChange: (value: string) => void`
- `onSortChange: (option: SortOption) => void`
- `onFilterChange: (filters: RecipeFilters) => void`
- `onAddRecipe: () => void`

### 4.4 RecipeGrid

**Opis:** Grid wyświetlający karty przepisów w responsywnym układzie kolumnowym.

**Główne elementy:**
- Container (`<div>`) z CSS Grid (3 kolumny desktop, 2 tablet, 1 mobile)
- RecipeCard[] - lista kart przepisów
- EmptyState - gdy brak przepisów
- LoadingState - skeleton cards podczas ładowania

**Obsługiwane interakcje:**
- Click karty → emit `onRecipeClick`
- Click "Szczegóły" → nawigacja do `/recipes/:id`
- Click "Ugotuj" → emit `onCookRecipe`
- Click "Edytuj" (dropdown) → emit `onEditRecipe`
- Click "Usuń" (dropdown) → emit `onDeleteRecipe`

**Obsługiwana walidacja:**
- Brak

**Typy:**
- `RecipeSummaryDTO[]` - lista przepisów

**Propsy:**
- `recipes: RecipeSummaryDTO[]`
- `loading: boolean`
- `onRecipeClick: (id: number) => void`
- `onCookRecipe: (id: number) => void`
- `onEditRecipe: (recipe: RecipeSummaryDTO) => void`
- `onDeleteRecipe: (id: number) => void`

### 4.5 RecipeCard

**Opis:** Karta pojedynczego przepisu z obrazem placeholder, tytułem, składnikami, meta danymi i akcjami.

**Główne elementy:**
- Card container (Shadcn Card component)
- SourceBadge (prawy górny róg, position absolute)
- Tytuł przepisu (`<h3>`, 2-line clamp)
- Lista pierwszych 3-4 składników (1-line clamp) + "i X więcej"
- Footer z ikonami: czas gotowania, trudność
- Przyciski akcji: "Szczegóły" (secondary), "Ugotuj" (primary)
- Dropdown menu (three dots): Edytuj, Usuń (tylko dla USER source)

**Obsługiwane interakcje:**
- Click całej karty → `onRecipeClick`
- Click "Szczegóły" → `onDetailsClick`
- Click "Ugotuj" → `onCookClick`
- Click "Edytuj" → `onEditClick`
- Click "Usuń" → `onDeleteClick`
- Hover effect: scale(1.02), shadow

**Obsługiwana walidacja:**
- Brak

**Typy:**
- `RecipeSummaryDTO` - dane przepisu

**Propsy:**
- `recipe: RecipeSummaryDTO`
- `onRecipeClick: () => void`
- `onDetailsClick: () => void`
- `onCookClick: () => void`
- `onEditClick?: () => void` - tylko dla USER
- `onDeleteClick?: () => void` - tylko dla USER

### 4.6 RecipeFormModal

**Opis:** Modal do tworzenia i edycji przepisów. Full-screen na mobile, centered 600px na desktop. Zawiera formularz z czterema sekcjami: podstawowe info, składniki, instrukcje, meta.

**Główne elementy:**
- Dialog/Modal (Shadcn Dialog)
- Sticky Header: "Dodaj przepis" / "Edytuj przepis" + close button
- Form (`<form>`)
  - Sekcja 1: Tytuł (Input), Opis (Textarea)
  - Sekcja 2: Składniki (dynamic list)
    - Każdy wiersz: ProductAutocomplete + Quantity (number) + UnitSelect + Remove button
    - Button "+ Dodaj składnik"
  - Sekcja 3: Instrukcje (Textarea, min 10 znaków)
  - Sekcja 4: Meta
    - Czas gotowania (number input, minutes)
    - Trudność (Radio buttons: easy/medium/hard)
    - Tagi (Multi-select + opcja "+ Dodaj tag")
- Sticky Footer: "Anuluj" + "Zapisz przepis"

**Obsługiwane interakcje:**
- Otwieranie/zamykanie modalu
- Wypełnianie formularza
- Dodawanie/usuwanie składników (dynamic list)
- Autocomplete produktów (GET `/api/products?search=...`)
- Tworzenie nowego produktu inline (POST `/api/products`)
- Tworzenie nowego tagu inline (POST `/api/tags`)
- Submit formularza (POST `/api/recipes` lub PATCH `/api/recipes/:id`)
- Keyboard navigation: Enter = dodaj składnik, Escape = zamknij modal

**Obsługiwana walidacja:**
- **Tytuł:** required, min 1, max 100 znaków (trim)
- **Opis:** optional, max 500 znaków
- **Instrukcje:** required, min 10, max 5000 znaków
- **Składniki:** minimum 1, każdy z:
  - product_id: required, musi istnieć
  - quantity: required, > 0
  - unit_id: required, musi istnieć
  - Brak duplikatów product_id
- **Czas gotowania:** optional, > 0 jeśli podane
- **Trudność:** optional, enum: easy/medium/hard
- **Tagi:** optional, array of valid tag IDs

**Typy:**
- `CreateRecipeDTO` - request body dla POST
- `UpdateRecipeDTO` - request body dla PATCH
- `RecipeDTO` - response z API
- `RecipeFormData` (custom ViewModel):
  ```typescript
  {
    title: string;
    description?: string;
    instructions: string;
    cookingTime?: number;
    difficulty?: DifficultyEnum;
    ingredients: RecipeIngredientFormData[];
    tagIds?: number[];
  }
  ```
- `RecipeIngredientFormData`:
  ```typescript
  {
    productId: number;
    productName?: string; // dla display
    quantity: number;
    unitId: number;
  }
  ```

**Propsy:**
- `mode: 'add' | 'edit'`
- `recipe?: RecipeSummaryDTO` - dla trybu edit
- `isOpen: boolean`
- `onClose: () => void`
- `onSuccess: (recipe: RecipeDTO) => void`

### 4.7 PaginationControls

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

### 4.8 DeleteConfirmDialog

**Opis:** Dialog potwierdzenia usunięcia przepisu.

**Główne elementy:**
- Dialog (Shadcn AlertDialog)
- Tytuł: "Czy na pewno usunąć przepis?"
- Treść: "Przepis '[nazwa]' zostanie trwale usunięty. Tej operacji nie można cofnąć."
- Przyciski: "Anuluj" (secondary) + "Usuń" (destructive)

**Obsługiwane interakcje:**
- Click "Anuluj" → emit `onCancel`
- Click "Usuń" → emit `onConfirm`, loading state, wywołaj DELETE `/api/recipes/:id`

**Obsługiwana walidacja:**
- Brak

**Typy:**
- Brak specjalnych typów

**Propsy:**
- `isOpen: boolean`
- `recipeName: string`
- `onConfirm: () => Promise<void>`
- `onCancel: () => void`

### 4.9 EmptyState

**Opis:** Stan pusty gdy użytkownik nie ma żadnych przepisów.

**Główne elementy:**
- Container centered
- Ikona (duża, 64px)
- Tytuł: "Nie masz jeszcze przepisów"
- Opis: "Dodaj swój pierwszy przepis lub wyszukaj przepisy dopasowane do Twojej lodówki"
- Przyciski: "Dodaj przepis" (primary) + "Znajdź przepis" (secondary)

**Obsługiwane interakcje:**
- Click "Dodaj przepis" → emit `onAddRecipe`
- Click "Znajdź przepis" → navigate to `/recipes/search`

**Obsługiwana walidacja:**
- Brak

**Typy:**
- Brak

**Propsy:**
- `onAddRecipe: () => void`

### 4.10 SourceBadge

**Opis:** Badge wyświetlający źródło przepisu z odpowiednim kolorem i ikoną.

**Główne elementy:**
- Badge (Shadcn Badge) z custom styling
- Ikona (opcjonalna)
- Tekst: "MOJE" | "API" | "AI"

**Obsługiwane interakcje:**
- Brak (pure display)

**Obsługiwana walidacja:**
- Brak

**Typy:**
- `SourceEnum` - 'user' | 'api' | 'ai'

**Propsy:**
- `source: SourceEnum`

**Mapping kolorów:**
- USER: niebieski #3b82f6
- API: fioletowy #8b5cf6
- AI: pomarańczowy #f59e0b

## 5. Typy

### 5.1 Istniejące typy z types.ts

Wykorzystywane bezpośrednio z `src/types.ts`:

```typescript
// Request/Response DTOs
RecipesListResponseDTO {
  data: RecipeSummaryDTO[];
  pagination: PaginationMetaDTO;
}

RecipeSummaryDTO {
  id: number;
  title: string;
  description: string | null;
  instructions: string;
  cooking_time: number | null;
  difficulty: DifficultyEnum | null;
  source: SourceEnum;
  tags: TagDTO[];
  ingredients: RecipeIngredientDTO[];
  created_at: string;
  updated_at: string;
}

RecipeDTO extends RecipeSummaryDTO {
  metadata?: Json | null; // Dodatkowe pole
}

CreateRecipeDTO {
  title: string;
  description?: string | null;
  instructions: string;
  cooking_time?: number | null;
  difficulty?: DifficultyEnum | null;
  ingredients: CreateRecipeIngredientDTO[];
  tag_ids?: number[];
}

UpdateRecipeDTO {
  title?: string;
  description?: string | null;
  instructions?: string;
  cooking_time?: number | null;
  difficulty?: DifficultyEnum | null;
  ingredients?: CreateRecipeIngredientDTO[];
  tag_ids?: number[];
}

CreateRecipeIngredientDTO {
  product_id: number;
  quantity: number;
  unit_id: number;
}

RecipeIngredientDTO {
  product: ProductReferenceDTO;
  quantity: number;
  unit: UnitReferenceDTO;
}

TagDTO {
  id: number;
  name: string;
}

ProductReferenceDTO {
  id: number;
  name: string;
}

UnitReferenceDTO {
  id: number;
  name: string;
  abbreviation: string;
}

PaginationMetaDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

DifficultyEnum = 'easy' | 'medium' | 'hard'
SourceEnum = 'user' | 'api' | 'ai'
SortOrderEnum = 'asc' | 'desc'
```

### 5.2 Nowe typy ViewModel (do utworzenia)

Typy specyficzne dla widoku, używane w komponentach React:

```typescript
// src/components/recipes/types.ts

/**
 * Model widoku dla statystyk przepisów
 */
export interface RecipeStats {
  total: number;
  userCount: number;
  apiCount: number;
  aiCount: number;
}

/**
 * Opcje sortowania dla widoku przepisów
 */
export interface SortOption {
  field: 'title' | 'cooking_time' | 'difficulty' | 'created_at';
  order: 'asc' | 'desc';
}

/**
 * Filtry dla widoku przepisów
 */
export interface RecipeFilters {
  source?: SourceEnum;
  difficulty?: DifficultyEnum;
  tagIds?: number[];
  maxCookingTime?: number;
}

/**
 * Kompletny stan filtrów, sortowania i paginacji dla widoku
 */
export interface RecipeListState {
  search: string;
  sort: SortOption;
  filters: RecipeFilters;
  page: number;
  limit: number;
}

/**
 * Model formularza dodawania/edycji przepisu
 */
export interface RecipeFormData {
  title: string;
  description: string;
  instructions: string;
  cookingTime: number | null;
  difficulty: DifficultyEnum | null;
  ingredients: RecipeIngredientFormData[];
  tagIds: number[];
}

/**
 * Model składnika w formularzu
 */
export interface RecipeIngredientFormData {
  id?: string; // temporary ID dla key w React
  productId: number | null;
  productName: string; // dla display w autocomplete
  quantity: number;
  unitId: number | null;
}

/**
 * Błędy walidacji formularza
 */
export interface RecipeFormErrors {
  title?: string;
  description?: string;
  instructions?: string;
  cookingTime?: string;
  ingredients?: {
    [index: number]: {
      productId?: string;
      quantity?: string;
      unitId?: string;
    };
  };
}

/**
 * Props dla głównego widoku (z SSR)
 */
export interface RecipesPageProps {
  initialData?: RecipesListResponseDTO;
  initialTags?: TagDTO[];
  initialUnits?: UnitDTO[];
}
```

### 5.3 Mapowanie DTO ↔ ViewModel

Funkcje transformacji między API DTOs a ViewModels:

```typescript
// src/lib/mappers/recipe-view.mapper.ts

export function mapRecipeFormDataToCreateDTO(
  formData: RecipeFormData
): CreateRecipeDTO {
  return {
    title: formData.title.trim(),
    description: formData.description.trim() || null,
    instructions: formData.instructions.trim(),
    cooking_time: formData.cookingTime,
    difficulty: formData.difficulty,
    ingredients: formData.ingredients.map(ing => ({
      product_id: ing.productId!,
      quantity: ing.quantity,
      unit_id: ing.unitId!
    })),
    tag_ids: formData.tagIds.length > 0 ? formData.tagIds : undefined
  };
}

export function mapRecipeFormDataToUpdateDTO(
  formData: RecipeFormData
): UpdateRecipeDTO {
  // Podobne do CreateDTO, ale wszystkie pola opcjonalne
  const updates: UpdateRecipeDTO = {};
  
  if (formData.title) updates.title = formData.title.trim();
  if (formData.description !== undefined) 
    updates.description = formData.description.trim() || null;
  if (formData.instructions) updates.instructions = formData.instructions.trim();
  if (formData.cookingTime !== null) updates.cooking_time = formData.cookingTime;
  if (formData.difficulty !== null) updates.difficulty = formData.difficulty;
  if (formData.ingredients.length > 0) {
    updates.ingredients = formData.ingredients.map(ing => ({
      product_id: ing.productId!,
      quantity: ing.quantity,
      unit_id: ing.unitId!
    }));
  }
  if (formData.tagIds.length > 0) updates.tag_ids = formData.tagIds;
  
  return updates;
}

export function mapRecipeDTOToFormData(
  recipe: RecipeSummaryDTO | RecipeDTO
): RecipeFormData {
  return {
    title: recipe.title,
    description: recipe.description || '',
    instructions: recipe.instructions,
    cookingTime: recipe.cooking_time,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients.map((ing, index) => ({
      id: `ingredient-${index}`,
      productId: ing.product.id,
      productName: ing.product.name,
      quantity: ing.quantity,
      unitId: ing.unit.id
    })),
    tagIds: recipe.tags.map(tag => tag.id)
  };
}

export function calculateRecipeStats(
  recipes: RecipeSummaryDTO[]
): RecipeStats {
  return {
    total: recipes.length,
    userCount: recipes.filter(r => r.source === 'user').length,
    apiCount: recipes.filter(r => r.source === 'api').length,
    aiCount: recipes.filter(r => r.source === 'ai').length
  };
}
```

## 6. Zarządzanie stanem

### 6.1 Strategia

Widok wykorzystuje **lokalny stan komponentu React** (`useState`) bez zewnętrznych bibliotek state management. Zgodnie z architekturą Astro Islands, każdy island jest izolowany.

### 6.2 Stan w RecipeListView

```typescript
// Stan listy przepisów
const [recipes, setRecipes] = useState<RecipeSummaryDTO[]>(
  initialData?.data || []
);

// Stan paginacji
const [pagination, setPagination] = useState<PaginationMetaDTO>(
  initialData?.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 }
);

// Stan wyszukiwania i filtrów
const [search, setSearch] = useState<string>('');
const [sort, setSort] = useState<SortOption>({
  field: 'created_at',
  order: 'desc'
});
const [filters, setFilters] = useState<RecipeFilters>({});

// Stan UI
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

// Stan modalu
const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
const [editingRecipe, setEditingRecipe] = useState<RecipeSummaryDTO | null>(null);

// Stan dialogu usuwania
const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
const [recipeToDelete, setRecipeToDelete] = useState<number | null>(null);

// Dane słownikowe (cache)
const [tags, setTags] = useState<TagDTO[]>(initialTags || []);
const [units, setUnits] = useState<UnitDTO[]>(initialUnits || []);
```

### 6.3 Custom Hook: useRecipeList

Opcjonalnie można wydzielić logikę do custom hooka dla lepszej organizacji:

```typescript
// src/hooks/useRecipeList.ts

interface UseRecipeListOptions {
  initialData?: RecipesListResponseDTO;
}

interface UseRecipeListReturn {
  // Stan
  recipes: RecipeSummaryDTO[];
  pagination: PaginationMetaDTO;
  loading: boolean;
  error: string | null;
  search: string;
  sort: SortOption;
  filters: RecipeFilters;
  
  // Akcje
  fetchRecipes: () => Promise<void>;
  setSearch: (value: string) => void;
  setSort: (option: SortOption) => void;
  setFilters: (filters: RecipeFilters) => void;
  setPage: (page: number) => void;
  deleteRecipe: (id: number) => Promise<void>;
  refreshList: () => Promise<void>;
}

export function useRecipeList(
  options: UseRecipeListOptions = {}
): UseRecipeListReturn {
  const [recipes, setRecipes] = useState<RecipeSummaryDTO[]>(
    options.initialData?.data || []
  );
  const [pagination, setPagination] = useState<PaginationMetaDTO>(
    options.initialData?.pagination || { page: 1, limit: 20, total: 0, total_pages: 0 }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortOption>({ field: 'created_at', order: 'desc' });
  const [filters, setFilters] = useState<RecipeFilters>({});

  const fetchRecipes = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: ListRecipesQueryDTO = {
        page: pagination.page,
        limit: pagination.limit,
        search: search || undefined,
        sort: sort.field,
        order: sort.order,
        ...filters
      };

      const response = await apiClient.get<RecipesListResponseDTO>(
        '/api/recipes',
        params
      );

      setRecipes(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Nie udało się pobrać przepisów. Spróbuj ponownie.');
      console.error('Fetch recipes error:', err);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, search, sort, filters]);

  // Fetch przy zmianie parametrów
  useEffect(() => {
    fetchRecipes();
  }, [fetchRecipes]);

  const deleteRecipe = async (id: number) => {
    try {
      await apiClient.delete(`/api/recipes/${id}`);
      await refreshList();
    } catch (err) {
      throw new Error('Nie udało się usunąć przepisu');
    }
  };

  const refreshList = async () => {
    await fetchRecipes();
  };

  const setPage = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
  };

  return {
    recipes,
    pagination,
    loading,
    error,
    search,
    sort,
    filters,
    fetchRecipes,
    setSearch,
    setSort,
    setFilters,
    setPage,
    deleteRecipe,
    refreshList
  };
}
```

### 6.4 Synchronizacja z URL (opcjonalnie)

Dla lepszego UX można synchronizować filtry z URL params:

```typescript
// Inicjalizacja z URL params
const searchParams = new URLSearchParams(window.location.search);
const [search, setSearch] = useState(searchParams.get('search') || '');
const [filters, setFilters] = useState<RecipeFilters>({
  source: searchParams.get('source') as SourceEnum,
  difficulty: searchParams.get('difficulty') as DifficultyEnum,
  // ... inne filtry
});

// Update URL przy zmianie filtrów
useEffect(() => {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  if (filters.source) params.set('source', filters.source);
  if (filters.difficulty) params.set('difficulty', filters.difficulty);
  // ... inne filtry
  
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  window.history.replaceState({}, '', newUrl);
}, [search, filters]);
```

## 7. Integracja API

### 7.1 Lista przepisów (GET /api/recipes)

**Kiedy:** Przy montowaniu komponentu, zmianie filtrów, sortowania, strony, wyszukiwania

**Request:**
```typescript
// Query parameters
interface ListRecipesQuery {
  search?: string;
  source?: 'user' | 'api' | 'ai';
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: number[]; // comma-separated w URL
  max_cooking_time?: number;
  sort?: 'title' | 'cooking_time' | 'difficulty' | 'created_at';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// Wywołanie
const response = await apiClient.get<RecipesListResponseDTO>(
  '/api/recipes',
  {
    page: 1,
    limit: 20,
    search: 'tomato',
    source: 'user',
    difficulty: 'easy',
    tags: [1, 2],
    max_cooking_time: 30,
    sort: 'created_at',
    order: 'desc'
  }
);
```

**Response:**
```typescript
RecipesListResponseDTO {
  data: RecipeSummaryDTO[];
  pagination: PaginationMetaDTO;
}
```

**Obsługa błędów:**
- 401 Unauthorized → Redirect do `/login`
- 422 Unprocessable Entity → Toast z komunikatem błędu walidacji
- 500 Internal Server Error → Toast "Wystąpił błąd serwera"
- Network error → Toast "Brak połączenia z internetem"

### 7.2 Tworzenie przepisu (POST /api/recipes)

**Kiedy:** Submit formularza w RecipeFormModal (tryb add)

**Request:**
```typescript
const requestBody: CreateRecipeDTO = {
  title: 'Zupa pomidorowa',
  description: 'Prosta i pyszna zupa',
  instructions: '1. Pokrój pomidory...',
  cooking_time: 30,
  difficulty: 'easy',
  ingredients: [
    {
      product_id: 10,
      quantity: 5,
      unit_id: 1
    }
  ],
  tag_ids: [1, 2]
};

const response = await apiClient.post<RecipeDTO>('/api/recipes', requestBody);
```

**Response:**
```typescript
RecipeDTO {
  id: number;
  title: string;
  // ... pełne dane przepisu
  created_at: string;
  updated_at: string;
}
```

**Obsługa błędów:**
- 400 Bad Request → Wyświetl błędy walidacji w formularzu
- 404 Not Found → Toast "Produkt, jednostka lub tag nie istnieje"
- 409 Conflict → Toast "Przepis o tej nazwie już istnieje"

**Po sukcesie:**
1. Toast "Przepis został dodany"
2. Zamknij modal
3. Odśwież listę przepisów (fetchRecipes())
4. Opcjonalnie: nawigacja do `/recipes/:id`

### 7.3 Edycja przepisu (PATCH /api/recipes/:id)

**Kiedy:** Submit formularza w RecipeFormModal (tryb edit)

**Request:**
```typescript
const requestBody: UpdateRecipeDTO = {
  title: 'Zaktualizowana zupa',
  cooking_time: 25,
  // ... tylko zmienione pola
};

const response = await apiClient.patch<RecipeDTO>(
  `/api/recipes/${recipeId}`,
  requestBody
);
```

**Response:**
```typescript
RecipeDTO // zaktualizowany przepis
```

**Obsługa błędów:**
- 400 Bad Request → Błędy walidacji
- 404 Not Found → Toast "Przepis nie istnieje"

**Po sukcesie:**
1. Toast "Przepis został zaktualizowany"
2. Zamknij modal
3. Odśwież listę

### 7.4 Usuwanie przepisu (DELETE /api/recipes/:id)

**Kiedy:** Potwierdzenie w DeleteConfirmDialog

**Request:**
```typescript
await apiClient.delete(`/api/recipes/${recipeId}`);
```

**Response:**
- 204 No Content (puste body)

**Obsługa błędów:**
- 404 Not Found → Toast "Przepis nie istnieje"
- 403 Forbidden → Toast "Nie masz uprawnień do usunięcia tego przepisu"

**Po sukcesie:**
1. Toast "Przepis został usunięty"
2. Zamknij dialog
3. Odśwież listę
4. Jeśli była to ostatnia pozycja na stronie, przejdź do poprzedniej strony

### 7.5 Pobieranie tagów (GET /api/tags)

**Kiedy:** Przy otwieraniu RecipeFormModal (jeśli nie są już w cache)

**Request:**
```typescript
const response = await apiClient.get<TagsListResponseDTO>('/api/tags', {
  search: 'vege' // opcjonalnie
});
```

**Response:**
```typescript
TagsListResponseDTO {
  data: TagDTO[];
}
```

### 7.6 Tworzenie tagu (POST /api/tags)

**Kiedy:** Użytkownik wybiera "+ Dodaj tag" w multi-select

**Request:**
```typescript
const requestBody: CreateTagDTO = {
  name: 'bezglutenowe'
};

const response = await apiClient.post<TagDTO>('/api/tags', requestBody);
```

**Response:**
```typescript
TagDTO {
  id: number;
  name: string;
  created_at: string;
}
```

**Po sukcesie:**
1. Dodaj nowy tag do lokalnej listy tags
2. Automatycznie wybierz nowy tag w formularzu

### 7.7 API Client

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
          if (Array.isArray(value)) {
            url.searchParams.set(key, value.join(','));
          } else {
            url.searchParams.set(key, String(value));
          }
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: this.getHeaders()
    });

    return this.handleResponse<T>(response);
  }

  async post<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });

    return this.handleResponse<T>(response);
  }

  async patch<T>(endpoint: string, body: any): Promise<T> {
    const response = await fetch(endpoint, {
      method: 'PATCH',
      headers: this.getHeaders(),
      body: JSON.stringify(body)
    });

    return this.handleResponse<T>(response);
  }

  async delete(endpoint: string): Promise<void> {
    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers: this.getHeaders()
    });

    if (!response.ok) {
      throw await this.parseError(response);
    }
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

### 8.1 Przeglądanie przepisów

**Flow:**
1. Użytkownik wchodzi na `/recipes`
2. Widok ładuje się z danymi SSR (opcjonalnie) lub fetchuje dane client-side
3. Wyświetla grid kart przepisów
4. Użytkownik scrolluje i przegląda przepisy

**Elementy UI:**
- Grid responsywny (3/2/1 kolumny)
- Lazy loading obrazów (placeholder)
- Smooth scroll
- Hover effects na kartach

### 8.2 Wyszukiwanie przepisów

**Flow:**
1. Użytkownik wpisuje tekst w search bar
2. Debouncing 300ms
3. Wywołanie API z parametrem `search`
4. Loading state (skeleton cards)
5. Wyświetlenie wyników

**Elementy UI:**
- Search bar z ikoną lupy
- Clear button (X) gdy jest tekst
- Loading spinner w input podczas fetchu
- Info "Znaleziono X przepisów" lub "Brak wyników"

### 8.3 Filtrowanie przepisów

**Flow:**
1. Użytkownik otwiera dropdown "Filtruj"
2. Wybiera filtry: źródło (USER/API/AI), trudność, tagi, max czas
3. Każda zmiana → auto-submit (lub przycisk "Zastosuj")
4. Wywołanie API z parametrami filtrów
5. Wyświetlenie przefiltrowanych wyników

**Elementy UI:**
- Multi-select dropdown
- Checkboxes dla każdego filtru
- Badge pokazujący liczbę aktywnych filtrów
- Button "Wyczyść wszystkie"
- Slider dla max cooking time

### 8.4 Sortowanie przepisów

**Flow:**
1. Użytkownik otwiera dropdown "Sortuj"
2. Wybiera opcję: Najnowsze/Najstarsze/A-Z/Czas gotowania
3. Wywołanie API z parametrami sort + order
4. Wyświetlenie posortowanych wyników

**Elementy UI:**
- Single-select dropdown
- Radio buttons dla opcji sortowania
- Ikony strzałek (asc/desc)

### 8.5 Przechodzenie między stronami

**Flow:**
1. Użytkownik klika "Następna" lub numer strony
2. Wywołanie API z parametrem `page`
3. Scroll do góry strony
4. Wyświetlenie nowej strony wyników

**Elementy UI:**
- Pagination controls na dole gridu
- Disabled state dla prev/next gdy na końcu
- Current page bold/highlighted
- Info "Strona X z Y"

### 8.6 Dodawanie przepisu

**Flow:**
1. Użytkownik klika "Dodaj przepis"
2. Otwiera się modal RecipeFormModal
3. Użytkownik wypełnia formularz:
   - Tytuł (required)
   - Opis (optional)
   - Składniki (minimum 1):
     - Autocomplete produkt
     - Ilość
     - Jednostka
     - Click "+ Dodaj składnik" dla kolejnych
   - Instrukcje (required)
   - Czas gotowania (optional)
   - Trudność (optional, radio)
   - Tagi (optional, multi-select)
4. Click "Zapisz przepis"
5. Walidacja client-side
6. Submit POST /api/recipes
7. Loading state na przycisku
8. Success → Toast + zamknij modal + refresh listy
9. Error → wyświetl błędy w formularzu

**Elementy UI:**
- Modal full-screen (mobile) / centered 600px (desktop)
- Focus trap w modalu
- Validation errors inline (czerwone obramowanie + tekst)
- Loading spinner na przycisku submit
- Close button + ESC key

### 8.7 Edycja przepisu

**Flow:**
1. Użytkownik klika three dots na karcie przepisu (tylko USER source)
2. Wybiera "Edytuj" z dropdown
3. Otwiera się modal RecipeFormModal z prefilowanymi danymi
4. Użytkownik modyfikuje pola
5. Click "Zapisz przepis"
6. Submit PATCH /api/recipes/:id
7. Success → Toast + zamknij modal + refresh listy

**Elementy UI:**
- Ten sam modal co dodawanie, zmienia się tytuł "Edytuj przepis"
- Prefilowane wartości w polach
- Możliwość edycji wszystkich pól oprócz source

### 8.8 Usuwanie przepisu

**Flow:**
1. Użytkownik klika three dots na karcie przepisu
2. Wybiera "Usuń" z dropdown
3. Otwiera się DeleteConfirmDialog
4. Użytkownik czyta: "Czy na pewno usunąć przepis '[nazwa]'?"
5. Click "Usuń"
6. Loading state na przycisku
7. Submit DELETE /api/recipes/:id
8. Success → Toast + zamknij dialog + refresh listy
9. Jeśli ostatnia pozycja na stronie → przejdź do poprzedniej strony

**Elementy UI:**
- AlertDialog z czerwonym przyciskiem "Usuń"
- Wyraźne ostrzeżenie o trwałym usunięciu
- Przyciski: "Anuluj" (secondary) + "Usuń" (destructive)

### 8.9 Nawigacja do szczegółów przepisu

**Flow:**
1. Użytkownik klika "Szczegóły" na karcie przepisu
2. Nawigacja do `/recipes/:id`
3. Widok szczegółów przepisu (inny widok, poza scope tego planu)

**Elementy UI:**
- Link/button "Szczegóły"
- Cała karta również klikalna (optional)
- Hover effect wskazujący kliknięcie

### 8.10 Dodawanie nowego produktu inline

**Flow (w ramach formularza przepisu):**
1. Użytkownik wpisuje nazwę produktu w autocomplete
2. Produkt nie istnieje w liście
3. Wyświetla się opcja "+ Dodaj 'nazwa produktu'"
4. Click na opcję
5. Submit POST /api/products
6. Nowy produkt dodany do listy
7. Automatycznie wybrany w autocomplete

**Elementy UI:**
- Opcja z ikoną plus w dropdown autocomplete
- Loading state podczas dodawania
- Success feedback (highlight)

### 8.11 Dodawanie nowego tagu inline

**Flow (w ramach formularza przepisu):**
1. Użytkownik wpisuje nazwę tagu w multi-select
2. Tag nie istnieje
3. Wyświetla się opcja "+ Dodaj tag 'nazwa'"
4. Click na opcję
5. Submit POST /api/tags
6. Nowy tag dodany do listy
7. Automatycznie wybrany

**Elementy UI:**
- Podobnie jak produkty

## 9. Warunki i walidacja

### 9.1 Walidacja client-side w RecipeFormModal

**Tytuł:**
- **Warunek:** required, min 1 znak (po trim), max 100 znaków
- **Weryfikacja:** `onBlur` i `onSubmit`
- **Komunikat:** "Tytuł jest wymagany" / "Tytuł może mieć max 100 znaków"
- **UI:** Czerwone obramowanie input + tekst błędu pod polem

**Opis:**
- **Warunek:** optional, max 500 znaków
- **Weryfikacja:** `onBlur` i `onSubmit`
- **Komunikat:** "Opis może mieć max 500 znaków"
- **UI:** Licznik znaków "X/500"

**Instrukcje:**
- **Warunek:** required, min 10 znaków, max 5000 znaków
- **Weryfikacja:** `onBlur` i `onSubmit`
- **Komunikat:** "Instrukcje są wymagane (min. 10 znaków)" / "Instrukcje mogą mieć max 5000 znaków"
- **UI:** Licznik znaków, czerwone obramowanie

**Składniki:**
- **Warunek:** minimum 1 składnik
- **Weryfikacja:** `onSubmit`
- **Komunikat:** "Dodaj przynajmniej jeden składnik"
- **UI:** Alert box nad sekcją składników

**Każdy składnik:**
- **product_id:**
  - **Warunek:** required
  - **Weryfikacja:** `onBlur` wiersza składnika
  - **Komunikat:** "Wybierz produkt"
  - **UI:** Czerwone obramowanie autocomplete

- **quantity:**
  - **Warunek:** required, > 0
  - **Weryfikacja:** `onChange` (prevent negative), `onBlur`, `onSubmit`
  - **Komunikat:** "Ilość musi być większa od 0"
  - **UI:** Czerwone obramowanie input

- **unit_id:**
  - **Warunek:** required
  - **Weryfikacja:** `onBlur`
  - **Komunikat:** "Wybierz jednostkę"
  - **UI:** Czerwone obramowanie select

- **Duplikaty product_id:**
  - **Warunek:** każdy product_id tylko raz w liście
  - **Weryfikacja:** `onSubmit`, przy dodawaniu składnika
  - **Komunikat:** "Produkt '[nazwa]' już został dodany"
  - **UI:** Toast warning

**Czas gotowania:**
- **Warunek:** optional, jeśli podany: integer > 0
- **Weryfikacja:** `onChange` (prevent negative), `onBlur`
- **Komunikat:** "Czas gotowania musi być większy od 0"
- **UI:** Czerwone obramowanie, input type="number" min="1"

**Trudność:**
- **Warunek:** optional, enum: easy/medium/hard
- **Weryfikacja:** automatyczna przez radio buttons
- **Komunikat:** brak (nie może być błędu)
- **UI:** Radio group

**Tagi:**
- **Warunek:** optional, array of valid tag IDs
- **Weryfikacja:** automatyczna przez multi-select
- **Komunikat:** brak
- **UI:** Multi-select

### 9.2 Walidacja server-side (odpowiedź API)

**Błędy 400 Bad Request:**
- Mapowanie błędów z API response do pól formularza
- Wyświetlenie pod odpowiednimi polami
- Przykład: `{ "error": { "details": { "title": "Title is required" } } }`

### 9.3 Warunki wyświetlania elementów UI

**Przycisk "Edytuj" w karcie:**
- **Warunek:** `recipe.source === 'user'`
- **UI:** Widoczny tylko dla przepisów USER

**Przycisk "Usuń" w karcie:**
- **Warunek:** `recipe.source === 'user'`
- **UI:** Widoczny tylko dla przepisów USER

**EmptyState:**
- **Warunek:** `recipes.length === 0 && !loading`
- **UI:** Wyświetl empty state zamiast gridu

**Skeleton loading:**
- **Warunek:** `loading === true`
- **UI:** 6 skeleton cards zamiast prawdziwych kart

**Pagination controls:**
- **Warunek:** `pagination.total_pages > 1`
- **UI:** Widoczne tylko gdy więcej niż 1 strona

**Button "Poprzednia":**
- **Warunek:** `pagination.page > 1`
- **UI:** Enabled gdy nie pierwsza strona, inaczej disabled

**Button "Następna":**
- **Warunek:** `pagination.page < pagination.total_pages`
- **UI:** Enabled gdy nie ostatnia strona, inaczej disabled

**Badge liczby filtrów:**
- **Warunek:** `Object.keys(filters).length > 0`
- **UI:** Wyświetl badge z liczbą aktywnych filtrów

**Clear button w search bar:**
- **Warunek:** `search.length > 0`
- **UI:** Wyświetl X button do czyszczenia

## 10. Obsługa błędów

### 10.1 Błędy API

**401 Unauthorized:**
- **Przyczyna:** Brak lub nieprawidłowy token
- **Obsługa:** Redirect do `/login` + toast "Sesja wygasła. Zaloguj się ponownie."

**403 Forbidden:**
- **Przyczyna:** Próba edycji/usunięcia cudzego przepisu
- **Obsługa:** Toast "Nie masz uprawnień do wykonania tej operacji"

**404 Not Found:**
- **Przyczyna:** Przepis, produkt, jednostka lub tag nie istnieje
- **Obsługa:** Toast "Zasób nie został znaleziony"

**409 Conflict:**
- **Przyczyna:** Duplikat nazwy przepisu lub tagu
- **Obsługa:** Wyświetl błąd w formularzu pod polem "title" / "tag name"

**422 Unprocessable Entity:**
- **Przyczyna:** Błędy walidacji
- **Obsługa:** Parsuj `error.details` i wyświetl błędy pod odpowiednimi polami

**500 Internal Server Error:**
- **Przyczyna:** Błąd serwera
- **Obsługa:** Toast "Wystąpił błąd serwera. Spróbuj ponownie później."

**Network error:**
- **Przyczyna:** Brak internetu
- **Obsługa:** Toast "Brak połączenia z internetem. Sprawdź połączenie." + retry button

### 10.2 Błędy UI

**Empty state (brak wyników wyszukiwania):**
- **Przyczyna:** Wyszukiwanie nie zwróciło wyników
- **UI:** "Nie znaleziono przepisów pasujących do '[query]'" + sugestie: "Spróbuj innych słów kluczowych" + button "Wyczyść filtry"

**Empty state (brak przepisów użytkownika):**
- **Przyczyna:** Użytkownik nie ma żadnych przepisów
- **UI:** EmptyState z CTA "Dodaj przepis" + "Znajdź przepis"

**Failed to load recipes:**
- **Przyczyna:** Błąd podczas fetch
- **UI:** Error state z ikoną ostrzeżenia + "Nie udało się pobrać przepisów" + button "Spróbuj ponownie"

**Failed to delete recipe:**
- **Przyczyna:** Błąd podczas DELETE
- **UI:** Toast error "Nie udało się usunąć przepisu. Spróbuj ponownie."

**Failed to save recipe:**
- **Przyczyna:** Błąd podczas POST/PATCH
- **UI:** Toast error + zachowaj formularz otwarty + wyświetl błędy walidacji

### 10.3 Error Boundary

**React Error Boundary dla całego widoku:**
```typescript
// src/components/ErrorBoundary.tsx

class RecipeViewErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  state = { hasError: false, error: undefined };

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Recipe view error:', error, errorInfo);
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
- **UI:** Skeleton grid (6 skeleton cards)

**Searching/Filtering:**
- **UI:** Loading overlay na gridzie (blur + spinner)

**Deleting recipe:**
- **UI:** Disabled + spinner na przycisku "Usuń", disable entire dialog

**Saving recipe:**
- **UI:** Disabled + spinner na przycisku "Zapisz przepis", disable entire form

### 10.5 Toast Notifications

Wszystkie toasty używają globalnego ToastContext:

**Typy toastów:**
- **Success:** zielony, ikona checkmark, 5s auto-dismiss
- **Error:** czerwony, ikona X, 7s auto-dismiss + manual dismiss
- **Info:** niebieski, ikona info, 5s auto-dismiss
- **Warning:** pomarańczowy, ikona ostrzeżenia, 5s auto-dismiss

**Przykłady komunikatów:**
- Success: "Przepis został dodany", "Przepis został zaktualizowany", "Przepis został usunięty"
- Error: "Nie udało się zapisać przepisu", "Brak połączenia z internetem"
- Warning: "Produkt już został dodany do listy składników"

## 11. Kroki implementacji

### Krok 1: Struktura plików i podstawowe typy

1.1. Utworzenie struktury folderów:
```
src/
├── components/
│   └── recipes/
│       ├── RecipeListView.tsx
│       ├── RecipeListHeader.tsx
│       ├── RecipeToolbar.tsx
│       ├── RecipeGrid.tsx
│       ├── RecipeCard.tsx
│       ├── RecipeFormModal.tsx
│       ├── DeleteConfirmDialog.tsx
│       ├── EmptyState.tsx
│       ├── PaginationControls.tsx
│       ├── SourceBadge.tsx
│       └── types.ts
├── hooks/
│   └── useRecipeList.ts
├── lib/
│   └── mappers/
│       └── recipe-view.mapper.ts
└── pages/
    └── recipes.astro
```

1.2. Utworzenie pliku typów `src/components/recipes/types.ts`:
- Zdefiniowanie wszystkich ViewModels (RecipeStats, SortOption, RecipeFilters, RecipeListState, RecipeFormData, etc.)

1.3. Utworzenie mappera `src/lib/mappers/recipe-view.mapper.ts`:
- Funkcje transformacji DTO ↔ ViewModel

### Krok 2: Utility components (podstawowe komponenty UI)

2.1. **SourceBadge.tsx**:
- Prosty komponent wyświetlający badge z kolorem według source
- Mapping: USER → niebieski, API → fioletowy, AI → pomarańczowy

2.2. **EmptyState.tsx**:
- Komponent z ikoną, tekstem, opisem i przyciskami CTA
- Reużywalny dla różnych scenariuszy (brak przepisów, brak wyników)

2.3. **PaginationControls.tsx**:
- Komponenty kontrolek paginacji
- Disabled states dla prev/next
- Click handlers

### Krok 3: Custom hook useRecipeList

3.1. Implementacja `src/hooks/useRecipeList.ts`:
- Stan: recipes, pagination, loading, error, search, sort, filters
- Funkcje: fetchRecipes, setSearch, setSort, setFilters, setPage, deleteRecipe, refreshList
- useEffect do fetch przy zmianie parametrów
- Debouncing dla search

### Krok 4: RecipeCard component

4.1. Implementacja `src/components/recipes/RecipeCard.tsx`:
- Layout karty z Shadcn Card
- SourceBadge position absolute
- Truncate title (2 lines) i ingredients (1 line)
- Footer z meta info (czas, trudność)
- Dropdown menu (three dots) dla USER source
- Click handlers dla wszystkich akcji

4.2. Stylowanie:
- Responsive layout
- Hover effects (scale, shadow)
- Transition animations

### Krok 5: RecipeGrid component

5.1. Implementacja `src/components/recipes/RecipeGrid.tsx`:
- CSS Grid layout (3/2/1 kolumny)
- Map recipes do RecipeCard
- Conditional render: loading → skeleton, empty → EmptyState
- Przekazywanie event handlers do kart

5.2. Skeleton cards:
- 6 skeleton cards z shimmer animation
- Struktura podobna do RecipeCard

### Krok 6: RecipeToolbar components

6.1. **SearchBar** (może być reużywalny komponent):
- Input z ikoną lupy
- Clear button (X)
- Debounced onChange (300ms)
- Focus management

6.2. **SortDropdown**:
- Shadcn Select component
- Opcje: Najnowsze, Najstarsze, A-Z, Czas gotowania
- Icon pokazujący aktualny order (asc/desc)

6.3. **FilterMultiSelect**:
- Dropdown z checkboxes
- Sekcje: Źródło, Trudność, Tagi, Max czas
- Badge z liczbą aktywnych filtrów
- Button "Wyczyść wszystkie"

6.4. **RecipeToolbar**:
- Container łączący wszystkie powyższe
- Responsive layout (wrap na mobile)
- Button "Dodaj przepis" dla mobile

### Krok 7: RecipeListHeader component

7.1. Implementacja `src/components/recipes/RecipeListHeader.tsx`:
- Tytuł "Moje przepisy"
- Statystyki (badges z licznikami)
- Button "Dodaj przepis" dla desktop

7.2. Funkcja `calculateRecipeStats`:
- Zliczanie przepisów według źródła

### Krok 8: RecipeFormModal - podstawowa struktura

8.1. Implementacja skeleton `src/components/recipes/RecipeFormModal.tsx`:
- Shadcn Dialog z responsive layout
- Sticky header i footer
- Form z refs
- useState dla formData
- Validation state

8.2. Sekcja 1 - Podstawowe info:
- Input dla tytułu
- Textarea dla opisu
- Inline validation

8.3. Sekcja 3 - Instrukcje:
- Textarea z licznikiem znaków
- Min/max validation

8.4. Sekcja 4 - Meta:
- Number input dla czasu gotowania
- Radio group dla trudności
- Multi-select dla tagów

### Krok 9: RecipeFormModal - sekcja składników (najtrudniejsza)

9.1. Stan dla składników:
- Array of RecipeIngredientFormData
- Dynamic add/remove

9.2. Jeden wiersz składnika:
- ProductAutocomplete (GET /api/products)
- Number input dla quantity
- Select dla jednostki (GET /api/units)
- Remove button

9.3. Button "+ Dodaj składnik":
- Dodaje nowy pusty wiersz
- Auto-focus na autocomplete

9.4. Inline tworzenie produktu:
- Opcja w autocomplete "+ Dodaj produkt"
- POST /api/products
- Dodanie do lokalnej listy

9.5. Validation składników:
- Minimum 1 składnik
- Brak duplikatów product_id
- Wszystkie pola wypełnione
- Quantity > 0

### Krok 10: RecipeFormModal - submit i integracja API

10.1. Submit handler:
- Validate całego formularza
- Map RecipeFormData → CreateRecipeDTO / UpdateRecipeDTO
- POST /api/recipes lub PATCH /api/recipes/:id
- Loading state
- Error handling (wyświetl błędy w formularzu)
- Success → callback onSuccess + zamknij modal

10.2. Inicjalizacja w trybie edit:
- useEffect: jeśli recipe prop → mapuj na formData
- Prefill wszystkich pól

### Krok 11: DeleteConfirmDialog

11.1. Implementacja `src/components/recipes/DeleteConfirmDialog.tsx`:
- Shadcn AlertDialog
- Wyświetl nazwę przepisu
- Ostrzeżenie o trwałym usunięciu
- Loading state na przycisku
- onConfirm → DELETE /api/recipes/:id

### Krok 12: RecipeListView - główny komponent

12.1. Implementacja `src/components/recipes/RecipeListView.tsx`:
- Użycie useRecipeList hook
- Stan dla modalu (isOpen, editingRecipe)
- Stan dla delete dialog (isOpen, recipeToDelete)

12.2. Layout:
- RecipeListHeader
- RecipeToolbar
- RecipeGrid
- PaginationControls
- RecipeFormModal (conditional)
- DeleteConfirmDialog (conditional)

12.3. Event handlers:
- onAddRecipe → otwórz modal w trybie add
- onEditRecipe → otwórz modal w trybie edit z przepisem
- onDeleteRecipe → otwórz delete dialog
- onRecipeClick → nawigacja do /recipes/:id
- onCookRecipe → nawigacja do /recipes/:id lub bezpośrednie "ugotuj"

12.4. Przekazywanie props i callbacks do child components

### Krok 13: Strona Astro

13.1. Implementacja `src/pages/recipes.astro`:
- Użycie Layout.astro
- Opcjonalnie: fetch recipes SSR i przekaż jako initialData
- Fetch tags i units (dla modalu)
- Render RecipeListView jako island z client:load

```astro
---
import Layout from '../layouts/Layout.astro';
import RecipeListView from '../components/recipes/RecipeListView.tsx';

// Opcjonalnie SSR fetch
const recipesResponse = await fetch('http://localhost:4321/api/recipes');
const initialData = await recipesResponse.json();

const tagsResponse = await fetch('http://localhost:4321/api/tags');
const initialTags = await tagsResponse.json();

const unitsResponse = await fetch('http://localhost:4321/api/units');
const initialUnits = await unitsResponse.json();
---

<Layout title="Moje przepisy">
  <RecipeListView 
    client:load
    initialData={initialData}
    initialTags={initialTags.data}
    initialUnits={initialUnits.data}
  />
</Layout>
```

### Krok 14: Stylowanie i responsywność

14.1. Tailwind classes:
- Grid: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`
- Karty: hover, shadow, transitions
- Toolbar: flex wrap, responsive buttons

14.2. Breakpoints:
- Mobile: < 768px
- Tablet: 768px - 1023px
- Desktop: >= 1024px

14.3. Modal responsywność:
- Full-screen na mobile: `className="md:max-w-[600px]"`
- Sticky header/footer

### Krok 15: Accessibility

15.1. Semantic HTML:
- `<main>`, `<header>`, `<nav>`, `<article>`
- Proper heading hierarchy (h1 → h2 → h3)

15.2. ARIA attributes:
- `aria-label` dla icon buttons
- `aria-labelledby` dla modalu
- `aria-live` dla loading states

15.3. Keyboard navigation:
- Tab order logiczny
- Focus trap w modalu
- ESC zamyka modal
- Enter submits form

15.4. Focus visible:
- Custom focus ring (Tailwind: `focus:ring-2 focus:ring-amber-500`)

### Krok 16: Toast notifications

16.1. Integracja z globalnym ToastContext:
- Success toasts po dodaniu/edycji/usunięciu
- Error toasts przy błędach API

16.2. Przykłady:
```typescript
showToast('Przepis został dodany', 'success');
showToast('Nie udało się usunąć przepisu', 'error');
```

### Krok 17: Testowanie manualne

17.1. Scenariusze testowe:
- [ ] Wyświetlenie listy przepisów
- [ ] Wyszukiwanie przepisów (search)
- [ ] Filtrowanie (źródło, trudność, tagi, czas)
- [ ] Sortowanie (wszystkie opcje)
- [ ] Paginacja (next, prev, page numbers)
- [ ] Dodawanie przepisu (wszystkie pola)
- [ ] Dodawanie przepisu (tylko wymagane pola)
- [ ] Dodawanie składnika inline (produkt)
- [ ] Dodawanie tagu inline
- [ ] Walidacja formularza (wszystkie błędy)
- [ ] Edycja przepisu (tylko USER)
- [ ] Usuwanie przepisu (z potwierdzeniem)
- [ ] Empty state (brak przepisów)
- [ ] Empty state (brak wyników wyszukiwania)
- [ ] Loading states (skeleton, spinners)
- [ ] Error handling (401, 404, 500, network error)
- [ ] Responsywność (mobile, tablet, desktop)
- [ ] Keyboard navigation (tab, enter, esc)
- [ ] Accessibility (screen reader, focus management)

17.2. Edge cases:
- [ ] Bardzo długi tytuł przepisu (truncate)
- [ ] Przepis bez składników (błąd walidacji)
- [ ] Przepis z wieloma składnikami (scrollable)
- [ ] Usunięcie ostatniej pozycji na stronie (przejście do prev page)
- [ ] Duplikat product_id w składnikach (błąd walidacji)

### Krok 18: Optymalizacja wydajności

18.1. React.memo dla komponentów:
- RecipeCard (memo po recipe.id)
- PaginationControls (memo po pagination)

18.2. useCallback dla handlers:
- fetchRecipes, setSearch, setSort, setFilters

18.3. Debouncing:
- Search input (300ms)

18.4. Lazy loading:
- RecipeFormModal (React.lazy)
- DeleteConfirmDialog (React.lazy)

### Krok 19: Dokumentacja

19.1. JSDoc dla komponentów:
- Props interfaces
- Przykłady użycia

19.2. README dla widoku:
- Opis struktury
- Diagram komponentów
- Instrukcje development

### Krok 20: Code review i refactoring

20.1. Review checklist:
- [ ] Typy poprawne i kompletne
- [ ] Error handling wszędzie
- [ ] Loading states wszędzie
- [ ] Accessibility zgodne z WCAG AA
- [ ] Responsywność na wszystkich breakpointach
- [ ] Kod DRY (brak duplikacji)
- [ ] Komponenty reużywalne
- [ ] Performance (memo, callbacks)

20.2. Refactoring:
- Wydzielenie wspólnych utility functions
- Optymalizacja re-renders
- Cleanup console.logs

---

## Podsumowanie

Ten plan implementacji szczegółowo opisuje wszystkie aspekty widoku Przepisy, od architektury komponentów, przez typy i zarządzanie stanem, po integrację API i obsługę błędów. Implementacja powinna być wykonywana krok po kroku, testując każdy element przed przejściem do następnego. Kluczowe jest zachowanie spójności z architekturą Astro Islands, PRD oraz wytycznymi accessibility i UX opisanymi w `ui-plan.md`.

