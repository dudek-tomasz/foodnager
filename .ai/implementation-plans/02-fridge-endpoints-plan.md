# API Endpoints Implementation Plan: Virtual Fridge Management

## Spis treści

1. [GET /api/fridge - List Fridge Items](#1-get-apifridge---list-fridge-items)
2. [GET /api/fridge/:id - Get Fridge Item by ID](#2-get-apifridgeid---get-fridge-item-by-id)
3. [POST /api/fridge - Add Item to Fridge](#3-post-apifridge---add-item-to-fridge)
4. [PATCH /api/fridge/:id - Update Fridge Item](#4-patch-apifridgeid---update-fridge-item)
5. [DELETE /api/fridge/:id - Delete Fridge Item](#5-delete-apifridgeid---delete-fridge-item)

---

## 1. GET /api/fridge - List Fridge Items

### 1.1 Przegląd punktu końcowego

Endpoint pobiera zawartość wirtualnej lodówki użytkownika z zaawansowanymi opcjami filtrowania i sortowania. Umożliwia wyszukiwanie produktów, filtrowanie według daty ważności (przeterminowane, wkrótce przeterminowane), sortowanie oraz paginację wyników.

**Powiązane User Stories:** US-002 (Zarządzanie wirtualną lodówką)

### 1.2 Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/fridge`
- **Wymagane nagłówki:** `Authorization: Bearer {access_token}`

**Query Parameters:**

- **Opcjonalne:**
  - `expired` (enum: `yes`, `no`, `all`) - Filtruj według statusu ważności, domyślnie `all`
  - `expiring_soon` (integer) - Próg dni dla produktów wkrótce przeterminowanych (np. 3 = w ciągu 3 dni)
  - `search` (string) - Wyszukiwanie w nazwach produktów
  - `sort` (enum: `name`, `quantity`, `expiry_date`, `created_at`) - Pole sortowania, domyślnie `created_at`
  - `order` (enum: `asc`, `desc`) - Kierunek sortowania, domyślnie `desc`
  - `page` (integer) - Numer strony, domyślnie `1`, minimum `1`
  - `limit` (integer) - Liczba elementów na stronę, domyślnie `20`, maximum `100`

**Przykładowe żądania:**

```
GET /api/fridge?expired=no&expiring_soon=3&page=1&limit=20
GET /api/fridge?search=tomato&sort=expiry_date&order=asc
```

### 1.3 Wykorzystywane typy

**Query DTO:**

```typescript
ListFridgeQueryDTO {
  expired?: 'yes' | 'no' | 'all';
  expiring_soon?: number;
  search?: string;
  sort?: 'name' | 'quantity' | 'expiry_date' | 'created_at';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}
```

**Response DTOs:**

```typescript
FridgeListResponseDTO {
  data: FridgeItemDTO[];
  pagination: PaginationMetaDTO;
}

FridgeItemDTO {
  id: number;
  product: ProductReferenceDTO;
  quantity: number;
  unit: UnitReferenceDTO;
  expiry_date: string | null;
  created_at: string;
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

**Sukces (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "product": {
        "id": 10,
        "name": "Tomato"
      },
      "quantity": 5,
      "unit": {
        "id": 1,
        "name": "piece",
        "abbreviation": "pc"
      },
      "expiry_date": "2025-10-25",
      "created_at": "2025-10-18T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "total_pages": 3
  }
}
```

**Błędy:**

- `401 Unauthorized` - Brak lub nieprawidłowy token
- `422 Unprocessable Entity` - Nieprawidłowe parametry zapytania

### 1.5 Przepływ danych

```
1. [Client] → GET /api/fridge?expired=no&expiring_soon=3
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Walidacja query params przez Zod
5. [Service] → FridgeService.listFridgeItems(userId, queryParams)
6. [Database] → Complex query:
   - Base: SELECT up.*, p.name, u.name, u.abbreviation
   - FROM user_products up
   - JOIN products p ON up.product_id = p.id
   - JOIN units u ON up.unit_id = u.id
   - WHERE up.user_id = $userId
   - Filtr expired:
     - yes: AND expiry_date < CURRENT_DATE
     - no: AND (expiry_date IS NULL OR expiry_date >= CURRENT_DATE)
     - all: brak warunku
   - Filtr expiring_soon: AND expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + $days
   - Search: AND p.name ILIKE '%' || $search || '%'
   - ORDER BY (mapowanie sort field)
   - LIMIT/OFFSET
7. [Service] → Transformacja na FridgeItemDTO (nested objects)
8. [Service] → Obliczenie pagination meta
9. [Handler] → Response 200 z FridgeListResponseDTO
```

### 1.6 Względy bezpieczeństwa

**Uwierzytelnianie:**

- Wymagany Bearer token z Supabase Auth

**Autoryzacja:**

- RLS Policy: `WHERE user_id = auth.uid()`
- Użytkownik widzi tylko swoją lodówkę
- JOIN z products respektuje RLS (global + own private)

**Walidacja:**

- Walidacja wszystkich query params przez Zod
- Sanityzacja search query (ILIKE z parametryzacją)
- Walidacja zakresów: page >= 1, limit <= 100, expiring_soon >= 0

**Data Privacy:**

- Nie ujawniamy user_id w response
- Produkty prywatne innych użytkowników są niedostępne

### 1.7 Obsługa błędów

| Scenariusz                  | Kod HTTP | Error Code       | Akcja                                    |
| --------------------------- | -------- | ---------------- | ---------------------------------------- |
| Brak tokenu                 | 401      | UNAUTHORIZED     | Zwróć komunikat o wymaganej autoryzacji  |
| Nieprawidłowy token         | 401      | UNAUTHORIZED     | Zwróć komunikat o nieprawidłowym tokenie |
| Nieprawidłowy expired value | 422      | VALIDATION_ERROR | Zwróć: expired must be yes, no, or all   |
| expiring_soon < 0           | 422      | VALIDATION_ERROR | Zwróć: expiring_soon must be positive    |
| Nieprawidłowy sort field    | 422      | VALIDATION_ERROR | Zwróć listę dozwolonych wartości         |
| page < 1                    | 422      | VALIDATION_ERROR | Zwróć: page must be >= 1                 |
| limit > 100                 | 422      | VALIDATION_ERROR | Zwróć: limit cannot exceed 100           |
| Błąd bazy danych            | 500      | INTERNAL_ERROR   | Loguj szczegóły, zwróć ogólny komunikat  |

### 1.8 Wydajność

**Optymalizacje:**

- Indeks na `user_products(user_id)` - FK index
- Indeks na `user_products(expiry_date)` - dla filtrowania
- JOIN optymalizacja: indexed foreign keys
- COUNT(\*) OVER() dla total bez dodatkowego query

**Caching:**

- Cache krótkoterminowy (5 minut): `fridge:{userId}:page:{page}:params:{hash}`
- Invalidacja cache przy: POST, PATCH, DELETE
- Cache key zawiera hash wszystkich parametrów

**Query Optimization:**

- Selective loading tylko potrzebnych kolumn
- Proper index usage dla wszystkich filtrów

### 1.9 Etapy wdrożenia

1. **Utworzenie Zod schema walidacji**
   - Schema dla ListFridgeQueryDTO:

   ```typescript
   z.object({
     expired: z.enum(["yes", "no", "all"]).default("all"),
     expiring_soon: z.coerce.number().int().nonnegative().optional(),
     search: z.string().trim().optional(),
     sort: z.enum(["name", "quantity", "expiry_date", "created_at"]).default("created_at"),
     order: z.enum(["asc", "desc"]).default("desc"),
     page: z.coerce.number().int().min(1).default(1),
     limit: z.coerce.number().int().min(1).max(100).default(20),
   });
   ```

2. **Utworzenie FridgeService**
   - Utwórz `src/lib/services/fridge.service.ts`
   - Implementuj `listFridgeItems(userId, query)`
   - Zbuduj complex SQL query z JOIN
   - Mapuj sort field na database column (name → p.name)
   - Implementuj logikę filtrów (expired, expiring_soon, search)
   - Transformuj wyniki na FridgeItemDTO z nested objects

3. **Helper funkcje transformacji**
   - `transformToFridgeItemDTO(row)` - konwertuje flat row na nested DTO
   - Grupowanie kolumn: product._, unit._

4. **Utworzenie endpoint handlera**
   - Utwórz `src/pages/api/fridge/index.ts`
   - `export const prerender = false`
   - Implementuj `GET(context: APIContext)`
   - Parse query params, waliduj przez Zod
   - Wywołaj FridgeService.listFridgeItems()
   - Zwróć 200 z response

5. **Testowanie**
   - Test podstawowego listowania (200)
   - Test filtrowania expired: yes, no, all
   - Test expiring_soon (produkty wkrótce przeterminowane)
   - Test search query
   - Test sortowania: wszystkie pola, asc/desc
   - Test paginacji
   - Test bez produktów (pusta lodówka)
   - Test bez autoryzacji (401)

---

## 2. GET /api/fridge/:id - Get Fridge Item by ID

### 2.1 Przegląd punktu końcowego

Endpoint pobiera szczegóły pojedynczego produktu z lodówki użytkownika. Zwraca pełne informacje o produkcie, ilości, jednostce i dacie ważności.

**Powiązane User Stories:** US-002 (Zarządzanie wirtualną lodówką)

### 2.2 Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/fridge/:id`
- **Wymagane nagłówki:** `Authorization: Bearer {access_token}`

**URL Parameters:**

- **Wymagane:**
  - `id` (integer) - ID pozycji w lodówce

**Przykładowe żądanie:**

```
GET /api/fridge/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3 Wykorzystywane typy

**Response DTO:**

```typescript
FridgeItemDTO {
  id: number;
  product: ProductReferenceDTO;
  quantity: number;
  unit: UnitReferenceDTO;
  expiry_date: string | null;
  created_at: string;
}
```

### 2.4 Szczegóły odpowiedzi

**Sukces (200 OK):**

```json
{
  "id": 1,
  "product": {
    "id": 10,
    "name": "Tomato"
  },
  "quantity": 5,
  "unit": {
    "id": 1,
    "name": "piece",
    "abbreviation": "pc"
  },
  "expiry_date": "2025-10-25",
  "created_at": "2025-10-18T12:00:00Z"
}
```

**Błędy:**

- `401 Unauthorized` - Brak lub nieprawidłowy token
- `404 Not Found` - Pozycja nie istnieje lub nie należy do użytkownika

### 2.5 Przepływ danych

```
1. [Client] → GET /api/fridge/123
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse i walidacja ID
5. [Service] → FridgeService.getFridgeItemById(userId, itemId)
6. [Database] → SELECT up.*, p.name, u.name, u.abbreviation
   FROM user_products up
   JOIN products p ON up.product_id = p.id
   JOIN units u ON up.unit_id = u.id
   WHERE up.id = $id AND up.user_id = $userId
7. [Service] → Jeśli brak wyniku → throw NotFoundError
8. [Service] → Transformacja na FridgeItemDTO
9. [Handler] → Response 200 z FridgeItemDTO
```

### 2.6 Względy bezpieczeństwa

**Uwierzytelnianie:**

- Wymagany Bearer token

**Autoryzacja:**

- RLS Policy: `WHERE id = $id AND user_id = auth.uid()`
- Zapobiega dostępowi do lodówek innych użytkowników
- 404 zamiast 403 (information disclosure prevention)

**Walidacja:**

- Walidacja ID: integer, positive

### 2.7 Obsługa błędów

| Scenariusz                 | Kod HTTP | Error Code       | Akcja                                    |
| -------------------------- | -------- | ---------------- | ---------------------------------------- |
| Brak tokenu                | 401      | UNAUTHORIZED     | Zwróć komunikat o wymaganej autoryzacji  |
| Nieprawidłowy token        | 401      | UNAUTHORIZED     | Zwróć komunikat o nieprawidłowym tokenie |
| Nieprawidłowy ID           | 400      | VALIDATION_ERROR | Zwróć: Invalid item ID                   |
| Pozycja nie istnieje       | 404      | NOT_FOUND        | Zwróć: Fridge item not found             |
| Pozycja innego użytkownika | 404      | NOT_FOUND        | Zwróć: Fridge item not found             |
| Błąd bazy danych           | 500      | INTERNAL_ERROR   | Loguj, zwróć ogólny komunikat            |

### 2.8 Wydajność

**Optymalizacje:**

- PRIMARY KEY lookup (id) - bardzo szybkie
- JOIN z indexed foreign keys

**Caching:**

- Cache item: `fridge:item:{itemId}` na 5 minut
- Invalidacja przy UPDATE/DELETE

### 2.9 Etapy wdrożenia

1. **Zod schema walidacji**
   - Schema dla ID: `z.coerce.number().int().positive()`

2. **Rozszerzenie FridgeService**
   - Dodaj metodę `getFridgeItemById(userId, itemId): Promise<FridgeItemDTO>`
   - Query z JOIN products + units
   - WHERE id AND user_id
   - Transformuj na FridgeItemDTO

3. **Endpoint handler**
   - Utwórz `src/pages/api/fridge/[id].ts`
   - Implementuj `GET(context: APIContext)`
   - Parse params.id, waliduj
   - Wywołaj service, zwróć response

4. **Testowanie**
   - Test pobrania własnej pozycji (200)
   - Test pozycji innego użytkownika (404)
   - Test nieistniejącej pozycji (404)
   - Test nieprawidłowego ID (400)
   - Test bez autoryzacji (401)

---

## 3. POST /api/fridge - Add Item to Fridge

### 3.1 Przegląd punktu końcowego

Endpoint dodaje nowy produkt do wirtualnej lodówki użytkownika. Wymaga podania ID produktu, ilości, jednostki miary oraz opcjonalnie daty ważności.

**Powiązane User Stories:** US-002 (Zarządzanie wirtualną lodówką)

### 3.2 Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/api/fridge`
- **Wymagane nagłówki:**
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`

**Request Body:**

- **Wymagane:**
  - `product_id` (integer) - ID produktu (globalnego lub prywatnego użytkownika)
  - `quantity` (number) - Ilość produktu, >= 0
  - `unit_id` (integer) - ID jednostki miary
- **Opcjonalne:**
  - `expiry_date` (string | null) - Data ważności w formacie ISO 8601 (YYYY-MM-DD)

**Przykładowe żądanie:**

```json
POST /api/fridge
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "product_id": 10,
  "quantity": 5,
  "unit_id": 1,
  "expiry_date": "2025-10-25"
}
```

### 3.3 Wykorzystywane typy

**Request DTO:**

```typescript
CreateFridgeItemDTO {
  product_id: number;
  quantity: number;
  unit_id: number;
  expiry_date?: string | null;
}
```

**Response DTO:**

```typescript
FridgeItemDTO {
  id: number;
  product: ProductReferenceDTO;
  quantity: number;
  unit: UnitReferenceDTO;
  expiry_date: string | null;
  created_at: string;
}
```

### 3.4 Szczegóły odpowiedzi

**Sukces (201 Created):**

```json
{
  "id": 1,
  "product": {
    "id": 10,
    "name": "Tomato"
  },
  "quantity": 5,
  "unit": {
    "id": 1,
    "name": "piece",
    "abbreviation": "pc"
  },
  "expiry_date": "2025-10-25",
  "created_at": "2025-10-18T12:00:00Z"
}
```

**Błędy:**

- `400 Bad Request` - Nieprawidłowe dane (quantity < 0, nieprawidłowa data)
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `404 Not Found` - Produkt lub jednostka nie istnieją

### 3.5 Przepływ danych

```
1. [Client] → POST /api/fridge {product_id, quantity, unit_id, expiry_date}
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse request body
5. [Handler] → Walidacja przez Zod
6. [Service] → FridgeService.addItemToFridge(userId, createDto)
7. [Service] → Weryfikacja istnienia product_id (accessible to user)
8. [Service] → Weryfikacja istnienia unit_id
9. [Database] → INSERT INTO user_products (user_id, product_id, quantity, unit_id, expiry_date)
   VALUES ($1, $2, $3, $4, $5) RETURNING *
10. [Service] → Pobierz pełne dane z JOIN (product, unit)
11. [Service] → Transformacja na FridgeItemDTO
12. [Handler] → Response 201 z Location header
```

### 3.6 Względy bezpieczeństwa

**Uwierzytelnianie:**

- Wymagany Bearer token

**Autoryzacja:**

- RLS Policy dla INSERT: `WITH CHECK (user_id = auth.uid())`
- user_id automatycznie ustawiany na auth.uid()
- Weryfikacja dostępu do product_id (global lub own)

**Walidacja:**

- quantity >= 0 (decimal)
- product_id musi istnieć i być dostępny dla użytkownika
- unit_id musi istnieć
- expiry_date: walidacja formatu ISO, opcjonalna walidacja przyszłej daty
- Prevent SQL injection przez parametryzację

**Business Rules:**

- Możliwość dodania tego samego produktu wiele razy (różne daty ważności, lokalizacje)
- expiry_date w przeszłości: opcjonalnie warning, ale dozwolone

### 3.7 Obsługa błędów

| Scenariusz                       | Kod HTTP | Error Code       | Akcja                                     |
| -------------------------------- | -------- | ---------------- | ----------------------------------------- |
| Brak tokenu                      | 401      | UNAUTHORIZED     | Zwróć komunikat o wymaganej autoryzacji   |
| Nieprawidłowy token              | 401      | UNAUTHORIZED     | Zwróć komunikat o nieprawidłowym tokenie  |
| Brak wymaganych pól              | 400      | VALIDATION_ERROR | Zwróć listę brakujących pól               |
| quantity < 0                     | 400      | VALIDATION_ERROR | Zwróć: quantity must be >= 0              |
| Nieprawidłowy format expiry_date | 400      | VALIDATION_ERROR | Zwróć: expiry_date must be valid ISO date |
| product_id nie istnieje          | 404      | NOT_FOUND        | Zwróć: Product not found                  |
| unit_id nie istnieje             | 404      | NOT_FOUND        | Zwróć: Unit not found                     |
| Invalid JSON                     | 400      | VALIDATION_ERROR | Zwróć: Invalid request body               |
| Błąd bazy danych                 | 500      | INTERNAL_ERROR   | Loguj, zwróć ogólny komunikat             |

### 3.8 Wydajność

**Optymalizacje:**

- Batch verification: sprawdzenie product + unit w jednym query
- RETURNING clause: unikamy dodatkowego SELECT
- Transakcja dla atomowości

**Cache Invalidation:**

- Invalidacja cache listy: `fridge:{userId}:*`

### 3.9 Etapy wdrożenia

1. **Zod schema walidacji**
   - Schema dla CreateFridgeItemDTO:

   ```typescript
   z.object({
     product_id: z.number().int().positive(),
     quantity: z.number().nonnegative(),
     unit_id: z.number().int().positive(),
     expiry_date: z.string().date().nullable().optional(),
   });
   ```

2. **Rozszerzenie FridgeService**
   - Dodaj metodę `addItemToFridge(userId, data): Promise<FridgeItemDTO>`
   - Weryfikuj product_id: SELECT WHERE id AND (user_id IS NULL OR user_id = $userId)
   - Weryfikuj unit_id: SELECT WHERE id
   - INSERT z RETURNING id
   - Fetch pełne dane z JOIN
   - Transformuj na FridgeItemDTO

3. **Endpoint handler**
   - W `src/pages/api/fridge/index.ts` dodaj `POST`
   - Parse body, waliduj
   - Wywołaj service
   - Zwróć 201 z Location: `/api/fridge/{newId}`

4. **Error handling**
   - Not found dla product/unit → 404
   - Validation errors → 400

5. **Testowanie**
   - Test dodania produktu (201)
   - Test z wszystkimi polami (including expiry_date)
   - Test bez expiry_date (201)
   - Test nieprawidłowego product_id (404)
   - Test nieprawidłowego unit_id (404)
   - Test quantity < 0 (400)
   - Test nieprawidłowej daty (400)
   - Test bez autoryzacji (401)
   - Weryfikacja Location header

---

## 4. PATCH /api/fridge/:id - Update Fridge Item

### 4.1 Przegląd punktu końcowego

Endpoint aktualizuje istniejącą pozycję w lodówce użytkownika. Pozwala na zmianę ilości, jednostki miary oraz daty ważności. Nie można zmienić produktu (product_id) - wymaga usunięcia i dodania nowej pozycji.

**Powiązane User Stories:** US-002 (Zarządzanie wirtualną lodówką)

### 4.2 Szczegóły żądania

- **Metoda HTTP:** `PATCH`
- **Struktura URL:** `/api/fridge/:id`
- **Wymagane nagłówki:**
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`

**URL Parameters:**

- **Wymagane:**
  - `id` (integer) - ID pozycji do aktualizacji

**Request Body:**

- **Opcjonalne (przynajmniej jedno wymagane):**
  - `quantity` (number) - Nowa ilość, >= 0
  - `unit_id` (integer) - Nowy ID jednostki
  - `expiry_date` (string | null) - Nowa data ważności lub null (usunięcie)

**Przykładowe żądanie:**

```json
PATCH /api/fridge/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "quantity": 3,
  "unit_id": 1,
  "expiry_date": "2025-10-28"
}
```

### 4.3 Wykorzystywane typy

**Request DTO:**

```typescript
UpdateFridgeItemDTO {
  quantity?: number;
  unit_id?: number;
  expiry_date?: string | null;
}
```

**Response DTO:**

```typescript
FridgeItemDTO {
  id: number;
  product: ProductReferenceDTO;
  quantity: number;
  unit: UnitReferenceDTO;
  expiry_date: string | null;
  created_at: string;
}
```

### 4.4 Szczegóły odpowiedzi

**Sukces (200 OK):**

```json
{
  "id": 1,
  "product": {
    "id": 10,
    "name": "Tomato"
  },
  "quantity": 3,
  "unit": {
    "id": 1,
    "name": "piece",
    "abbreviation": "pc"
  },
  "expiry_date": "2025-10-28",
  "created_at": "2025-10-18T12:00:00Z"
}
```

**Błędy:**

- `400 Bad Request` - Nieprawidłowe dane (puste body, quantity < 0)
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `404 Not Found` - Pozycja nie istnieje, unit nie istnieje, lub pozycja nie należy do użytkownika

### 4.5 Przepływ danych

```
1. [Client] → PATCH /api/fridge/123 {quantity, unit_id, expiry_date}
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse ID + body
5. [Handler] → Walidacja przez Zod
6. [Service] → FridgeService.updateFridgeItem(userId, itemId, updateDto)
7. [Service] → Sprawdź istnienie pozycji: SELECT WHERE id AND user_id
8. [Service] → Jeśli brak → throw NotFoundError
9. [Service] → Jeśli unit_id zmienione: weryfikuj istnienie nowej jednostki
10. [Database] → UPDATE user_products SET {fields} WHERE id = $1 AND user_id = $2
11. [Service] → Fetch zaktualizowane dane z JOIN
12. [Service] → Transformacja na FridgeItemDTO
13. [Handler] → Response 200 z FridgeItemDTO
```

### 4.6 Względy bezpieczeństwa

**Uwierzytelnianie:**

- Wymagany Bearer token

**Autoryzacja:**

- RLS Policy dla UPDATE: `USING (user_id = auth.uid())`
- Użytkownik może aktualizować tylko swoje pozycje

**Walidacja:**

- Walidacja ID pozycji
- quantity >= 0
- Weryfikacja istnienia nowego unit_id (jeśli zmieniane)
- expiry_date format validation
- Wymóg przynajmniej jednego pola w body

**Business Rules:**

- Nie można zmienić product_id (by design)
- expiry_date może być ustawione na null (usunięcie daty)

### 4.7 Obsługa błędów

| Scenariusz                 | Kod HTTP | Error Code       | Akcja                                    |
| -------------------------- | -------- | ---------------- | ---------------------------------------- |
| Brak tokenu                | 401      | UNAUTHORIZED     | Zwróć komunikat o wymaganej autoryzacji  |
| Nieprawidłowy token        | 401      | UNAUTHORIZED     | Zwróć komunikat o nieprawidłowym tokenie |
| Nieprawidłowy ID           | 400      | VALIDATION_ERROR | Zwróć: Invalid item ID                   |
| Puste body                 | 400      | VALIDATION_ERROR | Zwróć: At least one field required       |
| quantity < 0               | 400      | VALIDATION_ERROR | Zwróć: quantity must be >= 0             |
| Nieprawidłowa data         | 400      | VALIDATION_ERROR | Zwróć: Invalid expiry_date format        |
| Pozycja nie istnieje       | 404      | NOT_FOUND        | Zwróć: Fridge item not found             |
| Pozycja innego użytkownika | 404      | NOT_FOUND        | Zwróć: Fridge item not found             |
| unit_id nie istnieje       | 404      | NOT_FOUND        | Zwróć: Unit not found                    |
| Błąd bazy danych           | 500      | INTERNAL_ERROR   | Loguj, zwróć ogólny komunikat            |

### 4.8 Wydajność

**Optymalizacje:**

- UPDATE WHERE id + user_id używa indeksów
- Weryfikacja unit tylko gdy zmienione
- Pojedyncza transakcja

**Cache Invalidation:**

- Invalidacja cache pozycji: `fridge:item:{itemId}`
- Invalidacja cache listy: `fridge:{userId}:*`

### 4.9 Etapy wdrożenia

1. **Zod schema walidacji**
   - Schema dla UpdateFridgeItemDTO:

   ```typescript
   z.object({
     quantity: z.number().nonnegative().optional(),
     unit_id: z.number().int().positive().optional(),
     expiry_date: z.string().date().nullable().optional(),
   }).refine((data) => Object.keys(data).length > 0, {
     message: "At least one field is required",
   });
   ```

2. **Rozszerzenie FridgeService**
   - Dodaj metodę `updateFridgeItem(userId, itemId, data): Promise<FridgeItemDTO>`
   - SELECT pozycji: WHERE id AND user_id
   - Jeśli unit_id zmienione: weryfikuj
   - UPDATE z SET tylko dla przekazanych pól
   - Fetch zaktualizowane dane z JOIN
   - Transformuj na FridgeItemDTO

3. **Endpoint handler**
   - W `src/pages/api/fridge/[id].ts` dodaj `PATCH`
   - Parse params + body, waliduj
   - Wywołaj service
   - Zwróć 200 z response

4. **Dynamic UPDATE query**
   - Helper budujący SET clause tylko dla przekazanych pól
   - Parametryzowane zapytanie

5. **Testowanie**
   - Test aktualizacji quantity (200)
   - Test aktualizacji unit_id (200)
   - Test aktualizacji expiry_date (200)
   - Test ustawienia expiry_date na null (200)
   - Test aktualizacji wszystkich pól (200)
   - Test pustego body (400)
   - Test pozycji innego użytkownika (404)
   - Test nieistniejącej pozycji (404)
   - Test nieistniejącego unit (404)
   - Test quantity < 0 (400)
   - Test bez autoryzacji (401)

---

## 5. DELETE /api/fridge/:id - Delete Fridge Item

### 5.1 Przegląd punktu końcowego

Endpoint usuwa pozycję z wirtualnej lodówki użytkownika. Operacja jest trwała i nieodwracalna. Nie wpływa na inne dane (brak CASCADE do innych tabel).

**Powiązane User Stories:** US-002 (Zarządzanie wirtualną lodówką)

### 5.2 Szczegóły żądania

- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/api/fridge/:id`
- **Wymagane nagłówki:** `Authorization: Bearer {access_token}`

**URL Parameters:**

- **Wymagane:**
  - `id` (integer) - ID pozycji do usunięcia

**Przykładowe żądanie:**

```
DELETE /api/fridge/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5.3 Wykorzystywane typy

Brak body w request i response (204 No Content).

### 5.4 Szczegóły odpowiedzi

**Sukces (204 No Content):**

- Puste body
- Status 204 oznacza sukces

**Błędy:**

- `401 Unauthorized` - Brak lub nieprawidłowy token
- `404 Not Found` - Pozycja nie istnieje lub nie należy do użytkownika

### 5.5 Przepływ danych

```
1. [Client] → DELETE /api/fridge/123
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse i walidacja ID
5. [Service] → FridgeService.deleteFridgeItem(userId, itemId)
6. [Service] → Opcjonalne: sprawdź istnienie (dla lepszych error messages)
7. [Database] → DELETE FROM user_products WHERE id = $1 AND user_id = $2
8. [Service] → Sprawdź rowCount: jeśli 0 → throw NotFoundError
9. [Handler] → Response 204 No Content
```

### 5.6 Względy bezpieczeństwa

**Uwierzytelnianie:**

- Wymagany Bearer token

**Autoryzacja:**

- RLS Policy dla DELETE: `USING (user_id = auth.uid())`
- Użytkownik może usuwać tylko swoje pozycje

**Walidacja:**

- Walidacja ID pozycji

**No Cascade Effects:**

- Usunięcie z lodówki nie wpływa na inne dane
- Bezpieczna operacja

### 5.7 Obsługa błędów

| Scenariusz                 | Kod HTTP | Error Code       | Akcja                                    |
| -------------------------- | -------- | ---------------- | ---------------------------------------- |
| Brak tokenu                | 401      | UNAUTHORIZED     | Zwróć komunikat o wymaganej autoryzacji  |
| Nieprawidłowy token        | 401      | UNAUTHORIZED     | Zwróć komunikat o nieprawidłowym tokenie |
| Nieprawidłowy ID           | 400      | VALIDATION_ERROR | Zwróć: Invalid item ID                   |
| Pozycja nie istnieje       | 404      | NOT_FOUND        | Zwróć: Fridge item not found             |
| Pozycja innego użytkownika | 404      | NOT_FOUND        | Zwróć: Fridge item not found             |
| Błąd bazy danych           | 500      | INTERNAL_ERROR   | Loguj, zwróć ogólny komunikat            |

### 5.8 Wydajność

**Optymalizacje:**

- DELETE WHERE id + user_id używa indeksów PRIMARY + FK
- Bardzo szybka operacja

**Cache Invalidation:**

- Invalidacja cache pozycji: `fridge:item:{itemId}`
- Invalidacja cache listy: `fridge:{userId}:*`

### 5.9 Etapy wdrożenia

1. **Zod schema walidacji**
   - Schema dla ID: `z.coerce.number().int().positive()`

2. **Rozszerzenie FridgeService**
   - Dodaj metodę `deleteFridgeItem(userId, itemId): Promise<void>`
   - DELETE query: WHERE id AND user_id
   - Sprawdź rowCount
   - Jeśli 0 → throw NotFoundError

3. **Endpoint handler**
   - W `src/pages/api/fridge/[id].ts` dodaj `DELETE`
   - Parse i waliduj params.id
   - Wywołaj service
   - Zwróć 204 No Content

4. **Testowanie**
   - Test usunięcia własnej pozycji (204)
   - Test pozycji innego użytkownika (404)
   - Test nieistniejącej pozycji (404)
   - Test nieprawidłowego ID (400)
   - Test bez autoryzacji (401)
   - Weryfikacja pustego body w response

---

## Podsumowanie implementacji Virtual Fridge API

### Struktura plików

```
src/
├── lib/
│   ├── services/
│   │   └── fridge.service.ts           # Logika biznesowa lodówki
│   ├── validations/
│   │   └── fridge.validation.ts        # Zod schemas
│   └── utils/
│       └── date.utils.ts                # Date helpers (expiry calculations)
└── pages/
    └── api/
        └── fridge/
            ├── index.ts                 # GET, POST /api/fridge
            └── [id].ts                  # GET, PATCH, DELETE /api/fridge/:id
```

### Kluczowe funkcjonalności

**Filtrowanie wg ważności:**

```typescript
// Expired products
WHERE expiry_date < CURRENT_DATE

// Not expired
WHERE expiry_date IS NULL OR expiry_date >= CURRENT_DATE

// Expiring soon (next N days)
WHERE expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '$N days'
```

**Transformacja danych:**

```typescript
function transformToFridgeItemDTO(row): FridgeItemDTO {
  return {
    id: row.id,
    product: {
      id: row.product_id,
      name: row.product_name,
    },
    quantity: row.quantity,
    unit: {
      id: row.unit_id,
      name: row.unit_name,
      abbreviation: row.unit_abbreviation,
    },
    expiry_date: row.expiry_date,
    created_at: row.created_at,
  };
}
```

**Date helpers:**

```typescript
function isExpired(expiryDate: string | null): boolean;
function isExpiringSoon(expiryDate: string | null, days: number): boolean;
function formatDate(date: Date): string; // ISO format
```

### Kolejność implementacji

1. Setup: Date utils, error classes (reuse from Products)
2. FridgeService: Wszystkie metody
3. Validation schemas: Zod schemas
4. Endpoints:
   - GET /api/fridge (list with filters)
   - POST /api/fridge (add)
   - GET /api/fridge/:id (get by id)
   - PATCH /api/fridge/:id (update)
   - DELETE /api/fridge/:id (delete)
   <!-- 5. Testing: Unit + integration tests -->

### Uwagi implementacyjne

- **JOIN optimization**: Zawsze łączymy products i units dla pełnych danych
- **Expiry date handling**: NULL oznacza brak daty ważności (produkt nie psujący się)
- **Quantity precision**: Używamy DECIMAL dla dokładności (np. 1.5 kg)
- **RLS security**: Automatyczna izolacja danych użytkowników
