# API Endpoints Implementation Plan: Recipe Discovery & AI Integration

## Spis treści
1. [POST /api/recipes/search-by-fridge - Search Recipes by Fridge Contents](#1-post-apirecipessearch-by-fridge---search-recipes-by-fridge-contents)
2. [POST /api/recipes/generate - Generate Recipe with AI](#2-post-apirecipesgenerate---generate-recipe-with-ai)

---

## 1. POST /api/recipes/search-by-fridge - Search Recipes by Fridge Contents

### 1.1 Przegląd punktu końcowego
Najbardziej złożony endpoint w systemie. Implementuje hierarchiczne wyszukiwanie przepisów (US-004): najpierw przeszukuje przepisy użytkownika, następnie zewnętrzne API, a ostatecznie generuje przepis przez AI. Matching algorithm oblicza score na podstawie dostępności składników.

**Powiązane User Stories:** US-004 (Wyszukiwanie przepisu na podstawie dostępnych produktów)

### 1.2 Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/api/recipes/search-by-fridge`
- **Wymagane nagłówki:**
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`

**Request Body:**
- **Wymagane:**
  - `use_all_fridge_items` (boolean) - Czy użyć wszystkich produktów z lodówki
- **Opcjonalne:**
  - `custom_product_ids` (array of integers) - Własna lista produktów (jeśli use_all_fridge_items = false)
  - `max_results` (integer) - Maksymalna liczba wyników, domyślnie 10
  - `preferences` (object) - Preferencje wyszukiwania:
    - `max_cooking_time` (integer) - Maksymalny czas gotowania w minutach
    - `difficulty` (enum) - Preferowana trudność
    - `dietary_restrictions` (array of strings) - Ograniczenia dietetyczne (np. ["vegetarian", "gluten-free"])

**Przykładowe żądania:**
```json
POST /api/recipes/search-by-fridge
{
  "use_all_fridge_items": true,
  "max_results": 5,
  "preferences": {
    "max_cooking_time": 60,
    "difficulty": "easy",
    "dietary_restrictions": ["vegetarian"]
  }
}
```

```json
POST /api/recipes/search-by-fridge
{
  "use_all_fridge_items": false,
  "custom_product_ids": [10, 15, 20],
  "max_results": 10
}
```

### 1.3 Wykorzystywane typy

**Request DTOs:**
```typescript
SearchRecipesByFridgeDTO {
  use_all_fridge_items: boolean;
  custom_product_ids?: number[];
  max_results?: number;
  preferences?: SearchRecipePreferencesDTO;
}

SearchRecipePreferencesDTO {
  max_cooking_time?: number;
  difficulty?: DifficultyEnum;
  dietary_restrictions?: string[];
}
```

**Response DTOs:**
```typescript
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
```

### 1.4 Szczegóły odpowiedzi

**Sukces (200 OK):**
```json
{
  "results": [
    {
      "recipe": {
        "id": 1,
        "title": "Tomato Soup",
        "description": "A simple and delicious tomato soup",
        "instructions": "1. Chop tomatoes...",
        "cooking_time": 30,
        "difficulty": "easy",
        "source": "user",
        "ingredients": [
          {
            "product": {
              "id": 10,
              "name": "Tomato"
            },
            "quantity": 5,
            "unit": {
              "id": 1,
              "name": "piece",
              "abbreviation": "pc"
            }
          }
        ]
      },
      "match_score": 0.95,
      "available_ingredients": [
        {
          "product_id": 10,
          "product_name": "Tomato",
          "required_quantity": 5,
          "available_quantity": 8,
          "unit": "pc"
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

**Błędy:**
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `422 Unprocessable Entity` - Nieprawidłowe dane wejściowe
- `500 Internal Server Error` - Błąd zewnętrznego API lub AI

### 1.5 Przepływ danych

```
1. [Client] → POST /api/recipes/search-by-fridge
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse request body
5. [Handler] → Walidacja przez Zod
6. [Service] → RecipeDiscoveryService.searchByFridge(userId, searchDto)

=== TIER 1: USER RECIPES ===
7. [Service] → Pobierz available products:
   - Jeśli use_all_fridge_items: SELECT * FROM user_products WHERE user_id = $1
   - Jeśli custom_product_ids: Weryfikuj dostępność i pobierz dane
8. [Service] → Pobierz przepisy użytkownika z ingredients
9. [Service] → Dla każdego przepisu: oblicz match_score
   - Score = (available_ingredients_count / total_ingredients_count)
   - Uwzględnij ilości (czy wystarczająco?)
10. [Service] → Filtruj według preferences (time, difficulty, dietary)
11. [Service] → Sortuj według match_score DESC
12. [Service] → Jeśli match_score > 0.7 dla top result → RETURN results

=== TIER 2: EXTERNAL API (jeśli Tier 1 nie wystarczy) ===
13. [Service] → ExternalAPIService.searchRecipes(productNames, preferences)
14. [External API] → Call recipe API (np. Spoonacular, TheMealDB)
15. [Service] → Parse i mapuj response na internal format
16. [Service] → Dla każdego wyniku:
    - Mapuj external ingredients na internal products (fuzzy match)
    - Oblicz match_score
17. [Service] → Jeśli znaleziono wyniki → Save best recipes (source='api') → RETURN

=== TIER 3: AI GENERATION (jeśli Tier 2 failed/empty) ===
18. [Service] → AIService.generateRecipe(products, preferences)
19. [AI Service] → Call OpenRouter API z promptem
20. [Service] → Parse AI response (JSON)
21. [Service] → Waliduj strukturę przepisu
22. [Service] → Mapuj AI ingredients na products
23. [Service] → Save recipe (source='ai')
24. [Service] → RETURN generated recipe

25. [Handler] → Response 200 z SearchRecipesResponseDTO
```

### 1.6 Względy bezpieczeństwa

**Uwierzytelnianie:**
- Wymagany Bearer token

**Autoryzacja:**
- Dostęp tylko do własnej lodówki
- custom_product_ids: weryfikacja dostępności dla użytkownika

**Walidacja:**
- Walidacja use_all_fridge_items + custom_product_ids logic
- max_results: 1-50
- preferences validation
- Sanityzacja przed wysłaniem do External API/AI

**Rate Limiting:**
- Szczególnie ważne dla AI tier (kosztowne)
- Limit: 5 AI requests per minute per user
- Cache wyniki na podstawie product combination

**External API:**
- API key security (environment variables)
- Timeout handling (max 10s per tier)
- Error handling (failover to next tier)

**AI Safety:**
- Prompt injection prevention
- Output validation (schema check)
- Content filtering (optional)

### 1.7 Obsługa błędów

| Scenariusz | Kod HTTP | Error Code | Akcja |
|------------|----------|------------|-------|
| Brak tokenu | 401 | UNAUTHORIZED | Zwróć komunikat o wymaganej autoryzacji |
| Nieprawidłowy token | 401 | UNAUTHORIZED | Zwróć komunikat o nieprawidłowym tokenie |
| Nieprawidłowe dane | 422 | VALIDATION_ERROR | Zwróć szczegóły walidacji |
| custom_product_ids nie istnieją | 422 | VALIDATION_ERROR | Zwróć: Invalid product IDs |
| Pusta lodówka | 422 | VALIDATION_ERROR | Zwróć: No products available |
| External API timeout | 500 | EXTERNAL_API_ERROR | Log, fallback to next tier |
| External API error | 500 | EXTERNAL_API_ERROR | Log, fallback to next tier |
| AI service error | 500 | AI_SERVICE_ERROR | Log, return empty results with metadata |
| AI rate limit exceeded | 429 | RATE_LIMIT_EXCEEDED | Zwróć: Try again later |
| Wszystkie tiers failed | 500 | INTERNAL_ERROR | Zwróć: No recipes found, try different products |

**Partial Success:**
- Jeśli Tier 1 zwraca 0 wyników: nie jest to błąd, próbujemy Tier 2
- Jeśli wszystkie tiers zwracają 0: zwracamy 200 z pustą listą + metadata

### 1.8 Wydajność

**Optymalizacje:**
- Tier 1 (user recipes) - najbardziej efektywny, zawsze próbujemy najpierw
- Batch loading: wszystkie przepisy + ingredients w 2-3 queries
- Match score calculation: in-memory (szybkie)
- Cache wyników: `search:{userId}:{productsHash}:{preferencesHash}` na 1 godzinę

**Timeouts:**
- Tier 1: max 5 sekund
- Tier 2: max 10 sekund
- Tier 3: max 30 sekund
- Total timeout: 45 sekund

**Caching Strategy:**
```typescript
// Cache key
const cacheKey = `search:${userId}:${hashProducts(products)}:${hashPreferences(prefs)}`;

// Cache hit: return immediately
if (cached) return cached;

// Cache miss: execute search, then cache
const results = await executeSearch();
cache.set(cacheKey, results, 3600); // 1 hour
```

**Cost Optimization (AI):**
- Cache agresywnie dla AI tier
- Fallback to tier 2 jeśli możliwe
- Batch AI requests (jeśli możliwe)

### 1.9 Etapy wdrożenia

#### Phase 1: Core Infrastructure

1. **Zod schema walidacji**
   ```typescript
   z.object({
     use_all_fridge_items: z.boolean(),
     custom_product_ids: z.array(z.number().int().positive()).optional(),
     max_results: z.number().int().min(1).max(50).default(10),
     preferences: z.object({
       max_cooking_time: z.number().int().positive().optional(),
       difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
       dietary_restrictions: z.array(z.string()).optional()
     }).optional()
   }).refine(data => {
     if (!data.use_all_fridge_items && !data.custom_product_ids) {
       return false;
     }
     return true;
   }, { message: "custom_product_ids required when use_all_fridge_items is false" })
   ```

2. **Match Score Calculator**
   ```typescript
   class MatchScoreCalculator {
     calculate(
       recipeIngredients: Ingredient[],
       availableProducts: FridgeItem[]
     ): {
       score: number;
       available: AvailableIngredientDTO[];
       missing: AvailableIngredientDTO[];
     }
   }
   ```

3. **Hash utilities**
   - `hashProducts(productIds: number[]): string`
   - `hashPreferences(prefs: SearchRecipePreferencesDTO): string`

#### Phase 2: Tier 1 Implementation

4. **RecipeDiscoveryService - Tier 1**
   ```typescript
   class RecipeDiscoveryService {
     async searchUserRecipes(
       userId: string,
       products: Product[],
       preferences?: Preferences
     ): Promise<RecipeSearchResultDTO[]>
   }
   ```
   - Fetch user recipes with ingredients
   - Calculate match scores
   - Filter by preferences
   - Sort by score
   - Return top matches (score > threshold)

5. **Preferences Filter**
   ```typescript
   function filterByPreferences(
     recipes: Recipe[],
     preferences?: Preferences
   ): Recipe[]
   ```

#### Phase 3: Tier 2 Implementation

6. **External API Service**
   ```typescript
   class ExternalAPIService {
     async searchRecipes(
       ingredients: string[],
       preferences?: Preferences
     ): Promise<ExternalRecipe[]>
   }
   ```
   - HTTP client with timeout
   - Error handling
   - Response parsing

7. **External API Mapper**
   ```typescript
   class ExternalRecipeMapper {
     async mapToInternalFormat(
       externalRecipe: ExternalRecipe,
       userId: string
     ): Promise<Recipe>
   }
   ```
   - Ingredient mapping (fuzzy match product names)
   - Create products if not exist
   - Save recipe with source='api'

8. **Fuzzy Product Matcher**
   ```typescript
   class ProductMatcher {
     async findOrCreateProduct(
       productName: string,
       userId: string
     ): Promise<Product>
   }
   ```
   - Search existing products (case-insensitive, fuzzy)
   - Create new product if no match

#### Phase 4: Tier 3 Implementation

9. **AI Service**
   ```typescript
   class AIService {
     async generateRecipe(
       products: Product[],
       preferences?: Preferences
     ): Promise<GeneratedRecipe>
   }
   ```
   - Build prompt
   - Call OpenRouter API
   - Parse JSON response
   - Validate structure

10. **Prompt Builder**
    ```typescript
    class RecipePromptBuilder {
      build(
        products: Product[],
        preferences?: Preferences
      ): string
    }
    ```
    - Structured prompt for consistent output
    - Include JSON schema for response

11. **AI Response Validator**
    ```typescript
    class AIResponseValidator {
      validate(response: unknown): GeneratedRecipe
    }
    ```
    - Zod schema for AI response
    - Error handling for malformed responses

#### Phase 5: Integration & Endpoint

12. **Orchestrator Service**
    ```typescript
    class RecipeDiscoveryService {
      async searchByFridge(
        userId: string,
        searchDto: SearchRecipesByFridgeDTO
      ): Promise<SearchRecipesResponseDTO> {
        const startTime = Date.now();
        
        // Get available products
        const products = await this.getAvailableProducts(userId, searchDto);
        
        // Tier 1: User recipes
        const tier1Results = await this.searchUserRecipes(userId, products, searchDto.preferences);
        if (this.isGoodMatch(tier1Results)) {
          return this.buildResponse(tier1Results, 'user_recipes', startTime);
        }
        
        // Tier 2: External API
        try {
          const tier2Results = await this.searchExternalAPI(products, searchDto.preferences);
          if (tier2Results.length > 0) {
            return this.buildResponse(tier2Results, 'external_api', startTime);
          }
        } catch (error) {
          logger.error('External API failed', error);
        }
        
        // Tier 3: AI Generation
        try {
          const tier3Results = await this.generateWithAI(products, searchDto.preferences);
          return this.buildResponse(tier3Results, 'ai_generated', startTime);
        } catch (error) {
          logger.error('AI generation failed', error);
          return this.buildResponse([], 'ai_generated', startTime);
        }
      }
    }
    ```

13. **Endpoint handler**
    - Utwórz `src/pages/api/recipes/search-by-fridge.ts`
    - `export const prerender = false`
    - Implementuj `POST(context: APIContext)`
    - Rate limiting check
    - Cache check
    - Walidacja
    - Wywołaj RecipeDiscoveryService
    - Cache result
    - Zwróć response

#### Phase 6: Testing

14. **Unit Tests**
    - MatchScoreCalculator tests
    - Preferences filtering tests
    - Product matching tests
    - Prompt builder tests

15. **Integration Tests**
    - Tier 1: user recipes search
    - Tier 2: external API (mocked)
    - Tier 3: AI generation (mocked)
    - Fallback scenarios
    - Cache behavior

16. **E2E Tests**
    - Complete flow: Tier 1 success
    - Complete flow: Tier 1 → Tier 2
    - Complete flow: Tier 1 → Tier 2 → Tier 3
    - Error scenarios
    - Rate limiting

### 1.10 Configuration

**Environment Variables:**
```env
# External Recipe API
EXTERNAL_RECIPE_API_URL=https://api.spoonacular.com
EXTERNAL_RECIPE_API_KEY=your-api-key

# AI Service
OPENROUTER_API_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=your-api-key
OPENROUTER_MODEL=anthropic/claude-3-sonnet

# Thresholds
RECIPE_MATCH_THRESHOLD=0.7
TIER1_MAX_DURATION_MS=5000
TIER2_MAX_DURATION_MS=10000
TIER3_MAX_DURATION_MS=30000

# Rate Limiting
AI_REQUESTS_PER_MINUTE=5
```

---

## 2. POST /api/recipes/generate - Generate Recipe with AI

### 2.1 Przegląd punktu końcowego
Endpoint bezpośrednio generuje nowy przepis używając AI na podstawie wybranych produktów i preferencji. W przeciwieństwie do search-by-fridge, ten endpoint pomija wyszukiwanie i idzie bezpośrednio do generacji AI. Opcjonalnie zapisuje wygenerowany przepis do bazy danych użytkownika.

**Powiązane User Stories:** US-004 (Wyszukiwanie przepisu), rozszerzenie funkcjonalności AI

### 2.2 Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/api/recipes/generate`
- **Wymagane nagłówki:**
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`

**Request Body:**
- **Wymagane:**
  - `product_ids` (array of integers) - Lista IDs produktów do użycia, minimum 1
- **Opcjonalne:**
  - `preferences` (object) - Preferencje generacji:
    - `cuisine` (string) - Preferowana kuchnia (np. "Italian", "Asian")
    - `max_cooking_time` (integer) - Maksymalny czas gotowania
    - `difficulty` (enum) - Preferowana trudność
    - `dietary_restrictions` (array of strings) - Ograniczenia dietetyczne
  - `save_to_recipes` (boolean) - Czy zapisać wygenerowany przepis, domyślnie true

**Przykładowe żądanie:**
```json
POST /api/recipes/generate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

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

### 2.3 Wykorzystywane typy

**Request DTOs:**
```typescript
GenerateRecipeDTO {
  product_ids: number[];
  preferences?: GenerateRecipePreferencesDTO;
  save_to_recipes?: boolean;
}

GenerateRecipePreferencesDTO {
  cuisine?: string;
  max_cooking_time?: number;
  difficulty?: DifficultyEnum;
  dietary_restrictions?: string[];
}
```

**Response DTO:**
```typescript
GenerateRecipeResponseDTO {
  recipe: RecipeDTO;
}
```

### 2.4 Szczegóły odpowiedzi

**Sukces (201 Created):**
```json
{
  "recipe": {
    "id": 25,
    "title": "AI-Generated Tomato Pasta",
    "description": "A quick Italian-inspired pasta dish",
    "instructions": "1. Boil water for pasta...",
    "cooking_time": 25,
    "difficulty": "easy",
    "source": "ai",
    "metadata": {
      "ai_model": "anthropic/claude-3-sonnet",
      "generation_timestamp": "2025-10-18T12:00:00Z",
      "prompt_hash": "abc123",
      "input_products": [10, 15, 20],
      "preferences": {
        "cuisine": "Italian",
        "difficulty": "easy"
      }
    },
    "ingredients": [
      {
        "product": {
          "id": 10,
          "name": "Tomato"
        },
        "quantity": 4,
        "unit": {
          "id": 1,
          "name": "piece",
          "abbreviation": "pc"
        }
      }
    ],
    "tags": [
      {
        "id": 1,
        "name": "vegetarian"
      }
    ],
    "created_at": "2025-10-18T12:00:00Z",
    "updated_at": "2025-10-18T12:00:00Z"
  }
}
```

**Błędy:**
- `400 Bad Request` - Nieprawidłowe dane wejściowe
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `404 Not Found` - Produkt nie istnieje lub nie jest dostępny
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - AI service error
- `503 Service Unavailable` - AI service tymczasowo niedostępny

### 2.5 Przepływ danych

```
1. [Client] → POST /api/recipes/generate {product_ids, preferences}
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse request body
5. [Handler] → Walidacja przez Zod
6. [Handler] → Rate limit check (AI tier)
7. [Service] → AIRecipeService.generateRecipe(userId, generateDto)
8. [Service] → Weryfikacja product_ids (dostępność dla użytkownika)
9. [Database] → Fetch product details (names) dla product_ids
10. [Service] → Build AI prompt:
    - Product list
    - Preferences (cuisine, time, difficulty, dietary)
    - Output format instructions (JSON schema)
11. [AI Service] → Call OpenRouter API:
    - Model: claude-3-sonnet (lub configurable)
    - Temperature: 0.7 (kreatywność)
    - Max tokens: 2000
12. [AI Service] → Receive response (JSON)
13. [Service] → Parse i waliduj response:
    - Sprawdź required fields: title, instructions, ingredients
    - Waliduj ingredient quantities (> 0)
    - Waliduj cooking_time (> 0 jeśli podane)
14. [Service] → Map AI ingredients na products:
    - Dla każdego AI ingredient: find or create product
    - Find or create units
15. [Service] → Jeśli save_to_recipes = true:
    - BEGIN TRANSACTION
    - INSERT recipe (source='ai', metadata=...)
    - INSERT recipe_ingredients
    - Auto-tag based on dietary_restrictions
    - INSERT recipe_tags
    - COMMIT
16. [Service] → Build RecipeDTO (z lub bez ID, zależnie od save)
17. [Handler] → Response 201 z GenerateRecipeResponseDTO
```

### 2.6 Względy bezpieczeństwa

**Uwierzytelnianie:**
- Wymagany Bearer token

**Autoryzacja:**
- product_ids: weryfikacja dostępności dla użytkownika
- Zapisywanie tylko do własnych przepisów

**Walidacja:**
- product_ids: minimum 1, maximum 20 (praktyczny limit)
- Weryfikacja wszystkich product_ids przed generacją
- Sanityzacja preferences przed wysłaniem do AI

**Rate Limiting:**
- **Krytyczne**: AI generation jest kosztowne
- Limit: 5 requests per minute per user
- Limit dzienny: 50 requests per day per user
- Header w response: `X-RateLimit-Remaining-AI`

**AI Safety:**
- **Prompt Injection Prevention:**
  - Nie pozwalaj użytkownikowi na bezpośredni input do promptu
  - Tylko kontrolowane parametry (cuisine, difficulty)
  - Sanityzacja product names
- **Output Validation:**
  - Strict schema validation
  - Content filtering (opcjonalnie)
  - Reject malformed responses
- **Cost Control:**
  - Max tokens limit
  - Cache identycznych requestów
  - Monitor usage per user

**Data Privacy:**
- Metadata zawiera input data (audyt)
- Nie wysyłamy user PII do AI
- Log AI interactions (dla audytu)

### 2.7 Obsługa błędów

| Scenariusz | Kod HTTP | Error Code | Akcja |
|------------|----------|------------|-------|
| Brak tokenu | 401 | UNAUTHORIZED | Zwróć komunikat o wymaganej autoryzacji |
| Nieprawidłowy token | 401 | UNAUTHORIZED | Zwróć komunikat o nieprawidłowym tokenie |
| Brak product_ids | 400 | VALIDATION_ERROR | Zwróć: product_ids required |
| Puste product_ids | 400 | VALIDATION_ERROR | Zwróć: at least one product required |
| Za dużo product_ids (>20) | 400 | VALIDATION_ERROR | Zwróć: maximum 20 products allowed |
| product_id nie istnieje | 404 | NOT_FOUND | Zwróć: Product not found (ID) |
| product_id innego użytkownika | 404 | NOT_FOUND | Zwróć: Product not found |
| Rate limit exceeded | 429 | RATE_LIMIT_EXCEEDED | Zwróć: AI generation rate limit exceeded, headers z reset time |
| AI API timeout | 503 | AI_SERVICE_ERROR | Zwróć: AI service temporarily unavailable |
| AI API error | 500 | AI_SERVICE_ERROR | Log, zwróć: Failed to generate recipe |
| AI response malformed | 500 | AI_SERVICE_ERROR | Log, zwróć: Failed to parse AI response |
| AI response validation failed | 500 | AI_SERVICE_ERROR | Log, zwróć: Generated recipe is invalid |
| Save to DB failed | 500 | INTERNAL_ERROR | Log, ale zwróć generated recipe (bez ID) |

**Error Response Format:**
```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "AI generation rate limit exceeded. Try again in 45 seconds.",
    "details": {
      "limit": 5,
      "remaining": 0,
      "reset_at": "2025-10-18T12:01:00Z"
    }
  }
}
```

### 2.8 Wydajność

**Optymalizacje:**
- Cache identical requests: `ai:recipe:${hashProducts}:${hashPreferences}` na 24 godziny
- Batch product fetching
- Async processing (optional): zwróć job ID, poll for result

**Cost Optimization:**
- Agresywne cachowanie
- Monitoring usage per user
- Alert przy nadmiernym użyciu

**Timeouts:**
- AI API call: max 30 sekund
- Total request: max 45 sekund

**Caching Strategy:**
```typescript
// Cache key based on products + preferences
const cacheKey = `ai:recipe:${hashArray(productIds)}:${hashObject(preferences)}`;

// Check cache first
const cached = await cache.get(cacheKey);
if (cached) {
  // Return cached, optionally save as new recipe with different user_id
  return cached;
}

// Generate, then cache
const recipe = await generateWithAI(...);
await cache.set(cacheKey, recipe, 86400); // 24 hours
```

### 2.9 Etapy wdrożenia

#### Phase 1: Validation & Core

1. **Zod schema walidacji**
   ```typescript
   z.object({
     product_ids: z.array(z.number().int().positive()).min(1).max(20),
     preferences: z.object({
       cuisine: z.string().trim().max(50).optional(),
       max_cooking_time: z.number().int().positive().optional(),
       difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
       dietary_restrictions: z.array(z.string().trim()).optional()
     }).optional(),
     save_to_recipes: z.boolean().default(true)
   })
   ```

2. **Rate Limiter**
   ```typescript
   class AIRateLimiter {
     async checkLimit(userId: string): Promise<{
       allowed: boolean;
       remaining: number;
       resetAt: Date;
     }>
     
     async consumeToken(userId: string): Promise<void>
   }
   ```
   - Redis-based rate limiting
   - Sliding window algorithm
   - Per-minute and per-day limits

#### Phase 2: AI Integration

3. **AI Prompt Builder**
   ```typescript
   class AIRecipePromptBuilder {
     build(
       products: Product[],
       preferences?: GenerateRecipePreferencesDTO
     ): string {
       return `Generate a recipe using the following ingredients:
       ${products.map(p => `- ${p.name}`).join('\n')}
       
       Preferences:
       ${preferences?.cuisine ? `- Cuisine: ${preferences.cuisine}` : ''}
       ${preferences?.max_cooking_time ? `- Max cooking time: ${preferences.max_cooking_time} minutes` : ''}
       ${preferences?.difficulty ? `- Difficulty: ${preferences.difficulty}` : ''}
       ${preferences?.dietary_restrictions?.length ? `- Dietary restrictions: ${preferences.dietary_restrictions.join(', ')}` : ''}
       
       Return a JSON object with the following structure:
       {
         "title": "Recipe title",
         "description": "Short description",
         "instructions": "Step-by-step instructions",
         "cooking_time": 30,
         "difficulty": "easy",
         "ingredients": [
           {
             "product_name": "Tomato",
             "quantity": 5,
             "unit": "piece"
           }
         ],
         "tags": ["vegetarian", "quick meal"]
       }`;
     }
   }
   ```

4. **OpenRouter Client**
   ```typescript
   class OpenRouterClient {
     async generateRecipe(prompt: string): Promise<unknown> {
       const response = await fetch(OPENROUTER_API_URL, {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
           'Content-Type': 'application/json',
           'HTTP-Referer': 'https://foodnager.app',
           'X-Title': 'Foodnager'
         },
         body: JSON.stringify({
           model: OPENROUTER_MODEL,
           messages: [
             {
               role: 'user',
               content: prompt
             }
           ],
           temperature: 0.7,
           max_tokens: 2000,
           response_format: { type: 'json_object' }
         }),
         signal: AbortSignal.timeout(30000)
       });
       
       if (!response.ok) {
         throw new AIServiceError(`OpenRouter API error: ${response.status}`);
       }
       
       const data = await response.json();
       return JSON.parse(data.choices[0].message.content);
     }
   }
   ```

5. **AI Response Validator**
   ```typescript
   const AIRecipeSchema = z.object({
     title: z.string().min(1),
     description: z.string().optional(),
     instructions: z.string().min(1),
     cooking_time: z.number().int().positive().optional(),
     difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
     ingredients: z.array(z.object({
       product_name: z.string(),
       quantity: z.number().positive(),
       unit: z.string()
     })).min(1),
     tags: z.array(z.string()).optional()
   });
   
   class AIResponseValidator {
     validate(response: unknown): AIRecipe {
       return AIRecipeSchema.parse(response);
     }
   }
   ```

#### Phase 3: Product & Unit Mapping

6. **AI Ingredient Mapper**
   ```typescript
   class AIIngredientMapper {
     async mapIngredients(
       aiIngredients: AIIngredient[],
       userId: string
     ): Promise<RecipeIngredient[]> {
       const results = [];
       
       for (const aiIng of aiIngredients) {
         // Find or create product
         const product = await this.productMatcher.findOrCreate(
           aiIng.product_name,
           userId
         );
         
         // Find or create unit
         const unit = await this.unitMatcher.findOrCreate(aiIng.unit);
         
         results.push({
           product_id: product.id,
           quantity: aiIng.quantity,
           unit_id: unit.id
         });
       }
       
       return results;
     }
   }
   ```

7. **Tag Auto-Assignment**
   ```typescript
   class TagAutoAssigner {
     async assignTags(
       recipe: Partial<Recipe>,
       aiTags: string[],
       preferences?: GenerateRecipePreferencesDTO
     ): Promise<number[]> {
       const tagNames = new Set<string>();
       
       // Add AI-suggested tags
       aiTags?.forEach(t => tagNames.add(t.toLowerCase()));
       
       // Add tags from dietary restrictions
       preferences?.dietary_restrictions?.forEach(r => 
         tagNames.add(r.toLowerCase())
       );
       
       // Find or create tags
       const tagIds = [];
       for (const name of tagNames) {
         const tag = await this.findOrCreateTag(name);
         tagIds.push(tag.id);
       }
       
       return tagIds;
     }
   }
   ```

#### Phase 4: Service Integration

8. **AIRecipeService**
   ```typescript
   class AIRecipeService {
     async generateRecipe(
       userId: string,
       generateDto: GenerateRecipeDTO
     ): Promise<RecipeDTO> {
       // 1. Verify products
       const products = await this.verifyProducts(userId, generateDto.product_ids);
       
       // 2. Check cache
       const cacheKey = this.buildCacheKey(generateDto);
       const cached = await this.cache.get(cacheKey);
       if (cached) {
         return this.handleCachedRecipe(cached, userId, generateDto.save_to_recipes);
       }
       
       // 3. Build prompt
       const prompt = this.promptBuilder.build(products, generateDto.preferences);
       
       // 4. Call AI
       const aiResponse = await this.openRouterClient.generateRecipe(prompt);
       
       // 5. Validate response
       const validatedRecipe = this.validator.validate(aiResponse);
       
       // 6. Map ingredients
       const ingredients = await this.ingredientMapper.mapIngredients(
         validatedRecipe.ingredients,
         userId
       );
       
       // 7. Auto-assign tags
       const tagIds = await this.tagAssigner.assignTags(
         validatedRecipe,
         validatedRecipe.tags || [],
         generateDto.preferences
       );
       
       // 8. Save to DB (if requested)
       let savedRecipe: Recipe | null = null;
       if (generateDto.save_to_recipes) {
         savedRecipe = await this.saveRecipe(
           userId,
           validatedRecipe,
           ingredients,
           tagIds,
           generateDto
         );
       }
       
       // 9. Cache result
       await this.cache.set(cacheKey, validatedRecipe, 86400);
       
       // 10. Build response
       return this.buildRecipeDTO(savedRecipe || validatedRecipe, ingredients);
     }
     
     private async saveRecipe(
       userId: string,
       aiRecipe: AIRecipe,
       ingredients: RecipeIngredient[],
       tagIds: number[],
       originalRequest: GenerateRecipeDTO
     ): Promise<Recipe> {
       return await withTransaction(async (client) => {
         // Insert recipe with metadata
         const recipe = await client.query(`
           INSERT INTO recipes (
             user_id, title, description, instructions,
             cooking_time, difficulty, source, metadata
           ) VALUES ($1, $2, $3, $4, $5, $6, 'ai', $7)
           RETURNING *
         `, [
           userId,
           aiRecipe.title,
           aiRecipe.description,
           aiRecipe.instructions,
           aiRecipe.cooking_time,
           aiRecipe.difficulty,
           JSON.stringify({
             ai_model: OPENROUTER_MODEL,
             generation_timestamp: new Date().toISOString(),
             prompt_hash: hashString(this.promptBuilder.build(...)),
             input_products: originalRequest.product_ids,
             preferences: originalRequest.preferences
           })
         ]);
         
         // Insert ingredients
         await this.batchInsertIngredients(client, recipe.id, ingredients);
         
         // Insert tags
         await this.batchInsertTags(client, recipe.id, tagIds);
         
         return recipe.rows[0];
       });
     }
   }
   ```

#### Phase 5: Endpoint & Testing

9. **Endpoint handler**
   - Utwórz `src/pages/api/recipes/generate.ts`
   - `export const prerender = false`
   - Implementuj `POST(context: APIContext)`
   - Rate limiting check (AI tier)
   - Parse i waliduj body
   - Wywołaj AIRecipeService.generateRecipe()
   - Zwróć 201 z response

10. **Rate Limit Headers**
    ```typescript
    // Add headers to response
    response.headers.set('X-RateLimit-Limit-AI', '5');
    response.headers.set('X-RateLimit-Remaining-AI', remaining.toString());
    response.headers.set('X-RateLimit-Reset-AI', resetAt.toISOString());
    ```

11. **Testing**
    - Unit tests: prompt builder, validator, mapper
    - Integration tests: AI client (mocked), full flow
    - E2E tests:
      - Successful generation + save
      - Successful generation without save
      - Cache hit scenario
      - Rate limit enforcement
      - Invalid AI response handling
      - Product mapping (find vs create)
      - Tag auto-assignment

### 2.10 Monitoring & Observability

**Metrics to Track:**
- AI requests per user (rate limiting)
- AI response times
- AI success/failure rates
- AI token usage (cost)
- Cache hit rate
- Generated recipes saved vs not saved

**Logging:**
```typescript
logger.info('AI recipe generation started', {
  userId,
  productIds: generateDto.product_ids,
  preferences: generateDto.preferences
});

logger.info('AI recipe generated successfully', {
  userId,
  recipeId: savedRecipe?.id,
  duration: Date.now() - startTime,
  cached: false,
  tokenUsage: aiResponse.usage
});

logger.error('AI generation failed', {
  userId,
  error: error.message,
  productIds: generateDto.product_ids
});
```

**Alerts:**
- AI error rate > 10%
- User exceeding daily limits frequently
- High AI costs (monthly budget)
- AI response validation failures > 5%

---

## Podsumowanie implementacji Recipe Discovery & AI Integration

### Architektura

```
┌─────────────────────────────────────────────────────────────┐
│                     Recipe Discovery API                     │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  POST /api/recipes/search-by-fridge                         │
│    ↓                                                          │
│    RecipeDiscoveryService (Orchestrator)                    │
│    ├─→ Tier 1: User Recipes (MatchScoreCalculator)         │
│    ├─→ Tier 2: External API (ExternalAPIService)           │
│    └─→ Tier 3: AI Generation (AIService)                   │
│                                                               │
│  POST /api/recipes/generate                                  │
│    ↓                                                          │
│    AIRecipeService                                           │
│    ├─→ OpenRouterClient                                     │
│    ├─→ AIIngredientMapper                                   │
│    └─→ TagAutoAssigner                                      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Struktura plików
```
src/
├── lib/
│   ├── services/
│   │   ├── recipe-discovery.service.ts   # Tier 1-3 orchestration
│   │   ├── ai-recipe.service.ts          # Direct AI generation
│   │   ├── external-api.service.ts       # External recipe API
│   │   └── ai/
│   │       ├── openrouter.client.ts      # OpenRouter API client
│   │       ├── prompt-builder.ts         # AI prompt construction
│   │       └── response-validator.ts     # AI response validation
│   ├── mappers/
│   │   ├── ingredient-mapper.ts          # AI → DB mapping
│   │   └── external-recipe-mapper.ts     # External → DB mapping
│   ├── utils/
│   │   ├── match-score.calculator.ts     # Ingredient matching
│   │   ├── product-matcher.ts            # Fuzzy product matching
│   │   ├── rate-limiter.ts               # AI rate limiting
│   │   └── hash.utils.ts                 # Cache key generation
│   └── validations/
│       └── recipe-discovery.validation.ts
└── pages/
    └── api/
        └── recipes/
            ├── search-by-fridge.ts
            └── generate.ts
```

### Konfiguracja środowiskowa

```env
# External API (Tier 2)
EXTERNAL_RECIPE_API_URL=https://api.spoonacular.com/recipes/findByIngredients
EXTERNAL_RECIPE_API_KEY=your-spoonacular-key

# OpenRouter (Tier 3)
OPENROUTER_API_URL=https://openrouter.ai/api/v1/chat/completions
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=anthropic/claude-3-sonnet

# Thresholds & Limits
RECIPE_MATCH_THRESHOLD=0.7
TIER1_TIMEOUT_MS=5000
TIER2_TIMEOUT_MS=10000
TIER3_TIMEOUT_MS=30000

# Rate Limiting
AI_RATE_LIMIT_PER_MINUTE=5
AI_RATE_LIMIT_PER_DAY=50

# Caching
RECIPE_SEARCH_CACHE_TTL=3600
AI_RECIPE_CACHE_TTL=86400
```

### Kolejność implementacji

**Week 1: Infrastructure**
1. Rate limiter (Redis-based)
2. Cache utilities
3. Hash functions
4. Base error classes

**Week 2: Tier 1 (User Recipes)**
5. MatchScoreCalculator
6. Preferences filter
7. RecipeDiscoveryService - Tier 1
<!-- 8. Tests -->

**Week 3: Tier 2 (External API)**
9. ExternalAPIService
10. ExternalRecipeMapper
11. Product fuzzy matcher
12. Integration

**Week 4: Tier 3 (AI Generation)**
13. OpenRouter client
14. Prompt builder
15. Response validator
16. AI ingredient mapper
17. Tag auto-assigner

<!-- **Week 5: Integration & Testing**
18. Full RecipeDiscoveryService orchestration
19. AIRecipeService (direct generation)
20. Endpoint handlers
21. E2E testing
22. Performance optimization -->

### Critical Success Factors

1. **Rate Limiting**: Absolutnie kluczowe dla kosztów AI
2. **Caching**: Maksymalne wykorzystanie cache dla identycznych requestów
3. **Error Handling**: Graceful degradation (Tier fallback)
4. **Monitoring**: Tracking AI usage, costs, success rates
5. **Validation**: Strict validation AI outputs (security + quality)
6. **Performance**: Timeouts i optymalizacje dla każdego tier

