# API Endpoints Implementation Plan: Recipes Management

## Spis treści
1. [GET /api/recipes - List Recipes](#1-get-apirecipes---list-recipes)
2. [GET /api/recipes/:id - Get Recipe by ID](#2-get-apirecipesid---get-recipe-by-id)
3. [POST /api/recipes - Create Recipe](#3-post-apirecipes---create-recipe)
4. [PATCH /api/recipes/:id - Update Recipe](#4-patch-apirecipesid---update-recipe)
5. [DELETE /api/recipes/:id - Delete Recipe](#5-delete-apirecipesid---delete-recipe)

---

## 1. GET /api/recipes - List Recipes

### 1.1 Przegląd punktu końcowego
Endpoint pobiera listę przepisów użytkownika z zaawansowanymi opcjami filtrowania i wyszukiwania. Obsługuje full-text search, filtrowanie według źródła, trudności, tagów, czasu gotowania oraz sortowanie i paginację. Zwraca przepisy z zagnieżdżonymi składnikami i tagami.

**Powiązane User Stories:** US-003 (Zarządzanie przepisami), US-004 (Wyszukiwanie przepisu)

### 1.2 Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/recipes`
- **Wymagane nagłówki:** `Authorization: Bearer {access_token}`

**Query Parameters:**
- **Opcjonalne:**
  - `search` (string) - Full-text search w tytule i instrukcjach
  - `source` (enum: `user`, `api`, `ai`) - Filtruj według źródła przepisu
  - `difficulty` (enum: `easy`, `medium`, `hard`) - Filtruj według trudności
  - `tags` (array of integers) - Filtruj według tag IDs (comma-separated, np. `tags=1,2,3`)
  - `max_cooking_time` (integer) - Maksymalny czas gotowania w minutach
  - `sort` (enum: `title`, `cooking_time`, `difficulty`, `created_at`) - Pole sortowania, domyślnie `created_at`
  - `order` (enum: `asc`, `desc`) - Kierunek sortowania, domyślnie `desc`
  - `page` (integer) - Numer strony, domyślnie `1`
  - `limit` (integer) - Liczba elementów na stronę, domyślnie `20`, max `100`

**Przykładowe żądania:**
```
GET /api/recipes?search=tomato&difficulty=easy&page=1
GET /api/recipes?source=user&tags=1,2&max_cooking_time=30&sort=cooking_time&order=asc
```

### 1.3 Wykorzystywane typy

**Query DTO:**
```typescript
ListRecipesQueryDTO {
  search?: string;
  source?: SourceEnum; // 'user' | 'api' | 'ai'
  difficulty?: DifficultyEnum; // 'easy' | 'medium' | 'hard'
  tags?: number[];
  max_cooking_time?: number;
  sort?: 'title' | 'cooking_time' | 'difficulty' | 'created_at';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

**Response DTOs:**
```typescript
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

RecipeIngredientDTO {
  product: ProductReferenceDTO;
  quantity: number;
  unit: UnitReferenceDTO;
}

TagDTO {
  id: number;
  name: string;
}
```

### 1.4 Szczegóły odpowiedzi

**Sukces (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "title": "Tomato Soup",
      "description": "A simple and delicious tomato soup",
      "instructions": "1. Chop tomatoes...",
      "cooking_time": 30,
      "difficulty": "easy",
      "source": "user",
      "tags": [
        {
          "id": 1,
          "name": "vegetarian"
        }
      ],
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
      ],
      "created_at": "2025-10-18T12:00:00Z",
      "updated_at": "2025-10-18T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 35,
    "total_pages": 2
  }
}
```

**Błędy:**
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `422 Unprocessable Entity` - Nieprawidłowe parametry zapytania

### 1.5 Przepływ danych

```
1. [Client] → GET /api/recipes?search=tomato&difficulty=easy&tags=1,2
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse query params (tags split by comma)
5. [Handler] → Walidacja przez Zod
6. [Service] → RecipeService.listRecipes(userId, queryParams)
7. [Database] → Complex query:
   - Base: SELECT r.* FROM recipes r WHERE r.user_id = $userId
   - Full-text search: AND to_tsvector('english', r.title || ' ' || r.instructions) @@ plainto_tsquery($search)
   - Source filter: AND r.source = $source
   - Difficulty filter: AND r.difficulty = $difficulty
   - Cooking time filter: AND r.cooking_time <= $maxTime
   - Tags filter: AND EXISTS (SELECT 1 FROM recipe_tags WHERE recipe_id = r.id AND tag_id = ANY($tags))
   - ORDER BY mapped field
   - LIMIT/OFFSET
8. [Service] → Dla każdego przepisu:
   - Pobierz ingredients: JOIN recipe_ingredients + products + units
   - Pobierz tags: JOIN recipe_tags
9. [Service] → Transformacja na RecipeSummaryDTO[]
10. [Handler] → Response 200 z RecipesListResponseDTO
```

### 1.6 Względy bezpieczeństwa

**Uwierzytelnianie:**
- Wymagany Bearer token

**Autoryzacja:**
- RLS Policy: `WHERE user_id = auth.uid()`
- Użytkownik widzi tylko swoje przepisy

**Walidacja:**
- Walidacja wszystkich query params
- Sanityzacja search query (parametryzowane zapytanie)
- Walidacja arrays (tags) - parse i validate integers
- Zakresy: page >= 1, limit <= 100, max_cooking_time >= 0

**Data Exposure:**
- Nie zwracamy metadata w listingu (tylko w szczegółach)

### 1.7 Obsługa błędów

| Scenariusz | Kod HTTP | Error Code | Akcja |
|------------|----------|------------|-------|
| Brak tokenu | 401 | UNAUTHORIZED | Zwróć komunikat o wymaganej autoryzacji |
| Nieprawidłowy token | 401 | UNAUTHORIZED | Zwróć komunikat o nieprawidłowym tokenie |
| Nieprawidłowy source | 422 | VALIDATION_ERROR | Zwróć dozwolone wartości |
| Nieprawidłowy difficulty | 422 | VALIDATION_ERROR | Zwróć dozwolone wartości |
| Nieprawidłowy sort field | 422 | VALIDATION_ERROR | Zwróć dozwolone wartości |
| tags nie są liczbami | 422 | VALIDATION_ERROR | Zwróć: tags must be array of integers |
| max_cooking_time < 0 | 422 | VALIDATION_ERROR | Zwróć: must be positive |
| page < 1 | 422 | VALIDATION_ERROR | Zwróć: page must be >= 1 |
| limit > 100 | 422 | VALIDATION_ERROR | Zwróć: limit cannot exceed 100 |
| Błąd bazy danych | 500 | INTERNAL_ERROR | Loguj, zwróć ogólny komunikat |

### 1.8 Wydajność

**Optymalizacje:**
- Indeks GIN dla full-text search: `to_tsvector('english', title || ' ' || instructions)`
- Indeks na `recipes(source)` dla filtrowania
- Indeks na `recipes(user_id, created_at)` composite
- N+1 query prevention: batch loading ingredients i tags

**Batch Loading Strategy:**
```typescript
// Po pobraniu recipes (IDs)
const recipeIds = recipes.map(r => r.id);

// Batch fetch ingredients
const ingredients = await db.query(`
  SELECT ri.recipe_id, ri.quantity, p.id, p.name, u.id, u.name, u.abbreviation
  FROM recipe_ingredients ri
  JOIN products p ON ri.product_id = p.id
  JOIN units u ON ri.unit_id = u.id
  WHERE ri.recipe_id = ANY($1)
`, [recipeIds]);

// Batch fetch tags
const tags = await db.query(`
  SELECT rt.recipe_id, t.id, t.name
  FROM recipe_tags rt
  JOIN tags t ON rt.tag_id = t.id
  WHERE rt.recipe_id = ANY($1)
`, [recipeIds]);

// Group by recipe_id and merge
```

**Caching:**
- Cache per user: `recipes:{userId}:page:{page}:params:{hash}` na 10 minut
- Invalidacja przy: POST, PATCH, DELETE

### 1.9 Etapy wdrożenia

1. **Zod schema walidacji**
   - Schema dla ListRecipesQueryDTO:
   ```typescript
   z.object({
     search: z.string().trim().optional(),
     source: z.enum(['user', 'api', 'ai']).optional(),
     difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
     tags: z.string().transform(val => val.split(',').map(Number)).optional(),
     max_cooking_time: z.coerce.number().int().positive().optional(),
     sort: z.enum(['title', 'cooking_time', 'difficulty', 'created_at']).default('created_at'),
     order: z.enum(['asc', 'desc']).default('desc'),
     page: z.coerce.number().int().min(1).default(1),
     limit: z.coerce.number().int().min(1).max(100).default(20)
   })
   ```

2. **Utworzenie RecipeService**
   - Utwórz `src/lib/services/recipe.service.ts`
   - Implementuj `listRecipes(userId, query)`
   - Query builder dla dynamicznych filtrów
   - Batch loading dla ingredients i tags
   - Transformacja na RecipeSummaryDTO[]

3. **Query builder helper**
   - `buildRecipeFilters(query)` - zwraca WHERE clauses i params
   - Dynamic SQL construction z walidacją

4. **Data transformation helpers**
   - `groupIngredientsByRecipe(ingredients)` - grupuje według recipe_id
   - `groupTagsByRecipe(tags)` - grupuje według recipe_id
   - `mergeRecipeData(recipes, ingredientsMap, tagsMap)` - łączy dane

5. **Endpoint handler**
   - Utwórz `src/pages/api/recipes/index.ts`
   - `export const prerender = false`
   - Implementuj `GET(context: APIContext)`
   - Parse query (szczególnie tags array)
   - Waliduj przez Zod
   - Wywołaj RecipeService.listRecipes()
   - Zwróć 200 z response

6. **Testowanie**
   - Test podstawowego listowania (200)
   - Test full-text search
   - Test filtrowania: source, difficulty, max_cooking_time
   - Test filtrowania po tags (single, multiple)
   - Test sortowania: wszystkie pola, asc/desc
   - Test paginacji
   - Test pustej listy (0 przepisów)
   - Test kombinacji filtrów
   - Test bez autoryzacji (401)

---

## 2. GET /api/recipes/:id - Get Recipe by ID

### 2.1 Przegląd punktu końcowego
Endpoint pobiera szczegółowe informacje o pojedynczym przepisie, włączając wszystkie składniki, tagi oraz metadata (dla przepisów z API/AI). Użytkownik może pobrać tylko swoje przepisy.

**Powiązane User Stories:** US-003 (Zarządzanie przepisami)

### 2.2 Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/recipes/:id`
- **Wymagane nagłówki:** `Authorization: Bearer {access_token}`

**URL Parameters:**
- **Wymagane:**
  - `id` (integer) - ID przepisu

**Przykładowe żądanie:**
```
GET /api/recipes/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3 Wykorzystywane typy

**Response DTO:**
```typescript
RecipeDTO {
  id: number;
  title: string;
  description: string | null;
  instructions: string;
  cooking_time: number | null;
  difficulty: DifficultyEnum | null;
  source: SourceEnum;
  metadata?: Json | null; // Included for API/AI recipes
  tags: TagDTO[];
  ingredients: RecipeIngredientDTO[];
  created_at: string;
  updated_at: string;
}
```

### 2.4 Szczegóły odpowiedzi

**Sukces (200 OK):**
```json
{
  "id": 1,
  "title": "Tomato Soup",
  "description": "A simple and delicious tomato soup",
  "instructions": "1. Chop tomatoes...",
  "cooking_time": 30,
  "difficulty": "easy",
  "source": "user",
  "metadata": {},
  "tags": [
    {
      "id": 1,
      "name": "vegetarian"
    }
  ],
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
  ],
  "created_at": "2025-10-18T12:00:00Z",
  "updated_at": "2025-10-18T12:00:00Z"
}
```

**Błędy:**
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `404 Not Found` - Przepis nie istnieje lub nie należy do użytkownika

### 2.5 Przepływ danych

```
1. [Client] → GET /api/recipes/123
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse i walidacja ID
5. [Service] → RecipeService.getRecipeById(userId, recipeId)
6. [Database] → SELECT * FROM recipes WHERE id = $1 AND user_id = $2
7. [Service] → Jeśli brak → throw NotFoundError
8. [Database] → Fetch ingredients:
   SELECT ri.quantity, p.id, p.name, u.id, u.name, u.abbreviation
   FROM recipe_ingredients ri
   JOIN products p ON ri.product_id = p.id
   JOIN units u ON ri.unit_id = u.id
   WHERE ri.recipe_id = $1
9. [Database] → Fetch tags:
   SELECT t.id, t.name
   FROM recipe_tags rt
   JOIN tags t ON rt.tag_id = t.id
   WHERE rt.recipe_id = $1
10. [Service] → Transformacja na RecipeDTO (merge all data)
11. [Handler] → Response 200 z RecipeDTO
```

### 2.6 Względy bezpieczeństwa

**Uwierzytelnianie:**
- Wymagany Bearer token

**Autoryzacja:**
- RLS Policy: `WHERE id = $id AND user_id = auth.uid()`
- 404 zamiast 403 (information disclosure prevention)

**Walidacja:**
- Walidacja ID: integer, positive

**Metadata Exposure:**
- Metadata może zawierać wrażliwe dane z AI/API
- Dostępne tylko dla właściciela przepisu

### 2.7 Obsługa błędów

| Scenariusz | Kod HTTP | Error Code | Akcja |
|------------|----------|------------|-------|
| Brak tokenu | 401 | UNAUTHORIZED | Zwróć komunikat o wymaganej autoryzacji |
| Nieprawidłowy token | 401 | UNAUTHORIZED | Zwróć komunikat o nieprawidłowym tokenie |
| Nieprawidłowy ID | 400 | VALIDATION_ERROR | Zwróć: Invalid recipe ID |
| Przepis nie istnieje | 404 | NOT_FOUND | Zwróć: Recipe not found |
| Przepis innego użytkownika | 404 | NOT_FOUND | Zwróć: Recipe not found |
| Błąd bazy danych | 500 | INTERNAL_ERROR | Loguj, zwróć ogólny komunikat |

### 2.8 Wydajność

**Optymalizacje:**
- PRIMARY KEY lookup (id) - bardzo szybkie
- Parallel fetch: ingredients i tags równocześnie (Promise.all)

**Caching:**
- Cache recipe: `recipe:{recipeId}` na 10 minut
- Invalidacja przy UPDATE/DELETE

### 2.9 Etapy wdrożenia

1. **Zod schema walidacji**
   - Schema dla ID: `z.coerce.number().int().positive()`

2. **Rozszerzenie RecipeService**
   - Dodaj metodę `getRecipeById(userId, recipeId): Promise<RecipeDTO>`
   - SELECT recipe base
   - Parallel fetch ingredients + tags (Promise.all)
   - Merge data, transformuj na RecipeDTO

3. **Endpoint handler**
   - Utwórz `src/pages/api/recipes/[id].ts`
   - `export const prerender = false`
   - Implementuj `GET(context: APIContext)`
   - Parse params.id, waliduj
   - Wywołaj service
   - Zwróć 200 z RecipeDTO

4. **Testowanie**
   - Test pobrania własnego przepisu (200)
   - Test przepisu innego użytkownika (404)
   - Test nieistniejącego przepisu (404)
   - Test nieprawidłowego ID (400)
   - Test przepisu z metadata (source=ai/api)
   - Test bez autoryzacji (401)

---

## 3. POST /api/recipes - Create Recipe

### 3.1 Przegląd punktu końcowego
Endpoint tworzy nowy przepis użytkownika. Wymaga tytułu, instrukcji oraz przynajmniej jednego składnika. Opcjonalnie: opis, czas gotowania, trudność, tagi. Automatycznie tworzy powiązania w tabelach recipe_ingredients i recipe_tags.

**Powiązane User Stories:** US-003 (Zarządzanie przepisami)

### 3.2 Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/api/recipes`
- **Wymagane nagłówki:**
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`

**Request Body:**
- **Wymagane:**
  - `title` (string) - Tytuł przepisu, min 1 znak, max 255
  - `instructions` (string) - Instrukcje przygotowania, min 1 znak
  - `ingredients` (array) - Tablica składników, minimum 1 element
    - `product_id` (integer) - ID produktu
    - `quantity` (number) - Ilość, > 0
    - `unit_id` (integer) - ID jednostki
- **Opcjonalne:**
  - `description` (string | null) - Krótki opis przepisu
  - `cooking_time` (integer | null) - Czas w minutach, > 0
  - `difficulty` (enum | null) - `easy`, `medium`, lub `hard`
  - `tag_ids` (array of integers) - IDs tagów

**Przykładowe żądanie:**
```json
POST /api/recipes
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Tomato Soup",
  "description": "A simple and delicious tomato soup",
  "instructions": "1. Chop tomatoes\n2. Cook in pot\n3. Blend and serve",
  "cooking_time": 30,
  "difficulty": "easy",
  "ingredients": [
    {
      "product_id": 10,
      "quantity": 5,
      "unit_id": 1
    },
    {
      "product_id": 15,
      "quantity": 2,
      "unit_id": 1
    }
  ],
  "tag_ids": [1, 2]
}
```

### 3.3 Wykorzystywane typy

**Request DTO:**
```typescript
CreateRecipeDTO {
  title: string;
  description?: string | null;
  instructions: string;
  cooking_time?: number | null;
  difficulty?: DifficultyEnum | null;
  ingredients: CreateRecipeIngredientDTO[];
  tag_ids?: number[];
}

CreateRecipeIngredientDTO {
  product_id: number;
  quantity: number;
  unit_id: number;
}
```

**Response DTO:**
```typescript
RecipeDTO // Pełny przepis ze składnikami i tagami
```

### 3.4 Szczegóły odpowiedzi

**Sukces (201 Created):**
```json
{
  "id": 1,
  "title": "Tomato Soup",
  "description": "A simple and delicious tomato soup",
  "instructions": "1. Chop tomatoes\n2. Cook in pot\n3. Blend and serve",
  "cooking_time": 30,
  "difficulty": "easy",
  "source": "user",
  "tags": [
    {
      "id": 1,
      "name": "vegetarian"
    }
  ],
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
  ],
  "created_at": "2025-10-18T12:00:00Z",
  "updated_at": "2025-10-18T12:00:00Z"
}
```

**Błędy:**
- `400 Bad Request` - Nieprawidłowe dane (brak wymaganych pól, quantity <= 0, cooking_time <= 0)
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `404 Not Found` - Produkt, jednostka lub tag nie istnieją

### 3.5 Przepływ danych

```
1. [Client] → POST /api/recipes {title, instructions, ingredients, ...}
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse request body
5. [Handler] → Walidacja przez Zod (głęboka walidacja ingredients array)
6. [Service] → RecipeService.createRecipe(userId, createDto)
7. [Service] → Weryfikacja istnienia: products, units, tags (batch)
8. [Database] → BEGIN TRANSACTION
9. [Database] → INSERT INTO recipes (...) VALUES (...) RETURNING id
10. [Database] → Batch INSERT INTO recipe_ingredients (recipe_id, product_id, quantity, unit_id)
11. [Database] → Batch INSERT INTO recipe_tags (recipe_id, tag_id)
12. [Database] → COMMIT
13. [Service] → Fetch pełne dane przepisu (z ingredients + tags)
14. [Service] → Transformacja na RecipeDTO
15. [Handler] → Response 201 z Location header
```

### 3.6 Względy bezpieczeństwa

**Uwierzytelnianie:**
- Wymagany Bearer token

**Autoryzacja:**
- RLS Policy dla INSERT: `WITH CHECK (user_id = auth.uid())`
- user_id automatycznie ustawiany
- source automatycznie ustawiany na 'user'

**Walidacja:**
- Głęboka walidacja: title, instructions (nie puste po trim)
- cooking_time > 0 (jeśli podane)
- ingredients: minimum 1, każdy z quantity > 0
- Weryfikacja istnienia wszystkich foreign keys
- Zapobieganie duplicate ingredients (same product_id w ramach przepisu)

**Transaction Safety:**
- Cała operacja w transakcji
- Rollback przy błędzie w którymkolwiek kroku

### 3.7 Obsługa błędów

| Scenariusz | Kod HTTP | Error Code | Akcja |
|------------|----------|------------|-------|
| Brak tokenu | 401 | UNAUTHORIZED | Zwróć komunikat o wymaganej autoryzacji |
| Nieprawidłowy token | 401 | UNAUTHORIZED | Zwróć komunikat o nieprawidłowym tokenie |
| Brak title | 400 | VALIDATION_ERROR | Zwróć: title is required |
| Brak instructions | 400 | VALIDATION_ERROR | Zwróć: instructions are required |
| Brak ingredients | 400 | VALIDATION_ERROR | Zwróć: at least one ingredient required |
| cooking_time <= 0 | 400 | VALIDATION_ERROR | Zwróć: cooking_time must be positive |
| quantity <= 0 | 400 | VALIDATION_ERROR | Zwróć: ingredient quantity must be positive |
| Nieprawidłowy difficulty | 400 | VALIDATION_ERROR | Zwróć dozwolone wartości |
| product_id nie istnieje | 404 | NOT_FOUND | Zwróć: Product not found (ID) |
| unit_id nie istnieje | 404 | NOT_FOUND | Zwróć: Unit not found (ID) |
| tag_id nie istnieje | 404 | NOT_FOUND | Zwróć: Tag not found (ID) |
| Duplicate ingredients | 400 | VALIDATION_ERROR | Zwróć: Duplicate product in ingredients |
| Błąd transakcji | 500 | INTERNAL_ERROR | Rollback, loguj, zwróć ogólny komunikat |

### 3.8 Wydajność

**Optymalizacje:**
- Batch verification: wszystkie products, units, tags w single queries
- Batch INSERT dla ingredients i tags (multi-row INSERT)
- Transaction dla atomowości

**Przykład batch INSERT:**
```sql
INSERT INTO recipe_ingredients (recipe_id, product_id, quantity, unit_id)
VALUES 
  ($1, $2, $3, $4),
  ($1, $5, $6, $7),
  ...
```

### 3.9 Etapy wdrożenia

1. **Zod schema walidacji**
   - Schema dla CreateRecipeDTO:
   ```typescript
   z.object({
     title: z.string().trim().min(1).max(255),
     description: z.string().trim().nullable().optional(),
     instructions: z.string().trim().min(1),
     cooking_time: z.number().int().positive().nullable().optional(),
     difficulty: z.enum(['easy', 'medium', 'hard']).nullable().optional(),
     ingredients: z.array(
       z.object({
         product_id: z.number().int().positive(),
         quantity: z.number().positive(),
         unit_id: z.number().int().positive()
       })
     ).min(1),
     tag_ids: z.array(z.number().int().positive()).optional()
   }).refine(
     data => {
       const productIds = data.ingredients.map(i => i.product_id);
       return new Set(productIds).size === productIds.length;
     },
     { message: "Duplicate products in ingredients" }
   )
   ```

2. **Verification helpers**
   - `verifyProductsExist(userId, productIds)` - batch check
   - `verifyUnitsExist(unitIds)` - batch check
   - `verifyTagsExist(tagIds)` - batch check

3. **Rozszerzenie RecipeService**
   - Dodaj metodę `createRecipe(userId, data): Promise<RecipeDTO>`
   - Batch verification all foreign keys
   - Begin transaction
   - INSERT recipe (RETURNING id)
   - Batch INSERT ingredients
   - Batch INSERT tags (jeśli są)
   - Commit
   - Fetch pełne dane
   - Transformuj na RecipeDTO

4. **Transaction helper**
   - `withTransaction(callback)` - wrapper dla BEGIN/COMMIT/ROLLBACK

5. **Endpoint handler**
   - W `src/pages/api/recipes/index.ts` dodaj `POST`
   - Parse body, waliduj
   - Wywołaj service
   - Zwróć 201 z Location: `/api/recipes/{newId}`

6. **Testowanie**
   - Test utworzenia przepisu (201)
   - Test z wszystkimi opcjonalnymi polami (201)
   - Test bez opcjonalnych pól (201)
   - Test z wieloma składnikami (201)
   - Test z tagami (201)
   - Test bez title (400)
   - Test bez instructions (400)
   - Test bez ingredients (400)
   - Test z quantity <= 0 (400)
   - Test z cooking_time <= 0 (400)
   - Test z nieistniejącym product_id (404)
   - Test z nieistniejącym unit_id (404)
   - Test z nieistniejącym tag_id (404)
   - Test duplicate ingredients (400)
   - Test bez autoryzacji (401)
   - Test transaction rollback przy błędzie

---

## 4. PATCH /api/recipes/:id - Update Recipe

### 4.1 Przegląd punktu końcowego
Endpoint aktualizuje istniejący przepis użytkownika. Wszystkie pola są opcjonalne. Aktualizacja ingredients lub tags zastępuje całe listy (nie merguje). Operacja w transakcji dla spójności danych.

**Powiązane User Stories:** US-003 (Zarządzanie przepisami)

### 4.2 Szczegóły żądania

- **Metoda HTTP:** `PATCH`
- **Struktura URL:** `/api/recipes/:id`
- **Wymagane nagłówki:**
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`

**URL Parameters:**
- **Wymagane:**
  - `id` (integer) - ID przepisu do aktualizacji

**Request Body:**
- **Opcjonalne (przynajmniej jedno wymagane):**
  - `title` (string) - Nowy tytuł
  - `description` (string | null) - Nowy opis
  - `instructions` (string) - Nowe instrukcje
  - `cooking_time` (integer | null) - Nowy czas
  - `difficulty` (enum | null) - Nowa trudność
  - `ingredients` (array) - Nowa lista składników (zastępuje całkowicie)
  - `tag_ids` (array) - Nowa lista tagów (zastępuje całkowicie)

**Przykładowe żądanie:**
```json
PATCH /api/recipes/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "title": "Updated Tomato Soup",
  "cooking_time": 25,
  "ingredients": [
    {
      "product_id": 10,
      "quantity": 6,
      "unit_id": 1
    }
  ],
  "tag_ids": [1, 3]
}
```

### 4.3 Wykorzystywane typy

**Request DTO:**
```typescript
UpdateRecipeDTO {
  title?: string;
  description?: string | null;
  instructions?: string;
  cooking_time?: number | null;
  difficulty?: DifficultyEnum | null;
  ingredients?: CreateRecipeIngredientDTO[];
  tag_ids?: number[];
}
```

**Response DTO:**
```typescript
RecipeDTO // Pełny zaktualizowany przepis
```

### 4.4 Szczegóły odpowiedzi

**Sukces (200 OK):**
```json
{
  "id": 1,
  "title": "Updated Tomato Soup",
  "description": "An even better tomato soup",
  "instructions": "1. Chop tomatoes...",
  "cooking_time": 25,
  "difficulty": "medium",
  "source": "user",
  "tags": [
    {
      "id": 1,
      "name": "vegetarian"
    }
  ],
  "ingredients": [
    {
      "product": {
        "id": 10,
        "name": "Tomato"
      },
      "quantity": 6,
      "unit": {
        "id": 1,
        "name": "piece",
        "abbreviation": "pc"
      }
    }
  ],
  "created_at": "2025-10-18T12:00:00Z",
  "updated_at": "2025-10-18T13:00:00Z"
}
```

**Błędy:**
- `400 Bad Request` - Nieprawidłowe dane (puste body, walidacja)
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `404 Not Found` - Przepis nie istnieje, nie należy do użytkownika, lub foreign key nie istnieje

### 4.5 Przepływ danych

```
1. [Client] → PATCH /api/recipes/123 {title, ingredients, ...}
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse ID + body
5. [Handler] → Walidacja przez Zod
6. [Service] → RecipeService.updateRecipe(userId, recipeId, updateDto)
7. [Service] → Sprawdź istnienie przepisu: SELECT WHERE id AND user_id
8. [Service] → Jeśli brak → throw NotFoundError
9. [Service] → Jeśli ingredients/tags w dto: weryfikuj foreign keys
10. [Database] → BEGIN TRANSACTION
11. [Database] → UPDATE recipes SET {fields} WHERE id = $1 AND user_id = $2
12. [Database] → Jeśli ingredients w dto:
    - DELETE FROM recipe_ingredients WHERE recipe_id = $1
    - Batch INSERT nowe ingredients
13. [Database] → Jeśli tag_ids w dto:
    - DELETE FROM recipe_tags WHERE recipe_id = $1
    - Batch INSERT nowe tags
14. [Database] → COMMIT
15. [Service] → Fetch zaktualizowane pełne dane
16. [Service] → Transformacja na RecipeDTO
17. [Handler] → Response 200 z RecipeDTO
```

### 4.6 Względy bezpieczeństwa

**Uwierzytelnianie:**
- Wymagany Bearer token

**Autoryzacja:**
- RLS Policy dla UPDATE: `USING (user_id = auth.uid())`
- Użytkownik może aktualizować tylko swoje przepisy

**Walidacja:**
- Walidacja wszystkich przekazanych pól
- Wymóg przynajmniej jednego pola
- Jeśli ingredients: minimum 1, każdy z quantity > 0
- Duplicate ingredients check

**Business Rules:**
- source nie może być zmienione (locked)
- metadata nie może być zmienione przez user (tylko AI/API)

### 4.7 Obsługa błędów

| Scenariusz | Kod HTTP | Error Code | Akcja |
|------------|----------|------------|-------|
| Brak tokenu | 401 | UNAUTHORIZED | Zwróć komunikat o wymaganej autoryzacji |
| Nieprawidłowy token | 401 | UNAUTHORIZED | Zwróć komunikat o nieprawidłowym tokenie |
| Nieprawidłowy ID | 400 | VALIDATION_ERROR | Zwróć: Invalid recipe ID |
| Puste body | 400 | VALIDATION_ERROR | Zwróć: At least one field required |
| Nieprawidłowe pola | 400 | VALIDATION_ERROR | Zwróć szczegóły walidacji |
| Przepis nie istnieje | 404 | NOT_FOUND | Zwróć: Recipe not found |
| Przepis innego użytkownika | 404 | NOT_FOUND | Zwróć: Recipe not found |
| product_id nie istnieje | 404 | NOT_FOUND | Zwróć: Product not found |
| unit_id nie istnieje | 404 | NOT_FOUND | Zwróć: Unit not found |
| tag_id nie istnieje | 404 | NOT_FOUND | Zwróć: Tag not found |
| Błąd transakcji | 500 | INTERNAL_ERROR | Rollback, loguj, zwróć ogólny komunikat |

### 4.8 Wydajność

**Optymalizacje:**
- UPDATE tylko przekazane pola (dynamic SQL)
- DELETE + INSERT dla ingredients/tags (prostsze niż diff)
- Batch operations
- Transaction dla atomowości

**Cache Invalidation:**
- Invalidacja `recipe:{recipeId}`
- Invalidacja `recipes:{userId}:*`

### 4.9 Etapy wdrożenia

1. **Zod schema walidacji**
   - Schema dla UpdateRecipeDTO (wszystkie pola optional):
   ```typescript
   z.object({
     title: z.string().trim().min(1).max(255).optional(),
     description: z.string().trim().nullable().optional(),
     instructions: z.string().trim().min(1).optional(),
     cooking_time: z.number().int().positive().nullable().optional(),
     difficulty: z.enum(['easy', 'medium', 'hard']).nullable().optional(),
     ingredients: z.array(...).min(1).optional(),
     tag_ids: z.array(...).optional()
   }).refine(data => Object.keys(data).length > 0, {
     message: "At least one field is required"
   }).refine(data => {
     if (data.ingredients) {
       const productIds = data.ingredients.map(i => i.product_id);
       return new Set(productIds).size === productIds.length;
     }
     return true;
   }, { message: "Duplicate products in ingredients" })
   ```

2. **Rozszerzenie RecipeService**
   - Dodaj metodę `updateRecipe(userId, recipeId, data): Promise<RecipeDTO>`
   - SELECT recipe: sprawdź istnienie + ownership
   - Weryfikuj foreign keys (jeśli przekazane)
   - Begin transaction
   - UPDATE recipe (dynamic fields)
   - Jeśli ingredients: DELETE old + INSERT new
   - Jeśli tag_ids: DELETE old + INSERT new
   - Commit
   - Fetch zaktualizowane dane
   - Transformuj na RecipeDTO

3. **Dynamic UPDATE helper**
   - `buildUpdateQuery(fields)` - generuje SET clause tylko dla przekazanych pól

4. **Endpoint handler**
   - W `src/pages/api/recipes/[id].ts` dodaj `PATCH`
   - Parse params + body
   - Waliduj
   - Wywołaj service
   - Zwróć 200 z RecipeDTO

5. **Testowanie**
   - Test aktualizacji title (200)
   - Test aktualizacji instructions (200)
   - Test aktualizacji cooking_time (200)
   - Test aktualizacji difficulty (200)
   - Test aktualizacji ingredients (200)
   - Test aktualizacji tag_ids (200)
   - Test aktualizacji wszystkich pól (200)
   - Test pustego body (400)
   - Test przepisu innego użytkownika (404)
   - Test nieistniejącego przepisu (404)
   - Test nieistniejącego product/unit/tag (404)
   - Test duplicate ingredients (400)
   - Test bez autoryzacji (401)
   - Test transaction rollback

---

## 5. DELETE /api/recipes/:id - Delete Recipe

### 5.1 Przegląd punktu końcowego
Endpoint usuwa przepis użytkownika. Operacja jest trwała. CASCADE automatycznie usuwa powiązane recipe_ingredients, recipe_tags oraz cooking_history.

**Powiązane User Stories:** US-003 (Zarządzanie przepisami)

### 5.2 Szczegóły żądania

- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/api/recipes/:id`
- **Wymagane nagłówki:** `Authorization: Bearer {access_token}`

**URL Parameters:**
- **Wymagane:**
  - `id` (integer) - ID przepisu do usunięcia

**Przykładowe żądanie:**
```
DELETE /api/recipes/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5.3 Wykorzystywane typy

Brak body w request i response (204 No Content).

### 5.4 Szczegóły odpowiedzi

**Sukces (204 No Content):**
- Puste body

**Błędy:**
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `404 Not Found` - Przepis nie istnieje lub nie należy do użytkownika

### 5.5 Przepływ danych

```
1. [Client] → DELETE /api/recipes/123
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse i walidacja ID
5. [Service] → RecipeService.deleteRecipe(userId, recipeId)
6. [Service] → Opcjonalne: SELECT recipe dla weryfikacji
7. [Database] → DELETE FROM recipes WHERE id = $1 AND user_id = $2
8. [Database] → CASCADE: automatycznie usuwa:
   - recipe_ingredients
   - recipe_tags
   - cooking_history
9. [Service] → Sprawdź rowCount: jeśli 0 → throw NotFoundError
10. [Handler] → Response 204 No Content
```

### 5.6 Względy bezpieczeństwa

**Uwierzytelnianie:**
- Wymagany Bearer token

**Autoryzacja:**
- RLS Policy dla DELETE: `USING (user_id = auth.uid())`
- Użytkownik może usuwać tylko swoje przepisy

**Cascade Effects:**
- CASCADE usuwa: recipe_ingredients, recipe_tags, cooking_history
- Nie usuwa products (shared resource)
- Warning: historia gotowania zostanie utracona

**Walidacja:**
- Walidacja ID

### 5.7 Obsługa błędów

| Scenariusz | Kod HTTP | Error Code | Akcja |
|------------|----------|------------|-------|
| Brak tokenu | 401 | UNAUTHORIZED | Zwróć komunikat o wymaganej autoryzacji |
| Nieprawidłowy token | 401 | UNAUTHORIZED | Zwróć komunikat o nieprawidłowym tokenie |
| Nieprawidłowy ID | 400 | VALIDATION_ERROR | Zwróć: Invalid recipe ID |
| Przepis nie istnieje | 404 | NOT_FOUND | Zwróć: Recipe not found |
| Przepis innego użytkownika | 404 | NOT_FOUND | Zwróć: Recipe not found |
| Błąd bazy danych | 500 | INTERNAL_ERROR | Loguj, zwróć ogólny komunikat |

### 5.8 Wydajność

**Optymalizacje:**
- DELETE WHERE id + user_id używa indeksów
- CASCADE efektywnie obsługiwane przez PostgreSQL

**Monitoring:**
- Log cascade count (ile powiązanych rekordów usunięto)

**Considerations:**
- Soft delete zamiast hard delete? (opcjonalnie dla audytu)

**Cache Invalidation:**
- Invalidacja `recipe:{recipeId}`
- Invalidacja `recipes:{userId}:*`

### 5.9 Etapy wdrożenia

1. **Zod schema walidacji**
   - Schema dla ID: `z.coerce.number().int().positive()`

2. **Rozszerzenie RecipeService**
   - Dodaj metodę `deleteRecipe(userId, recipeId): Promise<void>`
   - DELETE query: WHERE id AND user_id
   - Sprawdź rowCount
   - Jeśli 0 → throw NotFoundError

3. **Endpoint handler**
   - W `src/pages/api/recipes/[id].ts` dodaj `DELETE`
   - Parse i waliduj params.id
   - Wywołaj service
   - Zwróć 204 No Content

4. **Opcjonalnie: Cascade info**
   - Przed usunięciem: count powiązanych rekordów
   - Zwróć info w logs (dla audytu)

5. **Testowanie**
   - Test usunięcia własnego przepisu (204)
   - Test przepisu innego użytkownika (404)
   - Test nieistniejącego przepisu (404)
   - Test nieprawidłowego ID (400)
   - Test cascade: sprawdź usunięcie ingredients, tags, history
   - Test bez autoryzacji (401)
   - Weryfikacja pustego body w response

---

## Podsumowanie implementacji Recipes API

### Struktura plików
```
src/
├── lib/
│   ├── services/
│   │   └── recipe.service.ts            # Logika biznesowa przepisów
│   ├── validations/
│   │   └── recipe.validation.ts         # Zod schemas
│   ├── utils/
│   │   ├── query-builder.ts             # Dynamic SQL builder
│   │   └── transaction.ts               # Transaction wrapper
│   └── transformers/
│       └── recipe.transformer.ts        # Data transformation helpers
└── pages/
    └── api/
        └── recipes/
            ├── index.ts                  # GET, POST /api/recipes
            └── [id].ts                   # GET, PATCH, DELETE /api/recipes/:id
```

### Kluczowe funkcjonalności

**Batch Loading Pattern:**
```typescript
async function loadRecipeIngredients(recipeIds: number[]) {
  const rows = await db.query(`
    SELECT ri.recipe_id, ri.quantity,
           p.id as product_id, p.name as product_name,
           u.id as unit_id, u.name as unit_name, u.abbreviation as unit_abbr
    FROM recipe_ingredients ri
    JOIN products p ON ri.product_id = p.id
    JOIN units u ON ri.unit_id = u.id
    WHERE ri.recipe_id = ANY($1)
  `, [recipeIds]);
  
  // Group by recipe_id
  return groupBy(rows, 'recipe_id');
}
```

**Transaction Helper:**
```typescript
async function withTransaction<T>(
  callback: (client: DatabaseClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
```

**Dynamic Query Builder:**
```typescript
function buildUpdateQuery(
  tableName: string,
  fields: Record<string, any>,
  whereClause: string
) {
  const updates = Object.keys(fields)
    .map((key, i) => `${key} = $${i + 1}`)
    .join(', ');
  const values = Object.values(fields);
  
  return {
    query: `UPDATE ${tableName} SET ${updates} WHERE ${whereClause}`,
    values
  };
}
```

### Complex Queries

**Full-text search z filtrami:**
```sql
SELECT r.*, COUNT(*) OVER() as total_count
FROM recipes r
WHERE r.user_id = $1
  AND ($2::text IS NULL OR to_tsvector('english', r.title || ' ' || r.instructions) @@ plainto_tsquery($2))
  AND ($3::source_enum IS NULL OR r.source = $3)
  AND ($4::difficulty_enum IS NULL OR r.difficulty = $4)
  AND ($5::int IS NULL OR r.cooking_time <= $5)
  AND ($6::int[] IS NULL OR EXISTS (
    SELECT 1 FROM recipe_tags WHERE recipe_id = r.id AND tag_id = ANY($6)
  ))
ORDER BY 
  CASE WHEN $7 = 'title' THEN r.title END,
  CASE WHEN $7 = 'cooking_time' THEN r.cooking_time END,
  CASE WHEN $7 = 'created_at' THEN r.created_at END
  $8  -- ASC/DESC
LIMIT $9 OFFSET $10
```

### Kolejność implementacji
1. Setup: Transaction helper, query builder, transformers
2. RecipeService: Wszystkie metody z batch loading
3. Validation schemas: Complex nested validation
4. Endpoints:
   - GET /api/recipes (list with complex filters)
   - POST /api/recipes (create with transaction)
   - GET /api/recipes/:id (get by id)
   - PATCH /api/recipes/:id (update with transaction)
   - DELETE /api/recipes/:id (delete with cascade)
<!-- 5. Testing: Szczególnie testy transakcji i rollback -->

### Uwagi implementacyjne
- **Transactional Integrity**: CREATE i UPDATE w transakcjach
- **Batch Operations**: Wszystkie multi-row operations jako batch
- **N+1 Prevention**: Batch loading dla related data
- **Full-text Search**: Użycie ts_vector indexes
- **Cascade Handling**: Świadomość CASCADE effects przy DELETE
- **Validation Complexity**: Głęboka walidacja nested structures (ingredients array)

