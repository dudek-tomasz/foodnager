# Konfiguracja Spoonacular API

## Przegląd

Aplikacja Foodnager wykorzystuje Spoonacular API jako Tier 2 w hierarchicznym wyszukiwaniu przepisów. Spoonacular dostarcza bogatą bazę przepisów z dokładnymi informacjami o składnikach, instrukcjach i wartościach odżywczych.

## Rejestracja i klucz API

1. Przejdź do [Spoonacular Food API](https://spoonacular.com/food-api)
2. Zarejestruj się i utwórz konto
3. Przejdź do [Dashboard](https://spoonacular.com/food-api/console#Dashboard)
4. Skopiuj swój klucz API

## Plany i limity

### Darmowy plan
- 150 requestów dziennie
- Dostęp do wszystkich podstawowych endpointów
- Idealny do testowania i MVP

### Płatne plany
- Basic: $19.99/miesiąc (500 req/dzień)
- Mega: $49.99/miesiąc (5000 req/dzień)
- Ultra: $149.99/miesiąc (50000 req/dzień)

## Konfiguracja zmiennych środowiskowych

Dodaj następujące zmienne do pliku `.env`:

```env
# External Recipe API (Tier 2) - Spoonacular
EXTERNAL_RECIPE_API_URL=https://api.spoonacular.com
EXTERNAL_RECIPE_API_KEY=your-spoonacular-api-key

# Timeouts for Tier 2 (optional, default: 10000ms)
TIER2_TIMEOUT_MS=10000
```

## Wykorzystywane endpointy

### 1. Find Recipes by Ingredients
**Endpoint:** `GET /recipes/findByIngredients`

**Opis:** Wyszukuje przepisy na podstawie listy składników

**Parametry:**
- `ingredients` (string) - Comma-separated lista składników (np. "tomato,pasta,cheese")
- `number` (integer) - Liczba wyników (domyślnie: 5)
- `ranking` (integer) - 1 = maksymalizuj użyte składniki, 2 = minimalizuj brakujące
- `ignorePantry` (boolean) - Ignoruj podstawowe składniki jak sól, pieprz

**Przykład:**
```
GET /recipes/findByIngredients?ingredients=tomato,pasta&number=5&ranking=1&ignorePantry=true&apiKey=YOUR_KEY
```

**Odpowiedź:**
```json
[
  {
    "id": 654959,
    "title": "Pasta With Tuna",
    "image": "https://spoonacular.com/recipeImages/654959-312x231.jpg",
    "usedIngredientCount": 2,
    "missedIngredientCount": 1,
    "missedIngredients": [...],
    "usedIngredients": [...],
    "unusedIngredients": [...],
    "likes": 123
  }
]
```

### 2. Get Recipe Information
**Endpoint:** `GET /recipes/{id}/information`

**Opis:** Pobiera szczegółowe informacje o przepisie

**Parametry:**
- `id` (integer) - ID przepisu

**Przykład:**
```
GET /recipes/654959/information?apiKey=YOUR_KEY
```

**Odpowiedź:**
```json
{
  "id": 654959,
  "title": "Pasta With Tuna",
  "image": "https://spoonacular.com/recipeImages/654959-556x370.jpg",
  "servings": 4,
  "readyInMinutes": 45,
  "sourceUrl": "https://example.com",
  "instructions": "Step by step instructions...",
  "extendedIngredients": [
    {
      "id": 11529,
      "name": "tomato",
      "amount": 2,
      "unit": "cups",
      "measures": {
        "metric": {
          "amount": 473.0,
          "unitShort": "ml",
          "unitLong": "milliliters"
        }
      }
    }
  ],
  "cuisines": ["Italian"],
  "diets": ["dairy free"],
  "vegetarian": false,
  "vegan": false,
  "glutenFree": false,
  "dairyFree": true
}
```

## Implementacja w Foodnager

### Przepływ wyszukiwania (Tier 2)

1. Użytkownik wybiera produkty z lodówki
2. System wywołuje `searchRecipes(ingredients, preferences)`
3. ExternalAPIService:
   - Konwertuje produkty na nazwy składników
   - Wywołuje `/recipes/findByIngredients`
   - Dla każdego znalezionego przepisu wywołuje `/recipes/{id}/information`
   - Parsuje odpowiedź do wewnętrznego formatu `ExternalRecipe`
4. RecipeDiscoveryService:
   - Mapuje zewnętrzne przepisy na wewnętrzny format
   - Zapisuje przepisy do bazy (source='api')
   - Oblicza match_score dla każdego przepisu
   - Zwraca posortowane wyniki

### Mapowanie danych

#### Składniki
```typescript
// Spoonacular → Internal format
{
  name: ingredient.nameClean || ingredient.name,
  quantity: ingredient.amount || 1,
  unit: ingredient.measures.metric.unitShort || ingredient.unit || 'piece'
}
```

#### Trudność przepisu
Obliczana na podstawie:
- Liczby składników (1-5: easy, 6-10: medium, 11+: hard)
- Czasu gotowania (≤30min: easy, 31-60min: medium, 61+min: hard)

#### Tagi
Zbierane z:
- `diets` (vegetarian, vegan, gluten-free, etc.)
- `cuisines` (Italian, Asian, Mexican, etc.)
- `dishTypes` (main course, dessert, appetizer, etc.)

### Obsługa błędów

#### Brak klucza API
```typescript
if (!this.config.apiKey) {
  console.warn('Spoonacular API key not configured, skipping external API search');
  return [];
}
```

#### Przekroczenie limitu requestów
```json
{
  "status": 402,
  "message": "Your API key's daily points limit has been reached. Please wait..."
}
```

#### Timeout
- Domyślny timeout: 10 sekund
- Konfigurowalne przez `TIER2_TIMEOUT_MS`
- Fallback do Tier 3 (AI) w przypadku timeout

## Optymalizacja kosztów

### 1. Cachowanie wyników
- Klucz cache: `search:{userId}:{productsHash}:{preferencesHash}`
- TTL: 1 godzina
- Znacznie redukuje liczbę requestów dla powtarzalnych wyszukiwań

### 2. Limit wyników
- Pobieramy maksymalnie 5 przepisów na wyszukiwanie
- Zapisujemy tylko top 3 do bazy
- Minimalizuje zużycie API calls

### 3. Fallback do Tier 1
- Zawsze najpierw przeszukujemy przepisy użytkownika
- Tier 2 uruchamiany tylko gdy Tier 1 nie zwróci dobrych wyników (match_score < 0.7)

### 4. Rate limiting po stronie aplikacji
- Implementacja rate limiter przed wywołaniem API
- Ochrona przed przypadkowym wyczerpaniem limitu

## Monitoring

### Metryki do śledzenia
1. Liczba requestów do Spoonacular dziennie
2. Średni czas odpowiedzi API
3. Liczba błędów / timeoutów
4. Cache hit rate
5. Procent wyszukiwań kończących się na Tier 2

### Alerty
- Zużycie > 80% dziennego limitu
- Error rate > 10%
- Średni czas odpowiedzi > 5s

## Testy

### Testowanie z mock API
W testach jednostkowych używamy mock responses:

```typescript
// Mock findByIngredients response
const mockSearchResults = [
  {
    id: 654959,
    title: "Test Recipe",
    image: "https://example.com/image.jpg",
    usedIngredientCount: 3,
    missedIngredientCount: 1
  }
];

// Mock recipe details response
const mockRecipeDetails = {
  id: 654959,
  title: "Test Recipe",
  readyInMinutes: 30,
  extendedIngredients: [...],
  instructions: "Test instructions..."
};
```

## Problemy i rozwiązania

### Problem: HTML w summary/instructions
**Rozwiązanie:** Metoda `stripHtmlTags()` usuwa tagi HTML

### Problem: Brak instrukcji w plain text
**Rozwiązanie:** Parsowanie `analyzedInstructions` do tekstu

### Problem: Różne jednostki miary
**Rozwiązanie:** Używamy `measures.metric` dla spójności

### Problem: Duplikaty tagów
**Rozwiązanie:** `[...new Set(tags)]` usuwa duplikaty

## Przykładowe zapytania

### Wyszukiwanie przepisów z pomidorami i serem
```bash
curl "https://api.spoonacular.com/recipes/findByIngredients?ingredients=tomato,cheese&number=5&ranking=1&ignorePantry=true&apiKey=YOUR_KEY"
```

### Szczegóły przepisu
```bash
curl "https://api.spoonacular.com/recipes/654959/information?apiKey=YOUR_KEY"
```

## Dokumentacja API

Pełna dokumentacja Spoonacular API:
- [Official Docs](https://spoonacular.com/food-api/docs)
- [API Console](https://spoonacular.com/food-api/console)
- [Recipe Endpoints](https://spoonacular.com/food-api/docs#Search-Recipes-by-Ingredients)

## Następne kroki

1. Zarejestruj się na Spoonacular i uzyskaj klucz API
2. Dodaj klucz do pliku `.env`
3. Przetestuj integrację: `npm run dev`
4. Monitoruj zużycie w Spoonacular Dashboard
5. Rozważ upgrade planu jeśli potrzeba więcej requestów

