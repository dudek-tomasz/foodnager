# Podsumowanie ulepszeń integracji Spoonacular API

## Naprawione problemy

### ✅ Problem 1: Wyniki w języku angielskim

**Rozwiązanie:** Automatyczne tłumaczenie używając OpenRouter LLM

**Pliki:**
- `src/lib/utils/recipe-translator.ts` - Nowy moduł tłumaczący
- `src/lib/services/ai/openrouter.client.ts` - Dodana metoda `generateText()`
- `src/lib/services/external-api.service.ts` - Integracja tłumaczenia

**Jak działa:**
```typescript
// 1. Pobierz przepis z Spoonacular (angielski)
const externalRecipe = await spoonacular.getRecipeDetails(id);

// 2. Automatyczne tłumaczenie na polski
const translated = await translateRecipe({
  title: "Cheesy Rosemary Meatball Bake",
  description: "A delicious...",
  instructions: "1. Heat oil..."
});

// 3. Przepis po polsku
{
  title: "Pieczone klopsiki z serem i rozmarynem",
  description: "Pyszne...",
  instructions: "1. Rozgrzej olej..."
}
```

**Konfiguracja:**
- Używa modelu skonfigurowanego w `OPENROUTER_MODEL`
- Temperatura: 0.3 (dla spójnych tłumaczeń)
- Fallback: jeśli tłumaczenie się nie powiedzie, zwraca oryginalny angielski tekst

---

### ✅ Problem 2: Opis ucięty do 200 znaków

**Rozwiązanie:** Zwiększono limit + inteligentne cięcie na granicy zdania

**Plik:** `src/lib/utils/html-to-text.ts`

**Przed:**
```typescript
description: stripHtmlTags(recipe.summary).substring(0, 200)
// Wynik: "Stuffed Breakfast Balls is a gluten free side dish. One portion..."
```

**Teraz:**
```typescript
description: extractSummary(recipe.summary, 500)
// Wynik: Pełny opis, maksymalnie 500 znaków, ucięty na granicy zdania
```

**Funkcja `extractSummary()`:**
- Domyślnie 500 znaków (możliwość konfiguracji)
- Stara się ciąć na granicy zdania (`. `)
- Jeśli nie ma zdania, cięcie na granicy słowa
- Dodaje `...` jeśli opis został ucięty

---

### ✅ Problem 3: HTML w opisie i instrukcjach

**Rozwiązanie:** Konwersja HTML na czytelny tekst z zachowaniem struktury

**Plik:** `src/lib/utils/html-to-text.ts`

**Przed:**
```html
<ol><li>Shred 5 red skinned potatoes.</li><li>Squeeze all liquid...</li></ol>
```

**Teraz:**
```
1. Shred 5 red skinned potatoes.
2. Squeeze all liquid out of red skinned potatoes in papertowel.
3. Place pan on med/high heat...
```

**Funkcja `htmlToText()`:**
- Konwertuje `<ol><li>` → numerowane kroki (`1. `, `2. `)
- Konwertuje `<ul><li>` → punktory (`• `)
- Konwertuje `<p>` → nowe linie
- Konwertuje `<br>` → nowe linie
- Usuwa wszystkie pozostałe tagi HTML
- Czyści nadmiarowe białe znaki

**Obsługiwane formaty:**
- Listy numerowane (`<ol>`)
- Listy wypunktowane (`<ul>`)
- Paragrafy (`<p>`)
- Nagłówki (`<h1>`-`<h6>`)
- Łamanie linii (`<br>`)
- HTML entities (`&nbsp;`, `&amp;`, etc.)

---

### ✅ Problem 4: Brak składników (extendedIngredients)

**Rozwiązanie:** Poprawione parsowanie z lepszymi fallbackami

**Plik:** `src/lib/services/external-api.service.ts`

**Przed:**
```typescript
ingredients: recipe.extendedIngredients.map((ing) => ({
  name: ing.nameClean || ing.name,
  quantity: ing.amount || 1,
  unit: ing.measures.metric.unitShort || ing.unit || 'piece',
}))
```

**Problem:** Crashowało gdy `extendedIngredients` było puste lub undefined

**Teraz:**
```typescript
const ingredients: ExternalIngredient[] = [];

if (recipe.extendedIngredients && recipe.extendedIngredients.length > 0) {
  for (const ing of recipe.extendedIngredients) {
    ingredients.push({
      name: ing.nameClean || ing.name || ing.originalName || 'unknown',
      quantity: ing.amount && ing.amount > 0 ? ing.amount : 1,
      unit: ing.measures?.metric?.unitShort || ing.unit || 'piece',
    });
  }
  console.log(`🌐 [SPOONACULAR] Parsed ${ingredients.length} ingredients`);
} else {
  console.warn(`🌐 [SPOONACULAR] ⚠️ No extendedIngredients for recipe ${recipeId}`);
}
```

**Ulepszenia:**
1. **Sprawdzanie istnienia:** `if (recipe.extendedIngredients && recipe.extendedIngredients.length > 0)`
2. **Fallbacki dla nazwy:** `nameClean || name || originalName || 'unknown'`
3. **Sprawdzanie ilości:** `ing.amount && ing.amount > 0 ? ing.amount : 1`
4. **Optional chaining:** `ing.measures?.metric?.unitShort`
5. **Szczegółowe logi:** Informuje ile składników zostało sparsowanych

**Instrukcje - podwójne źródło:**
```typescript
// Preferuj analyzedInstructions (strukturowane kroki)
if (recipe.analyzedInstructions && recipe.analyzedInstructions.length > 0) {
  instructions = recipe.analyzedInstructions
    .map(instruction => 
      instruction.steps
        .map(step => `${step.number}. ${step.step}`)
        .join('\n')
    )
    .join('\n\n');
}
// Fallback do plain instructions (HTML format)
else if (recipe.instructions) {
  instructions = htmlToText(recipe.instructions);
}
// Ostateczny fallback
else {
  instructions = 'Brak instrukcji przygotowania.';
}
```

---

## Szczegółowe logi diagnostyczne

Dodano obszerne logi do debugowania:

```
🌐 [SPOONACULAR] Fetching details for recipe 637684...
🌐 [SPOONACULAR] ✅ Fetched recipe: Cheesy Rosemary Meatball Bake
🌐 [SPOONACULAR] Recipe has 15 ingredients
🌐 [SPOONACULAR] Parsed 15 ingredients
🌐 [SPOONACULAR] Using analyzedInstructions (2 sections)
🌍 [TRANSLATOR] Translating recipe: "Cheesy Rosemary Meatball Bake"
🌍 [TRANSLATOR] ✅ Translated to: "Pieczone klopsiki z serem i rozmarynem"
```

**Poziomy logowania:**
- `🌐 [SPOONACULAR]` - Operacje Spoonacular API
- `🌍 [TRANSLATOR]` - Tłumaczenie przepisów
- `📦 [MAPPER]` - Mapowanie i zapis do bazy
- `✅` - Sukces
- `⚠️` - Ostrzeżenie
- `❌` - Błąd

---

## Nowe pliki

### 1. `src/lib/utils/html-to-text.ts`
Konwersja HTML na czytelny tekst:
- `htmlToText(html: string): string` - Pełna konwersja
- `stripHtmlTags(html: string): string` - Tylko usuwanie tagów
- `extractSummary(html: string, maxLength: number): string` - Inteligentne skracanie

### 2. `src/lib/utils/recipe-translator.ts`
Tłumaczenie przepisów używając LLM:
- `translateRecipe(recipe): Promise<TranslatedRecipe>` - Tłumacz pojedynczy przepis
- `translateRecipes(recipes): Promise<TranslatedRecipe[]>` - Batch tłumaczenie
- Automatyczny fallback do angielskiego jeśli tłumaczenie się nie powiedzie

### 3. Rozszerzenie `src/lib/services/ai/openrouter.client.ts`
- `generateText(prompt, options): Promise<string>` - Ogólna generacja tekstu
- Używane do tłumaczenia przepisów

---

## Koszty i wydajność

### Tłumaczenie (OpenRouter):
- **Model:** `perplexity/sonar-pro` (lub skonfigurowany)
- **Koszt:** ~$3 per 1M tokens
- **Szacowany koszt na przepis:** ~$0.01 (1 przepis = ~300 tokenów)
- **Czas:** ~2-5 sekund na przepis

### Spoonacular API:
- **Koszt punktów:** 
  - findByIngredients: 1 punkt
  - recipe information: 1 punkt na przepis
  - Razem: ~6 punktów na wyszukiwanie (5 przepisów)
- **Limit darmowy:** 150 punktów/dzień = ~25 wyszukiwań

### Optymalizacja:
- Tłumaczenie jest **opcjonalne** - jeśli OpenRouter nie jest skonfigurowany, zwraca angielski tekst
- Przepisy są cache'owane w bazie - tłumaczenie raz, używane wielokrotnie
- Duplikaty są wykrywane (external_id) - nie ma ponownego tłumaczenia

---

## Testowanie

### Scenariusz 1: Pełny przepis ze składnikami
```bash
# Wyszukaj: mięso mielone, jajko, cebula
🌐 [SPOONACULAR] Found 5 recipe summaries
🌐 [SPOONACULAR] Recipe has 15 ingredients
🌐 [SPOONACULAR] Parsed 15 ingredients
🌍 [TRANSLATOR] ✅ Translated to: "Pieczone klopsiki..."
```

**Oczekiwany wynik:**
- ✅ Przepis po polsku
- ✅ Wszystkie składniki widoczne
- ✅ Instrukcje jako numerowana lista
- ✅ Pełny opis (do 500 znaków)

### Scenariusz 2: Przepis bez składników
```bash
🌐 [SPOONACULAR] ⚠️ No extendedIngredients for recipe 12345
🌐 [SPOONACULAR] Using plain instructions field (HTML format)
```

**Oczekiwany wynik:**
- ✅ Brak błędów
- ⚠️ Lista składników pusta
- ✅ Instrukcje nadal widoczne (z HTML)

### Scenariusz 3: Tłumaczenie wyłączone
```bash
🌍 [TRANSLATOR] OpenRouter not configured, skipping translation
```

**Oczekiwany wynik:**
- ✅ Przepis po angielsku (oryginalny)
- ✅ Brak błędów
- ✅ Pozostała funkcjonalność działa

---

## Troubleshooting

### Problem: Przepisy nadal po angielsku

**Powody:**
1. OpenRouter nie skonfigurowany
2. Brak kredytów w OpenRouter
3. Błąd tłumaczenia (fallback do angielskiego)

**Rozwiązanie:**
- Sprawdź logi: `🌍 [TRANSLATOR]`
- Sprawdź `OPENROUTER_API_KEY` w `.env`
- Sprawdź kredyty na [OpenRouter](https://openrouter.ai/credits)

### Problem: Instrukcje nadal jako HTML

**Powód:** Funkcja `htmlToText` nie została zastosowana

**Rozwiązanie:**
- Sprawdź czy import jest poprawny
- Sprawdź logi: `🌐 [SPOONACULAR] Using plain instructions`
- Kod powinien używać `htmlToText(recipe.instructions)`

### Problem: Brak składników

**Powody:**
1. Spoonacular nie zwraca `extendedIngredients` dla tego przepisu
2. Błąd parsowania

**Rozwiązanie:**
- Sprawdź logi: `🌐 [SPOONACULAR] Recipe has X ingredients`
- Jeśli X = 0: problem po stronie Spoonacular API
- Spróbuj innego przepisu

---

## Przyszłe ulepszenia (opcjonalne)

1. **Cache tłumaczeń**
   - Zapisz przetłumaczone teksty w osobnej tabeli
   - Ponowne użycie dla identycznych przepisów

2. **Batch tłumaczenie**
   - Tłumacz wszystkie 5 przepisów w jednym request
   - Zmniejsz koszty i czas

3. **Wybór języka**
   - Pozwól użytkownikowi wybrać język (polski/angielski)
   - Zapisz preferencję w profilu

4. **Lepsze dopasowanie jednostek**
   - Konwertuj jednostki imperialne na metryczne
   - Normalizuj nazwy jednostek (tbsp → łyżka stołowa)

5. **Obsługa wielu źródeł instrukcji**
   - Parsuj różne formaty HTML
   - Obsługa video URLs (YouTube, Vimeo)

