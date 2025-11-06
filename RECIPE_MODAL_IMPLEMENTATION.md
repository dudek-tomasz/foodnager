# Implementacja Recipe Details Modal

## Podsumowanie zmian

Przepisy wyświetlają się teraz w modalu zamiast na dedykowanej stronie `/recipes/[id]` w następujących widokach:
- **Znajdź przepis** (`/recipes/search`) - wszystkie przepisy (user, API, AI)
- **Moje przepisy** (`/recipes`) - przepisy użytkownika

Dedykowana strona `/recipes/[id]` pozostaje dostępna dla bezpośrednich linków (np. z historii przeglądarki, zewnętrznych źródeł).

## Zaimplementowane zmiany

### 1. RecipeDetailsModal (`src/components/recipe-details/RecipeDetailsModal.tsx`)
Nowy komponent modal będący wrapperem dla `RecipeDetailsView`.

**Props:**
- `isOpen: boolean` - kontrola widoczności modala
- `onClose: () => void` - callback zamknięcia modala
- `recipeId?: number` - ID przepisu z bazy danych (dla zapisanych przepisów)
- `externalRecipe?: ExternalRecipe` - dane zewnętrznego przepisu (dla przepisów z API/AI niezapisanych jeszcze do bazy)
- `from?: string` - źródło nawigacji
- `matchScore?: number` - wynik dopasowania składników
- `hideHistory?: boolean` - ukrycie sekcji historii (domyślnie: false)

**Cechy:**
- Responsywny modal (max-width: 4xl, max-height: 90vh)
- Scrollowalny content
- Przycisk zamknięcia (X) w prawym górnym rogu

### 2. Rozszerzony useRecipeDetails hook
Hook został zmodyfikowany aby obsługiwał dwa tryby:

#### Tryb 1: Zapisany przepis (recipeId)
```typescript
useRecipeDetails({ recipeId: 123 })
```
- Pobiera dane przepisu z API
- Pełna funkcjonalność: gotuj, usuń, edytuj, zapisz (zmiana source)

#### Tryb 2: External recipe (externalRecipe)
```typescript
useRecipeDetails({ externalRecipe: {...} })
```
- Wyświetla dane zewnętrznego przepisu bez zapisywania do bazy
- Konwertuje `ExternalRecipe` na format `RecipeDTO` dla wyświetlenia
- Ograniczona funkcjonalność:
  - ✅ Zapisz (tworzy nowy przepis w bazie jako 'user')
  - ❌ Gotuj (wymaga najpierw zapisu)
  - ❌ Usuń (przepis nie istnieje w bazie)
  - ❌ Edytuj (przepis nie istnieje w bazie)

**Nowe callbacki:**
- `onSaveSuccess?: () => void` - wywoływane po pomyślnym zapisie (zamyka modal)
- `onDeleteSuccess?: () => void` - wywoływane po pomyślnym usunięciu (zamyka modal)
- `onCookSuccess?: () => void` - wywoływane po pomyślnym ugotowaniu (zamyka modal)

### 3. RecipeSearchView z modalem
**Zmiany:**
- Dodano state dla modala: `selectedRecipeId`, `isModalOpen`
- Kliknięcie w przepis otwiera modal zamiast przekierowania
- Modal z `hideHistory={true}` (historia nie jest potrzebna w discovery)

**Przepływ:**
1. Użytkownik wyszukuje przepis
2. Klika "Zobacz przepis" lub na kartę przepisu
3. Otwiera się modal z szczegółami
4. Użytkownik może:
   - Zapisać przepis → modal się zamyka, użytkownik zostaje na liście
   - Zamknąć modal (X lub kliknięcie w overlay) → wraca do listy wyników

### 4. RecipeListView z modalem
**Zmiany:**
- Dodano state dla modala: `selectedRecipeId`, `isDetailsModalOpen`
- Kliknięcie w przepis otwiera modal zamiast przekierowania
- Po zamknięciu modala odświeża listę (`refreshList()`)

**Przepływ:**
1. Użytkownik przegląda swoje przepisy
2. Klika "Szczegóły" lub na kartę przepisu
3. Otwiera się modal z szczegółami
4. Użytkownik może:
   - Ugotować przepis → modal się zamyka, użytkownik zostaje na liście
   - Usunąć przepis → modal się zamyka, lista się odświeża
   - Edytować przepis → przekierowanie do `/recipes/${id}/edit` (TODO: może też modal?)
   - Zamknąć modal → wraca do listy

### 5. RecipeDetailsView z callbackami
**Nowe props:**
- `recipeId?: number` - opcjonalne (zamiast required)
- `externalRecipe?: ExternalRecipe` - opcjonalne dla external recipes
- `hideHistory?: boolean` - ukrycie sekcji historii (obecnie nieużywane, bo historia nie jest wyświetlana)
- `onSaveSuccess?: () => void` - callback po zapisie
- `onDeleteSuccess?: () => void` - callback po usunięciu
- `onCookSuccess?: () => void` - callback po ugotowaniu

## Problem z przepisami AI/External został rozwiązany

### Problem oryginalny:
```
Przepis z AI/API generowany → brak ID → przekierowanie do /recipes/null → błąd 404
```

### Rozwiązanie:
```
Przepis z AI/API generowany → ExternalRecipe object → modal z danymi → 
użytkownik klika "Zapisz" → tworzy przepis w bazie → modal się zamyka → 
użytkownik zostaje na liście wyników
```

## Struktura plików

```
src/
├── components/
│   ├── recipe-details/
│   │   ├── RecipeDetailsView.tsx          (zmodyfikowany)
│   │   ├── RecipeDetailsModal.tsx         (NOWY)
│   │   ├── hooks/
│   │   │   └── useRecipeDetails.ts        (zmodyfikowany)
│   │   └── index.ts                       (zaktualizowany export)
│   ├── recipe-search/
│   │   └── RecipeSearchView.tsx           (zmodyfikowany)
│   └── recipes/
│       └── RecipeListView.tsx             (zmodyfikowany)
```

## Testowanie

### Scenariusz 1: Przepis z wyszukiwania (user recipe)
1. Przejdź do `/recipes/search`
2. Wybierz źródło "Moje przepisy" lub "Wszystkie"
3. Wyszukaj przepis
4. Kliknij "Zobacz przepis"
5. **Oczekiwane:** Modal się otwiera z pełnymi danymi przepisu
6. Kliknij "Ugotuj to"
7. **Oczekiwane:** Modal się zamyka, przekierowanie do `/history` (lub zostaje na liście jeśli jest w modalu)
8. Kliknij "X" aby zamknąć modal
9. **Oczekiwane:** Modal się zamyka, użytkownik zostaje na liście wyników

### Scenariusz 2: Przepis z AI (external recipe - główny test case)
1. Przejdź do `/recipes/search`
2. Wybierz źródło "AI" lub "Wszystkie"
3. Wyszukaj przepis (np. "pizza")
4. Kliknij "Wygeneruj z AI" jeśli nie ma wyników
5. Poczekaj na wygenerowanie przepisu
6. Kliknij "Zobacz przepis" na wygenerowanym przepisie
7. **Oczekiwane:** Modal się otwiera z danymi przepisu (tytuł, składniki, instrukcje)
8. **Sprawdź:** Nie ma przycisku "Usuń" (przepis nie jest jeszcze w bazie)
9. **Sprawdź:** Przycisk "Ugotuj to" jest zablokowany lub pokazuje toast o konieczności zapisu
10. Kliknij "Zapisz przepis"
11. **Oczekiwane:** 
    - Toast: "Przepis zapisany! Przepis został dodany do Twojej kolekcji."
    - Modal się zamyka
    - Użytkownik zostaje na liście wyników
12. Sprawdź w "Moje przepisy" (`/recipes`) czy przepis został dodany

### Scenariusz 3: Przepis z "Moich przepisów"
1. Przejdź do `/recipes`
2. Kliknij na dowolny przepis
3. **Oczekiwane:** Modal się otwiera z pełnymi danymi przepisu
4. Sprawdź wszystkie funkcje:
   - "Ugotuj to" → modal się zamyka
   - "Usuń" → modal się zamyka, lista się odświeża
   - "Edytuj" → przekierowanie do edycji (TODO: może też modal?)
5. Kliknij "X" aby zamknąć modal
6. **Oczekiwane:** Modal się zamyka, lista się odświeża

### Scenariusz 4: Dedykowana strona (bezpośredni link)
1. Wejdź bezpośrednio na `/recipes/123` (gdzie 123 to ID istniejącego przepisu)
2. **Oczekiwane:** Strona się ładuje normalnie (NIE modal, ale pełna strona)
3. **Weryfikacja:** URL pozostaje `/recipes/123`

## Znane ograniczenia i TODO

1. **Historia przepisu:**
   - Prop `hideHistory` jest dodany, ale historia nie jest jeszcze wyświetlana w `RecipeDetailsView`
   - Gdy historia zostanie dodana, będzie automatycznie ukryta w recipe discovery dzięki `hideHistory={true}`

2. **Edycja przepisu:**
   - Obecnie przekierowuje do `/recipes/${id}/edit`
   - TODO: Rozważyć modal dla edycji przepisu?

3. **Matching external products z bazą:**
   - External recipes używają prostego mapowania nazw składników
   - TODO: Lepsze dopasowanie produktów z bazy danych (fuzzy matching)

4. **Shopping list dla external recipes:**
   - Wymaga ID przepisu
   - Obecnie możliwa tylko po zapisaniu przepisu

5. **URL nie zmienia się w modalu:**
   - Modal nie zmienia URL (akceptowalne zgodnie z wymaganiami użytkownika)
   - Historia przeglądarki nie rejestruje wejścia w modal
   - Nie można skopiować linka do konkretnego przepisu z modala

## Co dalej?

Implementacja gotowa do testowania! 🎉

Przetestuj wszystkie scenariusze i zgłoś wszelkie problemy lub nieoczekiwane zachowania.

