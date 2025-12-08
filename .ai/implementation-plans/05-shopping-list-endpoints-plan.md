# API Endpoints Implementation Plan: Shopping List Generation

## Spis treści

1. [POST /api/shopping-list/generate - Generate Shopping List](#1-post-apishopping-listgenerate---generate-shopping-list)

---

## 1. POST /api/shopping-list/generate - Generate Shopping List

### 1.1 Przegląd punktu końcowego

Endpoint generuje listę zakupów na podstawie przepisu i zawartości wirtualnej lodówki użytkownika. Porównuje wymagane składniki przepisu z dostępnymi produktami w lodówce, oblicza brakujące ilości i zwraca szczegółową listę zakupów. Wspiera User Story US-005.

**Powiązane User Stories:** US-005 (Generowanie listy zakupów)

### 1.2 Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/api/shopping-list/generate`
- **Wymagane nagłówki:**
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`

**Request Body:**

- **Wymagane:**
  - `recipe_id` (integer) - ID przepisu do przygotowania

**Przykładowe żądanie:**

```json
POST /api/shopping-list/generate
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "recipe_id": 1
}
```

### 1.3 Wykorzystywane typy

**Request DTO:**

```typescript
GenerateShoppingListDTO {
  recipe_id: number;
}
```

**Response DTOs:**

```typescript
ShoppingListResponseDTO {
  recipe: RecipeReferenceDTO;
  missing_ingredients: ShoppingListItemDTO[];
  total_items: number;
}

RecipeReferenceDTO {
  id: number;
  title: string;
}

ShoppingListItemDTO {
  product: ProductReferenceDTO;
  required_quantity: number;
  available_quantity: number;
  missing_quantity: number;
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
```

### 1.4 Szczegóły odpowiedzi

**Sukces (200 OK) - Z brakującymi składnikami:**

```json
{
  "recipe": {
    "id": 1,
    "title": "Tomato Soup"
  },
  "missing_ingredients": [
    {
      "product": {
        "id": 15,
        "name": "Onion"
      },
      "required_quantity": 2,
      "available_quantity": 0,
      "missing_quantity": 2,
      "unit": {
        "id": 1,
        "name": "piece",
        "abbreviation": "pc"
      }
    },
    {
      "product": {
        "id": 10,
        "name": "Tomato"
      },
      "required_quantity": 5,
      "available_quantity": 3,
      "missing_quantity": 2,
      "unit": {
        "id": 1,
        "name": "piece",
        "abbreviation": "pc"
      }
    }
  ],
  "total_items": 2
}
```

**Sukces (200 OK) - Wszystkie składniki dostępne:**

```json
{
  "recipe": {
    "id": 1,
    "title": "Tomato Soup"
  },
  "missing_ingredients": [],
  "total_items": 0
}
```

**Błędy:**

- `400 Bad Request` - Nieprawidłowy recipe_id
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `404 Not Found` - Przepis nie istnieje lub nie należy do użytkownika

### 1.5 Przepływ danych

```
1. [Client] → POST /api/shopping-list/generate {recipe_id: 1}
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse request body
5. [Handler] → Walidacja przez Zod
6. [Service] → ShoppingListService.generateShoppingList(userId, recipeId)

=== Step 1: Fetch Recipe ===
7. [Database] → SELECT recipe:
   - FROM recipes WHERE id = $1 AND user_id = $2
   - Jeśli brak → throw NotFoundError

=== Step 2: Fetch Recipe Ingredients ===
8. [Database] → SELECT recipe ingredients:
   SELECT ri.product_id, ri.quantity as required_quantity, ri.unit_id,
          p.name as product_name,
          u.name as unit_name, u.abbreviation as unit_abbr
   FROM recipe_ingredients ri
   JOIN products p ON ri.product_id = p.id
   JOIN units u ON ri.unit_id = u.id
   WHERE ri.recipe_id = $1

=== Step 3: Fetch User's Fridge Contents ===
9. [Database] → SELECT fridge items:
   SELECT up.product_id, SUM(up.quantity) as available_quantity, up.unit_id
   FROM user_products up
   WHERE up.user_id = $1
   GROUP BY up.product_id, up.unit_id

=== Step 4: Calculate Missing Quantities ===
10. [Service] → Dla każdego recipe ingredient:
    a. Znajdź matching fridge item (product_id + unit_id)
    b. available_quantity = fridge.quantity || 0
    c. missing_quantity = MAX(0, required_quantity - available_quantity)
    d. Jeśli missing_quantity > 0 → dodaj do shopping list

=== Step 5: Handle Unit Conversions (optional) ===
11. [Service] → Jeśli unit_id różne w recipe vs fridge:
    - Spróbuj konwersji jednostek (jeśli zaimplementowane)
    - Lub: traktuj jako completely missing

=== Step 6: Build Response ===
12. [Service] → Transformacja na ShoppingListResponseDTO:
    - recipe info
    - missing_ingredients array
    - total_items count

13. [Handler] → Response 200 z ShoppingListResponseDTO
```

### 1.6 Względy bezpieczeństwa

**Uwierzytelnianie:**

- Wymagany Bearer token

**Autoryzacja:**

- Weryfikacja recipe_id: przepis musi należeć do użytkownika
- Dostęp tylko do własnej lodówki

**Walidacja:**

- Walidacja recipe_id (integer, positive)

**Data Privacy:**

- Nie ujawniamy informacji o przepisach innych użytkowników
- Zwracamy 404 dla przepisu innego użytkownika (nie 403)

### 1.7 Obsługa błędów

| Scenariusz                 | Kod HTTP | Error Code       | Akcja                                       |
| -------------------------- | -------- | ---------------- | ------------------------------------------- |
| Brak tokenu                | 401      | UNAUTHORIZED     | Zwróć komunikat o wymaganej autoryzacji     |
| Nieprawidłowy token        | 401      | UNAUTHORIZED     | Zwróć komunikat o nieprawidłowym tokenie    |
| Brak recipe_id             | 400      | VALIDATION_ERROR | Zwróć: recipe_id is required                |
| Nieprawidłowy recipe_id    | 400      | VALIDATION_ERROR | Zwróć: recipe_id must be a positive integer |
| Przepis nie istnieje       | 404      | NOT_FOUND        | Zwróć: Recipe not found                     |
| Przepis innego użytkownika | 404      | NOT_FOUND        | Zwróć: Recipe not found                     |
| Przepis bez składników     | 200      | -                | Zwróć pustą listę (edge case)               |
| Błąd bazy danych           | 500      | INTERNAL_ERROR   | Loguj szczegóły, zwróć ogólny komunikat     |

**Format odpowiedzi błędu:**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Recipe not found",
    "details": {
      "recipe_id": 123
    }
  }
}
```

### 1.8 Wydajność

**Optymalizacje:**

- **Batch queries**: Wszystkie dane w 3 zapytaniach:
  1. Recipe metadata
  2. Recipe ingredients (JOIN products + units)
  3. Fridge contents (GROUP BY dla sumowania ilości)
- **Aggregation**: GROUP BY w query dla sumowania multiple entries tego samego produktu w lodówce
- **In-memory calculation**: Matching i missing quantity calculation w aplikacji (szybkie)

**Query Optimization:**

```sql
-- Efficient fridge query with aggregation
SELECT
  up.product_id,
  up.unit_id,
  SUM(up.quantity) as total_available
FROM user_products up
WHERE up.user_id = $1
  AND up.product_id = ANY($2)  -- Filter only needed products
GROUP BY up.product_id, up.unit_id
```

**Caching:**

- Opcjonalnie: cache fridge contents na krótki czas (1 minuta)
- Cache key: `fridge:summary:{userId}`
- Invalidacja przy: POST/PATCH/DELETE na /api/fridge

**Considerations:**

- Dla receptur z wieloma składnikami (>20): optymalizacja JOIN
- Parallel queries: recipe ingredients i fridge contents (Promise.all)

### 1.9 Etapy wdrożenia

#### Phase 1: Validation & Types

1. **Zod schema walidacji**

   ```typescript
   const GenerateShoppingListSchema = z.object({
     recipe_id: z.number().int().positive(),
   });
   ```

2. **Type definitions**
   - Już zdefiniowane w `src/types.ts`
   - Verify completeness

#### Phase 2: Core Service

3. **ShoppingListService - Core Methods**

   ```typescript
   class ShoppingListService {
     async generateShoppingList(userId: string, recipeId: number): Promise<ShoppingListResponseDTO> {
       // 1. Fetch and verify recipe
       const recipe = await this.fetchRecipe(userId, recipeId);

       // 2. Fetch recipe ingredients
       const requiredIngredients = await this.fetchRecipeIngredients(recipeId);

       // 3. Fetch user's fridge contents
       const fridgeContents = await this.fetchFridgeContents(
         userId,
         requiredIngredients.map((i) => i.product_id)
       );

       // 4. Calculate missing quantities
       const missingIngredients = this.calculateMissingIngredients(requiredIngredients, fridgeContents);

       // 5. Build response
       return {
         recipe: {
           id: recipe.id,
           title: recipe.title,
         },
         missing_ingredients: missingIngredients,
         total_items: missingIngredients.length,
       };
     }
   }
   ```

4. **Recipe Fetcher**

   ```typescript
   private async fetchRecipe(
     userId: string,
     recipeId: number
   ): Promise<{ id: number; title: string }> {
     const result = await this.db.query(`
       SELECT id, title
       FROM recipes
       WHERE id = $1 AND user_id = $2
     `, [recipeId, userId]);

     if (result.rows.length === 0) {
       throw new NotFoundError('Recipe not found');
     }

     return result.rows[0];
   }
   ```

5. **Recipe Ingredients Fetcher**

   ```typescript
   private async fetchRecipeIngredients(
     recipeId: number
   ): Promise<RequiredIngredient[]> {
     const result = await this.db.query(`
       SELECT
         ri.product_id,
         ri.quantity as required_quantity,
         ri.unit_id,
         p.name as product_name,
         u.name as unit_name,
         u.abbreviation as unit_abbreviation
       FROM recipe_ingredients ri
       JOIN products p ON ri.product_id = p.id
       JOIN units u ON ri.unit_id = u.id
       WHERE ri.recipe_id = $1
     `, [recipeId]);

     return result.rows;
   }

   interface RequiredIngredient {
     product_id: number;
     required_quantity: number;
     unit_id: number;
     product_name: string;
     unit_name: string;
     unit_abbreviation: string;
   }
   ```

6. **Fridge Contents Fetcher**

   ```typescript
   private async fetchFridgeContents(
     userId: string,
     productIds: number[]
   ): Promise<Map<string, AvailableItem>> {
     const result = await this.db.query(`
       SELECT
         product_id,
         unit_id,
         SUM(quantity) as total_available
       FROM user_products
       WHERE user_id = $1
         AND product_id = ANY($2)
       GROUP BY product_id, unit_id
     `, [userId, productIds]);

     // Create map: "productId:unitId" -> available_quantity
     const map = new Map<string, AvailableItem>();
     for (const row of result.rows) {
       const key = `${row.product_id}:${row.unit_id}`;
       map.set(key, {
         product_id: row.product_id,
         unit_id: row.unit_id,
         available_quantity: parseFloat(row.total_available)
       });
     }

     return map;
   }

   interface AvailableItem {
     product_id: number;
     unit_id: number;
     available_quantity: number;
   }
   ```

7. **Missing Ingredients Calculator**

   ```typescript
   private calculateMissingIngredients(
     required: RequiredIngredient[],
     available: Map<string, AvailableItem>
   ): ShoppingListItemDTO[] {
     const missingList: ShoppingListItemDTO[] = [];

     for (const req of required) {
       const key = `${req.product_id}:${req.unit_id}`;
       const avail = available.get(key);

       const availableQty = avail ? avail.available_quantity : 0;
       const missingQty = Math.max(0, req.required_quantity - availableQty);

       if (missingQty > 0) {
         missingList.push({
           product: {
             id: req.product_id,
             name: req.product_name
           },
           required_quantity: req.required_quantity,
           available_quantity: availableQty,
           missing_quantity: missingQty,
           unit: {
             id: req.unit_id,
             name: req.unit_name,
             abbreviation: req.unit_abbreviation
           }
         });
       }
     }

     // Sort by missing_quantity DESC (most critical first)
     missingList.sort((a, b) => b.missing_quantity - a.missing_quantity);

     return missingList;
   }
   ```

#### Phase 3: Advanced Features (Optional)

8. **Unit Conversion Support**

   ```typescript
   class UnitConverter {
     // Conversion map: unit_id -> base_unit conversion
     private conversions = new Map<number, Conversion>();

     canConvert(fromUnitId: number, toUnitId: number): boolean {
       // Check if units are compatible (e.g., grams <-> kilograms)
     }

     convert(quantity: number, fromUnitId: number, toUnitId: number): number {
       // Convert quantity between compatible units
     }
   }
   ```

9. **Enhanced Calculator with Unit Conversion**

   ```typescript
   private calculateMissingIngredients(
     required: RequiredIngredient[],
     available: Map<string, AvailableItem>
   ): ShoppingListItemDTO[] {
     const missingList: ShoppingListItemDTO[] = [];

     for (const req of required) {
       let availableQty = 0;

       // Try exact match first
       const exactKey = `${req.product_id}:${req.unit_id}`;
       const exactMatch = available.get(exactKey);

       if (exactMatch) {
         availableQty = exactMatch.available_quantity;
       } else {
         // Try unit conversion for same product
         for (const [key, avail] of available.entries()) {
           if (avail.product_id === req.product_id) {
             if (this.unitConverter.canConvert(avail.unit_id, req.unit_id)) {
               const converted = this.unitConverter.convert(
                 avail.available_quantity,
                 avail.unit_id,
                 req.unit_id
               );
               availableQty += converted;
             }
           }
         }
       }

       const missingQty = Math.max(0, req.required_quantity - availableQty);

       if (missingQty > 0) {
         missingList.push({
           product: {
             id: req.product_id,
             name: req.product_name
           },
           required_quantity: req.required_quantity,
           available_quantity: availableQty,
           missing_quantity: missingQty,
           unit: {
             id: req.unit_id,
             name: req.unit_name,
             abbreviation: req.unit_abbreviation
           }
         });
       }
     }

     return missingList;
   }
   ```

#### Phase 4: Endpoint Implementation

10. **Endpoint handler**

    ```typescript
    // src/pages/api/shopping-list/generate.ts
    import type { APIContext } from "astro";
    import { ShoppingListService } from "@/lib/services/shopping-list.service";
    import { GenerateShoppingListSchema } from "@/lib/validations/shopping-list.validation";
    import { errorResponse } from "@/lib/utils/api-response";
    import { NotFoundError } from "@/lib/errors";

    export const prerender = false;

    export async function POST(context: APIContext) {
      try {
        // 1. Auth check
        const supabase = context.locals.supabase;
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
          return errorResponse("UNAUTHORIZED", "Authentication required", null, 401);
        }

        // 2. Parse and validate body
        const body = await context.request.json();
        const validatedData = GenerateShoppingListSchema.parse(body);

        // 3. Generate shopping list
        const shoppingListService = new ShoppingListService(supabase);
        const result = await shoppingListService.generateShoppingList(user.id, validatedData.recipe_id);

        // 4. Return response
        return new Response(JSON.stringify(result), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        if (error instanceof NotFoundError) {
          return errorResponse("NOT_FOUND", error.message, null, 404);
        }

        if (error.name === "ZodError") {
          return errorResponse("VALIDATION_ERROR", "Invalid request data", { errors: error.errors }, 400);
        }

        console.error("Shopping list generation error:", error);
        return errorResponse("INTERNAL_ERROR", "Failed to generate shopping list", null, 500);
      }
    }
    ```

<!-- #### Phase 5: Testing

11. **Unit Tests**
    ```typescript
    describe('ShoppingListService', () => {
      describe('calculateMissingIngredients', () => {
        it('should identify missing ingredients', () => {
          const required = [
            { product_id: 1, required_quantity: 5, unit_id: 1, ... }
          ];
          const available = new Map([
            ['1:1', { product_id: 1, unit_id: 1, available_quantity: 3 }]
          ]);

          const result = service.calculateMissingIngredients(required, available);

          expect(result).toHaveLength(1);
          expect(result[0].missing_quantity).toBe(2);
        });

        it('should return empty list when all ingredients available', () => {
          const required = [
            { product_id: 1, required_quantity: 3, unit_id: 1, ... }
          ];
          const available = new Map([
            ['1:1', { product_id: 1, unit_id: 1, available_quantity: 5 }]
          ]);

          const result = service.calculateMissingIngredients(required, available);

          expect(result).toHaveLength(0);
        });

        it('should handle completely missing ingredients', () => {
          const required = [
            { product_id: 1, required_quantity: 5, unit_id: 1, ... }
          ];
          const available = new Map();

          const result = service.calculateMissingIngredients(required, available);

          expect(result).toHaveLength(1);
          expect(result[0].available_quantity).toBe(0);
          expect(result[0].missing_quantity).toBe(5);
        });
      });
    });
    ```

12. **Integration Tests**
    ```typescript
    describe('POST /api/shopping-list/generate', () => {
      it('should generate shopping list for recipe', async () => {
        const response = await fetch('/api/shopping-list/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ recipe_id: testRecipeId })
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.recipe).toBeDefined();
        expect(data.missing_ingredients).toBeArray();
        expect(data.total_items).toBeNumber();
      });

      it('should return 404 for non-existent recipe', async () => {
        const response = await fetch('/api/shopping-list/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ recipe_id: 99999 })
        });

        expect(response.status).toBe(404);
      });

      it('should return empty list when all ingredients available', async () => {
        // Setup: Add all required products to fridge
        await addProductsToFridge(userId, allRequiredProducts);

        const response = await fetch('/api/shopping-list/generate', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${userToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ recipe_id: testRecipeId })
        });

        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data.missing_ingredients).toHaveLength(0);
        expect(data.total_items).toBe(0);
      });
    });
    ``` -->

### 1.10 Extensions & Future Enhancements

**Possible Extensions:**

1. **Bulk Shopping List Generation**
   - Generate list for multiple recipes at once
   - Aggregate ingredients across recipes
   - Optimize for minimal shopping

2. **Smart Suggestions**
   - Suggest alternative products if exact match not available
   - Recommend similar recipes based on what's available

3. **Shopping List Management**
   - Save/persist shopping lists
   - Mark items as purchased
   - Shopping list history

4. **Export Formats**
   - Export to PDF
   - Export to mobile apps
   - Share list via email

5. **Store Integration**
   - Link to online stores
   - Price comparison
   - One-click ordering

**Implementation for Bulk Generation:**

```typescript
interface BulkGenerateShoppingListDTO {
  recipe_ids: number[];
}

async generateBulkShoppingList(
  userId: string,
  recipeIds: number[]
): Promise<BulkShoppingListResponseDTO> {
  // Fetch all recipes and their ingredients
  const allIngredients = await this.fetchMultipleRecipeIngredients(recipeIds);

  // Aggregate ingredients (sum quantities for same product+unit)
  const aggregated = this.aggregateIngredients(allIngredients);

  // Fetch fridge once
  const fridge = await this.fetchFridgeContents(userId, allProductIds);

  // Calculate missing for aggregated list
  const missing = this.calculateMissingIngredients(aggregated, fridge);

  return {
    recipes: recipeInfos,
    missing_ingredients: missing,
    total_items: missing.length
  };
}
```

---

## Podsumowanie implementacji Shopping List API

### Struktura plików

```
src/
├── lib/
│   ├── services/
│   │   └── shopping-list.service.ts      # Core service
│   ├── utils/
│   │   └── unit-converter.ts             # Unit conversion (optional)
│   └── validations/
│       └── shopping-list.validation.ts   # Zod schemas
└── pages/
    └── api/
        └── shopping-list/
            └── generate.ts                # POST endpoint
```

### Kluczowe algorytmy

**Missing Quantity Calculation:**

```
For each required ingredient:
  1. Find matching fridge item (product_id + unit_id)
  2. available = fridge.quantity || 0
  3. missing = max(0, required - available)
  4. If missing > 0: add to shopping list
```

**Aggregation (for same product in fridge):**

```sql
SELECT product_id, unit_id, SUM(quantity) as total
FROM user_products
WHERE user_id = $1 AND product_id = ANY($2)
GROUP BY product_id, unit_id
```

### Performance Characteristics

- **Query Count**: 3 queries (recipe, ingredients, fridge)
- **Time Complexity**: O(n) where n = number of ingredients
- **Space Complexity**: O(n) for maps and results
- **Typical Response Time**: < 100ms

<!-- ### Testing Checklist

- [ ] Recipe exists and belongs to user
- [ ] Recipe doesn't exist (404)
- [ ] Recipe belongs to another user (404)
- [ ] All ingredients available (empty list)
- [ ] Some ingredients missing (partial list)
- [ ] All ingredients missing (full list)
- [ ] Multiple entries of same product in fridge (aggregation)
- [ ] Different units for same product (conversion if implemented)
- [ ] Recipe with no ingredients (edge case)
- [ ] Authorization checks
- [ ] Input validation -->

### Kolejność implementacji

1. **Day 1**: Service skeleton + basic queries
2. **Day 2**: Missing calculation logic
<!-- + tests -->
3. **Day 3**: Endpoint + error handling
<!-- 4. **Day 4**: Integration tests + optimization -->
4. **Day 5**: Optional: Unit conversion feature

### Critical Success Factors

1. **Accuracy**: Correct quantity calculations
2. **Performance**: Fast response (< 100ms)
3. **Usability**: Clear, actionable shopping list
4. **Reliability**: Proper error handling
5. **Scalability**: Efficient queries for large recipes
