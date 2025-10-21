# Plan implementacji widoku Recipe Details

## 1. Przegląd

Widok Recipe Details (Szczegóły przepisu) prezentuje pełne informacje o pojedynczym przepisie kulinarnym. Użytkownik może zobaczyć tytuł, opis, składniki z ilościami, instrukcje przygotowania oraz metadane (czas gotowania, trudność, tagi). Widok umożliwia również wykonanie kluczowych akcji: ugotowanie przepisu (z automatyczną aktualizacją lodówki), generowanie listy zakupów dla brakujących składników, edycję lub usunięcie przepisu (tylko dla przepisów użytkownika) oraz zapisanie przepisu z zewnętrznych źródeł do własnej kolekcji.

Kluczową funkcjonalnością jest wizualizacja dostępności składników poprzez color coding – użytkownik od razu widzi, które produkty ma w lodówce w wystarczającej ilości (zielony), które częściowo (pomarańczowy) i których brakuje (czerwony). To wspiera główny cel aplikacji: minimalizowanie marnowania żywności i ułatwianie podejmowania decyzji o gotowaniu.

**Powiązane User Stories:** US-003 (Zarządzanie przepisami), US-004 (Wyszukiwanie przepisu), US-005 (Generowanie listy zakupów)

## 2. Routing widoku

**Ścieżka:** `/recipes/:id`

**Parametry URL:**
- `id` (number) - identyfikator przepisu

**Query params (opcjonalne):**
- `from` (string) - informacja o źródle nawigacji (np. "search", "list", "history") dla customizacji back button
- `matchScore` (number) - wynik dopasowania z wyszukiwania (jeśli przyszło z search)

**Przykłady:**
- `/recipes/123` - podstawowy widok przepisu
- `/recipes/123?from=search&matchScore=85` - widok przepisu z wyników wyszukiwania

## 3. Struktura komponentów

```
RecipeDetailsPage (Astro page)
│
├── RecipeDetailsView (React component - główny kontener)
│   │
│   ├── RecipeHeader
│   │   ├── BackButton
│   │   ├── SourceBadge
│   │   ├── MatchScoreBadge (conditional)
│   │   └── RecipeActionsDropdown
│   │       ├── DropdownMenu (Shadcn/ui)
│   │       └── DropdownMenuItem (x4)
│   │
│   ├── RecipeMetaSection
│   │   ├── MetaItem (x3: czas, trudność, tagi)
│   │   └── TagBadge (multiple)
│   │
│   ├── RecipeIngredientsSection
│   │   ├── SectionHeader
│   │   ├── IngredientsList
│   │   │   └── IngredientItem (multiple)
│   │   │       ├── Checkbox (Shadcn/ui)
│   │   │       ├── AvailabilityIcon
│   │   │       └── AvailabilityLabel
│   │   └── GenerateShoppingListButton (conditional)
│   │
│   ├── RecipeInstructionsSection
│   │   ├── SectionHeader
│   │   └── InstructionsList (ordered list)
│   │       └── InstructionStep (multiple)
│   │
│   ├── StickyBottomBar (conditional visibility)
│   │   ├── CookButton (primary)
│   │   └── SaveRecipeButton (secondary, conditional)
│   │
│   ├── CookConfirmationDialog
│   │   ├── Dialog (Shadcn/ui)
│   │   ├── IngredientsDeductionPreview
│   │   └── DialogActions
│   │
│   ├── DeleteConfirmationDialog
│   │   ├── Dialog (Shadcn/ui)
│   │   └── DialogActions
│   │
│   └── LoadingSpinner / ErrorState
```

## 4. Szczegóły komponentów

### 4.1 RecipeDetailsView (główny kontener)

**Opis:** Główny komponent React zarządzający stanem całego widoku, fetchowaniem danych z API, koordynacją wszystkich podkomponentów oraz obsługą akcji użytkownika.

**Główne elementy:**
- Kontener `<div>` z odpowiednimi klasami Tailwind dla layoutu
- Warunkowo renderowane: LoadingSpinner (podczas ładowania), ErrorState (przy błędzie), lub pełna treść przepisu

**Obsługiwane interakcje:**
- Inicjalne załadowanie danych przepisu i lodówki
- Obsługa akcji "Ugotuj to" z confirmation dialog
- Obsługa akcji "Usuń przepis" z confirmation dialog
- Obsługa akcji "Zapisz do moich przepisów" (kopiowanie przepisu)
- Obsługa akcji "Generuj listę zakupów"
- Nawigacja powrotna

**Obsługiwana walidacja:**
- Weryfikacja, czy użytkownik ma wystarczające składniki do ugotowania (walidacja przed wywołaniem POST /api/cooking-history)
- Weryfikacja uprawnień do edycji/usunięcia (tylko źródło 'user')

**Typy:**
- `RecipeViewModel` - główny model danych przepisu z dodatkowymi polami
- `IngredientWithAvailability` - składnik z informacją o dostępności
- `FridgeItemDTO` - dane z lodówki
- `RecipeDTO` - bazowy typ z API

**Propsy:**
- `recipeId: number` - ID przepisu (z URL params)
- `initialFrom?: string` - źródło nawigacji (z query params)
- `initialMatchScore?: number` - wynik dopasowania (z query params)

### 4.2 RecipeHeader

**Opis:** Nagłówek przepisu zawierający back button, tytuł, badges (źródło, match score) oraz dropdown menu z akcjami.

**Główne elementy:**
- `<header>` z klasami Tailwind dla flexbox layout
- `<h1>` dla tytułu przepisu
- BackButton, SourceBadge, MatchScoreBadge (conditional)
- RecipeActionsDropdown

**Obsługiwane interakcje:**
- Kliknięcie back button - nawigacja wstecz
- Otwarcie dropdown menu
- Wybór akcji z menu: edytuj, usuń, zapisz, udostępnij (out of scope)

**Obsługiwana walidacja:**
- Walidacja czy source === 'user' dla pokazania opcji "Edytuj" i "Usuń"
- Walidacja czy source === 'api' || source === 'ai' dla pokazania opcji "Zapisz do moich przepisów"

**Typy:**
- `RecipeViewModel`
- `SourceEnum` ('user' | 'api' | 'ai')

**Propsy:**
```typescript
interface RecipeHeaderProps {
  title: string;
  source: SourceEnum;
  matchScore?: number;
  from?: string;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
  onBack: () => void;
}
```

### 4.3 BackButton

**Opis:** Przycisk nawigacji powrotnej z dynamicznym tekstem zależnie od źródła.

**Główne elementy:**
- `<button>` lub `<a>` z ikoną strzałki w lewo
- Tekst: "Wróć do przepisów" / "Wróć do wyników" / "Wróć" (zależnie od `from`)

**Obsługiwane interakcje:**
- Kliknięcie - nawigacja wstecz (history.back() lub navigate)

**Obsługiwana walidacja:**
- Brak specyficznej walidacji

**Typy:**
- Brak złożonych typów

**Propsy:**
```typescript
interface BackButtonProps {
  from?: string;
  onClick: () => void;
}
```

### 4.4 SourceBadge

**Opis:** Badge wizualizujący źródło przepisu.

**Główne elementy:**
- `<span>` lub komponent Badge z Shadcn/ui
- Tekst: "Mój przepis" (user), "Zewnętrzne API" (api), "Wygenerowane AI" (ai)
- Różne kolory dla każdego źródła

**Obsługiwane interakcje:**
- Brak interakcji

**Obsługiwana walidacja:**
- Brak walidacji

**Typy:**
- `SourceEnum`

**Propsy:**
```typescript
interface SourceBadgeProps {
  source: SourceEnum;
}
```

### 4.5 MatchScoreBadge

**Opis:** Badge pokazujący wynik dopasowania z wyszukiwania (conditional - tylko gdy przyszło z search).

**Główne elementy:**
- `<span>` lub komponent Badge z Shadcn/ui
- Tekst: "Dopasowanie: {score}%"
- Kolor zależny od score (zielony ≥80%, pomarańczowy 50-79%, czerwony <50%)

**Obsługiwane interakcje:**
- Brak interakcji

**Obsługiwana walidacja:**
- Renderowanie warunkowe: tylko gdy matchScore !== undefined

**Typy:**
- `number` dla score

**Propsy:**
```typescript
interface MatchScoreBadgeProps {
  matchScore: number;
}
```

### 4.6 RecipeActionsDropdown

**Opis:** Dropdown menu z dostępnymi akcjami dla przepisu (edytuj, usuń, zapisz).

**Główne elementy:**
- DropdownMenu (Shadcn/ui)
- DropdownMenuTrigger - przycisk z ikoną trzech kropek
- DropdownMenuContent
- DropdownMenuItem (x4, warunkowo renderowane):
  - "Edytuj przepis" (tylko user source)
  - "Usuń przepis" (tylko user source)
  - "Zapisz do moich przepisów" (tylko api/ai source)
  - "Udostępnij" (out of scope, disabled/hidden w MVP)

**Obsługiwane interakcje:**
- Otwarcie/zamknięcie dropdown
- Kliknięcie na "Edytuj" - wywołanie onEdit
- Kliknięcie na "Usuń" - wywołanie onDelete
- Kliknięcie na "Zapisz" - wywołanie onSave

**Obsługiwana walidacja:**
- Warunki renderowania: source === 'user' dla Edit/Delete
- Warunki renderowania: source !== 'user' dla Save

**Typy:**
- `SourceEnum`

**Propsy:**
```typescript
interface RecipeActionsDropdownProps {
  source: SourceEnum;
  onEdit: () => void;
  onDelete: () => void;
  onSave: () => void;
}
```

### 4.7 RecipeMetaSection

**Opis:** Sekcja prezentująca metadane przepisu: czas gotowania, trudność, tagi.

**Główne elementy:**
- `<section>` z flexbox layout
- MetaItem dla czasu gotowania (ikona zegara + wartość w min)
- MetaItem dla trudności (ikona + wartość: "Łatwy", "Średni", "Trudny")
- Lista TagBadge dla tagów

**Obsługiwane interakcje:**
- Brak interakcji (tylko prezentacja)

**Obsługiwana walidacja:**
- Warunki renderowania: czas gotowania i trudność są opcjonalne (null)

**Typy:**
- `DifficultyEnum` ('easy' | 'medium' | 'hard')
- `TagDTO[]`

**Propsy:**
```typescript
interface RecipeMetaSectionProps {
  cookingTime: number | null;
  difficulty: DifficultyEnum | null;
  tags: TagDTO[];
}
```

### 4.8 MetaItem

**Opis:** Pojedynczy element metadanych z ikoną i wartością.

**Główne elementy:**
- `<div>` z ikoną (z biblioteki ikon, np. lucide-react)
- `<span>` z tekstową wartością

**Obsługiwane interakcje:**
- Brak interakcji

**Obsługiwana walidacja:**
- Brak walidacji

**Typy:**
- `React.ReactNode` dla ikony
- `string` dla wartości

**Propsy:**
```typescript
interface MetaItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
}
```

### 4.9 TagBadge

**Opis:** Badge pojedynczego tagu.

**Główne elementy:**
- `<span>` lub komponent Badge z Shadcn/ui
- Tekst tagu

**Obsługiwane interakcje:**
- Opcjonalnie kliknięcie dla filtrowania (out of scope dla MVP)

**Obsługiwana walidacja:**
- Brak walidacji

**Typy:**
- `TagDTO`

**Propsy:**
```typescript
interface TagBadgeProps {
  tag: TagDTO;
}
```

### 4.10 RecipeIngredientsSection

**Opis:** Sekcja prezentująca listę składników z checklistą i color coding dostępności. Pod listą opcjonalny przycisk generowania listy zakupów.

**Główne elementy:**
- `<section>` z nagłówkiem "Składniki"
- IngredientsList - lista składników
- GenerateShoppingListButton (conditional - tylko gdy są brakujące składniki)

**Obsługiwane interakcje:**
- Kliknięcie na przycisk "Generuj listę zakupów" - wywołanie API i nawigacja

**Obsługiwana walidacja:**
- Warunki renderowania przycisku: hasMissingIngredients === true

**Typy:**
- `IngredientWithAvailability[]`

**Propsy:**
```typescript
interface RecipeIngredientsSectionProps {
  ingredients: IngredientWithAvailability[];
  onGenerateShoppingList: () => void;
}
```

### 4.11 IngredientsList

**Opis:** Lista składników jako semantic checklist.

**Główne elementy:**
- `<ul role="list">` lub `<div role="list">`
- Wielokrotne IngredientItem

**Obsługiwane interakcje:**
- Przekazuje interakcje do IngredientItem

**Obsługiwana walidacja:**
- Brak specyficznej walidacji

**Typy:**
- `IngredientWithAvailability[]`

**Propsy:**
```typescript
interface IngredientsListProps {
  ingredients: IngredientWithAvailability[];
}
```

### 4.12 IngredientItem

**Opis:** Pojedynczy składnik z checkboxem, ikoną dostępności, nazwą, ilością i color coding.

**Główne elementy:**
- `<li>` lub `<div role="listitem">`
- Checkbox (Shadcn/ui) - disabled, używany tylko do wizualizacji
- AvailabilityIcon - ikona statusu (checkmark, warning, x)
- Nazwa produktu + ilość + jednostka
- AvailabilityLabel (conditional) - pokazuje dostępne/wymagane dla partial availability

**Color coding:**
- Zielony: `availabilityStatus === 'full'` - produkt w pełnej ilości
- Pomarańczowy: `availabilityStatus === 'partial'` - produkt w częściowej ilości
- Czerwony: `availabilityStatus === 'none'` - produkt niedostępny

**Obsługiwane interakcje:**
- Checkbox czysto wizualny (disabled), brak interakcji

**Obsługiwana walidacja:**
- Brak walidacji

**Typy:**
- `IngredientWithAvailability`
- `AvailabilityStatus` ('full' | 'partial' | 'none')

**Propsy:**
```typescript
interface IngredientItemProps {
  ingredient: IngredientWithAvailability;
}
```

### 4.13 GenerateShoppingListButton

**Opis:** Przycisk generujący listę zakupów (secondary button).

**Główne elementy:**
- Button (Shadcn/ui) z wariantem secondary
- Ikona listy + tekst "Generuj listę zakupów"

**Obsługiwane interakcje:**
- Kliknięcie - wywołanie onClick handler

**Obsługiwana walidacja:**
- Brak walidacji

**Typy:**
- Brak złożonych typów

**Propsy:**
```typescript
interface GenerateShoppingListButtonProps {
  onClick: () => void;
  disabled?: boolean;
}
```

### 4.14 RecipeInstructionsSection

**Opis:** Sekcja prezentująca instrukcje przygotowania jako numerowaną listę kroków.

**Główne elementy:**
- `<section>` z nagłówkiem "Instrukcje"
- `<ol>` - numerowana lista
- Wielokrotne InstructionStep (`<li>`)

**Obsługiwane interakcje:**
- Brak interakcji (tylko prezentacja)

**Obsługiwana walidacja:**
- Parsowanie instrukcji: split przez \n lub wykrywanie numeracji w tekście

**Typy:**
- `string` - surowy tekst instrukcji
- `string[]` - parsowana lista kroków

**Propsy:**
```typescript
interface RecipeInstructionsSectionProps {
  instructions: string;
}
```

### 4.15 InstructionStep

**Opis:** Pojedynczy krok instrukcji.

**Główne elementy:**
- `<li>` z tekstem kroku

**Obsługiwane interakcje:**
- Brak interakcji

**Obsługiwana walidacja:**
- Brak walidacji

**Typy:**
- `string` dla tekstu

**Propsy:**
```typescript
interface InstructionStepProps {
  step: string;
  index: number;
}
```

### 4.16 StickyBottomBar

**Opis:** Sticky bar z akcjami "Ugotuj to" i "Zapisz przepis", pojawia się po zescrollowaniu poniżej fold.

**Główne elementy:**
- `<div>` z klasami sticky (fixed bottom)
- CookButton (primary)
- SaveRecipeButton (secondary, conditional - tylko dla api/ai source)

**Obsługiwane interakcje:**
- Kliknięcie "Ugotuj to" - wywołanie onCook
- Kliknięcie "Zapisz przepis" - wywołanie onSave
- Pojawienie się/znikanie na podstawie scroll position

**Obsługiwana walidacja:**
- Warunki renderowania: isVisible zależne od scroll position
- Warunki renderowania SaveButton: source !== 'user'

**Typy:**
- `SourceEnum`

**Propsy:**
```typescript
interface StickyBottomBarProps {
  source: SourceEnum;
  isVisible: boolean;
  onCook: () => void;
  onSave: () => void;
}
```

### 4.17 CookButton

**Opis:** Primary button dla akcji "Ugotuj to".

**Główne elementy:**
- Button (Shadcn/ui) z wariantem primary
- Ikona + tekst "Ugotuj to"

**Obsługiwane interakcje:**
- Kliknięcie - wywołanie onClick

**Obsługiwana walidacja:**
- Brak walidacji (walidacja odbywa się w parent component)

**Typy:**
- Brak złożonych typów

**Propsy:**
```typescript
interface CookButtonProps {
  onClick: () => void;
  disabled?: boolean;
}
```

### 4.18 SaveRecipeButton

**Opis:** Secondary button dla akcji "Zapisz przepis".

**Główne elementy:**
- Button (Shadcn/ui) z wariantem secondary
- Ikona + tekst "Zapisz przepis"

**Obsługiwane interakcje:**
- Kliknięcie - wywołanie onClick

**Obsługiwana walidacja:**
- Brak walidacji

**Typy:**
- Brak złożonych typów

**Propsy:**
```typescript
interface SaveRecipeButtonProps {
  onClick: () => void;
  disabled?: boolean;
}
```

### 4.19 CookConfirmationDialog

**Opis:** Dialog potwierdzenia przed ugotowaniem przepisu, pokazuje składniki które zostaną odjęte z lodówki.

**Główne elementy:**
- Dialog (Shadcn/ui)
- DialogHeader z tytułem "Potwierdź ugotowanie"
- DialogContent:
  - Tekst informacyjny: "Następujące składniki zostaną odjęte z Twojej lodówki:"
  - IngredientsDeductionPreview - lista składników do odjęcia
- DialogFooter z akcjami:
  - Przycisk "Anuluj" (secondary)
  - Przycisk "Potwierdź" (primary)

**Obsługiwane interakcje:**
- Kliknięcie "Anuluj" - zamknięcie dialogu
- Kliknięcie "Potwierdź" - wywołanie onConfirm i zamknięcie

**Obsługiwana walidacja:**
- Brak walidacji (walidacja wcześniej)

**Typy:**
- `IngredientWithAvailability[]`

**Propsy:**
```typescript
interface CookConfirmationDialogProps {
  isOpen: boolean;
  ingredients: IngredientWithAvailability[];
  onConfirm: () => void;
  onCancel: () => void;
}
```

### 4.20 IngredientsDeductionPreview

**Opis:** Lista składników które zostaną odjęte z lodówki po ugotowaniu.

**Główne elementy:**
- `<ul>` - lista składników
- Każdy element: nazwa + ilość do odjęcia

**Obsługiwane interakcje:**
- Brak interakcji (tylko prezentacja)

**Obsługiwana walidacja:**
- Filtrowanie: pokazuje tylko składniki dostępne (full lub partial)

**Typy:**
- `IngredientWithAvailability[]`

**Propsy:**
```typescript
interface IngredientsDeductionPreviewProps {
  ingredients: IngredientWithAvailability[];
}
```

### 4.21 DeleteConfirmationDialog

**Opis:** Dialog potwierdzenia przed usunięciem przepisu.

**Główne elementy:**
- Dialog (Shadcn/ui)
- DialogHeader z tytułem "Usuń przepis"
- DialogContent:
  - Tekst: "Czy na pewno chcesz usunąć przepis '{title}'? Ta akcja jest nieodwracalna."
- DialogFooter:
  - Przycisk "Anuluj" (secondary)
  - Przycisk "Usuń" (destructive)

**Obsługiwane interakcje:**
- Kliknięcie "Anuluj" - zamknięcie dialogu
- Kliknięcie "Usuń" - wywołanie onConfirm i zamknięcie

**Obsługiwana walidacja:**
- Brak walidacji

**Typy:**
- `string` dla tytułu

**Propsy:**
```typescript
interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  recipeTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
}
```

### 4.22 LoadingSpinner

**Opis:** Komponent wyświetlany podczas ładowania danych.

**Główne elementy:**
- Spinner (ikona lub animacja)
- Opcjonalny tekst "Ładowanie przepisu..."

**Obsługiwane interakcje:**
- Brak interakcji

**Obsługiwana walidacja:**
- Brak walidacji

**Typy:**
- Brak złożonych typów

**Propsy:**
- Brak propsów lub opcjonalnie `message: string`

### 4.23 ErrorState

**Opis:** Komponent wyświetlany przy błędzie ładowania.

**Główne elementy:**
- Ikona błędu
- Tekst błędu
- Przycisk "Spróbuj ponownie"

**Obsługiwane interakcje:**
- Kliknięcie "Spróbuj ponownie" - ponowne wywołanie fetch

**Obsługiwana walidacja:**
- Brak walidacji

**Typy:**
- `string` dla komunikatu błędu

**Propsy:**
```typescript
interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}
```

## 5. Typy

### 5.1 Typy z types.ts (istniejące)

```typescript
// Używane bezpośrednio z types.ts:
RecipeDTO {
  id: number;
  title: string;
  description: string | null;
  instructions: string;
  cooking_time: number | null;
  difficulty: DifficultyEnum | null;
  source: SourceEnum;
  metadata?: Json | null;
  tags: TagDTO[];
  ingredients: RecipeIngredientDTO[];
  created_at: string;
  updated_at: string;
}

RecipeIngredientDTO {
  product: ProductReferenceDTO;
  quantity: number;
  unit: UnitReferenceDTO;
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

TagDTO {
  id: number;
  name: string;
}

DifficultyEnum = 'easy' | 'medium' | 'hard';
SourceEnum = 'user' | 'api' | 'ai';

FridgeItemDTO {
  id: number;
  product: ProductReferenceDTO;
  quantity: number;
  unit: UnitReferenceDTO;
  expiry_date: string | null;
  created_at: string;
}

CreateCookingHistoryDTO {
  recipe_id: number;
}

GenerateShoppingListDTO {
  recipe_id: number;
}

ShoppingListResponseDTO {
  recipe: RecipeReferenceDTO;
  missing_ingredients: ShoppingListItemDTO[];
  total_items: number;
}
```

### 5.2 Nowe typy ViewModel (do utworzenia)

```typescript
/**
 * Status dostępności składnika w lodówce
 */
export type AvailabilityStatus = 'full' | 'partial' | 'none';

/**
 * Składnik z informacją o dostępności w lodówce
 */
export interface IngredientWithAvailability extends RecipeIngredientDTO {
  availabilityStatus: AvailabilityStatus;
  availableQuantity: number;
  requiredQuantity: number;
  // Ilość brakująca (0 dla full, >0 dla partial/none)
  missingQuantity: number;
}

/**
 * Rozszerzony model przepisu z dodatkowymi danymi dla widoku
 */
export interface RecipeViewModel extends RecipeDTO {
  // Składniki z informacją o dostępności
  enrichedIngredients: IngredientWithAvailability[];
  // Czy użytkownik ma wszystkie składniki
  hasAllIngredients: boolean;
  // Czy są jakieś brakujące składniki
  hasMissingIngredients: boolean;
  // Match score z wyszukiwania (opcjonalnie)
  matchScore?: number;
}

/**
 * Stan UI dla widoku Recipe Details
 */
export interface RecipeDetailsUIState {
  isLoading: boolean;
  error: string | null;
  recipe: RecipeViewModel | null;
  showDeleteDialog: boolean;
  showCookDialog: boolean;
  isDeleting: boolean;
  isCooking: boolean;
  isSaving: boolean;
  isGeneratingShoppingList: boolean;
}

/**
 * Parametry nawigacji dla widoku
 */
export interface RecipeDetailsNavigationParams {
  recipeId: number;
  from?: string;
  matchScore?: number;
}

/**
 * Helper type dla parsowania instrukcji
 */
export interface ParsedInstructions {
  steps: string[];
  isNumbered: boolean;
}
```

### 5.3 Typy dla utility functions

```typescript
/**
 * Rezultat porównania składnika z lodówką
 */
export interface IngredientAvailabilityCheckResult {
  status: AvailabilityStatus;
  availableQuantity: number;
  missingQuantity: number;
}

/**
 * Rezultat obliczeń dostępności dla całego przepisu
 */
export interface RecipeAvailabilityResult {
  enrichedIngredients: IngredientWithAvailability[];
  hasAllIngredients: boolean;
  hasMissingIngredients: boolean;
}
```

## 6. Zarządzanie stanem

### 6.1 Custom hook: useRecipeDetails

Główny hook zarządzający logiką widoku Recipe Details. Enkapsuluje state management, API calls i business logic.

```typescript
export function useRecipeDetails(recipeId: number, initialMatchScore?: number) {
  // State
  const [uiState, setUiState] = useState<RecipeDetailsUIState>({
    isLoading: true,
    error: null,
    recipe: null,
    showDeleteDialog: false,
    showCookDialog: false,
    isDeleting: false,
    isCooking: false,
    isSaving: false,
    isGeneratingShoppingList: false,
  });

  const [fridgeItems, setFridgeItems] = useState<FridgeItemDTO[]>([]);

  // Fetch recipe i fridge items przy mount
  useEffect(() => {
    fetchRecipeAndFridge();
  }, [recipeId]);

  // Funkcje API
  const fetchRecipeAndFridge = async () => {
    // Parallel fetch recipe + fridge
    // Transform do RecipeViewModel
    // Update state
  };

  const handleCook = async () => {
    // Walidacja dostępności składników
    // Wywołanie POST /api/cooking-history
    // Success toast + redirect do /history
  };

  const handleDelete = async () => {
    // Wywołanie DELETE /api/recipes/:id
    // Success toast + redirect do /recipes
  };

  const handleSave = async () => {
    // Wywołanie POST /api/recipes z danymi z obecnego przepisu (kopia)
    // Success toast + opcjonalnie redirect
  };

  const handleGenerateShoppingList = async () => {
    // Wywołanie POST /api/shopping-list/generate
    // Redirect do widoku listy zakupów lub pokazanie w modal/toast
  };

  // UI handlers
  const openCookDialog = () => setUiState(prev => ({ ...prev, showCookDialog: true }));
  const closeCookDialog = () => setUiState(prev => ({ ...prev, showCookDialog: false }));
  const openDeleteDialog = () => setUiState(prev => ({ ...prev, showDeleteDialog: true }));
  const closeDeleteDialog = () => setUiState(prev => ({ ...prev, showDeleteDialog: false }));

  return {
    uiState,
    fridgeItems,
    fetchRecipeAndFridge,
    handleCook,
    handleDelete,
    handleSave,
    handleGenerateShoppingList,
    openCookDialog,
    closeCookDialog,
    openDeleteDialog,
    closeDeleteDialog,
  };
}
```

### 6.2 Custom hook: useScrollVisibility

Hook do zarządzania widocznością sticky bottom bar na podstawie pozycji scrolla.

```typescript
export function useScrollVisibility(threshold: number = 300) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > threshold;
      setIsVisible(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return isVisible;
}
```

### 6.3 State flow

```
1. Mount komponentu
   ↓
2. useRecipeDetails hook inicjalizacja
   ↓
3. Fetch recipe + fridge (parallel)
   ↓
4. Calculate availability dla każdego składnika
   ↓
5. Transform do RecipeViewModel
   ↓
6. Update state → render UI
   ↓
7. User interactions:
   - Cook → validation → confirmation dialog → API call → redirect
   - Delete → confirmation dialog → API call → redirect
   - Save → API call → success toast
   - Generate shopping list → API call → navigation/modal
```

## 7. Integracja API

### 7.1 GET /api/recipes/:id

**Cel:** Pobranie szczegółowych danych przepisu.

**Request:**
- Method: `GET`
- URL: `/api/recipes/${recipeId}`
- Headers: `Authorization: Bearer {token}`

**Response Type:** `RecipeDTO`

**Success (200):**
```typescript
{
  id: number;
  title: string;
  description: string | null;
  instructions: string;
  cooking_time: number | null;
  difficulty: DifficultyEnum | null;
  source: SourceEnum;
  metadata?: Json | null;
  tags: TagDTO[];
  ingredients: RecipeIngredientDTO[];
  created_at: string;
  updated_at: string;
}
```

**Error responses:**
- `401 Unauthorized` - brak autoryzacji
- `404 Not Found` - przepis nie istnieje
- `500 Internal Error` - błąd serwera

**Implementacja:**
```typescript
async function fetchRecipe(recipeId: number): Promise<RecipeDTO> {
  const response = await fetch(`/api/recipes/${recipeId}`, {
    headers: {
      'Authorization': `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Przepis nie został znaleziony');
    }
    throw new Error('Błąd podczas pobierania przepisu');
  }

  return response.json();
}
```

### 7.2 GET /api/fridge

**Cel:** Pobranie wszystkich produktów z lodówki użytkownika do sprawdzenia dostępności.

**Request:**
- Method: `GET`
- URL: `/api/fridge`
- Headers: `Authorization: Bearer {token}`

**Response Type:** `FridgeListResponseDTO`

**Success (200):**
```typescript
{
  data: FridgeItemDTO[];
  pagination: PaginationMetaDTO;
}
```

**Implementacja:**
```typescript
async function fetchFridgeItems(): Promise<FridgeItemDTO[]> {
  const response = await fetch('/api/fridge?limit=1000', {
    headers: {
      'Authorization': `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    throw new Error('Błąd podczas pobierania lodówki');
  }

  const data = await response.json();
  return data.data;
}
```

### 7.3 POST /api/cooking-history

**Cel:** Rejestracja ugotowania przepisu i automatyczna aktualizacja lodówki.

**Request:**
- Method: `POST`
- URL: `/api/cooking-history`
- Headers: 
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- Body: `CreateCookingHistoryDTO`

**Request Type:** `CreateCookingHistoryDTO`
```typescript
{
  recipe_id: number;
}
```

**Response Type:** `CreateCookingHistoryResponseDTO`

**Success (201):**
```typescript
{
  id: number;
  recipe: RecipeReferenceDTO;
  cooked_at: string;
  fridge_state_before: FridgeStateDTO;
  fridge_state_after: FridgeStateDTO;
  updated_fridge_items: UpdatedFridgeItemDTO[];
}
```

**Error responses:**
- `400 Bad Request` - nieprawidłowe dane
- `401 Unauthorized` - brak autoryzacji
- `404 Not Found` - przepis nie istnieje
- `422 Unprocessable Entity` - brak wystarczających składników

**Implementacja:**
```typescript
async function cookRecipe(recipeId: number): Promise<CreateCookingHistoryResponseDTO> {
  const response = await fetch('/api/cooking-history', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipe_id: recipeId }),
  });

  if (!response.ok) {
    if (response.status === 422) {
      throw new Error('Brak wystarczających składników w lodówce');
    }
    throw new Error('Błąd podczas rejestracji gotowania');
  }

  return response.json();
}
```

### 7.4 POST /api/shopping-list/generate

**Cel:** Wygenerowanie listy zakupów dla brakujących składników.

**Request:**
- Method: `POST`
- URL: `/api/shopping-list/generate`
- Headers:
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- Body: `GenerateShoppingListDTO`

**Request Type:** `GenerateShoppingListDTO`
```typescript
{
  recipe_id: number;
}
```

**Response Type:** `ShoppingListResponseDTO`

**Success (200):**
```typescript
{
  recipe: RecipeReferenceDTO;
  missing_ingredients: ShoppingListItemDTO[];
  total_items: number;
}
```

**Implementacja:**
```typescript
async function generateShoppingList(recipeId: number): Promise<ShoppingListResponseDTO> {
  const response = await fetch('/api/shopping-list/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ recipe_id: recipeId }),
  });

  if (!response.ok) {
    throw new Error('Błąd podczas generowania listy zakupów');
  }

  return response.json();
}
```

### 7.5 DELETE /api/recipes/:id

**Cel:** Usunięcie przepisu użytkownika.

**Request:**
- Method: `DELETE`
- URL: `/api/recipes/${recipeId}`
- Headers: `Authorization: Bearer {token}`

**Response:** `204 No Content` (puste body)

**Error responses:**
- `401 Unauthorized` - brak autoryzacji
- `404 Not Found` - przepis nie istnieje lub nie należy do użytkownika

**Implementacja:**
```typescript
async function deleteRecipe(recipeId: number): Promise<void> {
  const response = await fetch(`/api/recipes/${recipeId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Przepis nie został znaleziony');
    }
    throw new Error('Błąd podczas usuwania przepisu');
  }
}
```

### 7.6 POST /api/recipes (dla "Zapisz przepis")

**Cel:** Utworzenie kopii przepisu z zewnętrznego źródła jako przepis użytkownika.

**Request:**
- Method: `POST`
- URL: `/api/recipes`
- Headers:
  - `Authorization: Bearer {token}`
  - `Content-Type: application/json`
- Body: `CreateRecipeDTO`

**Request Type:** `CreateRecipeDTO` (transformowany z RecipeDTO)

**Implementacja:**
```typescript
async function saveRecipeAsCopy(recipe: RecipeDTO): Promise<RecipeDTO> {
  // Transform RecipeDTO to CreateRecipeDTO
  const createDto: CreateRecipeDTO = {
    title: recipe.title,
    description: recipe.description,
    instructions: recipe.instructions,
    cooking_time: recipe.cooking_time,
    difficulty: recipe.difficulty,
    ingredients: recipe.ingredients.map(ing => ({
      product_id: ing.product.id,
      quantity: ing.quantity,
      unit_id: ing.unit.id,
    })),
    tag_ids: recipe.tags.map(tag => tag.id),
  };

  const response = await fetch('/api/recipes', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${getToken()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createDto),
  });

  if (!response.ok) {
    throw new Error('Błąd podczas zapisywania przepisu');
  }

  return response.json();
}
```

## 8. Interakcje użytkownika

### 8.1 Nawigacja do widoku

**Trigger:** Kliknięcie na przepis z listy, wyników wyszukiwania lub historii

**Akcja:**
1. Nawigacja do `/recipes/:id`
2. Opcjonalnie przekazanie query params: `from`, `matchScore`
3. Hook useRecipeDetails inicjalizuje fetch

**Rezultat:** Załadowanie i wyświetlenie szczegółów przepisu

### 8.2 Powrót do poprzedniego widoku

**Trigger:** Kliknięcie przycisku "Wróć"

**Akcja:**
1. Wywołanie `navigate(-1)` lub `history.back()`
2. Lub navigacja do `/recipes` jeśli history jest puste

**Rezultat:** Nawigacja do poprzedniej strony

### 8.3 Ugotowanie przepisu

**Trigger:** Kliknięcie przycisku "Ugotuj to"

**Akcja:**
1. Walidacja dostępności składników frontendowa
2. Jeśli nie wszystkie składniki dostępne → pokazanie error toast
3. Jeśli składniki dostępne → otwarcie confirmation dialog
4. User klika "Potwierdź" w dialogu
5. Wywołanie POST /api/cooking-history
6. Success → toast "Przepis ugotowany!" + redirect do `/history`
7. Error → toast z komunikatem błędu

**Rezultat:** 
- Sukces: przepis zarejestrowany, lodówka zaktualizowana, redirect do historii
- Błąd: komunikat dla użytkownika, pozostanie na widoku

### 8.4 Generowanie listy zakupów

**Trigger:** Kliknięcie przycisku "Generuj listę zakupów"

**Akcja:**
1. Wywołanie POST /api/shopping-list/generate
2. Success → pokazanie listy w modal/toast lub redirect do dedykowanego widoku
3. Error → toast z komunikatem błędu

**Rezultat:** 
- Sukces: wyświetlenie listy brakujących produktów
- Błąd: komunikat dla użytkownika

### 8.5 Usunięcie przepisu

**Trigger:** Wybór "Usuń przepis" z dropdown menu

**Akcja:**
1. Otwarcie confirmation dialog
2. User klika "Usuń"
3. Wywołanie DELETE /api/recipes/:id
4. Success → toast "Przepis usunięty" + redirect do `/recipes`
5. Error → toast z komunikatem błędu + zamknięcie dialogu

**Rezultat:**
- Sukces: przepis usunięty, redirect do listy przepisów
- Błąd: komunikat dla użytkownika, pozostanie na widoku

### 8.6 Zapisanie przepisu do własnej kolekcji

**Trigger:** Wybór "Zapisz do moich przepisów" z dropdown menu (tylko dla source !== 'user')

**Akcja:**
1. Transformacja RecipeDTO do CreateRecipeDTO
2. Wywołanie POST /api/recipes
3. Success → toast "Przepis zapisany!" + opcjonalnie redirect do nowego przepisu
4. Error → toast z komunikatem błędu

**Rezultat:**
- Sukces: nowy przepis utworzony jako kopia
- Błąd: komunikat dla użytkownika

### 8.7 Edycja przepisu

**Trigger:** Wybór "Edytuj" z dropdown menu (tylko dla source === 'user')

**Akcja:**
1. Nawigacja do `/recipes/:id/edit` (widok edycji - out of scope dla tego planu)

**Rezultat:** Przekierowanie do widoku edycji

### 8.8 Scroll i sticky bar

**Trigger:** User scrolluje stronę w dół

**Akcja:**
1. useScrollVisibility hook monitoruje pozycję scrolla
2. Gdy scrollY > threshold (np. 300px) → sticky bar staje się widoczny
3. Gdy scrollY <= threshold → sticky bar ukryty

**Rezultat:** Smooth pojawienie/znikanie sticky bar z akcjami

## 9. Warunki i walidacja

### 9.1 Walidacja dostępności składników

**Gdzie:** RecipeDetailsView, przed wywołaniem API cooking-history

**Warunek:**
```typescript
// Dla każdego składnika sprawdź dostępność w lodówce
ingredients.every(ing => ing.availabilityStatus === 'full')
```

**Wpływ na UI:**
- Jeśli false: przycisk "Ugotuj to" może pokazać warning lub error toast po kliknięciu
- Color coding składników (zielony/pomarańczowy/czerwony)

**Implementacja:**
```typescript
function validateIngredientsAvailability(
  ingredients: IngredientWithAvailability[]
): { canCook: boolean; missingIngredients: IngredientWithAvailability[] } {
  const missingIngredients = ingredients.filter(
    ing => ing.availabilityStatus !== 'full'
  );

  return {
    canCook: missingIngredients.length === 0,
    missingIngredients,
  };
}
```

### 9.2 Walidacja uprawnień do edycji/usunięcia

**Gdzie:** RecipeHeader, RecipeActionsDropdown

**Warunek:**
```typescript
recipe.source === 'user'
```

**Wpływ na UI:**
- Opcje "Edytuj" i "Usuń" w dropdown są widoczne tylko dla source === 'user'
- Dla source === 'api' lub 'ai' pokazuje się opcja "Zapisz do moich przepisów"

**Implementacja:**
```typescript
{source === 'user' && (
  <>
    <DropdownMenuItem onClick={onEdit}>Edytuj przepis</DropdownMenuItem>
    <DropdownMenuItem onClick={onDelete}>Usuń przepis</DropdownMenuItem>
  </>
)}
{source !== 'user' && (
  <DropdownMenuItem onClick={onSave}>Zapisz do moich przepisów</DropdownMenuItem>
)}
```

### 9.3 Walidacja potrzeby listy zakupów

**Gdzie:** RecipeIngredientsSection

**Warunek:**
```typescript
ingredients.some(ing => ing.availabilityStatus !== 'full')
// lub
recipe.hasMissingIngredients === true
```

**Wpływ na UI:**
- Przycisk "Generuj listę zakupów" jest widoczny tylko gdy są brakujące składniki
- Jeśli wszystkie składniki dostępne, przycisk ukryty

**Implementacja:**
```typescript
{hasMissingIngredients && (
  <GenerateShoppingListButton onClick={handleGenerateShoppingList} />
)}
```

### 9.4 Walidacja renderowania match score

**Gdzie:** RecipeHeader

**Warunek:**
```typescript
matchScore !== undefined && matchScore !== null
```

**Wpływ na UI:**
- MatchScoreBadge renderowany tylko gdy matchScore jest dostępny (przyszło z search)
- W innych przypadkach badge ukryty

**Implementacja:**
```typescript
{matchScore !== undefined && <MatchScoreBadge matchScore={matchScore} />}
```

### 9.5 Walidacja opcjonalnych meta danych

**Gdzie:** RecipeMetaSection

**Warunek:**
```typescript
// Czas gotowania
cookingTime !== null && cookingTime > 0

// Trudność
difficulty !== null
```

**Wpływ na UI:**
- MetaItem dla czasu gotowania renderowany tylko gdy cookingTime !== null
- MetaItem dla trudności renderowany tylko gdy difficulty !== null
- Tagi zawsze renderowane (może być pusta lista)

**Implementacja:**
```typescript
{cookingTime !== null && (
  <MetaItem 
    icon={<Clock />} 
    label="Czas" 
    value={`${cookingTime} min`} 
  />
)}
{difficulty !== null && (
  <MetaItem 
    icon={<ChefHat />} 
    label="Trudność" 
    value={getDifficultyLabel(difficulty)} 
  />
)}
```

### 9.6 Walidacja sticky bar visibility

**Gdzie:** StickyBottomBar

**Warunek:**
```typescript
isVisible === true (z useScrollVisibility hook)
```

**Wpływ na UI:**
- Sticky bar widoczny tylko po przekroczeniu threshold scrolla
- Smooth transition (opacity + transform)

**Implementacja:**
```typescript
<div className={cn(
  "fixed bottom-0 left-0 right-0 transition-all duration-300",
  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-full"
)}>
  {/* content */}
</div>
```

## 10. Obsługa błędów

### 10.1 Błąd ładowania przepisu (404)

**Scenariusz:** GET /api/recipes/:id zwraca 404

**Obsługa:**
1. Hook useRecipeDetails ustawia `error: 'Przepis nie został znaleziony'`
2. Renderowanie ErrorState z komunikatem
3. ErrorState zawiera przycisk "Wróć do przepisów" → redirect do `/recipes`

**UI:**
```typescript
if (error) {
  return (
    <ErrorState 
      error={error}
      onRetry={fetchRecipeAndFridge}
      showBackButton={true}
    />
  );
}
```

### 10.2 Błąd autoryzacji (401)

**Scenariusz:** Brak tokenu lub token wygasł

**Obsługa:**
1. Middleware/interceptor złapie 401
2. Redirect do `/login` z query param `redirect=/recipes/:id`
3. Po zalogowaniu user wraca do przepisu

**Implementacja:**
```typescript
if (response.status === 401) {
  localStorage.removeItem('token');
  navigate(`/login?redirect=${window.location.pathname}`);
  return;
}
```

### 10.3 Błąd braku składników przy gotowaniu (422)

**Scenariusz:** POST /api/cooking-history zwraca 422 (insufficient ingredients)

**Obsługa:**
1. Backend wykrył niewystarczające składniki (frontendowa walidacja nie wystarczyła)
2. Pokazanie error toast: "Brak wystarczających składników w lodówce"
3. Highlight brakujących składników w liście (jeśli API zwraca details)
4. Sugestia: "Wygeneruj listę zakupów" (przycisk w toast)

**UI:**
```typescript
catch (error) {
  if (error.status === 422) {
    showToast({
      variant: 'error',
      title: 'Brak składników',
      description: 'Nie masz wystarczających składników w lodówce.',
      action: (
        <Button onClick={handleGenerateShoppingList}>
          Wygeneruj listę zakupów
        </Button>
      ),
    });
  }
}
```

### 10.4 Błąd usuwania przepisu

**Scenariusz:** DELETE /api/recipes/:id zwraca błąd

**Obsługa:**
1. Pokazanie error toast z komunikatem
2. Zamknięcie confirmation dialog
3. Użytkownik pozostaje na widoku przepisu

**UI:**
```typescript
catch (error) {
  showToast({
    variant: 'error',
    title: 'Błąd usuwania',
    description: 'Nie udało się usunąć przepisu. Spróbuj ponownie.',
  });
  closeDeleteDialog();
}
```

### 10.5 Błąd generowania listy zakupów

**Scenariusz:** POST /api/shopping-list/generate zwraca błąd

**Obsługa:**
1. Pokazanie error toast
2. Użytkownik pozostaje na widoku przepisu

**UI:**
```typescript
catch (error) {
  showToast({
    variant: 'error',
    title: 'Błąd generowania listy',
    description: 'Nie udało się wygenerować listy zakupów. Spróbuj ponownie.',
  });
}
```

### 10.6 Błąd zapisywania kopii przepisu

**Scenariusz:** POST /api/recipes zwraca błąd przy zapisywaniu kopii

**Obsługa:**
1. Pokazanie error toast
2. Użytkownik pozostaje na widoku przepisu

**UI:**
```typescript
catch (error) {
  showToast({
    variant: 'error',
    title: 'Błąd zapisywania',
    description: 'Nie udało się zapisać przepisu. Spróbuj ponownie.',
  });
}
```

### 10.7 Błąd sieci (offline)

**Scenariusz:** Brak połączenia z internetem

**Obsługa:**
1. Pokazanie error toast: "Brak połączenia z internetem"
2. ErrorState z przyciskiem "Spróbuj ponownie"
3. Opcjonalnie: offline indicator w UI

**UI:**
```typescript
if (navigator.onLine === false) {
  showToast({
    variant: 'warning',
    title: 'Brak połączenia',
    description: 'Sprawdź połączenie z internetem i spróbuj ponownie.',
  });
}
```

### 10.8 Timeout

**Scenariusz:** Request trwa zbyt długo

**Obsługa:**
1. Po np. 30 sekundach abort request
2. Pokazanie error: "Przekroczono czas oczekiwania"
3. Przycisk "Spróbuj ponownie"

**Implementacja:**
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000);

try {
  const response = await fetch(url, { signal: controller.signal });
  clearTimeout(timeout);
  // ...
} catch (error) {
  if (error.name === 'AbortError') {
    showToast({
      variant: 'error',
      title: 'Przekroczono czas oczekiwania',
      description: 'Spróbuj ponownie później.',
    });
  }
}
```

## 11. Kroki implementacji

### Krok 1: Utworzenie struktury plików

1. Utworzyć strukturę katalogów:
   ```
   src/pages/recipes/
   src/components/recipe-details/
   src/lib/hooks/
   src/lib/utils/recipe-utils.ts
   ```

2. Utworzyć pliki komponentów:
   ```
   src/pages/recipes/[id].astro
   src/components/recipe-details/RecipeDetailsView.tsx
   src/components/recipe-details/RecipeHeader.tsx
   src/components/recipe-details/RecipeMetaSection.tsx
   src/components/recipe-details/RecipeIngredientsSection.tsx
   src/components/recipe-details/RecipeInstructionsSection.tsx
   src/components/recipe-details/StickyBottomBar.tsx
   src/components/recipe-details/dialogs/CookConfirmationDialog.tsx
   src/components/recipe-details/dialogs/DeleteConfirmationDialog.tsx
   ```

### Krok 2: Definicja typów ViewModel

1. Dodać nowe typy do `src/types.ts` lub utworzyć `src/lib/types/recipe-view-models.ts`:
   - `AvailabilityStatus`
   - `IngredientWithAvailability`
   - `RecipeViewModel`
   - `RecipeDetailsUIState`
   - Inne typy helper

### Krok 3: Implementacja utility functions

1. Utworzyć `src/lib/utils/recipe-utils.ts`:
   ```typescript
   // Funkcja sprawdzająca dostępność składnika
   export function checkIngredientAvailability(
     ingredient: RecipeIngredientDTO,
     fridgeItems: FridgeItemDTO[]
   ): IngredientAvailabilityCheckResult { /* ... */ }

   // Funkcja obliczająca dostępność dla całego przepisu
   export function calculateRecipeAvailability(
     recipe: RecipeDTO,
     fridgeItems: FridgeItemDTO[]
   ): RecipeAvailabilityResult { /* ... */ }

   // Funkcja parsująca instrukcje
   export function parseInstructions(instructions: string): ParsedInstructions { /* ... */ }

   // Funkcja transformująca difficulty enum na label
   export function getDifficultyLabel(difficulty: DifficultyEnum): string { /* ... */ }

   // Funkcja transformująca RecipeDTO do CreateRecipeDTO (dla copy)
   export function recipeToCreateDto(recipe: RecipeDTO): CreateRecipeDTO { /* ... */ }
   ```

### Krok 4: Implementacja API client functions

1. Utworzyć `src/lib/api/recipes-api.ts` (jeśli jeszcze nie istnieje):
   ```typescript
   export async function fetchRecipe(recipeId: number): Promise<RecipeDTO> { /* ... */ }
   export async function deleteRecipe(recipeId: number): Promise<void> { /* ... */ }
   export async function saveRecipeAsCopy(recipe: RecipeDTO): Promise<RecipeDTO> { /* ... */ }
   ```

2. Utworzyć `src/lib/api/fridge-api.ts`:
   ```typescript
   export async function fetchFridgeItems(): Promise<FridgeItemDTO[]> { /* ... */ }
   ```

3. Utworzyć `src/lib/api/cooking-history-api.ts`:
   ```typescript
   export async function cookRecipe(recipeId: number): Promise<CreateCookingHistoryResponseDTO> { /* ... */ }
   ```

4. Utworzyć `src/lib/api/shopping-list-api.ts`:
   ```typescript
   export async function generateShoppingList(recipeId: number): Promise<ShoppingListResponseDTO> { /* ... */ }
   ```

### Krok 5: Implementacja custom hooks

1. Utworzyć `src/lib/hooks/useRecipeDetails.ts`:
   - Zaimplementować pełną logikę state management
   - Fetch recipe i fridge
   - Calculate availability
   - Handlers dla wszystkich akcji

2. Utworzyć `src/lib/hooks/useScrollVisibility.ts`:
   - Monitoring scroll position
   - Zwracanie boolean isVisible

### Krok 6: Implementacja komponentów atomic

Implementować komponenty od najmniejszych do największych:

1. **LoadingSpinner** (`src/components/ui/loading-spinner.tsx`)
2. **ErrorState** (`src/components/ui/error-state.tsx`)
3. **BackButton** (`src/components/recipe-details/BackButton.tsx`)
4. **SourceBadge** (`src/components/recipe-details/SourceBadge.tsx`)
5. **MatchScoreBadge** (`src/components/recipe-details/MatchScoreBadge.tsx`)
6. **TagBadge** (`src/components/recipe-details/TagBadge.tsx`)
7. **MetaItem** (`src/components/recipe-details/MetaItem.tsx`)
8. **InstructionStep** (`src/components/recipe-details/InstructionStep.tsx`)
9. **IngredientItem** (`src/components/recipe-details/IngredientItem.tsx`)

### Krok 7: Implementacja komponentów złożonych

1. **RecipeActionsDropdown** - dropdown menu z akcjami
2. **RecipeHeader** - nagłówek z wszystkimi badges i dropdown
3. **RecipeMetaSection** - meta informacje
4. **IngredientsList** - lista składników
5. **IngredientsDeductionPreview** - preview w dialogu
6. **RecipeIngredientsSection** - pełna sekcja składników
7. **RecipeInstructionsSection** - sekcja instrukcji
8. **CookButton**, **SaveRecipeButton**, **GenerateShoppingListButton** - przyciski akcji
9. **StickyBottomBar** - sticky bar

### Krok 8: Implementacja dialogów

1. **CookConfirmationDialog** - dialog potwierdzenia gotowania
2. **DeleteConfirmationDialog** - dialog potwierdzenia usunięcia

### Krok 9: Implementacja głównego kontenera

1. **RecipeDetailsView** - główny komponent React:
   - Użycie useRecipeDetails hook
   - Użycie useScrollVisibility hook
   - Kompozycja wszystkich subkomponentów
   - Warunkowe renderowanie loading/error/content
   - Obsługa wszystkich interakcji

### Krok 10: Implementacja Astro page

1. **[id].astro** - strona Astro:
   ```astro
   ---
   import Layout from '../../layouts/Layout.astro';
   import RecipeDetailsView from '../../components/recipe-details/RecipeDetailsView';

   export const prerender = false;
   ---

   <Layout title="Szczegóły przepisu">
     <RecipeDetailsView client:load />
   </Layout>
   ```

### Krok 11: Styling z Tailwind

1. Zastosować klasy Tailwind do wszystkich komponentów:
   - Responsive design (mobile-first)
   - Color coding dla dostępności składników
   - Sticky positioning dla bottom bar
   - Smooth transitions i animations
   - Proper spacing i typography

2. Wykorzystać komponenty Shadcn/ui:
   - Button
   - Badge
   - Checkbox
   - Dialog
   - DropdownMenu
   - Toast (dla notifications)

### Krok 12: Dostępność (a11y)

1. Dodać proper ARIA attributes:
   - `role="list"` dla list
   - `aria-label` dla buttonów z ikonami
   - `aria-describedby` dla kontekstu
   - Keyboard navigation dla dropdown i dialogów

2. Semantic HTML:
   - `<header>`, `<section>`, `<nav>`
   - Proper heading hierarchy (h1 → h2 → h3)
   - `<ol>` dla instrukcji

3. Focus management:
   - Focus trap w dialogach
   - Focus na pierwszym elemencie po otwarciu dialogu
   - Return focus po zamknięciu

### Krok 13: Testowanie manualne

1. Test ścieżek happy path:
   - Załadowanie przepisu → wyświetlenie
   - Ugotowanie przepisu → sukces
   - Usunięcie przepisu → sukces
   - Zapisanie kopii → sukces
   - Generowanie listy zakupów → sukces

2. Test warunków:
   - Przepis z wszystkimi składnikami dostępnymi
   - Przepis z częściowo dostępnymi składnikami
   - Przepis bez składników
   - Przepis bez opcjonalnych pól (czas, trudność)
   - Przepis z różnymi sources (user, api, ai)

3. Test błędów:
   - Nieistniejący przepis (404)
   - Brak autoryzacji (401)
   - Błąd sieciowy
   - Timeout
   - Niewystarczające składniki przy gotowaniu

4. Test responsywności:
   - Mobile
   - Tablet
   - Desktop

5. Test dostępności:
   - Keyboard navigation
   - Screen reader compatibility
   - Color contrast

### Krok 14: Optymalizacje

1. Code splitting dla dialogów (lazy load)
2. Memoization dla expensive calculations (useMemo, useCallback)
3. Debounce dla scroll handler
4. Image optimization (jeśli dodane zdjęcia w przyszłości)

### Krok 15: Dokumentacja

1. Dodać JSDoc comments do funkcji
2. Udokumentować props interfaces
3. Przykłady użycia dla komponentów wielokrotnego użytku
4. README dla katalogu recipe-details

### Krok 16: Code review i refactoring

1. Przegląd kodu pod kątem:
   - Duplications
   - Edge cases
   - Error handling
   - Performance
   - Accessibility

2. Refactoring jeśli potrzebny

### Krok 17: Integracja z resztą aplikacji

1. Dodać linki do widoku recipe details z:
   - Listy przepisów
   - Wyników wyszukiwania
   - Historii gotowania
   - Dashboard

2. Upewnić się, że nawigacja działa w obie strony

### Krok 18: Finalne testy

1. Pełne testy end-to-end całego flow
2. Cross-browser testing
3. Performance testing (Lighthouse)
4. Accessibility audit (aXe, Lighthouse)

---

## Podsumowanie

Ten plan implementacji obejmuje kompletny widok Recipe Details zgodny z PRD i wymaganiami z planu API. Kluczowe elementy to:

- **Kompozycja komponentów** - modularna struktura z reużywalnymi komponentami
- **State management** - centralizacja logiki w custom hook useRecipeDetails
- **API integration** - pełna integracja z 5 endpointami
- **User experience** - color coding, confirmation dialogs, toasts, sticky bar
- **Accessibility** - semantic HTML, ARIA, keyboard navigation
- **Error handling** - kompletna obsługa wszystkich scenariuszy błędów
- **Walidacja** - warunki na poziomie UI i API

Implementacja powinna przebiegać iteracyjnie, od najmniejszych komponentów do największych, z testowaniem na każdym etapie.

