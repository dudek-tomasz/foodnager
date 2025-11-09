# Fix: Błąd zapisywania przepisu AI

## Problem

Przy zapisywaniu przepisu wygenerowanego przez AI przyciskiem "Zapisz przepis" występował błąd walidacji:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {
      "ingredients": ["Required", "Required", ...]
    }
  }
}
```

## Przyczyna

Funkcja `handleSave` w `useRecipeDetails.ts` wysyłała nazwy produktów i jednostek (`product_name`, `unit_name`) zamiast ich ID (`product_id`, `unit_id`), które są wymagane przez API endpoint `/api/recipes`.

## Rozwiązanie

### 1. Naprawiono zapisywanie przepisu AI

**Plik:** `src/components/recipe-details/hooks/useRecipeDetails.ts`

**Zmiana:** W trybie zapisywania przepisu AI (linie 429-434), zmieniono mapowanie składników:

**Przed:**
```typescript
ingredients: aiRecipe.ingredients.map(ing => ({
  product_name: ing.product.name,
  quantity: ing.quantity,
  unit_name: ing.unit.name,
})),
tags: aiRecipe.tags.map(tag => tag.name),
```

**Po:**
```typescript
ingredients: aiRecipe.ingredients.map(ing => ({
  product_id: ing.product.id,
  quantity: ing.quantity,
  unit_id: ing.unit.id,
})),
tag_ids: aiRecipe.tags.map(tag => tag.id),
```

### 2. Utworzono dedykowany endpoint dla przepisów zewnętrznych

**Plik:** `src/pages/api/recipes/from-external.ts` (nowy)

Endpoint `/api/recipes/from-external` akceptuje przepisy z nazwami produktów i jednostek (zamiast ID) i automatycznie:
- Wyszukuje istniejące produkty/jednostki po nazwie
- Tworzy nowe produkty/jednostki, jeśli nie istnieją
- Zapisuje przepis do bazy danych

**Schema walidacji:**
```typescript
{
  title: string,
  description?: string | null,
  instructions: string,
  cooking_time?: number | null,
  difficulty?: 'easy' | 'medium' | 'hard',
  ingredients: [
    {
      product_name: string,
      quantity: number,
      unit_name: string
    }
  ],
  tags?: string[],
  external_id?: string,
  image_url?: string,
  source_url?: string
}
```

### 3. Zaktualizowano zapisywanie przepisów zewnętrznych

**Plik:** `src/components/recipe-details/hooks/useRecipeDetails.ts`

Zmieniono endpoint dla zewnętrznych przepisów z `/api/recipes` na `/api/recipes/from-external` (linia 459).

## Testowanie

### Test 1: Zapisywanie przepisu AI

1. Zaloguj się do aplikacji
2. Przejdź do wyszukiwania przepisów (`/recipes/search`)
3. Wygeneruj przepis AI używając składników z lodówki
4. Otwórz szczegóły wygenerowanego przepisu
5. Kliknij przycisk "Zapisz przepis"
6. **Oczekiwany rezultat:** Przepis zostaje zapisany bez błędów walidacji

### Test 2: Zapisywanie przepisu zewnętrznego (API)

1. Zaloguj się do aplikacji
2. Przejdź do wyszukiwania przepisów (`/recipes/search`)
3. Wyszukaj przepisy z zewnętrznego API (tier 2)
4. Otwórz szczegóły przepisu z API
5. Kliknij przycisk "Zapisz przepis"
6. **Oczekiwany rezultat:** Przepis zostaje zapisany, produkty i jednostki są automatycznie tworzone jeśli nie istnieją

## Pliki zmienione

- ✅ `src/components/recipe-details/hooks/useRecipeDetails.ts` - naprawiono mapowanie składników dla AI i external recipes
- ✅ `src/pages/api/recipes/from-external.ts` - nowy endpoint dla przepisów z nazwami składników

## Weryfikacja

Po zastosowaniu poprawek:
- Przepisy AI powinny zapisywać się poprawnie z ID produktów i jednostek
- Przepisy zewnętrzne powinny zapisywać się przez dedykowany endpoint
- Brak błędów walidacji w konsoli przeglądarki i odpowiedziach API

