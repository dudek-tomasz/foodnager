# Recipe Components Documentation

Kompletny zestaw komponentów dla widoku Przepisy w aplikacji Foodnager.

## Struktura Komponentów

### Główny Komponent

- **RecipeListView** - główny kontener widoku, zarządza stanem i integruje wszystkie subkomponenty

### Komponenty Layout

- **RecipeListHeader** - nagłówek z tytułem, statystykami i przyciskiem dodawania
- **RecipeToolbar** - pasek narzędzi z wyszukiwaniem, sortowaniem i filtrowaniem
- **RecipeGrid** - responsywny grid wyświetlający karty przepisów

### Komponenty Kart i Lista

- **RecipeCard** - karta pojedynczego przepisu
- **SourceBadge** - badge pokazujący źródło przepisu (USER/API/AI)

### Komponenty Formularzy

- **RecipeFormModal** - modal dodawania/edycji przepisu
- **RecipeIngredientsSection** - sekcja składników w formularzu (dynamiczna lista)

### Komponenty Narzędziowe

- **SearchBar** - wyszukiwarka z debouncing
- **SortDropdown** - dropdown sortowania
- **FilterMultiSelect** - multi-select filtrów
- **PaginationControls** - kontrolki paginacji
- **EmptyState** - stan pusty
- **DeleteConfirmDialog** - dialog potwierdzenia usunięcia

## Responsywność

### Breakpoints (zgodnie z Tailwind)

- **Mobile**: < 768px (sm)
- **Tablet**: 768px - 1023px (md)
- **Desktop**: >= 1024px (lg)

### RecipeGrid Layout

```
Mobile (< md):    1 kolumna
Tablet (md-lg):   2 kolumny
Desktop (>= lg):  3 kolumny
```

### RecipeToolbar

```
Mobile:   Pełna szerokość, vertical stack, "Dodaj przepis" widoczny
Desktop:  Horizontal layout, "Dodaj przepis" ukryty (jest w header)
```

### RecipeListHeader

```
Mobile:   Vertical stack
Desktop:  Horizontal space-between
```

### RecipeFormModal

```
Mobile:   Full-screen modal (max-h-90vh)
Desktop:  Centered 600px modal
```

### RecipeIngredientsSection

```
Mobile:   Vertical stack dla składników
Desktop:  Horizontal layout (Product | Quantity | Unit | Delete)
```

## Accessibility (WCAG AA)

### Semantic HTML

- Proper heading hierarchy (h1 → h2 → h3)
- `<main>`, `<header>`, `<nav>` landmarks
- `<button>` dla akcji, `<a>` dla nawigacji

### ARIA Attributes

- `aria-label` na icon buttons
- `aria-expanded` na dropdowns
- `aria-current` na active page w paginacji
- `role="combobox"` na autocomplete

### Keyboard Navigation

- Tab order logiczny
- Focus trap w modalach
- ESC zamyka modaly
- Enter submituje formularze
- Arrow keys w dropdownach

### Focus Management

- Custom focus rings: `focus:ring-2 focus:ring-amber-500`
- Focus visible na wszystkich interaktywnych elementach
- Auto-focus na first input w modalach

## Integracja API

### Endpointy

- `GET /api/recipes` - lista przepisów (z query params)
- `POST /api/recipes` - dodanie przepisu
- `PATCH /api/recipes/:id` - edycja przepisu
- `DELETE /api/recipes/:id` - usunięcie przepisu
- `GET /api/tags` - lista tagów
- `GET /api/units` - lista jednostek
- `GET /api/products` - autocomplete produktów
- `POST /api/products` - dodanie produktu inline
- `POST /api/cooking-history` - ugotowanie przepisu

### Query Parameters (GET /api/recipes)

```typescript
{
  search?: string;
  source?: 'user' | 'api' | 'ai';
  difficulty?: 'easy' | 'medium' | 'hard';
  tags?: number[];
  max_cooking_time?: number;
  sort?: 'title' | 'cooking_time' | 'difficulty' | 'created_at';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

## Zarządzanie Stanem

### useRecipeList Hook

Custom hook zarządzający stanem listy przepisów:

- Fetching z API
- Debounced search (300ms)
- Filtrowanie, sortowanie, paginacja
- CRUD operations
- Error handling

### Local State (RecipeListView)

- Modal state (open/close, add/edit mode)
- Delete dialog state
- Editing recipe reference

## Error Handling

### API Errors

- **401**: Redirect do `/login`
- **403**: Toast "Brak uprawnień"
- **404**: Toast "Nie znaleziono"
- **409**: Conflict - wyświetl w formularzu
- **422**: Validation errors - wyświetl pod polami
- **500**: Toast "Błąd serwera"
- **Network**: Toast "Brak połączenia"

### UI Errors

- Empty state dla braku danych
- Error state z retry button
- Validation errors inline w formularzu
- Toast notifications dla operacji

## Performance

### Optimizations Implemented

- React.memo nie jest jeszcze zastosowany (TODO w kroku 18)
- useCallback w useRecipeList hook
- Debouncing dla search (300ms)
- Lazy loading modals - opcjonalne (TODO)
- Skeleton loading states

### Future Optimizations (Krok 18)

- React.memo dla RecipeCard, PaginationControls
- React.lazy dla RecipeFormModal, DeleteConfirmDialog
- Virtualization dla bardzo długich list (opcjonalnie)

## Testing Checklist

- [ ] Wyświetlenie listy przepisów
- [ ] Wyszukiwanie (search)
- [ ] Filtrowanie (wszystkie opcje)
- [ ] Sortowanie (wszystkie opcje)
- [ ] Paginacja
- [ ] Dodawanie przepisu (wszystkie pola)
- [ ] Dodawanie przepisu (tylko wymagane)
- [ ] Edycja przepisu
- [ ] Usuwanie przepisu
- [ ] Empty states
- [ ] Loading states
- [ ] Error handling
- [ ] Responsywność (mobile/tablet/desktop)
- [ ] Keyboard navigation
- [ ] Screen reader compatibility
