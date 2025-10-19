# API Endpoints Implementation Plan: Units Dictionary

**Status:** ✅ IMPLEMENTED (2025-10-19)  
**Summary:** `.ai/implementation-summary-units.md`

## Spis treści
1. [GET /api/units - List Units](#1-get-apiunits---list-units)

---

## 1. GET /api/units - List Units

### 1.1 Przegląd punktu końcowego
Endpoint pobiera listę wszystkich dostępnych jednostek miary w systemie. Jest to prosty endpoint słownikowy (dictionary) używany przy tworzeniu i edycji przepisów oraz produktów w lodówce. Dane są globalne (nie zależą od użytkownika) i rzadko się zmieniają, więc idealnie nadają się do cachowania.

**Powiązane User Stories:** US-002 (Zarządzanie wirtualną lodówką), US-003 (Zarządzanie przepisami)

### 1.2 Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/units`
- **Wymagane nagłówki:** `Authorization: Bearer {access_token}`

**Query Parameters:**
- Brak (endpoint zwraca wszystkie jednostki bez filtrowania ani paginacji)

**Przykładowe żądanie:**
```
GET /api/units
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 1.3 Wykorzystywane typy

**Response DTO:**
```typescript
UnitsListResponseDTO {
  data: UnitDTO[];
}

UnitDTO {
  id: number;
  name: string;
  abbreviation: string;
  created_at: string;
}
```

### 1.4 Szczegóły odpowiedzi

**Sukces (200 OK):**
```json
{
  "data": [
    {
      "id": 1,
      "name": "gram",
      "abbreviation": "g",
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 2,
      "name": "kilogram",
      "abbreviation": "kg",
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 3,
      "name": "piece",
      "abbreviation": "pc",
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 4,
      "name": "liter",
      "abbreviation": "L",
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 5,
      "name": "milliliter",
      "abbreviation": "ml",
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 6,
      "name": "tablespoon",
      "abbreviation": "tbsp",
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 7,
      "name": "teaspoon",
      "abbreviation": "tsp",
      "created_at": "2025-10-18T12:00:00Z"
    },
    {
      "id": 8,
      "name": "cup",
      "abbreviation": "cup",
      "created_at": "2025-10-18T12:00:00Z"
    }
  ]
}
```

**Błędy:**
- `401 Unauthorized` - Brak lub nieprawidłowy token

### 1.5 Przepływ danych

```
1. [Client] → GET /api/units
2. [Middleware] → Walidacja tokenu JWT
3. [Handler] → Check cache: `units:all`
4. [Handler] → If cache HIT → return cached data (fast path)
5. [Service] → UnitsService.listUnits()
6. [Database] → SELECT * FROM units ORDER BY name ASC
7. [Service] → Transformacja na UnitDTO[]
8. [Handler] → Cache result (TTL: 1 hour)
9. [Handler] → Response 200 z UnitsListResponseDTO
```

### 1.6 Względy bezpieczeństwa

**Uwierzytelnianie:**
- Wymagany Bearer token
- Dane są publiczne (globalne) ale endpoint chroniony dla authorized users only

**Autoryzacja:**
- Brak RLS (dane globalne)
- Każdy authenticated user może czytać

**Walidacja:**
- Brak parametrów do walidacji

**Data Exposure:**
- Dane są niegroźne (public dictionary)
- Brak user-specific data

### 1.7 Obsługa błędów

| Scenariusz | Kod HTTP | Error Code | Akcja |
|------------|----------|------------|-------|
| Brak tokenu | 401 | UNAUTHORIZED | Zwróć komunikat o wymaganej autoryzacji |
| Nieprawidłowy token | 401 | UNAUTHORIZED | Zwróć komunikat o nieprawidłowym tokenie |
| Błąd bazy danych | 500 | INTERNAL_ERROR | Loguj szczegóły, zwróć ogólny komunikat |
| Cache error | - | - | Fallback to database (transparent) |

**Uwaga**: Brak błędów typu 404 (empty list jest valid response, choć w praktyce bardzo nieprawdopodobny)

### 1.8 Wydajność

**Optymalizacje:**
- **Aggressive caching**: Cache na 1 godzinę (dane rzadko się zmieniają)
- **Simple query**: SELECT * FROM units (bardzo szybkie, < 1ms)
- **Small dataset**: Typowo 10-20 jednostek (< 1KB response)
- **No pagination needed**: Wszystkie dane mieszczą się w jednym response

**Caching Strategy:**
```typescript
const CACHE_KEY = 'units:all';
const CACHE_TTL = 3600; // 1 hour

// Try cache first
const cached = await cache.get(CACHE_KEY);
if (cached) {
  return cached; // Fast path (< 1ms)
}

// Cache miss: fetch from DB
const units = await db.query('SELECT * FROM units ORDER BY name ASC');

// Cache for future requests
await cache.set(CACHE_KEY, units, CACHE_TTL);

return units;
```

**Cache Invalidation:**
- Invalidacja przy: dodaniu/edycji/usunięciu jednostki (admin operation)
- W praktyce: bardzo rzadko (units są statyczne)

**Response Size:**
- Typowo: 10-20 units × ~100 bytes = 1-2 KB
- Brak potrzeby kompresji

### 1.9 Etapy wdrożenia

#### Phase 1: Service Implementation

1. **UnitsService**
   ```typescript
   // src/lib/services/units.service.ts
   
   export class UnitsService {
     constructor(private db: Database) {}
     
     async listUnits(): Promise<UnitDTO[]> {
       const { rows } = await this.db.query(`
         SELECT id, name, abbreviation, created_at
         FROM units
         ORDER BY name ASC
       `);
       
       return rows.map(row => ({
         id: row.id,
         name: row.name,
         abbreviation: row.abbreviation,
         created_at: row.created_at
       }));
     }
   }
   ```

#### Phase 2: Cache Helper

2. **Cache Wrapper**
   ```typescript
   // src/lib/utils/cache.ts
   
   interface CacheAdapter {
     get<T>(key: string): Promise<T | null>;
     set<T>(key: string, value: T, ttl: number): Promise<void>;
     delete(key: string): Promise<void>;
   }
   
   // Simple in-memory cache (for development)
   class MemoryCache implements CacheAdapter {
     private store = new Map<string, { value: any; expiresAt: number }>();
     
     async get<T>(key: string): Promise<T | null> {
       const entry = this.store.get(key);
       if (!entry) return null;
       
       if (Date.now() > entry.expiresAt) {
         this.store.delete(key);
         return null;
       }
       
       return entry.value as T;
     }
     
     async set<T>(key: string, value: T, ttl: number): Promise<void> {
       this.store.set(key, {
         value,
         expiresAt: Date.now() + ttl * 1000
       });
     }
     
     async delete(key: string): Promise<void> {
       this.store.delete(key);
     }
   }
   
   // Redis cache (for production)
   class RedisCache implements CacheAdapter {
     // ... Redis implementation
   }
   
   export const cache = new MemoryCache(); // or RedisCache in production
   ```

#### Phase 3: Endpoint Implementation

3. **Endpoint handler**
   ```typescript
   // src/pages/api/units/index.ts
   
   import type { APIContext } from 'astro';
   import { UnitsService } from '@/lib/services/units.service';
   import { cache } from '@/lib/utils/cache';
   import { errorResponse } from '@/lib/utils/api-response';
   
   export const prerender = false;
   
   const CACHE_KEY = 'units:all';
   const CACHE_TTL = 3600; // 1 hour
   
   export async function GET(context: APIContext) {
     try {
       // 1. Auth check
       const supabase = context.locals.supabase;
       const { data: { user }, error: authError } = await supabase.auth.getUser();
       
       if (authError || !user) {
         return errorResponse('UNAUTHORIZED', 'Authentication required', null, 401);
       }
       
       // 2. Try cache first
       const cached = await cache.get<UnitsListResponseDTO>(CACHE_KEY);
       if (cached) {
         return new Response(JSON.stringify(cached), {
           status: 200,
           headers: {
             'Content-Type': 'application/json',
             'X-Cache': 'HIT'
           }
         });
       }
       
       // 3. Cache miss: fetch from database
       const unitsService = new UnitsService(supabase);
       const units = await unitsService.listUnits();
       
       const response: UnitsListResponseDTO = {
         data: units
       };
       
       // 4. Cache result
       await cache.set(CACHE_KEY, response, CACHE_TTL);
       
       // 5. Return response
       return new Response(JSON.stringify(response), {
         status: 200,
         headers: {
           'Content-Type': 'application/json',
           'X-Cache': 'MISS'
         }
       });
       
     } catch (error) {
       console.error('Units list error:', error);
       return errorResponse(
         'INTERNAL_ERROR',
         'Failed to fetch units',
         null,
         500
       );
     }
   }
   ```
<!-- 
#### Phase 4: Testing

4. **Unit Tests**
   ```typescript
   describe('UnitsService', () => {
     it('should return all units sorted by name', async () => {
       const units = await unitsService.listUnits();
       
       expect(units).toBeArray();
       expect(units.length).toBeGreaterThan(0);
       
       // Verify sorting
       const names = units.map(u => u.name);
       expect(names).toEqual([...names].sort());
       
       // Verify structure
       units.forEach(unit => {
         expect(unit).toHaveProperty('id');
         expect(unit).toHaveProperty('name');
         expect(unit).toHaveProperty('abbreviation');
         expect(unit).toHaveProperty('created_at');
       });
     });
   });
   ```

5. **Integration Tests**
   ```typescript
   describe('GET /api/units', () => {
     it('should return list of units', async () => {
       const response = await fetch('/api/units', {
         headers: {
           'Authorization': `Bearer ${userToken}`
         }
       });
       
       expect(response.status).toBe(200);
       const data = await response.json();
       
       expect(data.data).toBeArray();
       expect(data.data.length).toBeGreaterThan(0);
       
       // Verify first unit structure
       const firstUnit = data.data[0];
       expect(firstUnit.id).toBeNumber();
       expect(firstUnit.name).toBeString();
       expect(firstUnit.abbreviation).toBeString();
     });
     
     it('should return 401 without auth', async () => {
       const response = await fetch('/api/units');
       expect(response.status).toBe(401);
     });
     
     it('should use cache on subsequent requests', async () => {
       // First request
       const response1 = await fetch('/api/units', {
         headers: { 'Authorization': `Bearer ${userToken}` }
       });
       expect(response1.headers.get('X-Cache')).toBe('MISS');
       
       // Second request (should hit cache)
       const response2 = await fetch('/api/units', {
         headers: { 'Authorization': `Bearer ${userToken}` }
       });
       expect(response2.headers.get('X-Cache')).toBe('HIT');
       
       // Data should be identical
       const data1 = await response1.json();
       const data2 = await response2.json();
       expect(data1).toEqual(data2);
     });
   });
   ``` -->

### 1.10 Seed Data

**Initial Units (Migration)**
```sql
-- supabase/migrations/xxx_seed_units.sql

INSERT INTO units (name, abbreviation) VALUES
  ('gram', 'g'),
  ('kilogram', 'kg'),
  ('milligram', 'mg'),
  ('piece', 'pc'),
  ('liter', 'L'),
  ('milliliter', 'ml'),
  ('tablespoon', 'tbsp'),
  ('teaspoon', 'tsp'),
  ('cup', 'cup'),
  ('ounce', 'oz'),
  ('pound', 'lb'),
  ('pinch', 'pinch'),
  ('dash', 'dash'),
  ('handful', 'handful'),
  ('slice', 'slice'),
  ('clove', 'clove'),
  ('bunch', 'bunch'),
  ('can', 'can'),
  ('jar', 'jar'),
  ('package', 'pkg')
ON CONFLICT (name) DO NOTHING;
```

### 1.11 Future Enhancements

**Admin Endpoints (Optional):**
```typescript
// POST /api/admin/units - Add new unit
// PATCH /api/admin/units/:id - Update unit
// DELETE /api/admin/units/:id - Delete unit (if not used)
```

**Unit Conversions (Future):**
```typescript
// GET /api/units/conversions
// Returns conversion rules between compatible units
{
  "conversions": [
    { "from": "kg", "to": "g", "factor": 1000 },
    { "from": "L", "to": "ml", "factor": 1000 },
    ...
  ]
}
```

**Localization (Future):**
```typescript
// Support multiple languages
interface UnitDTO {
  id: number;
  name: string; // English
  name_pl: string; // Polish
  abbreviation: string;
  abbreviation_pl: string;
}
```

---

## Podsumowanie implementacji Units API

### Struktura plików
```
src/
├── lib/
│   ├── services/
│   │   └── units.service.ts              # Simple service
│   └── utils/
│       └── cache.ts                      # Cache adapter
└── pages/
    └── api/
        └── units/
            └── index.ts                   # GET endpoint
```

### Kluczowe cechy

- **Simplicity**: Najprostszy endpoint w całym API
- **Performance**: Aggressive caching (1 hour TTL)
- **Reliability**: Fallback to DB if cache fails
- **Scalability**: No load on DB (99% cache hits)

### Performance Metrics

- **With Cache**: < 1ms response time
- **Without Cache**: < 10ms response time
- **Response Size**: 1-2 KB
- **Cache Hit Rate**: Expected > 99%

### Testing Checklist

- [ ] Returns all units
- [ ] Units sorted alphabetically
- [ ] Correct data structure
- [ ] Cache working (MISS then HIT)
- [ ] Auth required (401 without token)
- [ ] Cache TTL respected
- [ ] Handles empty table (edge case)
- [ ] Handles DB error gracefully

### Implementacja

**Szacowany czas:** 2-3 godziny
- 1h: Service + endpoint
- 1h: Cache implementation
<!-- - 1h: Tests -->

**Priorytety:**
1. Basic endpoint (no cache) - działa
2. Add caching - optymalizacja
<!-- 3. Tests - jakość -->

### Configuration

```env
# Cache settings
CACHE_PROVIDER=memory  # or 'redis' for production
REDIS_URL=redis://localhost:6379  # if using Redis
UNITS_CACHE_TTL=3600  # 1 hour
```

### Monitoring

**Metrics to Track:**
- Cache hit rate (should be > 95%)
- Response times
- Error rate (should be ~0%)

**Alerts:**
- Cache hit rate < 90% (investigate cache issues)
- Error rate > 1% (DB problems?)

---

**Uwagi implementacyjne:**

1. **Cache Provider**: Start z MemoryCache (prosty), później upgrade do Redis w production
2. **No Pagination**: Dataset jest bardzo mały (< 50 units)
3. **No Filtering**: Lista jest na tyle mała, że filtering po stronie klienta jest OK
4. **Immutable Data**: Units są prawie immutable, więc long cache TTL jest bezpieczny
5. **X-Cache Header**: Pomaga w debugowaniu i monitoringu cache performance

