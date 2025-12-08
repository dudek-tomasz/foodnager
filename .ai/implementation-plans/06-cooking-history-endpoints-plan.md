# API Endpoints Implementation Plan: Cooking History Management

## Spis treści

1. [GET /api/cooking-history - List Cooking History](#1-get-apicooking-history---list-cooking-history)
2. [POST /api/cooking-history - Create Cooking History Entry](#2-post-apicooking-history---create-cooking-history-entry)

---

## 1. GET /api/cooking-history - List Cooking History

### 1.1 Przegląd punktu końcowego

Endpoint pobiera historię gotowania użytkownika z opcjami filtrowania według przepisu i zakresu dat. Zwraca szczegółowe informacje o każdym zdarzeniu gotowania, włączając stany lodówki przed i po gotowaniu (dla audytu).

**Powiązane User Stories:** US-003 (rozszerzenie - tracking), audyt

### 1.2 Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/cooking-history`
- **Wymagane nagłówki:** `Authorization: Bearer {access_token}`

**Query Parameters:**

- **Opcjonalne:**
  - `recipe_id` (integer) - Filtruj według konkretnego przepisu
  - `from_date` (string) - Data początkowa (ISO 8601: YYYY-MM-DD)
  - `to_date` (string) - Data końcowa (ISO 8601: YYYY-MM-DD)
  - `page` (integer) - Numer strony, domyślnie `1`
  - `limit` (integer) - Liczba elementów na stronę, domyślnie `20`, max `100`

**Przykładowe żądania:**

```
GET /api/cooking-history?page=1&limit=20
GET /api/cooking-history?recipe_id=5
GET /api/cooking-history?from_date=2025-10-01&to_date=2025-10-31
```

### 1.3 Wykorzystywane typy

**Query DTO:**

```typescript
ListCookingHistoryQueryDTO {
  recipe_id?: number;
  from_date?: string; // ISO date
  to_date?: string;   // ISO date
  page?: number;
  limit?: number;
}
```

**Response DTOs:**

```typescript
CookingHistoryListResponseDTO {
  data: CookingHistoryDTO[];
  pagination: PaginationMetaDTO;
}

CookingHistoryDTO {
  id: number;
  recipe: RecipeReferenceDTO;
  cooked_at: string;
  fridge_state_before: FridgeStateDTO;
  fridge_state_after: FridgeStateDTO;
}

RecipeReferenceDTO {
  id: number;
  title: string;
}

FridgeStateDTO {
  items: FridgeStateItemDTO[];
}

FridgeStateItemDTO {
  product_id: number;
  product_name: string;
  quantity: number;
  unit: string;
}
```

### 1.4 Szczegóły odpowiedzi

**Sukces (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "recipe": {
        "id": 1,
        "title": "Tomato Soup"
      },
      "cooked_at": "2025-10-18T18:00:00Z",
      "fridge_state_before": {
        "items": [
          {
            "product_id": 10,
            "product_name": "Tomato",
            "quantity": 8,
            "unit": "pc"
          },
          {
            "product_id": 15,
            "product_name": "Onion",
            "quantity": 3,
            "unit": "pc"
          }
        ]
      },
      "fridge_state_after": {
        "items": [
          {
            "product_id": 10,
            "product_name": "Tomato",
            "quantity": 3,
            "unit": "pc"
          },
          {
            "product_id": 15,
            "product_name": "Onion",
            "quantity": 1,
            "unit": "pc"
          }
        ]
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 15,
    "total_pages": 1
  }
}
```

**Błędy:**

- `401 Unauthorized` - Brak lub nieprawidłowy token
- `422 Unprocessable Entity` - Nieprawidłowe parametry zapytania

### 1.5 Przepływ danych

```
1. [Client] → GET /api/cooking-history?recipe_id=5&from_date=2025-10-01
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse query parameters
5. [Handler] → Walidacja przez Zod
6. [Service] → CookingHistoryService.listCookingHistory(userId, queryParams)
7. [Database] → Query z filtrami:
   SELECT ch.id, ch.recipe_id, ch.cooked_at,
          ch.fridge_state_before, ch.fridge_state_after,
          r.title as recipe_title,
          COUNT(*) OVER() as total_count
   FROM cooking_history ch
   JOIN recipes r ON ch.recipe_id = r.id
   WHERE ch.user_id = $userId
     AND ($recipeId IS NULL OR ch.recipe_id = $recipeId)
     AND ($fromDate IS NULL OR ch.cooked_at >= $fromDate)
     AND ($toDate IS NULL OR ch.cooked_at <= $toDate)
   ORDER BY ch.cooked_at DESC
   LIMIT $limit OFFSET $offset
8. [Service] → Transformacja na CookingHistoryDTO[] (parse JSONB fields)
9. [Service] → Obliczenie pagination metadata
10. [Handler] → Response 200 z CookingHistoryListResponseDTO
```

### 1.6 Względy bezpieczeństwa

**Uwierzytelnianie:**

- Wymagany Bearer token

**Autoryzacja:**

- RLS Policy: `WHERE user_id = auth.uid()`
- Użytkownik widzi tylko swoją historię

**Walidacja:**

- Walidacja date formats (ISO 8601)
- Walidacja from_date <= to_date
- Walidacja recipe_id (if provided)
- Paginacja: page >= 1, limit <= 100

**Data Privacy:**

- Fridge states zawierają wrażliwe dane o przyzwyczajeniach użytkownika
- Dostępne tylko dla właściciela

### 1.7 Obsługa błędów

| Scenariusz                | Kod HTTP | Error Code       | Akcja                                       |
| ------------------------- | -------- | ---------------- | ------------------------------------------- |
| Brak tokenu               | 401      | UNAUTHORIZED     | Zwróć komunikat o wymaganej autoryzacji     |
| Nieprawidłowy token       | 401      | UNAUTHORIZED     | Zwróć komunikat o nieprawidłowym tokenie    |
| Nieprawidłowy date format | 422      | VALIDATION_ERROR | Zwróć: Invalid date format (use YYYY-MM-DD) |
| from_date > to_date       | 422      | VALIDATION_ERROR | Zwróć: from_date must be before to_date     |
| Nieprawidłowy recipe_id   | 422      | VALIDATION_ERROR | Zwróć: Invalid recipe_id                    |
| page < 1                  | 422      | VALIDATION_ERROR | Zwróć: page must be >= 1                    |
| limit > 100               | 422      | VALIDATION_ERROR | Zwróć: limit cannot exceed 100              |
| Błąd bazy danych          | 500      | INTERNAL_ERROR   | Loguj, zwróć ogólny komunikat               |

### 1.8 Wydajność

**Optymalizacje:**

- Indeks na `cooking_history(user_id, cooked_at DESC)` - composite dla sortowania
- Indeks na `cooking_history(recipe_id)` - dla filtrowania
- COUNT(\*) OVER() - unikamy dodatkowego query
- JSONB fields są efektywne w PostgreSQL

**Caching:**

- Opcjonalnie: cache dla recent history (5 minut)
- Cache key: `cooking-history:{userId}:page:{page}:params:{hash}`
- Invalidacja przy: POST nowego entry

**Query Optimization:**

- Selective loading: tylko potrzebne kolumny
- JOIN tylko recipes (dla title) - minimalne

### 1.9 Etapy wdrożenia

1. **Zod schema walidacji**

   ```typescript
   z.object({
     recipe_id: z.coerce.number().int().positive().optional(),
     from_date: z.string().date().optional(),
     to_date: z.string().date().optional(),
     page: z.coerce.number().int().min(1).default(1),
     limit: z.coerce.number().int().min(1).max(100).default(20),
   }).refine(
     (data) => {
       if (data.from_date && data.to_date) {
         return new Date(data.from_date) <= new Date(data.to_date);
       }
       return true;
     },
     { message: "from_date must be before to_date" }
   );
   ```

2. **CookingHistoryService - List Method**

   ```typescript
   class CookingHistoryService {
     async listCookingHistory(
       userId: string,
       query: ListCookingHistoryQueryDTO
     ): Promise<CookingHistoryListResponseDTO> {
       // Build query with filters
       const { rows } = await this.db.query(
         `
         SELECT 
           ch.id,
           ch.recipe_id,
           ch.cooked_at,
           ch.fridge_state_before,
           ch.fridge_state_after,
           r.title as recipe_title,
           COUNT(*) OVER() as total_count
         FROM cooking_history ch
         JOIN recipes r ON ch.recipe_id = r.id
         WHERE ch.user_id = $1
           AND ($2::int IS NULL OR ch.recipe_id = $2)
           AND ($3::timestamptz IS NULL OR ch.cooked_at >= $3)
           AND ($4::timestamptz IS NULL OR ch.cooked_at <= $4)
         ORDER BY ch.cooked_at DESC
         LIMIT $5 OFFSET $6
       `,
         [
           userId,
           query.recipe_id || null,
           query.from_date || null,
           query.to_date ? `${query.to_date}T23:59:59Z` : null,
           query.limit,
           (query.page - 1) * query.limit,
         ]
       );

       const data = rows.map((row) => this.transformToDTO(row));
       const total = rows.length > 0 ? parseInt(rows[0].total_count) : 0;

       return {
         data,
         pagination: calculatePaginationMeta(query.page, query.limit, total),
       };
     }

     private transformToDTO(row: any): CookingHistoryDTO {
       return {
         id: row.id,
         recipe: {
           id: row.recipe_id,
           title: row.recipe_title,
         },
         cooked_at: row.cooked_at,
         fridge_state_before: row.fridge_state_before, // Already JSONB
         fridge_state_after: row.fridge_state_after,
       };
     }
   }
   ```

3. **Endpoint handler**
   - Utwórz `src/pages/api/cooking-history/index.ts`
   - `export const prerender = false`
   - Implementuj `GET(context: APIContext)`
   - Parse query params, waliduj
   - Wywołaj CookingHistoryService.listCookingHistory()
   - Zwróć 200 z response

4. **Testowanie**
   - Test basic listing (200)
   - Test filtrowania po recipe_id
   - Test filtrowania po date range (from_date, to_date, both)
   - Test paginacji
   - Test pustej historii (0 entries)
   - Test nieprawidłowych dat (422)
   - Test from_date > to_date (422)
   - Test bez autoryzacji (401)

---

## 2. POST /api/cooking-history - Create Cooking History Entry

### 2.1 Przegląd punktu końcowego

Najbardziej złożony endpoint w grupie Cooking History. Rejestruje zdarzenie gotowania przepisu i **automatycznie aktualizuje zawartość lodówki** użytkownika, odejmując użyte składniki. Cała operacja wykonywana jest w transakcji database z wykorzystaniem PostgreSQL function dla atomowości.

**Powiązane User Stories:** US-003 (rozszerzenie), automatyzacja zarządzania lodówką

### 2.2 Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/api/cooking-history`
- **Wymagane nagłówki:**
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`

**Request Body:**

- **Wymagane:**
  - `recipe_id` (integer) - ID przepisu, który został ugotowany

**Przykładowe żądanie:**

```json
POST /api/cooking-history
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "recipe_id": 1
}
```

### 2.3 Wykorzystywane typy

**Request DTO:**

```typescript
CreateCookingHistoryDTO {
  recipe_id: number;
}
```

**Response DTO:**

```typescript
CreateCookingHistoryResponseDTO {
  id: number;
  recipe: RecipeReferenceDTO;
  cooked_at: string;
  fridge_state_before: FridgeStateDTO;
  fridge_state_after: FridgeStateDTO;
  updated_fridge_items: UpdatedFridgeItemDTO[];
}

UpdatedFridgeItemDTO {
  product_id: number;
  old_quantity: number;
  new_quantity: number;
  unit: string;
}
```

### 2.4 Szczegóły odpowiedzi

**Sukces (201 Created):**

```json
{
  "id": 1,
  "recipe": {
    "id": 1,
    "title": "Tomato Soup"
  },
  "cooked_at": "2025-10-18T18:00:00Z",
  "fridge_state_before": {
    "items": [
      {
        "product_id": 10,
        "product_name": "Tomato",
        "quantity": 8,
        "unit": "pc"
      }
    ]
  },
  "fridge_state_after": {
    "items": [
      {
        "product_id": 10,
        "product_name": "Tomato",
        "quantity": 3,
        "unit": "pc"
      }
    ]
  },
  "updated_fridge_items": [
    {
      "product_id": 10,
      "old_quantity": 8,
      "new_quantity": 3,
      "unit": "pc"
    }
  ]
}
```

**Błędy:**

- `400 Bad Request` - Nieprawidłowe dane, niewystarczające składniki
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `404 Not Found` - Przepis nie istnieje lub nie należy do użytkownika

### 2.5 Przepływ danych

```
1. [Client] → POST /api/cooking-history {recipe_id: 1}
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse request body
5. [Handler] → Walidacja przez Zod
6. [Service] → CookingHistoryService.createCookingHistoryEntry(userId, recipeId)

=== Phase 1: Validation ===
7. [Service] → Verify recipe exists and belongs to user
8. [Database] → SELECT * FROM recipes WHERE id = $1 AND user_id = $2
9. [Service] → Jeśli brak → throw NotFoundError

=== Phase 2: Capture Current Fridge State ===
10. [Database] → Fetch current fridge state:
    SELECT up.product_id, p.name, up.quantity, u.abbreviation
    FROM user_products up
    JOIN products p ON up.product_id = p.id
    JOIN units u ON up.unit_id = u.id
    WHERE up.user_id = $userId
    ORDER BY p.name

=== Phase 3: Fetch Recipe Ingredients ===
11. [Database] → Fetch required ingredients:
    SELECT ri.product_id, ri.quantity, ri.unit_id, u.abbreviation
    FROM recipe_ingredients ri
    JOIN units u ON ri.unit_id = u.id
    WHERE ri.recipe_id = $recipeId

=== Phase 4: Validate Sufficient Ingredients ===
12. [Service] → For each recipe ingredient:
    a. Find matching products in fridge (product_id + unit_id)
    b. Check: fridge.quantity >= recipe.quantity
    c. If any insufficient → throw InsufficientIngredientsError

=== Phase 5: Database Transaction ===
13. [Database] → BEGIN TRANSACTION
14. [Database] → Call PostgreSQL function:
    SELECT * FROM record_cooking_event(
      p_user_id := $userId,
      p_recipe_id := $recipeId
    )

    -- Function does:
    -- 1. Captures current fridge state (JSONB)
    -- 2. Updates user_products quantities
    -- 3. Deletes items with quantity = 0
    -- 4. Captures new fridge state (JSONB)
    -- 5. Inserts cooking_history record
    -- 6. Returns history record + update details

15. [Database] → COMMIT (if successful) or ROLLBACK (if error)

=== Phase 6: Build Response ===
16. [Service] → Transform function result to CreateCookingHistoryResponseDTO
17. [Handler] → Response 201 with Location header
```

### 2.6 Względy bezpieczeństwa

**Uwierzytelnianie:**

- Wymagany Bearer token

**Autoryzacja:**

- Weryfikacja: przepis musi należeć do użytkownika
- RLS zapewnia dostęp tylko do własnej lodówki

**Walidacja:**

- Walidacja recipe_id
- **Critical**: Weryfikacja wystarczających składników przed transakcją
- Prevent negative quantities

**Transactional Integrity:**

- **Atomowość**: Całość w transakcji - albo wszystko się powiedzie, albo nic
- Rollback przy jakimkolwiek błędzie
- Snapshot isolation dla consistency

**Race Conditions:**

- PostgreSQL transaction isolation zapobiega race conditions
- Multiple concurrent cooking events są bezpieczne

**Audit Trail:**

- Fridge states przed i po (immutable JSONB)
- Timestamp zdarzenia
- Pełny audit trail dla compliance

### 2.7 Obsługa błędów

| Scenariusz                 | Kod HTTP | Error Code               | Akcja                                         |
| -------------------------- | -------- | ------------------------ | --------------------------------------------- |
| Brak tokenu                | 401      | UNAUTHORIZED             | Zwróć komunikat o wymaganej autoryzacji       |
| Nieprawidłowy token        | 401      | UNAUTHORIZED             | Zwróć komunikat o nieprawidłowym tokenie      |
| Brak recipe_id             | 400      | VALIDATION_ERROR         | Zwróć: recipe_id is required                  |
| Nieprawidłowy recipe_id    | 400      | VALIDATION_ERROR         | Zwróć: recipe_id must be positive integer     |
| Przepis nie istnieje       | 404      | NOT_FOUND                | Zwróć: Recipe not found                       |
| Przepis innego użytkownika | 404      | NOT_FOUND                | Zwróć: Recipe not found                       |
| Niewystarczające składniki | 400      | INSUFFICIENT_INGREDIENTS | Zwróć szczegóły: które produkty i ile brakuje |
| Błąd transakcji            | 500      | INTERNAL_ERROR           | Rollback, loguj, zwróć ogólny komunikat       |
| Konflikt concurrency       | 409      | CONFLICT                 | Zwróć: Please try again (optimistic lock)     |

**Szczegóły INSUFFICIENT_INGREDIENTS:**

```json
{
  "error": {
    "code": "INSUFFICIENT_INGREDIENTS",
    "message": "Not enough ingredients in fridge to cook this recipe",
    "details": {
      "missing": [
        {
          "product_id": 10,
          "product_name": "Tomato",
          "required": 5,
          "available": 3,
          "unit": "pc"
        }
      ]
    }
  }
}
```

### 2.8 Wydajność

**Optymalizacje:**

- Single PostgreSQL function call (minimalna network overhead)
- Efficient JSONB operations
- Batch updates w ramach transakcji
- Indeksy na foreign keys

**Transaction Optimization:**

- Krótkie transakcje (< 100ms typically)
- Minimalna lock time
- Proper isolation level

**Monitoring:**

- Track transaction duration
- Monitor rollback rate
- Alert na długie transakcje (> 1s)

### 2.9 Etapy wdrożenia

#### Phase 1: Validation & Types

1. **Zod schema walidacji**
   ```typescript
   const CreateCookingHistorySchema = z.object({
     recipe_id: z.number().int().positive(),
   });
   ```

#### Phase 2: PostgreSQL Function

2. **Database Function - record_cooking_event**

   ```sql
   -- Create in migration: supabase/migrations/xxx_record_cooking_event.sql

   CREATE OR REPLACE FUNCTION record_cooking_event(
     p_user_id UUID,
     p_recipe_id BIGINT
   ) RETURNS TABLE (
     history_id BIGINT,
     recipe_id BIGINT,
     recipe_title TEXT,
     cooked_at TIMESTAMPTZ,
     fridge_before JSONB,
     fridge_after JSONB,
     updated_items JSONB
   ) AS $$
   DECLARE
     v_fridge_before JSONB;
     v_fridge_after JSONB;
     v_recipe_title TEXT;
     v_history_id BIGINT;
     v_updated_items JSONB;
     v_ingredient RECORD;
     v_available_qty DECIMAL;
   BEGIN
     -- Verify recipe exists and belongs to user
     SELECT title INTO v_recipe_title
     FROM recipes
     WHERE id = p_recipe_id AND user_id = p_user_id;

     IF NOT FOUND THEN
       RAISE EXCEPTION 'Recipe not found';
     END IF;

     -- Capture current fridge state
     SELECT JSONB_BUILD_OBJECT('items', JSONB_AGG(
       JSONB_BUILD_OBJECT(
         'product_id', up.product_id,
         'product_name', p.name,
         'quantity', up.quantity,
         'unit', u.abbreviation
       )
     )) INTO v_fridge_before
     FROM user_products up
     JOIN products p ON up.product_id = p.id
     JOIN units u ON up.unit_id = u.id
     WHERE up.user_id = p_user_id;

     -- Initialize updated items array
     v_updated_items := '[]'::JSONB;

     -- Process each ingredient
     FOR v_ingredient IN
       SELECT ri.product_id, ri.quantity as required_qty, ri.unit_id, u.abbreviation as unit
       FROM recipe_ingredients ri
       JOIN units u ON ri.unit_id = u.id
       WHERE ri.recipe_id = p_recipe_id
     LOOP
       -- Get available quantity in fridge
       SELECT SUM(quantity) INTO v_available_qty
       FROM user_products
       WHERE user_id = p_user_id
         AND product_id = v_ingredient.product_id
         AND unit_id = v_ingredient.unit_id;

       -- Check if sufficient
       IF v_available_qty IS NULL OR v_available_qty < v_ingredient.required_qty THEN
         RAISE EXCEPTION 'Insufficient ingredient: product_id=%, required=%, available=%',
           v_ingredient.product_id,
           v_ingredient.required_qty,
           COALESCE(v_available_qty, 0);
       END IF;

       -- Update fridge quantities
       -- Strategy: Deduct from oldest items first (FIFO)
       DECLARE
         v_remaining_to_deduct DECIMAL := v_ingredient.required_qty;
         v_fridge_item RECORD;
         v_old_qty DECIMAL;
       BEGIN
         FOR v_fridge_item IN
           SELECT id, quantity
           FROM user_products
           WHERE user_id = p_user_id
             AND product_id = v_ingredient.product_id
             AND unit_id = v_ingredient.unit_id
           ORDER BY created_at ASC
           FOR UPDATE
         LOOP
           IF v_remaining_to_deduct <= 0 THEN
             EXIT;
           END IF;

           v_old_qty := v_fridge_item.quantity;

           IF v_fridge_item.quantity >= v_remaining_to_deduct THEN
             -- This item has enough
             UPDATE user_products
             SET quantity = quantity - v_remaining_to_deduct
             WHERE id = v_fridge_item.id;

             v_remaining_to_deduct := 0;
           ELSE
             -- Consume entire item
             UPDATE user_products
             SET quantity = 0
             WHERE id = v_fridge_item.id;

             v_remaining_to_deduct := v_remaining_to_deduct - v_fridge_item.quantity;
           END IF;
         END LOOP;
       END;

       -- Delete zero-quantity items
       DELETE FROM user_products
       WHERE user_id = p_user_id
         AND product_id = v_ingredient.product_id
         AND quantity = 0;

       -- Record update
       SELECT v_updated_items || JSONB_BUILD_OBJECT(
         'product_id', v_ingredient.product_id,
         'old_quantity', v_available_qty,
         'new_quantity', v_available_qty - v_ingredient.required_qty,
         'unit', v_ingredient.unit
       ) INTO v_updated_items;
     END LOOP;

     -- Capture new fridge state
     SELECT JSONB_BUILD_OBJECT('items', JSONB_AGG(
       JSONB_BUILD_OBJECT(
         'product_id', up.product_id,
         'product_name', p.name,
         'quantity', up.quantity,
         'unit', u.abbreviation
       )
     )) INTO v_fridge_after
     FROM user_products up
     JOIN products p ON up.product_id = p.id
     JOIN units u ON up.unit_id = u.id
     WHERE up.user_id = p_user_id;

     -- Insert cooking history record
     INSERT INTO cooking_history (
       user_id, recipe_id, cooked_at,
       fridge_state_before, fridge_state_after
     ) VALUES (
       p_user_id, p_recipe_id, NOW(),
       v_fridge_before, v_fridge_after
     ) RETURNING id INTO v_history_id;

     -- Return result
     RETURN QUERY SELECT
       v_history_id,
       p_recipe_id,
       v_recipe_title,
       NOW(),
       v_fridge_before,
       v_fridge_after,
       v_updated_items;
   END;
   $$ LANGUAGE plpgsql;
   ```

#### Phase 3: Service Implementation

3. **CookingHistoryService - Create Method**

   ```typescript
   class CookingHistoryService {
     async createCookingHistoryEntry(userId: string, recipeId: number): Promise<CreateCookingHistoryResponseDTO> {
       try {
         // Call PostgreSQL function
         const { rows } = await this.db.query(
           `
           SELECT * FROM record_cooking_event($1, $2)
         `,
           [userId, recipeId]
         );

         if (rows.length === 0) {
           throw new Error("Failed to record cooking event");
         }

         const result = rows[0];

         // Transform to DTO
         return {
           id: result.history_id,
           recipe: {
             id: result.recipe_id,
             title: result.recipe_title,
           },
           cooked_at: result.cooked_at,
           fridge_state_before: result.fridge_before,
           fridge_state_after: result.fridge_after,
           updated_fridge_items: result.updated_items,
         };
       } catch (error) {
         // Parse PostgreSQL exception
         if (error.message.includes("Recipe not found")) {
           throw new NotFoundError("Recipe not found");
         }

         if (error.message.includes("Insufficient ingredient")) {
           // Parse details from error message
           throw new InsufficientIngredientsError(
             "Not enough ingredients in fridge",
             this.parseInsufficientDetails(error.message)
           );
         }

         throw error;
       }
     }

     private parseInsufficientDetails(errorMessage: string): any {
       // Parse "Insufficient ingredient: product_id=10, required=5, available=3"
       const match = errorMessage.match(/product_id=(\d+), required=([\d.]+), available=([\d.]+)/);
       if (match) {
         return {
           product_id: parseInt(match[1]),
           required: parseFloat(match[2]),
           available: parseFloat(match[3]),
         };
       }
       return null;
     }
   }
   ```

4. **Custom Error - InsufficientIngredientsError**
   ```typescript
   class InsufficientIngredientsError extends Error {
     constructor(
       message: string,
       public details: {
         product_id: number;
         required: number;
         available: number;
       }
     ) {
       super(message);
       this.name = "InsufficientIngredientsError";
     }
   }
   ```

#### Phase 4: Endpoint Implementation

5. **Endpoint handler**

   ```typescript
   // src/pages/api/cooking-history/index.ts
   export async function POST(context: APIContext) {
     try {
       // 1. Auth
       const supabase = context.locals.supabase;
       const {
         data: { user },
         error: authError,
       } = await supabase.auth.getUser();

       if (authError || !user) {
         return errorResponse("UNAUTHORIZED", "Authentication required", null, 401);
       }

       // 2. Parse and validate
       const body = await context.request.json();
       const validatedData = CreateCookingHistorySchema.parse(body);

       // 3. Create entry
       const service = new CookingHistoryService(supabase);
       const result = await service.createCookingHistoryEntry(user.id, validatedData.recipe_id);

       // 4. Return with Location header
       return new Response(JSON.stringify(result), {
         status: 201,
         headers: {
           "Content-Type": "application/json",
           Location: `/api/cooking-history/${result.id}`,
         },
       });
     } catch (error) {
       if (error instanceof NotFoundError) {
         return errorResponse("NOT_FOUND", error.message, null, 404);
       }

       if (error instanceof InsufficientIngredientsError) {
         return errorResponse("INSUFFICIENT_INGREDIENTS", error.message, { missing: [error.details] }, 400);
       }

       if (error.name === "ZodError") {
         return errorResponse("VALIDATION_ERROR", "Invalid request data", { errors: error.errors }, 400);
       }

       console.error("Cooking history creation error:", error);
       return errorResponse("INTERNAL_ERROR", "Failed to record cooking event", null, 500);
     }
   }
   ```

<!-- #### Phase 5: Testing

6. **Unit Tests - PostgreSQL Function**
   ```sql
   -- Test in migration or separate test file
   BEGIN;

   -- Setup test data
   INSERT INTO recipes (id, user_id, title, instructions, source)
   VALUES (1, 'test-user-id', 'Test Recipe', 'Instructions', 'user');

   INSERT INTO recipe_ingredients (recipe_id, product_id, quantity, unit_id)
   VALUES (1, 10, 5, 1);

   INSERT INTO user_products (user_id, product_id, quantity, unit_id)
   VALUES ('test-user-id', 10, 8, 1);

   -- Test: Successful cooking
   SELECT * FROM record_cooking_event('test-user-id', 1);

   -- Verify: Fridge updated
   SELECT quantity FROM user_products
   WHERE user_id = 'test-user-id' AND product_id = 10;
   -- Expected: 3

   -- Verify: History created
   SELECT COUNT(*) FROM cooking_history
   WHERE user_id = 'test-user-id' AND recipe_id = 1;
   -- Expected: 1

   ROLLBACK;
   ```

7. **Integration Tests**
   ```typescript
   describe('POST /api/cooking-history', () => {
     it('should create cooking history and update fridge', async () => {
       // Setup: Add products to fridge
       await addToFridge(userId, { product_id: 10, quantity: 8, unit_id: 1 });

       const response = await fetch('/api/cooking-history', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${userToken}`,
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({ recipe_id: testRecipeId })
       });

       expect(response.status).toBe(201);
       const data = await response.json();

       // Verify response structure
       expect(data.id).toBeDefined();
       expect(data.fridge_state_before.items).toHaveLength(1);
       expect(data.fridge_state_after.items).toHaveLength(1);
       expect(data.updated_fridge_items).toHaveLength(1);

       // Verify quantity decreased
       const beforeItem = data.fridge_state_before.items[0];
       const afterItem = data.fridge_state_after.items[0];
       expect(afterItem.quantity).toBeLessThan(beforeItem.quantity);

       // Verify database state
       const fridgeItem = await getFridgeItem(userId, 10);
       expect(fridgeItem.quantity).toBe(3); // 8 - 5
     });

     it('should return 400 for insufficient ingredients', async () => {
       // Setup: Add insufficient products
       await addToFridge(userId, { product_id: 10, quantity: 2, unit_id: 1 });
       // Recipe requires 5

       const response = await fetch('/api/cooking-history', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${userToken}`,
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({ recipe_id: testRecipeId })
       });

       expect(response.status).toBe(400);
       const error = await response.json();
       expect(error.error.code).toBe('INSUFFICIENT_INGREDIENTS');
       expect(error.error.details.missing).toBeDefined();
     });

     it('should handle FIFO deduction correctly', async () => {
       // Add same product multiple times with different dates
       await addToFridge(userId, {
         product_id: 10,
         quantity: 3,
         unit_id: 1,
         created_at: '2025-10-01'
       });
       await addToFridge(userId, {
         product_id: 10,
         quantity: 5,
         unit_id: 1,
         created_at: '2025-10-10'
       });

       // Recipe requires 5 (should consume first entry completely, none from second)
       const response = await fetch('/api/cooking-history', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${userToken}`,
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({ recipe_id: testRecipeId })
       });

       expect(response.status).toBe(201);

       // Verify: First entry deleted (was 3, needed 5)
       // Second entry partially used (5 - (5-3) = 3)
       const remainingItems = await getFridgeItems(userId, 10);
       expect(remainingItems).toHaveLength(1);
       expect(remainingItems[0].quantity).toBe(3);
     });

     it('should rollback on error', async () => {
       // Setup: Sufficient ingredients
       await addToFridge(userId, { product_id: 10, quantity: 10, unit_id: 1 });

       // Simulate error (e.g., by dropping a constraint temporarily in test)
       // ... trigger error during transaction ...

       // Verify: Fridge unchanged
       const fridgeItem = await getFridgeItem(userId, 10);
       expect(fridgeItem.quantity).toBe(10);

       // Verify: No history entry
       const history = await getCookingHistory(userId);
       expect(history).toHaveLength(0);
     });
   });
   ``` -->

### 2.10 Advanced Considerations

**Concurrency Handling:**

```sql
-- In function: Use FOR UPDATE to lock rows
SELECT id, quantity
FROM user_products
WHERE user_id = p_user_id
  AND product_id = v_ingredient.product_id
ORDER BY created_at ASC
FOR UPDATE;  -- Prevents concurrent modifications
```

**Partial Cooking (Future Enhancement):**

```typescript
// Allow cooking with ingredient multiplier (e.g., half recipe)
interface CreateCookingHistoryDTO {
  recipe_id: number;
  portion_multiplier?: number; // default 1.0, can be 0.5, 2.0, etc.
}
```

**Undo Functionality (Future Enhancement):**

```typescript
// Reverse a cooking event (if done in error)
async undoCookingEvent(userId: string, historyId: number) {
  // Restore fridge to state_before
  // Mark history entry as undone
}
```

---

## Podsumowanie implementacji Cooking History API

### Struktura plików

```
src/
├── lib/
│   ├── services/
│   │   └── cooking-history.service.ts      # Service
│   ├── errors/
│   │   └── insufficient-ingredients.error.ts
│   └── validations/
│       └── cooking-history.validation.ts
└── pages/
    └── api/
        └── cooking-history/
            └── index.ts                     # GET, POST
```

### Database Components

```
supabase/migrations/
└── xxx_record_cooking_event.sql           # PostgreSQL function
```

### Kluczowe algorytmy

**FIFO Deduction Strategy:**

```
For each recipe ingredient:
  1. Find all fridge items matching product+unit (ordered by created_at ASC)
  2. Deduct from oldest first:
     - If item.quantity >= remaining_needed: deduct and done
     - If item.quantity < remaining_needed: consume entire item, continue
  3. Delete items with quantity = 0
```

**State Capture:**

```
Before transaction:
  - Snapshot current fridge → fridge_state_before (JSONB)

During transaction:
  - Update fridge quantities
  - Delete zero items

After updates:
  - Snapshot new fridge → fridge_state_after (JSONB)
  - Insert history record with both states
```

### Performance Characteristics

- **Transaction Duration**: Typically 50-150ms
- **Query Count**: 1 (PostgreSQL function)
- **Atomicity**: Full ACID guarantees
- **Concurrency**: Row-level locking (FOR UPDATE)
- **Scalability**: Efficient for < 50 ingredients per recipe

### Critical Success Factors

1. **Atomicity**: All-or-nothing operations
2. **Data Integrity**: No negative quantities
3. **Audit Trail**: Immutable state snapshots
4. **Concurrency Safety**: Proper locking
5. **Error Handling**: Clear insufficient ingredient messages
6. **Performance**: Fast transactions (< 200ms)

### Kolejność implementacji

1. **Day 1**: PostgreSQL function (core logic)
2. **Day 2**: Service wrapper + error handling
3. **Day 3**: POST endpoint + validation
4. **Day 4**: GET endpoint (simpler)
   <!-- 5. **Day 5**: Testing (unit + integration) -->
   <!-- 6. **Day 6**: Performance testing + optimization -->
5. **Day 7**: Documentation + edge cases

<!-- ### Testing Checklist

- [ ] Successful cooking with sufficient ingredients
- [ ] Insufficient ingredients error (with details)
- [ ] FIFO deduction correctness
- [ ] Multiple entries of same product
- [ ] Zero quantity cleanup
- [ ] Transaction rollback on error
- [ ] Concurrent cooking attempts (race condition)
- [ ] State snapshots accuracy
- [ ] Recipe doesn't exist (404)
- [ ] Recipe of another user (404)
- [ ] Empty fridge scenario
- [ ] History listing with filters
- [ ] Pagination -->
