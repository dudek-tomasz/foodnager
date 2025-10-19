# API Endpoints Implementation Plan: Products Management

## Spis treści
1. [GET /api/products - List Products](#1-get-apiproducts---list-products)
2. [GET /api/products/:id - Get Product by ID](#2-get-apiproductsid---get-product-by-id)
3. [POST /api/products - Create Product](#3-post-apiproducts---create-product)
4. [PATCH /api/products/:id - Update Product](#4-patch-apiproductsid---update-product)
5. [DELETE /api/products/:id - Delete Product](#5-delete-apiproductsid---delete-product)

---

## 1. GET /api/products - List Products

### 1.1 Przegląd punktu końcowego
Endpoint umożliwia pobieranie listy produktów dostępnych dla użytkownika. Zwraca zarówno produkty globalne (widoczne dla wszystkich) jak i prywatne produkty użytkownika. Obsługuje wyszukiwanie pełnotekstowe, filtrowanie według zakresu (scope) oraz paginację.

**Powiązane User Stories:** US-002 (Zarządzanie wirtualną lodówką)

### 1.2 Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/products`
- **Wymagane nagłówki:** `Authorization: Bearer {access_token}`

**Query Parameters:**
- **Opcjonalne:**
  - `search` (string) - Wyszukiwanie pełnotekstowe w nazwach produktów
  - `scope` (enum: `global`, `private`, `all`) - Filtrowanie według zakresu, domyślnie `all`
  - `page` (integer) - Numer strony, domyślnie `1`, minimum `1`
  - `limit` (integer) - Liczba elementów na stronę, domyślnie `20`, maximum `100`

**Przykładowe żądanie:**
```
GET /api/products?search=tomato&scope=all&page=1&limit=20
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.3 Wykorzystywane typy

**Query DTO:**
```typescript
ListProductsQueryDTO {
  search?: string;
  scope?: 'global' | 'private' | 'all';
  page?: number;
  limit?: number;
}
```

**Response DTOs:**
```typescript
ProductsListResponseDTO {
  data: ProductDTO[];
  pagination: PaginationMetaDTO;
}

ProductDTO {
  id: number;
  name: string;
  user_id: string | null;
  is_global: boolean;
  created_at: string;
}

PaginationMetaDTO {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}
```

### 1.4 Szczegóły odpowiedzi

**Sukces (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Tomato",
      "user_id": null,
      "is_global": true,
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 2,
      "name": "My Special Spice",
      "user_id": "uuid-string",
      "is_global": false,
      "created_at": "2025-10-18T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "total_pages": 8
  }
}
```

**Błędy:**
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `422 Unprocessable Entity` - Nieprawidłowe parametry zapytania

### 1.5 Przepływ danych

```
1. [Client] → GET /api/products?search=tomato&scope=all
2. [Middleware] → Walidacja tokenu JWT (Supabase Auth)
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Walidacja query parameters (Zod)
5. [Service] → ProductService.listProducts(userId, queryParams)
6. [Database] → Query z wykorzystaniem RLS:
   - Filtrowanie: WHERE (user_id IS NULL OR user_id = auth.uid())
   - Wyszukiwanie: ts_vector index na name
   - Scope filter: WHERE user_id IS NULL (global) | IS NOT NULL (private) | both (all)
   - Paginacja: LIMIT/OFFSET
7. [Service] → Transformacja wyników na ProductDTO (dodanie is_global)
8. [Service] → Obliczenie metadanych paginacji
9. [Handler] → Response 200 z ProductsListResponseDTO
```

### 1.6 Względy bezpieczeństwa

**Uwierzytelnianie:**
- Wymagany Bearer token z Supabase Auth
- Token walidowany przez middleware przed wykonaniem logiki

**Autoryzacja:**
- RLS Policy: Użytkownik widzi produkty globalne (user_id IS NULL) + swoje prywatne
- Policy automatycznie filtruje wyniki na poziomie bazy danych
- Middleware ustawia kontekst auth.uid() dla RLS

**Walidacja danych wejściowych:**
- Zod schema dla query parameters
- Sanityzacja search query (zapobieganie SQL injection przez parametryzowane zapytania)
- Walidacja zakresu wartości (page >= 1, limit <= 100)

**Data Exposure:**
- Nie zwracamy user_id innych użytkowników dla produktów globalnych (zawsze null w response)
- Produkty prywatne innych użytkowników są niewidoczne dzięki RLS

### 1.7 Obsługa błędów

| Scenariusz | Kod HTTP | Error Code | Akcja |
|------------|----------|------------|-------|
| Brak tokenu autoryzacji | 401 | UNAUTHORIZED | Zwróć komunikat o wymaganej autoryzacji |
| Nieprawidłowy/wygasły token | 401 | UNAUTHORIZED | Zwróć komunikat o nieprawidłowym tokenie |
| Nieprawidłowy scope value | 422 | VALIDATION_ERROR | Zwróć szczegóły walidacji: dopuszczalne wartości |
| page < 1 | 422 | VALIDATION_ERROR | Zwróć komunikat: page musi być >= 1 |
| limit > 100 | 422 | VALIDATION_ERROR | Zwróć komunikat: limit nie może przekraczać 100 |
| Błąd bazy danych | 500 | INTERNAL_ERROR | Loguj szczegóły, zwróć ogólny komunikat błędu |

**Format odpowiedzi błędu:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid query parameters",
    "details": {
      "scope": "Must be one of: global, private, all"
    }
  }
}
```

### 1.8 Wydajność

**Optymalizacje:**
- Wykorzystanie indeksu GIN dla full-text search: `to_tsvector('english', name)`
- Indeks na `products_lower_name_idx` dla case-insensitive search
- Indeks automatyczny na `user_id` (foreign key)
- Limit maksymalny 100 elementów zapobiega przeciążeniu

**Caching:**
- Cache produktów globalnych na 1 godzinę (rzadko się zmieniają)
- Cache key: `products:global:page:{page}:limit:{limit}:search:{search}`
- Produkty prywatne bez cache (częste zmiany)

**Query Optimization:**
- Użycie COUNT(*) OVER() dla total bez dodatkowego query
- Selective loading - tylko potrzebne kolumny

### 1.9 Etapy wdrożenia

1. **Utworzenie Zod schema walidacji**
   - Zdefiniuj schema dla ListProductsQueryDTO
   - Dodaj walidatory dla: scope enum, page >= 1, limit 1-100
   - Eksportuj schema z `src/lib/validations/products.ts`

2. **Utworzenie ProductService**
   - Utwórz `src/lib/services/products.service.ts`
   - Implementuj metodę `listProducts(userId: string, query: ListProductsQueryDTO)`
   - Zbuduj zapytanie SQL z warunkami:
     - Base: `WHERE (user_id IS NULL OR user_id = $userId)`
     - Scope filter: dodaj warunek dla global/private
     - Search: użyj `to_tsvector` dla full-text search
     - Pagination: LIMIT/OFFSET
   - Użyj `COUNT(*) OVER()` dla total count
   - Transformuj wyniki: dodaj `is_global: user_id === null`

3. **Utworzenie helper funkcji paginacji**
   - Utwórz `src/lib/utils/pagination.ts`
   - Implementuj `calculatePaginationMeta(page, limit, total)`
   - Zwraca PaginationMetaDTO

4. **Utworzenie endpoint handlera**
   - Utwórz `src/pages/api/products/index.ts`
   - Dodaj `export const prerender = false`
   - Implementuj funkcję `GET(context: APIContext)`
   - Pobierz supabase z `context.locals.supabase`
   - Pobierz user z `await supabase.auth.getUser()`
   - Waliduj query params przez Zod
   - Wywołaj ProductService.listProducts()
   - Zwróć Response z JSON (200) lub błędem

5. **Obsługa błędów**
   - Stwórz helper `src/lib/utils/api-response.ts`
   - Funkcje: `errorResponse(code, message, details?, status)`
   - Opakowuj service calls w try-catch
   - Loguj błędy przez console.error

6. **Testowanie**
   - Test bez autoryzacji (401)
   - Test z prawidłowymi parametrami (200)
   - Test search query
   - Test scope filtering (global, private, all)
   - Test paginacji (różne page/limit)
   - Test walidacji (nieprawidłowe parametry)

---

## 2. GET /api/products/:id - Get Product by ID

### 2.1 Przegląd punktu końcowego
Endpoint pobiera szczegółowe informacje o pojedynczym produkcie. Użytkownik może pobrać produkt globalny lub swój prywatny produkt. Dostęp do prywatnych produktów innych użytkowników jest zablokowany przez RLS.

**Powiązane User Stories:** US-002 (Zarządzanie wirtualną lodówką)

### 2.2 Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/products/:id`
- **Wymagane nagłówki:** `Authorization: Bearer {access_token}`

**URL Parameters:**
- **Wymagane:**
  - `id` (integer) - ID produktu

**Przykładowe żądanie:**
```
GET /api/products/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2.3 Wykorzystywane typy

**Response DTO:**
```typescript
ProductDTO {
  id: number;
  name: string;
  user_id: string | null;
  is_global: boolean;
  created_at: string;
}
```

### 2.4 Szczegóły odpowiedzi

**Sukces (200 OK):**
```json
{
  "id": 1,
  "name": "Tomato",
  "user_id": null,
  "is_global": true,
  "created_at": "2025-10-18T12:00:00Z"
}
```

**Błędy:**
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `404 Not Found` - Produkt nie istnieje lub nie jest dostępny dla użytkownika

### 2.5 Przepływ danych

```
1. [Client] → GET /api/products/123
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse ID z URL params
5. [Handler] → Walidacja ID (number, > 0)
6. [Service] → ProductService.getProductById(userId, productId)
7. [Database] → SELECT * FROM products WHERE id = $1 AND (user_id IS NULL OR user_id = $2)
8. [Service] → Jeśli brak wyniku → throw NotFoundError
9. [Service] → Transformacja na ProductDTO (dodanie is_global)
10. [Handler] → Response 200 z ProductDTO
```

### 2.6 Względy bezpieczeństwa

**Uwierzytelnianie:**
- Wymagany Bearer token z Supabase Auth

**Autoryzacja:**
- RLS Policy: `WHERE id = $id AND (user_id IS NULL OR user_id = auth.uid())`
- Zapobiega dostępowi do prywatnych produktów innych użytkowników
- Zwraca 404 zamiast 403 (information disclosure prevention)

**Walidacja:**
- Walidacja ID: musi być liczbą całkowitą > 0
- Parametryzowane zapytanie SQL

### 2.7 Obsługa błędów

| Scenariusz | Kod HTTP | Error Code | Akcja |
|------------|----------|------------|-------|
| Brak tokenu | 401 | UNAUTHORIZED | Zwróć komunikat o wymaganej autoryzacji |
| Nieprawidłowy token | 401 | UNAUTHORIZED | Zwróć komunikat o nieprawidłowym tokenie |
| Nieprawidłowy ID (nie-numeryczny) | 400 | VALIDATION_ERROR | Zwróć komunikat: ID must be a number |
| ID <= 0 | 400 | VALIDATION_ERROR | Zwróć komunikat: ID must be positive |
| Produkt nie istnieje | 404 | NOT_FOUND | Zwróć: Product not found |
| Produkt należy do innego użytkownika | 404 | NOT_FOUND | Zwróć: Product not found (nie ujawniaj istnienia) |
| Błąd bazy danych | 500 | INTERNAL_ERROR | Loguj, zwróć ogólny komunikat |

### 2.8 Wydajność

**Optymalizacje:**
- Zapytanie po PRIMARY KEY (id) - bardzo szybkie
- Indeks na user_id dla warunku OR

**Caching:**
- Cache produktów globalnych: `product:global:{id}` na 1 godzinę
- Produkty prywatne bez cache

### 2.9 Etapy wdrożenia

1. **Utworzenie Zod schema walidacji**
   - Schema dla ID z params: `z.coerce.number().int().positive()`

2. **Rozszerzenie ProductService**
   - Dodaj metodę `getProductById(userId: string, productId: number): Promise<ProductDTO>`
   - Query: `SELECT * FROM products WHERE id = $1 AND (user_id IS NULL OR user_id = $2)`
   - Jeśli brak wyniku: throw NotFoundError
   - Transformuj: dodaj is_global

3. **Utworzenie endpoint handlera**
   - Utwórz `src/pages/api/products/[id].ts`
   - Dodaj `export const prerender = false`
   - Implementuj `GET(context: APIContext)`
   - Parse `context.params.id`
   - Waliduj ID przez Zod
   - Wywołaj ProductService.getProductById()
   - Zwróć 200 z ProductDTO lub obsłuż błąd

4. **Custom error classes**
   - Utwórz `src/lib/errors/index.ts`
   - NotFoundError, ValidationError, UnauthorizedError
   - Error handler middleware mapujący na response

5. **Testowanie**
   - Test pobrania produktu globalnego (200)
   - Test pobrania własnego produktu prywatnego (200)
   - Test produktu innego użytkownika (404)
   - Test nieistniejącego produktu (404)
   - Test nieprawidłowego ID (400)
   - Test bez autoryzacji (401)

---

## 3. POST /api/products - Create Product

### 3.1 Przegląd punktu końcowego
Endpoint umożliwia utworzenie nowego prywatnego produktu przez użytkownika. Produkty prywatne są widoczne tylko dla ich twórcy. Nazwa produktu musi być unikalna (case-insensitive) w obrębie produktów użytkownika.

**Powiązane User Stories:** US-002 (Zarządzanie wirtualną lodówką)

### 3.2 Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/api/products`
- **Wymagane nagłówki:** 
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`

**Request Body:**
- **Wymagane:**
  - `name` (string) - Nazwa produktu, minimum 1 znak, trimmed

**Przykładowe żądanie:**
```json
POST /api/products
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "My Custom Product"
}
```

### 3.3 Wykorzystywane typy

**Request DTO:**
```typescript
CreateProductDTO {
  name: string;
}
```

**Response DTO:**
```typescript
ProductDTO {
  id: number;
  name: string;
  user_id: string;
  is_global: false;
  created_at: string;
}
```

### 3.4 Szczegóły odpowiedzi

**Sukces (201 Created):**
```json
{
  "id": 123,
  "name": "My Custom Product",
  "user_id": "uuid-string",
  "is_global": false,
  "created_at": "2025-10-18T12:00:00Z"
}
```

**Błędy:**
- `400 Bad Request` - Nieprawidłowe dane wejściowe (brak name, pusta wartość)
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `409 Conflict` - Produkt o takiej nazwie już istnieje (case-insensitive)

### 3.5 Przepływ danych

```
1. [Client] → POST /api/products {name: "My Product"}
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse request body (JSON)
5. [Handler] → Walidacja body przez Zod schema
6. [Service] → ProductService.createProduct(userId, createDto)
7. [Service] → Sprawdź unikalność: SELECT WHERE LOWER(name) = LOWER($name) AND user_id = $userId
8. [Service] → Jeśli istnieje → throw ConflictError
9. [Database] → INSERT INTO products (user_id, name) VALUES ($1, $2) RETURNING *
10. [Service] → Transformacja na ProductDTO
11. [Handler] → Response 201 z ProductDTO
```

### 3.6 Względy bezpieczeństwa

**Uwierzytelnianie:**
- Wymagany Bearer token z Supabase Auth

**Autoryzacja:**
- RLS Policy dla INSERT: `WITH CHECK (auth.uid() = user_id)`
- user_id jest automatycznie ustawiany na auth.uid()
- Użytkownik nie może utworzyć produktu dla innego użytkownika

**Walidacja:**
- Trim whitespace z name
- Minimalna długość name: 1 znak (po trim)
- Maksymalna długość: 255 znaków
- Case-insensitive uniqueness check
- Sanityzacja input przed zapisem

**SQL Injection Prevention:**
- Parametryzowane zapytania
- Walidacja przez Zod przed query

### 3.7 Obsługa błędów

| Scenariusz | Kod HTTP | Error Code | Akcja |
|------------|----------|------------|-------|
| Brak tokenu | 401 | UNAUTHORIZED | Zwróć komunikat o wymaganej autoryzacji |
| Nieprawidłowy token | 401 | UNAUTHORIZED | Zwróć komunikat o nieprawidłowym tokenie |
| Brak pola name | 400 | VALIDATION_ERROR | Zwróć: name is required |
| Puste name (po trim) | 400 | VALIDATION_ERROR | Zwróć: name cannot be empty |
| name > 255 znaków | 400 | VALIDATION_ERROR | Zwróć: name too long (max 255) |
| Duplikat nazwy (case-insensitive) | 409 | CONFLICT | Zwróć: Product with this name already exists |
| Invalid JSON | 400 | VALIDATION_ERROR | Zwróć: Invalid request body |
| Błąd bazy danych | 500 | INTERNAL_ERROR | Loguj szczegóły, zwróć ogólny komunikat |

**Przykład odpowiedzi błędu:**
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Product with this name already exists",
    "details": {
      "field": "name",
      "value": "my custom product"
    }
  }
}
```

### 3.8 Wydajność

**Optymalizacje:**
- Użycie indeksu `products_lower_name_idx` dla sprawdzenia unikalności
- Transakcja database dla check + insert (atomowość)

**Potencjalne problemy:**
- Race condition przy równoczesnych utworzeniach (rozwiązane przez UNIQUE constraint + transaction)

### 3.9 Etapy wdrożenia

1. **Utworzenie Zod schema walidacji**
   - Schema dla CreateProductDTO:
   ```typescript
   z.object({
     name: z.string().trim().min(1).max(255)
   })
   ```

2. **Rozszerzenie ProductService**
   - Dodaj metodę `createProduct(userId: string, data: CreateProductDTO): Promise<ProductDTO>`
   - Implementuj sprawdzenie unikalności:
     ```sql
     SELECT id FROM products 
     WHERE LOWER(name) = LOWER($1) AND user_id = $2
     ```
   - Jeśli istnieje → throw ConflictError
   - INSERT query z RETURNING *
   - Transformuj na ProductDTO

3. **Aktualizacja endpoint handlera**
   - W `src/pages/api/products/index.ts` dodaj funkcję `POST`
   - Parse request body: `await context.request.json()`
   - Waliduj przez Zod schema
   - Wywołaj ProductService.createProduct()
   - Zwróć Response z status 201 i Location header

4. **Location header**
   - Dodaj header: `Location: /api/products/{newId}`

5. **Error handling**
   - Catch ConflictError → 409
   - Catch ValidationError → 400
   - Catch inne → 500

6. **Testowanie**
   - Test utworzenia produktu (201)
   - Test duplikatu case-insensitive (409)
   - Test bez name (400)
   - Test z pustym name (400)
   - Test z za długim name (400)
   - Test bez autoryzacji (401)
   - Test Location header w response

---

## 4. PATCH /api/products/:id - Update Product

### 4.1 Przegląd punktu końcowego
Endpoint umożliwia aktualizację nazwy prywatnego produktu użytkownika. Użytkownik może modyfikować tylko swoje prywatne produkty. Produkty globalne nie mogą być modyfikowane przez użytkowników.

**Powiązane User Stories:** US-002 (Zarządzanie wirtualną lodówką)

### 4.2 Szczegóły żądania

- **Metoda HTTP:** `PATCH`
- **Struktura URL:** `/api/products/:id`
- **Wymagane nagłówki:**
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`

**URL Parameters:**
- **Wymagane:**
  - `id` (integer) - ID produktu do aktualizacji

**Request Body:**
- **Opcjonalne (ale wymagane przynajmniej jedno):**
  - `name` (string) - Nowa nazwa produktu

**Przykładowe żądanie:**
```json
PATCH /api/products/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "Updated Product Name"
}
```

### 4.3 Wykorzystywane typy

**Request DTO:**
```typescript
UpdateProductDTO {
  name?: string;
}
```

**Response DTO:**
```typescript
ProductDTO {
  id: number;
  name: string;
  user_id: string;
  is_global: false;
  created_at: string;
}
```

### 4.4 Szczegóły odpowiedzi

**Sukces (200 OK):**
```json
{
  "id": 123,
  "name": "Updated Product Name",
  "user_id": "uuid-string",
  "is_global": false,
  "created_at": "2025-10-18T12:00:00Z"
}
```

**Błędy:**
- `400 Bad Request` - Nieprawidłowe dane (puste body, nieprawidłowa nazwa)
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `403 Forbidden` - Próba modyfikacji produktu globalnego
- `404 Not Found` - Produkt nie istnieje lub nie należy do użytkownika
- `409 Conflict` - Nowa nazwa już istnieje

### 4.5 Przepływ danych

```
1. [Client] → PATCH /api/products/123 {name: "New Name"}
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse ID z params + body z request
5. [Handler] → Walidacja przez Zod
6. [Service] → ProductService.updateProduct(userId, productId, updateDto)
7. [Service] → Pobierz istniejący produkt: SELECT WHERE id = $1 AND user_id = $2
8. [Service] → Jeśli brak → throw NotFoundError
9. [Service] → Jeśli user_id IS NULL → throw ForbiddenError (global product)
10. [Service] → Sprawdź unikalność nowej nazwy (jeśli zmieniona)
11. [Database] → UPDATE products SET name = $1 WHERE id = $2 AND user_id = $3 RETURNING *
12. [Service] → Transformacja na ProductDTO
13. [Handler] → Response 200 z ProductDTO
```

### 4.6 Względy bezpieczeństwa

**Uwierzytelnianie:**
- Wymagany Bearer token z Supabase Auth

**Autoryzacja:**
- RLS Policy dla UPDATE: `USING (auth.uid() = user_id)`
- Sprawdzenie, czy user_id IS NOT NULL (blokada global products)
- Użytkownik może modyfikować tylko swoje produkty

**Walidacja:**
- Walidacja ID produktu
- Trim i walidacja nowej nazwy
- Case-insensitive uniqueness check
- Wymóg przynajmniej jednego pola w body

**Audit:**
- Log akcji modyfikacji (opcjonalnie)

### 4.7 Obsługa błędów

| Scenariusz | Kod HTTP | Error Code | Akcja |
|------------|----------|------------|-------|
| Brak tokenu | 401 | UNAUTHORIZED | Zwróć komunikat o wymaganej autoryzacji |
| Nieprawidłowy token | 401 | UNAUTHORIZED | Zwróć komunikat o nieprawidłowym tokenie |
| Nieprawidłowy ID | 400 | VALIDATION_ERROR | Zwróć: Invalid product ID |
| Puste body | 400 | VALIDATION_ERROR | Zwróć: At least one field required |
| Nieprawidłowa nazwa | 400 | VALIDATION_ERROR | Zwróć szczegóły walidacji |
| Produkt nie istnieje | 404 | NOT_FOUND | Zwróć: Product not found |
| Produkt innego użytkownika | 404 | NOT_FOUND | Zwróć: Product not found |
| Produkt globalny | 403 | FORBIDDEN | Zwróć: Cannot modify global products |
| Duplikat nazwy | 409 | CONFLICT | Zwróć: Product name already exists |
| Błąd bazy danych | 500 | INTERNAL_ERROR | Loguj, zwróć ogólny komunikat |

### 4.8 Wydajność

**Optymalizacje:**
- Zapytanie WHERE id + user_id używa indeksów
- Sprawdzenie unikalności tylko gdy nazwa się zmienia
- Pojedyncza transakcja dla check + update

**Cache invalidation:**
- Usuń cache dla `product:user:{userId}:*` po aktualizacji

### 4.9 Etapy wdrożenia

1. **Utworzenie Zod schema walidacji**
   - Schema dla UpdateProductDTO:
   ```typescript
   z.object({
     name: z.string().trim().min(1).max(255).optional()
   }).refine(data => Object.keys(data).length > 0, {
     message: "At least one field is required"
   })
   ```

2. **Rozszerzenie ProductService**
   - Dodaj metodę `updateProduct(userId, productId, data): Promise<ProductDTO>`
   - SELECT produktu z WHERE id AND user_id
   - Sprawdź user_id IS NOT NULL (nie global)
   - Jeśli name się zmienia: sprawdź unikalność
   - UPDATE z RETURNING *
   - Transformuj na ProductDTO

3. **Aktualizacja endpoint handlera**
   - W `src/pages/api/products/[id].ts` dodaj funkcję `PATCH`
   - Parse params.id i request body
   - Waliduj przez Zod
   - Wywołaj ProductService.updateProduct()
   - Zwróć 200 z ProductDTO

4. **Custom error dla Forbidden**
   - Dodaj ForbiddenError do error classes
   - Handler mapuje na 403

5. **Testowanie**
   - Test aktualizacji własnego produktu (200)
   - Test produktu innego użytkownika (404)
   - Test produktu globalnego (403)
   - Test nieistniejącego produktu (404)
   - Test duplikatu nazwy (409)
   - Test pustego body (400)
   - Test nieprawidłowej nazwy (400)
   - Test bez autoryzacji (401)

---

## 5. DELETE /api/products/:id - Delete Product

### 5.1 Przegląd punktu końcowego
Endpoint umożliwia usunięcie prywatnego produktu użytkownika. Użytkownik może usuwać tylko swoje prywatne produkty. Produkty globalne nie mogą być usuwane. Operacja jest trwała - usunięty produkt zostaje również usunięty z powiązanych zasobów (CASCADE).

**Powiązane User Stories:** US-002 (Zarządzanie wirtualną lodówką)

### 5.2 Szczegóły żądania

- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/api/products/:id`
- **Wymagane nagłówki:** `Authorization: Bearer {access_token}`

**URL Parameters:**
- **Wymagane:**
  - `id` (integer) - ID produktu do usunięcia

**Przykładowe żądanie:**
```
DELETE /api/products/123
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 5.3 Wykorzystywane typy

Brak body w request i response (204 No Content).

### 5.4 Szczegóły odpowiedzi

**Sukces (204 No Content):**
- Puste body
- Status 204 oznacza, że operacja się powiodła

**Błędy:**
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `403 Forbidden` - Próba usunięcia produktu globalnego
- `404 Not Found` - Produkt nie istnieje lub nie należy do użytkownika

### 5.5 Przepływ danych

```
1. [Client] → DELETE /api/products/123
2. [Middleware] → Walidacja tokenu JWT
3. [Middleware] → Pobranie user_id z auth.uid()
4. [Handler] → Parse ID z params
5. [Handler] → Walidacja ID
6. [Service] → ProductService.deleteProduct(userId, productId)
7. [Service] → Pobierz produkt: SELECT WHERE id = $1 AND user_id = $2
8. [Service] → Jeśli brak → throw NotFoundError
9. [Service] → Jeśli user_id IS NULL → throw ForbiddenError
10. [Database] → DELETE FROM products WHERE id = $1 AND user_id = $2
11. [Database] → CASCADE: usuń powiązane user_products, recipe_ingredients
12. [Handler] → Response 204 No Content
```

### 5.6 Względy bezpieczeństwa

**Uwierzytelnianie:**
- Wymagany Bearer token z Supabase Auth

**Autoryzacja:**
- RLS Policy dla DELETE: `USING (auth.uid() = user_id)`
- Sprawdzenie user_id IS NOT NULL (blokada global products)
- Użytkownik może usuwać tylko swoje produkty

**Cascade Effects:**
- DELETE CASCADE automatycznie usuwa:
  - user_products (pozycje w lodówkach)
  - recipe_ingredients (składniki w przepisach)
- Użytkownik powinien być o tym poinformowany (opcjonalnie: sprawdzenie przed usunięciem)

**Walidacja:**
- Walidacja ID produktu

### 5.7 Obsługa błędów

| Scenariusz | Kod HTTP | Error Code | Akcja |
|------------|----------|------------|-------|
| Brak tokenu | 401 | UNAUTHORIZED | Zwróć komunikat o wymaganej autoryzacji |
| Nieprawidłowy token | 401 | UNAUTHORIZED | Zwróć komunikat o nieprawidłowym tokenie |
| Nieprawidłowy ID | 400 | VALIDATION_ERROR | Zwróć: Invalid product ID |
| Produkt nie istnieje | 404 | NOT_FOUND | Zwróć: Product not found |
| Produkt innego użytkownika | 404 | NOT_FOUND | Zwróć: Product not found |
| Produkt globalny | 403 | FORBIDDEN | Zwróć: Cannot delete global products |
| Błąd bazy danych | 500 | INTERNAL_ERROR | Loguj, zwróć ogólny komunikat |

**Format odpowiedzi błędu (nie dla 204):**
```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Cannot delete global products",
    "details": {
      "product_id": 123,
      "is_global": true
    }
  }
}
```

### 5.8 Wydajność

**Optymalizacje:**
- DELETE WHERE id + user_id używa indeksów
- CASCADE jest efektywnie obsługiwane przez PostgreSQL

**Monitoring:**
- Log liczby usuniętych powiązanych rekordów
- Alert przy masowym usuwaniu

**Considerations:**
- Jeśli produkt jest używany w wielu przepisach: rozważ soft delete lub warning
- Opcjonalnie: sprawdzenie użycia przed usunięciem

### 5.9 Etapy wdrożenia

1. **Zod schema walidacji**
   - Schema dla ID: `z.coerce.number().int().positive()`

2. **Rozszerzenie ProductService**
   - Dodaj metodę `deleteProduct(userId, productId): Promise<void>`
   - SELECT produktu: WHERE id AND user_id
   - Sprawdź user_id IS NOT NULL
   - Opcjonalnie: sprawdź usage count
   - DELETE query
   - Return void (lub count usuniętych)

3. **Aktualizacja endpoint handlera**
   - W `src/pages/api/products/[id].ts` dodaj funkcję `DELETE`
   - Parse i waliduj params.id
   - Wywołaj ProductService.deleteProduct()
   - Zwróć Response z status 204 (no body)

4. **Opcjonalne: Usage check**
   - Przed usunięciem sprawdź:
   ```sql
   SELECT 
     (SELECT COUNT(*) FROM user_products WHERE product_id = $1) as fridge_count,
     (SELECT COUNT(*) FROM recipe_ingredients WHERE product_id = $1) as recipe_count
   ```
   - Jeśli > 0: zwróć warning lub zapobiegaj usunięciu

5. **Testowanie**
   - Test usunięcia własnego produktu (204)
   - Test produktu innego użytkownika (404)
   - Test produktu globalnego (403)
   - Test nieistniejącego produktu (404)
   - Test cascade: sprawdź usunięcie powiązanych rekordów
   - Test bez autoryzacji (401)
   - Weryfikacja pustego body w response 204

---

## Podsumowanie implementacji Products API

### Struktura plików
```
src/
├── lib/
│   ├── services/
│   │   └── products.service.ts          # Logika biznesowa produktów
│   ├── validations/
│   │   └── products.validation.ts       # Zod schemas
│   ├── errors/
│   │   └── index.ts                     # Custom error classes
│   └── utils/
│       ├── api-response.ts              # Response helpers
│       └── pagination.ts                # Pagination utils
└── pages/
    └── api/
        └── products/
            ├── index.ts                 # GET, POST /api/products
            └── [id].ts                  # GET, PATCH, DELETE /api/products/:id
```

### Wspólne komponenty

**Error Classes:**
```typescript
class NotFoundError extends Error
class ConflictError extends Error
class ForbiddenError extends Error
class ValidationError extends Error
class UnauthorizedError extends Error
```

**Response Helpers:**
```typescript
function successResponse<T>(data: T, status = 200): Response
function errorResponse(code: string, message: string, details?, status): Response
```

**Middleware:**
- Auth middleware (weryfikacja JWT) - wbudowane w Astro przez locals.supabase
- Error handler middleware

### Kolejność implementacji
1. Setup: Error classes, response helpers, pagination utils
2. ProductService: Wszystkie metody
3. Validation schemas: Zod schemas dla wszystkich endpointów
4. Endpoints: 
   - GET /api/products (list)
   - POST /api/products (create)
   - GET /api/products/:id (get by id)
   - PATCH /api/products/:id (update)
   - DELETE /api/products/:id (delete)
<!-- 5. Testing: Unit tests dla service, integration tests dla endpoints -->

