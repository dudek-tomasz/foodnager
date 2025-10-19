# API Endpoints Implementation Plan: Tags Dictionary

## Spis treści
1. [GET /api/tags - List Tags](#1-get-apitags---list-tags)
2. [POST /api/tags - Create Tag](#2-post-apitags---create-tag)

---

## 1. GET /api/tags - List Tags

### 1.1 Przegląd punktu końcowego
Endpoint pobiera listę wszystkich dostępnych tagów (kategorii) przepisów w systemie. Tagi są globalne (widoczne dla wszystkich użytkowników) i służą do kategoryzacji przepisów (np. "vegetarian", "quick meal", "dessert"). Endpoint obsługuje opcjonalne wyszukiwanie.

**Powiązane User Stories:** US-003 (Zarządzanie przepisami), kategoryzacja

### 1.2 Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/tags`
- **Wymagane nagłówki:** `Authorization: Bearer {access_token}`

**Query Parameters:**
- **Opcjonalne:**
  - `search` (string) - Wyszukiwanie w nazwach tagów (case-insensitive)

**Przykładowe żądania:**
```
GET /api/tags
GET /api/tags?search=veg
```

### 1.3 Wykorzystywane typy

**Query DTO:**
```typescript
ListTagsQueryDTO {
  search?: string;
}
```

**Response DTO:**
```typescript
TagsListResponseDTO {
  data: TagDTO[];
}

TagDTO {
  id: number;
  name: string;
  created_at: string;
}
```

### 1.4 Szczegóły odpowiedzi

**Sukces (200 OK) - All tags:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "vegetarian",
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 2,
      "name": "vegan",
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 3,
      "name": "quick meal",
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 4,
      "name": "dessert",
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 5,
      "name": "gluten-free",
      "created_at": "2025-10-18T12:00:00Z"
    }
  ]
}
```

**Sukces (200 OK) - With search:**
```json
{
  "data": [
    {
      "id": 1,
      "name": "vegetarian",
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 2,
      "name": "vegan",
      "created_at": "2025-10-18T12:00:00Z"
    }
  ]
}
```

**Błędy:**
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `422 Unprocessable Entity` - Nieprawidłowe parametry zapytania

### 1.5 Przepływ danych

```
1. [Client] → GET /api/tags?search=veg
2. [Middleware] → Walidacja tokenu JWT
3. [Handler] → Parse query parameters
4. [Handler] → Walidacja przez Zod
5. [Handler] → Build cache key (include search param)
6. [Handler] → Check cache
7. [Handler] → If cache HIT → return cached data
8. [Service] → TagsService.listTags(search?)
9. [Database] → Query z opcjonalnym ILIKE:
   SELECT id, name, created_at
   FROM tags
   WHERE ($search IS NULL OR name ILIKE '%' || $search || '%')
   ORDER BY name ASC
10. [Service] → Transformacja na TagDTO[]
11. [Handler] → Cache result (TTL: 10 minutes)
12. [Handler] → Response 200 z TagsListResponseDTO
```

### 1.6 Względy bezpieczeństwa

**Uwierzytelnianie:**
- Wymagany Bearer token

**Autoryzacja:**
- Brak RLS (dane globalne)
- Każdy authenticated user może czytać

**Walidacja:**
- Sanityzacja search query (ILIKE z parametryzacją)
- Trim whitespace

**Data Exposure:**
- Dane publiczne (global dictionary)
- Brak wrażliwych informacji

### 1.7 Obsługa błędów

| Scenariusz | Kod HTTP | Error Code | Akcja |
|------------|----------|------------|-------|
| Brak tokenu | 401 | UNAUTHORIZED | Zwróć komunikat o wymaganej autoryzacji |
| Nieprawidłowy token | 401 | UNAUTHORIZED | Zwróć komunikat o nieprawidłowym tokenie |
| Search string za długi | 422 | VALIDATION_ERROR | Zwróć: Search query too long (max 50 chars) |
| Błąd bazy danych | 500 | INTERNAL_ERROR | Loguj, zwróć ogólny komunikat |

### 1.8 Wydajność

**Optymalizacje:**
- **Caching**: Cache per search query (10 minut TTL)
- **Simple query**: Szybkie ILIKE na indexed column
- **Small dataset**: Typowo 20-50 tagów
- **No pagination**: Dataset mały enough

**Caching Strategy:**
```typescript
const cacheKey = search 
  ? `tags:search:${search.toLowerCase()}`
  : 'tags:all';
const CACHE_TTL = 600; // 10 minutes

const cached = await cache.get(cacheKey);
if (cached) return cached;

const tags = await db.query(...);
await cache.set(cacheKey, tags, CACHE_TTL);
```

**Cache Invalidation:**
- Invalidacja przy: POST nowego taga
- Invaliduj wszystkie keys starting with `tags:`

### 1.9 Etapy wdrożenia

1. **Zod schema walidacji**
   ```typescript
   z.object({
     search: z.string().trim().max(50).optional()
   })
   ```

2. **TagsService - List Method**
   ```typescript
   class TagsService {
     async listTags(search?: string): Promise<TagDTO[]> {
       const { rows } = await this.db.query(`
         SELECT id, name, created_at
         FROM tags
         WHERE ($1::text IS NULL OR name ILIKE '%' || $1 || '%')
         ORDER BY name ASC
       `, [search || null]);
       
       return rows.map(row => ({
         id: row.id,
         name: row.name,
         created_at: row.created_at
       }));
     }
   }
   ```

3. **Endpoint handler**
   ```typescript
   // src/pages/api/tags/index.ts
   
   export const prerender = false;
   
   export async function GET(context: APIContext) {
     try {
       // Auth
       const supabase = context.locals.supabase;
       const { data: { user }, error: authError } = await supabase.auth.getUser();
       
       if (authError || !user) {
         return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401);
       }
       
       // Parse and validate
       const url = new URL(context.request.url);
       const search = url.searchParams.get('search') || undefined;
       const validatedQuery = ListTagsQuerySchema.parse({ search });
       
       // Cache check
       const cacheKey = validatedQuery.search
         ? `tags:search:${validatedQuery.search.toLowerCase()}`
         : 'tags:all';
       
       const cached = await cache.get<TagsListResponseDTO>(cacheKey);
       if (cached) {
         return new Response(JSON.stringify(cached), {
           status: 200,
           headers: {
             'Content-Type': 'application/json',
             'X-Cache': 'HIT'
           }
         });
       }
       
       // Fetch from DB
       const tagsService = new TagsService(supabase);
       const tags = await tagsService.listTags(validatedQuery.search);
       
       const response: TagsListResponseDTO = { data: tags };
       
       // Cache
       await cache.set(cacheKey, response, 600); // 10 min
       
       return new Response(JSON.stringify(response), {
         status: 200,
         headers: {
           'Content-Type': 'application/json',
           'X-Cache': 'MISS'
         }
       });
       
     } catch (error) {
       if (error.name === 'ZodError') {
         return errorResponse(
           'VALIDATION_ERROR',
           'Invalid query parameters',
           { errors: error.errors },
           422
         );
       }
       
       console.error('Tags list error:', error);
       return errorResponse('INTERNAL_ERROR', 'Failed to fetch tags', null, 500);
     }
   }
   ```

4. **Testowanie**
   - Test all tags (200)
   - Test search (200)
   - Test search case-insensitive
   - Test search empty results (200 with empty array)
   - Test cache hit/miss
   - Test auth required (401)
   - Test search too long (422)

---

## 2. POST /api/tags - Create Tag

### 2.1 Przegląd punktu końcowego
Endpoint tworzy nowy tag w systemie. Tagi są globalne (dostępne dla wszystkich użytkowników), więc każdy authenticated user może dodawać nowe tagi. Nazwa taga musi być unikalna (case-insensitive).

**Powiązane User Stories:** US-003 (rozszerzenie), community-driven tagging

### 2.2 Szczegóły żądania

- **Metoda HTTP:** `POST`
- **Struktura URL:** `/api/tags`
- **Wymagane nagłówki:**
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`

**Request Body:**
- **Wymagane:**
  - `name` (string) - Nazwa taga, min 2 znaki, max 50, unique (case-insensitive)

**Przykładowe żądanie:**
```json
POST /api/tags
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "gluten-free"
}
```

### 2.3 Wykorzystywane typy

**Request DTO:**
```typescript
CreateTagDTO {
  name: string;
}
```

**Response DTO:**
```typescript
TagDTO {
  id: number;
  name: string;
  created_at: string;
}
```

### 2.4 Szczegóły odpowiedzi

**Sukces (201 Created):**
```json
{
  "id": 10,
  "name": "gluten-free",
  "created_at": "2025-10-18T12:00:00Z"
}
```

**Błędy:**
- `400 Bad Request` - Nieprawidłowe dane (puste name, za krótkie)
- `401 Unauthorized` - Brak lub nieprawidłowy token
- `409 Conflict` - Tag o takiej nazwie już istnieje

### 2.5 Przepływ danych

```
1. [Client] → POST /api/tags {name: "gluten-free"}
2. [Middleware] → Walidacja tokenu JWT
3. [Handler] → Parse request body
4. [Handler] → Walidacja przez Zod
5. [Service] → TagsService.createTag(name)
6. [Service] → Sprawdź unikalność (case-insensitive):
   SELECT id FROM tags WHERE LOWER(name) = LOWER($name)
7. [Service] → Jeśli istnieje → throw ConflictError
8. [Database] → INSERT INTO tags (name) VALUES ($name) RETURNING *
9. [Service] → Transformacja na TagDTO
10. [Handler] → Invalidate cache (wszystkie keys: tags:*)
11. [Handler] → Response 201 z Location header
```

### 2.6 Względy bezpieczeństwa

**Uwierzytelnianie:**
- Wymagany Bearer token

**Autoryzacja:**
- Każdy authenticated user może tworzyć tagi (community-driven)
- **Alternative**: Tylko admini mogą tworzyć tagi (stricter control)

**Walidacja:**
- Trim whitespace
- Min length: 2 znaki
- Max length: 50 znaków
- Case-insensitive uniqueness check
- Lowercase normalizacja (optional): wszystkie tagi małe litery

**Input Sanitization:**
- Trim
- Remove multiple spaces
- Lowercase (optional, ale zalecane dla consistency)

**Rate Limiting:**
- Opcjonalnie: limit tworzenia tagów (np. 10 per hour per user)
- Zapobiega spam

### 2.7 Obsługa błędów

| Scenariusz | Kod HTTP | Error Code | Akcja |
|------------|----------|------------|-------|
| Brak tokenu | 401 | UNAUTHORIZED | Zwróć komunikat o wymaganej autoryzacji |
| Nieprawidłowy token | 401 | UNAUTHORIZED | Zwróć komunikat o nieprawidłowym tokenie |
| Brak name | 400 | VALIDATION_ERROR | Zwróć: name is required |
| name < 2 znaki | 400 | VALIDATION_ERROR | Zwróć: name must be at least 2 characters |
| name > 50 znaków | 400 | VALIDATION_ERROR | Zwróć: name too long (max 50) |
| Duplikat nazwy | 409 | CONFLICT | Zwróć: Tag with this name already exists |
| Invalid JSON | 400 | VALIDATION_ERROR | Zwróć: Invalid request body |
| Błąd bazy danych | 500 | INTERNAL_ERROR | Loguj, zwróć ogólny komunikat |

**Przykład odpowiedzi błędu:**
```json
{
  "error": {
    "code": "CONFLICT",
    "message": "Tag with this name already exists",
    "details": {
      "field": "name",
      "value": "gluten-free"
    }
  }
}
```

### 2.8 Wydajność

**Optymalizacje:**
- Uniqueness check używa indexed column (LOWER(name))
- INSERT jest szybki (single row)
- Cache invalidation po utworzeniu

**Cache Invalidation:**
```typescript
// Invalidate all tag caches
await cache.deletePattern('tags:*');
// Or more specific:
await cache.delete('tags:all');
// Keep search caches temporarily (will expire naturally)
```

### 2.9 Etapy wdrożenia

1. **Zod schema walidacji**
   ```typescript
   z.object({
     name: z.string()
       .trim()
       .min(2, 'Tag name must be at least 2 characters')
       .max(50, 'Tag name too long (max 50 characters)')
       .transform(val => val.toLowerCase()) // Normalize to lowercase
   })
   ```

2. **TagsService - Create Method**
   ```typescript
   class TagsService {
     async createTag(name: string): Promise<TagDTO> {
       // Check uniqueness (case-insensitive)
       const existing = await this.db.query(`
         SELECT id FROM tags
         WHERE LOWER(name) = LOWER($1)
       `, [name]);
       
       if (existing.rows.length > 0) {
         throw new ConflictError('Tag with this name already exists');
       }
       
       // Insert new tag
       const { rows } = await this.db.query(`
         INSERT INTO tags (name)
         VALUES ($1)
         RETURNING id, name, created_at
       `, [name]);
       
       return {
         id: rows[0].id,
         name: rows[0].name,
         created_at: rows[0].created_at
       };
     }
   }
   ```

3. **Endpoint handler**
   ```typescript
   // src/pages/api/tags/index.ts
   
   export async function POST(context: APIContext) {
     try {
       // Auth
       const supabase = context.locals.supabase;
       const { data: { user }, error: authError } = await supabase.auth.getUser();
       
       if (authError || !user) {
         return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401);
       }
       
       // Parse and validate
       const body = await context.request.json();
       const validatedData = CreateTagSchema.parse(body);
       
       // Create tag
       const tagsService = new TagsService(supabase);
       const tag = await tagsService.createTag(validatedData.name);
       
       // Invalidate cache
       await cache.deletePattern('tags:*');
       
       // Return with Location header
       return new Response(JSON.stringify(tag), {
         status: 201,
         headers: {
           'Content-Type': 'application/json',
           'Location': `/api/tags/${tag.id}`
         }
       });
       
     } catch (error) {
       if (error instanceof ConflictError) {
         return errorResponse(
           'CONFLICT',
           error.message,
           { field: 'name' },
           409
         );
       }
       
       if (error.name === 'ZodError') {
         return errorResponse(
           'VALIDATION_ERROR',
           'Invalid request data',
           { errors: error.errors },
           400
         );
       }
       
       console.error('Tag creation error:', error);
       return errorResponse('INTERNAL_ERROR', 'Failed to create tag', null, 500);
     }
   }
   ```

4. **Testowanie**
   - Test utworzenia taga (201)
   - Test duplikatu case-insensitive (409)
   - Test bez name (400)
   - Test za krótkiego name (400)
   - Test za długiego name (400)
   - Test cache invalidation (GET tags after POST)
   - Test Location header
   - Test bez autoryzacji (401)
   - Test lowercase normalizacji

### 2.10 Seed Data

**Initial Tags (Migration)**
```sql
-- supabase/migrations/xxx_seed_tags.sql

INSERT INTO tags (name) VALUES
  ('vegetarian'),
  ('vegan'),
  ('gluten-free'),
  ('dairy-free'),
  ('low-carb'),
  ('keto'),
  ('paleo'),
  ('quick meal'),
  ('under 30 minutes'),
  ('one-pot'),
  ('slow cooker'),
  ('instant pot'),
  ('no-cook'),
  ('breakfast'),
  ('lunch'),
  ('dinner'),
  ('snack'),
  ('dessert'),
  ('appetizer'),
  ('soup'),
  ('salad'),
  ('pasta'),
  ('rice'),
  ('chicken'),
  ('beef'),
  ('pork'),
  ('fish'),
  ('seafood'),
  ('italian'),
  ('asian'),
  ('mexican'),
  ('indian'),
  ('mediterranean'),
  ('american')
ON CONFLICT (name) DO NOTHING;
```

### 2.11 Future Enhancements

**Tag Management:**
```typescript
// PATCH /api/tags/:id - Update tag (admin only)
// DELETE /api/tags/:id - Delete tag (admin only, if not used)
// GET /api/tags/:id/recipes - Get recipes with this tag
```

**Tag Usage Statistics:**
```typescript
// GET /api/tags/popular - Most used tags
{
  "data": [
    { "id": 1, "name": "vegetarian", "recipe_count": 45 },
    { "id": 2, "name": "quick meal", "recipe_count": 38 },
    ...
  ]
}
```

**Tag Suggestions:**
```typescript
// AI-powered tag suggestions when creating recipe
// Based on ingredients, instructions, title
```

**Tag Hierarchies (Advanced):**
```typescript
// Parent-child relationships
// "vegetarian" is parent of "vegan"
// "italian" is parent of "pasta"
```

---

## Podsumowanie implementacji Tags API

### Struktura plików
```
src/
├── lib/
│   ├── services/
│   │   └── tags.service.ts               # Service
│   └── validations/
│       └── tags.validation.ts            # Zod schemas
└── pages/
    └── api/
        └── tags/
            └── index.ts                   # GET, POST
```

### Kluczowe cechy

- **Community-Driven**: Każdy user może dodawać tagi
- **Case-Insensitive**: Duplikaty są wykrywane niezależnie od wielkości liter
- **Normalized**: Wszystkie tagi lowercase (consistency)
- **Cached**: Szybkie odczyty dzięki cache
- **Validated**: Strict validation (length, uniqueness)

### Business Rules

1. **Uniqueness**: Case-insensitive unique names
2. **Normalization**: Store as lowercase
3. **Validation**: 2-50 characters
4. **Public**: Wszystkie tagi są publiczne (global)
5. **Immutable**: Po utworzeniu nazwa nie może być zmieniona (tylko admin może)

### Performance Characteristics

- **GET**: < 10ms (with cache), ~50ms (without)
- **POST**: ~50-100ms (includes uniqueness check)
- **Cache Hit Rate**: Expected > 90%
- **Response Size**: Typowo 2-5 KB

### Testing Checklist

**GET /api/tags:**
- [ ] Returns all tags
- [ ] Search filtering works
- [ ] Case-insensitive search
- [ ] Empty search results (valid)
- [ ] Cache HIT/MISS
- [ ] Auth required

**POST /api/tags:**
- [ ] Creates new tag
- [ ] Lowercase normalization
- [ ] Duplicate detection (case-insensitive)
- [ ] Name validation (min/max length)
- [ ] Cache invalidation
- [ ] Location header
- [ ] Auth required

### Kolejność implementacji

**Day 1:**
1. GET endpoint (2h)
2. POST endpoint (2h)
3. Cache integration (1h)

**Day 2:**
<!-- 4. Tests (3h) -->
5. Seed data (1h)
6. Documentation (1h)

### Configuration

```env
# Tags settings
TAGS_CACHE_TTL=600  # 10 minutes
TAGS_MIN_LENGTH=2
TAGS_MAX_LENGTH=50
TAGS_NORMALIZE_LOWERCASE=true
```

### Monitoring

**Metrics:**
- Tag creation rate (per day/hour)
- Most created tags
- Duplicate attempt rate
- Cache hit rate

**Alerts:**
- Unusual spike in tag creation (potential spam)
- High duplicate rate (UI issue?)
- Low cache hit rate (cache problems?)

### Security Considerations

**Spam Prevention:**
```typescript
// Rate limit: max 10 tags per hour per user
const rateLimiter = new RateLimiter({
  windowMs: 3600000, // 1 hour
  max: 10,
  keyGenerator: (context) => context.user.id
});
```

**Content Moderation:**
```typescript
// Optional: filter inappropriate words
const inappropriateWords = ['spam', 'xxx', ...];

function validateTagName(name: string): boolean {
  const lower = name.toLowerCase();
  return !inappropriateWords.some(word => lower.includes(word));
}
```

**Admin Override:**
```typescript
// Allow admins to create tags without restrictions
if (!user.isAdmin) {
  await rateLimiter.check(user.id);
}
```

---

## Final Notes

### Współpraca z innymi endpointami

**Tags są używane przez:**
- `POST /api/recipes` - Przypisywanie tagów do przepisów
- `PATCH /api/recipes/:id` - Aktualizacja tagów
- `GET /api/recipes` - Filtrowanie po tagach
- `POST /api/recipes/generate` - AI auto-tagging

**Cache Strategy:**
- Tags cache jest invalidowany przy POST
- Recipe endpoints używają tag data (mogą cache separately)
- Consistency przez cache TTL

### Best Practices

1. **Always Lowercase**: Przechowuj i porównuj w lowercase
2. **Trim Input**: Usuń whitespace przed zapisem
3. **Cache Aggressively**: Tags się rzadko zmieniają
4. **Validate Strictly**: Zapobiegaj spam i bad data
5. **Monitor Usage**: Track które tagi są popularne

### Migration Strategy

**From User-Specific to Global Tags:**
Jeśli w przyszłości zechcemy wspierać user-specific tags:

```typescript
interface TagDTO {
  id: number;
  name: string;
  is_global: boolean;  // New field
  user_id: string | null;  // New field
  created_at: string;
}
```

Ale na razie: **Keep it simple - global tags only**.

