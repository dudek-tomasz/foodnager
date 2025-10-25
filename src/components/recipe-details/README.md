# Recipe Details View

Widok szczegółów przepisu z pełną funkcjonalnością zarządzania przepisami.

## 🚀 Quick Start

### Użycie w projekcie

```tsx
import { RecipeDetailsView } from '@/components/recipe-details';

<RecipeDetailsView 
  recipeId={123} 
  from="search" 
  matchScore={85} 
/>
```

### Routing (Astro)

Dostęp przez URL: `/recipes/:id?from=search&matchScore=85`

Plik: `src/pages/recipes/[id].astro`

## ✨ Funkcjonalności

### 1. Wyświetlanie Przepisu
- **Tytuł** i podstawowe informacje
- **Metadane**: czas gotowania, trudność, tagi
- **Składniki** z informacją o dostępności
- **Instrukcje** przygotowania krok po kroku
- **Źródło** przepisu (USER/API/AI)

### 2. Color Coding Dostępności
- 🟢 **Zielony** - składnik w pełni dostępny
- 🟡 **Żółty** - składnik częściowo dostępny
- 🔴 **Czerwony** - składnik niedostępny

### 3. Akcje Użytkownika
- **Ugotuj to** - rejestruje gotowanie i aktualizuje lodówkę
- **Generuj listę zakupów** - tworzy listę brakujących składników
- **Zapisz przepis** - kopiuje przepis do własnej kolekcji (API/AI)
- **Edytuj przepis** - przekierowuje do edycji (tylko własne)
- **Usuń przepis** - usuwa przepis (tylko własne)

### 4. Sticky Bottom Bar
Akcje główne dostępne po scrollu w dół strony.

## 📁 Struktura Komponentów

```
RecipeDetailsView (główny kontener)
├── RecipeHeader (tytuł, badges, akcje)
├── RecipeMetaSection (czas, trudność, tagi)
├── RecipeIngredientsSection (składniki z dostępnością)
├── RecipeInstructionsSection (instrukcje)
├── StickyBottomBar (akcje po scrollu)
└── Dialogs (potwierdzenia)
```

**Pełna hierarchia:** Zobacz `IMPLEMENTATION_SUMMARY.md`

## 🔌 API Integration

### Endpointy
- `GET /api/recipes/:id` - pobieranie przepisu
- `GET /api/fridge` - pobieranie lodówki
- `POST /api/cooking-history` - rejestracja gotowania
- `POST /api/shopping-list/generate` - lista zakupów
- `DELETE /api/recipes/:id` - usuwanie
- `POST /api/recipes` - zapisywanie kopii

### Client Functions
Dostępne w `src/lib/api/`:
- `recipes-client.ts`
- `fridge-client.ts`
- `cooking-history-client.ts`
- `shopping-list-client.ts`

## 🎨 Customization

### Kolory Dostępności
```typescript
// src/lib/utils/recipe-utils.ts
getAvailabilityColors(status)
```

### Threshold Sticky Bar
```typescript
// RecipeDetailsView.tsx
const isStickyBarVisible = useScrollVisibility(300); // 300px
```

### Parsowanie Instrukcji
```typescript
// src/lib/utils/recipe-utils.ts
parseInstructions(instructions)
```

## 🧪 Testing

**Pełny testing guide:** Zobacz `TESTING.md`

### Quick Test Checklist
- [ ] Navigate to `/recipes/:id`
- [ ] Sprawdź color coding składników
- [ ] Kliknij "Ugotuj to" i potwierdź
- [ ] Sprawdź sticky bar po scrollu
- [ ] Test akcji dropdown menu
- [ ] Sprawdź responsywność (mobile)

## 📚 Dokumentacja

- **README.md** - ten plik (quick start)
- **TESTING.md** - comprehensive testing guide
- **IMPLEMENTATION_SUMMARY.md** - szczegółowa dokumentacja techniczna

## 🎯 Custom Hooks

### useRecipeDetails
Główny hook zarządzający całym stanem widoku.

```typescript
const {
  uiState,
  recipe,
  handleCook,
  handleDelete,
  handleSave,
  // ... więcej
} = useRecipeDetails({ recipeId, initialMatchScore });
```

### useScrollVisibility
Monitoruje pozycję scrolla.

```typescript
const isVisible = useScrollVisibility(threshold);
```

## 🔧 Typy

### RecipeViewModel
Przepis z wzbogaconymi danymi UI:
- `enrichedIngredients` - składniki z dostępnością
- `hasAllIngredients` - boolean flag
- `hasMissingIngredients` - boolean flag
- `matchScore` - opcjonalny wynik dopasowania

### IngredientWithAvailability
Składnik z informacją o dostępności:
- `availabilityStatus` - 'full' | 'partial' | 'none'
- `availableQuantity` - ilość w lodówce
- `requiredQuantity` - ilość wymagana
- `missingQuantity` - ilość brakująca

## 🐛 Troubleshooting

### Przepis się nie ładuje
- Sprawdź czy recipe ID jest prawidłowy
- Sprawdź network tab w DevTools
- Sprawdź czy użytkownik jest zalogowany

### Składniki pokazują nieprawidłowy status
- Sprawdź czy lodówka jest zsynchronizowana
- Sprawdź unit_id (muszą być takie same)
- Sprawdź console dla błędów

### Sticky bar nie pojawia się
- Sprawdź czy wysokość contentu > 300px
- Sprawdź console dla błędów JavaScript

## 🚀 Performance Tips

1. **Parallel Fetching** - recipe + fridge jednocześnie
2. **Throttled Scroll** - optymalizacja scroll handler
3. **Lazy Dialogs** - renderowane conditional
4. **Memoization** - możliwe dla heavy calculations

## 📝 Contribution

Aby dodać nową funkcjonalność:
1. Utwórz nowy komponent atomic/composite
2. Dodaj do odpowiedniej sekcji
3. Zaktualizuj typy w `recipe-view-models.ts`
4. Dodaj obsługę w `useRecipeDetails` hook
5. Dodaj testy w `TESTING.md`
6. Zaktualizuj dokumentację

## 📞 Support

- Issues: GitHub Issues
- Questions: Team Slack
- Documentation: `IMPLEMENTATION_SUMMARY.md`

## ✅ Status

**Version:** 1.0.0  
**Status:** ✅ **COMPLETE & READY FOR TESTING**

---

**Related:**
- [Implementation Summary](./IMPLEMENTATION_SUMMARY.md)
- [Testing Guide](./TESTING.md)
- [API Documentation](../../pages/api/recipes/)

