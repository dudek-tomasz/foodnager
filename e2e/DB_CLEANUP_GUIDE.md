# Database Cleanup Guide for E2E Tests

## 📋 Spis treści

1. [Przegląd](#przegląd)
2. [Konfiguracja](#konfiguracja)
3. [Global Teardown](#global-teardown)
4. [Ręczne czyszczenie](#ręczne-czyszczenie)
5. [Troubleshooting](#troubleshooting)

## Przegląd

Testy E2E tworzą dane testowe w bazie Supabase (produkty, przepisy, wpisy w lodówce itp.).
System czyszczenia zapewnia, że po każdym uruchomieniu testów baza jest czyszczona automatycznie.

### Jak to działa?

```
┌─────────────────┐
│  auth.setup.ts  │  ← Logowanie (przed testami)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Test Suite    │  ← Testy E2E
└────────┬────────┘
         │
         ▼
┌─────────────────────────┐
│ global.teardown.ts      │  ← Czyszczenie (po testach)
│ - Usuwa products        │
│ - Usuwa user_products   │
│ - Usuwa recipes         │
│ - Usuwa cooking_history │
└─────────────────────────┘
```

## Konfiguracja

### 1. Zmienne środowiskowe

Utwórz plik `.env.test` w katalogu głównym projektu:

```env
# Test User Credentials
E2E_USERNAME=test@foodnager.pl
E2E_PASSWORD=TestPassword123!

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# Service Role Key (REQUIRED for teardown)
# Bypasses Row Level Security (RLS) policies
# Get from: Supabase Dashboard -> Settings -> API -> service_role
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Test User UUID
# Get from: Supabase Dashboard -> Authentication -> Users
E2E_USERNAME_ID=a1b2c3d4-e5f6-7890-abcd-1234567890ab
```

### 2. Jak znaleźć Test User UUID?

**Metoda A: Przez Supabase Dashboard**

1. Otwórz Supabase Dashboard
2. Przejdź do **Authentication** → **Users**
3. Znajdź użytkownika `test@foodnager.pl`
4. Skopiuj kolumnę `id` (UUID)
5. Wklej jako `E2E_USERNAME_ID` w `.env.test`

**Metoda B: Przez SQL Editor**

```sql
SELECT id, email
FROM auth.users
WHERE email = 'test@foodnager.pl';
```

**Metoda C: Programatically (w setup)**

Dodaj do `e2e/auth.setup.ts`:

```typescript
setup("authenticate", async ({ page }) => {
  // ... existing login code ...

  // Get user ID after login
  const response = await page.request.get("/api/auth/me");
  const userData = await response.json();
  console.log("Test User ID:", userData.user.id);
});
```

### 3. Service Role Key - Bezpieczeństwo

⚠️ **WAŻNE OSTRZEŻENIA:**

- **NIGDY** nie commituj `SUPABASE_SERVICE_ROLE_KEY` do Git
- Używaj **TYLKO** z testową/developerską bazą danych
- **NIGDY** nie używaj z produkcyjną bazą!
- Service role key **omija wszystkie RLS policies**
- Traktuj go jak hasło root do bazy danych

✅ **Dobre praktyki:**

```bash
# .gitignore
.env.test        # ✅ Zawsze w gitignore!
.env.local       # ✅ Zawsze w gitignore!
```

## Global Teardown

### Jak działa?

Plik `e2e/global.teardown.ts` uruchamia się **po zakończeniu wszystkich testów**.

### Kolejność czyszczenia

Dane są usuwane w **odwrotnej kolejności** kluczy obcych (foreign keys):

```
1. cooking_history       (zależy od recipes)
2. user_products         (fridge - zależy od products)
3. recipe_tags           (zależy od recipes)
4. recipe_ingredients    (zależy od recipes i products)
5. recipes               (zależy od user)
6. products              (private - user_id = test user)
```

### Co jest czyszczone?

| Tabela               | Warunek                       | Opis                       |
| -------------------- | ----------------------------- | -------------------------- |
| `cooking_history`    | `user_id = E2E_USERNAME_ID`  | Historia gotowania         |
| `user_products`      | `user_id = E2E_USERNAME_ID`  | Produkty w lodówce         |
| `recipe_tags`        | `recipe_id IN (user recipes)` | Tagi przepisów użytkownika |
| `recipe_ingredients` | `recipe_id IN (user recipes)` | Składniki przepisów        |
| `recipes`            | `user_id = E2E_USERNAME_ID`  | Przepisy użytkownika       |
| `products`           | `user_id = E2E_USERNAME_ID`  | Prywatne produkty          |

### Co NIE jest czyszczone?

- ❌ Globalne produkty (`user_id = NULL`)
- ❌ Jednostki miar (`units`)
- ❌ Tagi (`tags`)
- ❌ Sam użytkownik testowy (`auth.users`)

### Konfiguracja w playwright.config.ts

```typescript
export default defineConfig({
  // ...

  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    { name: "chromium", dependencies: ["setup"] },
    { name: "teardown", testMatch: /.*\.teardown\.ts/ },
  ],

  // Global teardown runs AFTER all projects
  globalTeardown: "./e2e/global.teardown.ts",
});
```

### Logi

Podczas czyszczenia zobaczysz w konsoli:

```bash
🧹 Starting E2E database cleanup...
  ➜ Cleaning cooking_history...
  ✓ Deleted 5 cooking_history records
  ➜ Cleaning user_products (fridge)...
  ✓ Deleted 12 user_products records
  ➜ Finding user recipes...
  ➜ Found 3 recipes to clean
  ➜ Cleaning recipe_tags...
  ✓ Deleted 8 recipe_tags records
  ➜ Cleaning recipe_ingredients...
  ✓ Deleted 15 recipe_ingredients records
  ➜ Cleaning recipes...
  ✓ Deleted 3 recipes records
  ➜ Cleaning private products...
  ✓ Deleted 2 private products
✅ Database cleanup completed successfully
```

## Ręczne czyszczenie

### W testach

Jeśli potrzebujesz wyczyścić dane **w trakcie** testu:

```typescript
import { cleanupFridge } from "./helpers/db-cleanup";

test.describe("Fridge Tests", () => {
  test("should handle empty fridge", async ({ page }) => {
    // Clean fridge before test
    await cleanupFridge(process.env.E2E_USERNAME_ID!);

    // Test with empty state
    await page.goto("/fridge");
    await expect(page.getByText("Lodówka jest pusta")).toBeVisible();
  });
});
```

### Dostępne funkcje

```typescript
import {
  cleanupUserData, // Wszystkie dane użytkownika
  cleanupUserProducts, // Tylko produkty
  cleanupFridge, // Tylko lodówka
  cleanupRecipes, // Tylko przepisy
  cleanupCookingHistory, // Tylko historia
} from "./helpers/db-cleanup";

// Clean everything
await cleanupUserData(userId);

// Clean specific tables
await cleanupFridge(userId);
await cleanupRecipes(userId);
```

### Standalone skrypt

Możesz uruchomić cleanup jako standalone skrypt:

```typescript
// scripts/cleanup-test-db.ts
import { config } from "dotenv";
import { cleanupUserData } from "../e2e/helpers/db-cleanup";

config({ path: ".env.test" });

const userId = process.env.E2E_USERNAME_ID!;
await cleanupUserData(userId);

console.log("✅ Database cleaned!");
```

Uruchomienie:

```bash
npx tsx scripts/cleanup-test-db.ts
```

## Troubleshooting

### ⚠️ "Skipping database cleanup: SUPABASE_SERVICE_ROLE_KEY not configured"

**Przyczyna:** Brak service role key w `.env.test`

**Rozwiązanie:**

1. Otwórz Supabase Dashboard
2. Settings → API
3. Skopiuj `service_role` key
4. Dodaj do `.env.test`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

### ⚠️ "Skipping database cleanup: E2E_USERNAME_ID not configured"

**Przyczyna:** Brak UUID użytkownika testowego

**Rozwiązanie:**

1. Supabase Dashboard → Authentication → Users
2. Znajdź `test@foodnager.pl`
3. Skopiuj UUID
4. Dodaj do `.env.test`:
   ```env
   E2E_USERNAME_ID=a1b2c3d4-e5f6-...
   ```

### ❌ "Error cleaning products: foreign key violation"

**Przyczyna:** Próba usunięcia produktu, który jest używany w przepisach

**Rozwiązanie:**

Cleanup działa w poprawnej kolejności. Ten błąd pojawia się, jeśli:

1. RLS blokuje dostęp do powiązanych rekordów
2. Service role key jest niepoprawny
3. Foreign keys są źle skonfigurowane

Sprawdź:

```sql
-- Check foreign keys
SELECT
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY';
```

### ❌ "Database cleanup failed: Authentication error"

**Przyczyna:** Service role key jest niepoprawny lub wygasł

**Rozwiązanie:**

1. Wygeneruj nowy service role key
2. Zaktualizuj `.env.test`
3. Uruchom testy ponownie

### 🐛 Testy przechodzą, ale dane nie są czyszczone

**Przyczyna:** Global teardown może nie uruchamiać się na Windows

**Rozwiązanie A:** Użyj teardown project

```typescript
// playwright.config.ts
projects: [
  { name: 'setup', testMatch: /.*\.setup\.ts/ },
  { name: 'chromium', dependencies: ['setup'] },
  { name: 'teardown', testMatch: /.*\.teardown\.ts/ }, // ✅ Add this
],
```

**Rozwiązanie B:** Użyj test hooks

```typescript
// e2e/hooks.ts
import { test as base } from "@playwright/test";
import { cleanupUserData } from "./helpers/db-cleanup";

export const test = base.extend({
  // Cleanup after each test file
  auto: [
    async ({}, use, testInfo) => {
      await use();

      // Only cleanup after last test in file
      if (testInfo.project.name === "chromium") {
        await cleanupUserData(process.env.E2E_USERNAME_ID!);
      }
    },
    { auto: true },
  ],
});
```

### 📊 Jak sprawdzić czy cleanup działa?

**Metoda A: Logi konsoli**

Szukaj:

```
✅ Database cleanup completed successfully
```

**Metoda B: Supabase Dashboard**

1. Otwórz SQL Editor
2. Uruchom:
   ```sql
   SELECT COUNT(*) FROM user_products
   WHERE user_id = 'your-test-user-id';
   ```
3. Powinno być `0` po teardown

**Metoda C: Test assertion**

```typescript
test.afterAll(async () => {
  const supabase = createTestSupabaseClient();
  const { count } = await supabase
    .from("user_products")
    .select("*", { count: "exact", head: true })
    .eq("user_id", process.env.E2E_USERNAME_ID!);

  expect(count).toBe(0);
});
```

## Best Practices

### ✅ DO

- Zawsze używaj `.env.test` dla konfiguracji testów
- Używaj dedykowanej bazy testowej (nie produkcyjnej!)
- Trzymaj service role key w bezpiecznym miejscu
- Regularnie sprawdzaj czy cleanup działa
- Używaj specific cleanup functions w testach (cleanupFridge, cleanupRecipes)

### ❌ DON'T

- Nie commituj `.env.test` do Git
- Nie używaj produkcyjnej bazy do testów
- Nie usuwaj globalnych danych (units, tags)
- Nie zakładaj, że baza jest pusta przed testem (zawsze cleanup!)
- Nie uruchamiaj teardown na produkcji

## Pytania?

Jeśli masz problemy z cleanup:

1. Sprawdź logi w konsoli
2. Zweryfikuj `.env.test` konfigurację
3. Sprawdź RLS policies w Supabase
4. Zobacz [e2e/README.md](./README.md) dla więcej info
5. Otwórz issue na GitHub
