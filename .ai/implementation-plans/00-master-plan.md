# Foodnager API - Master Implementation Plan

## Przegląd

Ten dokument zawiera kompleksowy plan implementacji wszystkich endpointów REST API dla aplikacji Foodnager. Plan obejmuje 23 endpointy pogrupowane w 8 modułów funkcjonalnych.

---

## Spis Planów Implementacji

### 1. [Products Management](./01-products-endpoints-plan.md) - 5 endpointów
- `GET /api/products` - List Products
- `GET /api/products/:id` - Get Product by ID
- `POST /api/products` - Create Product
- `PATCH /api/products/:id` - Update Product
- `DELETE /api/products/:id` - Delete Product

### 2. [Virtual Fridge Management](./02-fridge-endpoints-plan.md) - 5 endpointów
- `GET /api/fridge` - List Fridge Items
- `GET /api/fridge/:id` - Get Fridge Item by ID
- `POST /api/fridge` - Add Item to Fridge
- `PATCH /api/fridge/:id` - Update Fridge Item
- `DELETE /api/fridge/:id` - Delete Fridge Item

### 3. [Recipes Management](./03-recipes-endpoints-plan.md) - 5 endpointów
- `GET /api/recipes` - List Recipes
- `GET /api/recipes/:id` - Get Recipe by ID
- `POST /api/recipes` - Create Recipe
- `PATCH /api/recipes/:id` - Update Recipe
- `DELETE /api/recipes/:id` - Delete Recipe

### 4. [Recipe Discovery & AI Integration](./04-recipe-discovery-endpoints-plan.md) - 2 endpointy
- `POST /api/recipes/search-by-fridge` - Search Recipes by Fridge Contents (3-tier: User → API → AI)
- `POST /api/recipes/generate` - Generate Recipe with AI

### 5. [Shopping List](./05-shopping-list-endpoints-plan.md) - 1 endpoint
- `POST /api/shopping-list/generate` - Generate Shopping List

### 6. [Cooking History](./06-cooking-history-endpoints-plan.md) - 2 endpointy
- `GET /api/cooking-history` - List Cooking History
- `POST /api/cooking-history` - Create Cooking History Entry (with automatic fridge update)

### 7. [Units Dictionary](./07-units-endpoints-plan.md) - 1 endpoint
- `GET /api/units` - List Units

### 8. [Tags Dictionary](./08-tags-endpoints-plan.md) - 2 endpointy
- `GET /api/tags` - List Tags
- `POST /api/tags` - Create Tag

---

## Architektura Systemu

```
┌─────────────────────────────────────────────────────────────────┐
│                         Foodnager API                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐         │
│  │   Products  │  │Virtual Fridge│  │    Recipes     │         │
│  │   (CRUD)    │  │   (CRUD)     │  │    (CRUD)      │         │
│  └─────────────┘  └──────────────┘  └────────────────┘         │
│         │                │                    │                  │
│         └────────────────┴────────────────────┘                  │
│                          │                                       │
│         ┌────────────────┴────────────────────┐                 │
│         │                                      │                 │
│  ┌──────▼──────┐                    ┌─────────▼──────────┐     │
│  │  Shopping   │                    │Recipe Discovery    │     │
│  │    List     │                    │  (AI Integration)  │     │
│  └─────────────┘                    └────────────────────┘     │
│                                               │                  │
│                                      ┌────────▼─────────┐       │
│                                      │  Cooking History │       │
│                                      │ (Fridge Update)  │       │
│                                      └──────────────────┘       │
│                                                                   │
│  ┌─────────────────────────────────────────────────────┐        │
│  │          Dictionaries (Units, Tags)                 │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Zależności między Modułami

### Core Dependencies (Muszą być zaimplementowane najpierw)
```
Units (słownik) 
  └─> Products
      └─> Virtual Fridge
          └─> Recipes
              └─> Shopping List
              └─> Cooking History
              └─> Recipe Discovery
```

### Tags (Niezależny, ale używany przez Recipes)
```
Tags (słownik)
  └─> Recipes (opcjonalne tagi)
```

### AI Integration (Wymaga Products i Units)
```
Products + Units
  └─> AI Recipe Generation
```

---

## Recommended Implementation Order

### Phase 1: Foundation (Week 1-2) - Infrastructure & Core Resources

**Priority: CRITICAL**

#### Week 1: Infrastructure Setup
1. **Setup Infrastructure** (2 days)
   - Error handling system (`src/lib/errors/`)
   - API response helpers (`src/lib/utils/api-response.ts`)
   - Pagination utilities (`src/lib/utils/pagination.ts`)
   - Cache system (`src/lib/utils/cache.ts`)
   - Validation schemas base (`src/lib/validations/`)

2. **Dictionary Endpoints** (1 day)
   - ✓ `GET /api/units` (2h) - Najprostszy, świetny do testowania infrastructure
   - ✓ `GET /api/tags` (2h)
   - ✓ `POST /api/tags` (2h)

3. **Products Module** (2 days)
   - ✓ `GET /api/products` (3h)
   - ✓ `POST /api/products` (2h)
   - ✓ `GET /api/products/:id` (1h)
   - ✓ `PATCH /api/products/:id` (2h)
   - ✓ `DELETE /api/products/:id` (1h)

#### Week 2: Core Features
4. **Virtual Fridge Module** (3 days)
   - ✓ `GET /api/fridge` (4h) - Complex filtering
   - ✓ `POST /api/fridge` (3h)
   - ✓ `GET /api/fridge/:id` (1h)
   - ✓ `PATCH /api/fridge/:id` (2h)
   - ✓ `DELETE /api/fridge/:id` (1h)

5. **Basic Recipes** (2 days)
   - ✓ `GET /api/recipes` (5h) - Complex with ingredients & tags
   - ✓ `GET /api/recipes/:id` (2h)
   - ✓ `POST /api/recipes` (4h) - Complex with transaction

**Deliverable**: MVP Core - Users can manage products, fridge, and create recipes

---

### Phase 2: Recipe Management (Week 3) - Complete CRUD

**Priority: HIGH**

#### Week 3: Recipe Operations
6. **Recipe Updates & Deletion** (2 days)
   - ✓ `PATCH /api/recipes/:id` (4h) - Complex update with transaction
   - ✓ `DELETE /api/recipes/:id` (2h)
   - Testing & bug fixes (3h)

7. **Shopping List** (1 day)
   - ✓ `POST /api/shopping-list/generate` (4h) - Business logic
   - Testing (2h)

8. **Cooking History - GET** (2 days)
   - PostgreSQL function development (4h)
   - ✓ `GET /api/cooking-history` (3h)
   - Testing (2h)

**Deliverable**: Complete recipe management + shopping list generation

---

### Phase 3: Advanced Features (Week 4-5) - AI & Automation

**Priority: MEDIUM-HIGH**

#### Week 4: Cooking Automation
9. **Cooking History - POST** (3 days)
   - PostgreSQL function for fridge update (8h) - Most complex function
   - ✓ `POST /api/cooking-history` (4h)
   - Extensive testing (4h) - Critical for data integrity
   - Edge cases & error handling (4h)

**Deliverable**: Automatic fridge updates when cooking

#### Week 5: AI Integration - Part 1
10. **Recipe Discovery Infrastructure** (2 days)
    - Rate limiter setup (3h)
    - Cache strategies (2h)
    - Match score calculator (3h)
    - Product matcher (fuzzy) (4h)

11. **Tier 1: User Recipe Search** (1 day)
    - User recipes search logic (4h)
    - Testing (2h)

**Deliverable**: Recipe search by fridge contents (user recipes only)

---

### Phase 4: AI & External APIs (Week 6-7) - Advanced Discovery

**Priority: MEDIUM**

#### Week 6: External Integration
12. **Tier 2: External API** (3 days)
    - External API client (4h)
    - Recipe mapper (external → internal) (4h)
    - Integration testing (4h)
    - Error handling & fallback (4h)

#### Week 7: AI Generation
13. **Tier 3: AI Generation** (3 days)
    - OpenRouter client (4h)
    - Prompt engineering (4h)
    - Response validator (3h)
    - AI ingredient mapper (4h)

14. **Recipe Discovery Integration** (1 day)
    - ✓ `POST /api/recipes/search-by-fridge` (4h) - Orchestration
    - End-to-end testing (4h)

**Deliverable**: Complete 3-tier recipe discovery system

---

### Phase 5: Direct AI Generation (Week 8) - Final Features

**Priority: LOW-MEDIUM**

#### Week 8: AI Recipe Generation
15. **Direct AI Generation** (3 days)
    - ✓ `POST /api/recipes/generate` (6h) - Reuse AI components
    - Tag auto-assignment (3h)
    - Testing (4h)

16. **Polish & Optimization** (2 days)
    - Performance optimization (4h)
    - Cache tuning (2h)
    - Error message improvements (2h)
    - Documentation updates (4h)

**Deliverable**: Complete API with all features

---

## Szacunki Czasowe

### Summary by Module

| Moduł | Endpointy | Szacowany Czas | Priorytet |
|-------|-----------|----------------|-----------|
| Infrastructure | - | 2 dni | CRITICAL |
| Units | 1 | 2h | CRITICAL |
| Tags | 2 | 4h | CRITICAL |
| Products | 5 | 9h | CRITICAL |
| Virtual Fridge | 5 | 11h | CRITICAL |
| Recipes (Basic) | 3 | 11h | HIGH |
| Recipes (Update/Delete) | 2 | 6h | HIGH |
| Shopping List | 1 | 6h | HIGH |
| Cooking History (GET) | 1 | 9h | MEDIUM-HIGH |
| Cooking History (POST) | 1 | 16h | MEDIUM-HIGH |
| Recipe Discovery (Infra) | - | 12h | MEDIUM |
| Recipe Discovery (Tier 1) | - | 6h | MEDIUM |
| Recipe Discovery (Tier 2) | - | 16h | MEDIUM |
| Recipe Discovery (Tier 3) | - | 15h | MEDIUM |
| Recipe Discovery (Integration) | 1 | 8h | MEDIUM |
| AI Recipe Generation | 1 | 13h | LOW-MEDIUM |
| **TOTAL** | **23** | **~144h** | **(18 dni roboczych)** |

### Timeline

- **Phase 1 (Foundation)**: Week 1-2 (10 dni)
- **Phase 2 (Recipe Management)**: Week 3 (5 dni)
- **Phase 3 (Advanced Features)**: Week 4-5 (10 dni)
- **Phase 4 (AI Integration)**: Week 6-7 (10 dni)
- **Phase 5 (Finalization)**: Week 8 (5 dni)

**Total**: ~8 tygodni (40 dni roboczych) z buforem

---

## Complexity Ratings

### Simple (1-2h each)
- `GET /api/units`
- `GET /api/products/:id`
- `GET /api/fridge/:id`
- `GET /api/recipes/:id`
- `DELETE /api/products/:id`
- `DELETE /api/fridge/:id`
- `DELETE /api/recipes/:id`

### Medium (3-4h each)
- `GET /api/tags`
- `POST /api/tags`
- `POST /api/products`
- `PATCH /api/products/:id`
- `POST /api/fridge`
- `PATCH /api/fridge/:id`

### Complex (5-8h each)
- `GET /api/products` (filtering, search)
- `GET /api/fridge` (complex filtering, expiry)
- `GET /api/recipes` (joins, nested data)
- `POST /api/recipes` (transaction, validation)
- `PATCH /api/recipes/:id` (transaction)
- `POST /api/shopping-list/generate` (business logic)
- `GET /api/cooking-history` (JSONB, filtering)

### Very Complex (10-20h each)
- `POST /api/cooking-history` (PostgreSQL function, transaction, FIFO)
- `POST /api/recipes/search-by-fridge` (3-tier orchestration)
- `POST /api/recipes/generate` (AI integration, mapping)

---

## Critical Path

```
Infrastructure Setup
  ↓
Units → Products → Virtual Fridge → Recipes (CRUD)
  ↓                                    ↓
  └────────────────────────────────> Shopping List
                                       ↓
                                   Cooking History
                                       ↓
                              Recipe Discovery (Tier 1-3)
                                       ↓
                              AI Recipe Generation
```

**Bottlenecks:**
1. Infrastructure (everything depends on it)
2. Products (fridge and recipes depend on it)
3. Recipes CRUD (shopping list, history, discovery depend on it)
4. PostgreSQL function (cooking history depends on it)

---

## Testing Strategy

### Unit Tests (Per Module)
- Service logic
- Validation schemas
- Utility functions
- Transformers

### Integration Tests (Per Endpoint)
- Happy path
- Error scenarios
- Edge cases
- Auth checks

### E2E Tests (User Flows)
1. **User onboarding**: Register → Add products to fridge → Create recipe
2. **Recipe discovery**: Search by fridge → Get shopping list → Cook recipe
3. **AI flow**: Generate recipe → Save → Use in cooking history

### Performance Tests
- Load testing (concurrent requests)
- Stress testing (high volume)
- Cache efficiency
- Database query optimization

---

## Risk Assessment

### High Risk Items

1. **PostgreSQL Function (Cooking History)**
   - **Risk**: Complex logic, transaction handling, FIFO
   - **Mitigation**: Extensive testing, transaction rollback tests, peer review

2. **AI Integration (Rate Limiting, Cost)**
   - **Risk**: High costs, rate limits, unpredictable responses
   - **Mitigation**: Aggressive caching, rate limiting, fallback strategies, monitoring

3. **External API Reliability**
   - **Risk**: Downtime, rate limits, changing APIs
   - **Mitigation**: Fallback to next tier, error handling, timeout management

### Medium Risk Items

1. **Complex Filtering (Recipes, Fridge)**
   - **Risk**: Performance issues with large datasets
   - **Mitigation**: Proper indexing, pagination, query optimization

2. **Recipe Creation Transaction**
   - **Risk**: Partial inserts on error
   - **Mitigation**: Proper transaction handling, rollback tests

3. **Concurrent Cooking Events**
   - **Risk**: Race conditions in fridge updates
   - **Mitigation**: Row-level locking (FOR UPDATE), proper isolation

---

## Monitoring & Observability

### Key Metrics to Track

**Performance:**
- Response times (p50, p95, p99)
- Database query times
- Cache hit rates
- Transaction durations

**Business:**
- Recipes created (user vs AI vs API)
- Shopping lists generated
- Cooking events logged
- Fridge usage patterns

**Costs:**
- AI API calls (count, tokens)
- External API calls
- Database operations

**Errors:**
- Error rates by endpoint
- AI generation failures
- Transaction rollbacks
- Cache failures

### Alerts

**Critical:**
- Error rate > 5%
- Response time p95 > 2s
- AI generation error rate > 20%
- Transaction rollback rate > 5%

**Warning:**
- Cache hit rate < 80%
- AI cost > budget threshold
- Database query time > 500ms

---

## Configuration Management

### Environment Variables

```env
# Database (Supabase)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# External Recipe API
EXTERNAL_RECIPE_API_URL=https://api.spoonacular.com
EXTERNAL_RECIPE_API_KEY=xxx

# AI Service (OpenRouter)
OPENROUTER_API_URL=https://openrouter.ai/api/v1
OPENROUTER_API_KEY=xxx
OPENROUTER_MODEL=anthropic/claude-3-sonnet

# Cache (Redis for production)
REDIS_URL=redis://localhost:6379
CACHE_PROVIDER=memory # or 'redis'

# Rate Limiting
AI_RATE_LIMIT_PER_MINUTE=5
AI_RATE_LIMIT_PER_DAY=50

# Thresholds
RECIPE_MATCH_THRESHOLD=0.7
TIER1_TIMEOUT_MS=5000
TIER2_TIMEOUT_MS=10000
TIER3_TIMEOUT_MS=30000

# Caching TTLs
UNITS_CACHE_TTL=3600
TAGS_CACHE_TTL=600
PRODUCTS_CACHE_TTL=3600
FRIDGE_CACHE_TTL=300
RECIPES_CACHE_TTL=600
AI_RECIPE_CACHE_TTL=86400
```

---

## Success Criteria

### MVP (Phase 1-2)
- [ ] All CRUD operations working
- [ ] Authentication & authorization
- [ ] Basic error handling
- [ ] Shopping list generation
- [ ] Unit tests coverage > 70%

### Complete (Phase 3-4)
- [ ] Cooking history with fridge updates
- [ ] Recipe discovery (3-tier)
- [ ] AI recipe generation
- [ ] Integration tests coverage > 80%
- [ ] Performance benchmarks met

### Production Ready (Phase 5)
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Monitoring & alerts configured
- [ ] Performance optimized
- [ ] Security audit completed

---

## Team Recommendations

### Suggested Team Structure
- **Backend Developer 1**: Products, Fridge, Units, Tags (Foundation)
- **Backend Developer 2**: Recipes CRUD, Shopping List (Core Features)
- **Backend Developer 3**: Cooking History, PostgreSQL functions (Complex Logic)
- **AI/ML Developer**: Recipe Discovery, AI Integration (Specialized)

### Parallel Work Streams

**Stream 1 (Foundation):**
Products → Fridge → Units → Tags

**Stream 2 (Recipes):**
Recipes CRUD → Shopping List

**Stream 3 (Advanced):**
Cooking History PostgreSQL function

**Stream 4 (AI):**
AI client → Prompt engineering → Recipe Discovery

---

## Documentation Deliverables

1. **API Reference** - Swagger/OpenAPI spec
2. **Integration Guide** - For frontend developers
3. **Database Schema** - ER diagrams, relationships
4. **Deployment Guide** - CI/CD, environment setup
5. **Monitoring Runbook** - Alert handling, troubleshooting

---

## Conclusion

This master plan provides a comprehensive roadmap for implementing all 23 API endpoints for Foodnager. The phased approach ensures:

1. **Solid Foundation**: Core infrastructure and simple endpoints first
2. **Incremental Value**: Each phase delivers working features
3. **Risk Management**: Complex features (AI, transactions) later with more context
4. **Flexibility**: Phases can be adjusted based on priorities

**Estimated Total Time**: 8 weeks (with buffer)
**Team Size**: 2-4 developers
**Confidence Level**: High (detailed plans for each endpoint)

---

*For detailed implementation instructions for each endpoint, refer to the individual plan documents listed at the beginning of this master plan.*

