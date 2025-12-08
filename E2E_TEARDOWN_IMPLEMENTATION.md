# ✅ Implementacja E2E Teardown - Czyszczenie bazy Supabase

## 📋 Podsumowanie implementacji

Zaimplementowano automatyczne czyszczenie bazy danych Supabase po testach E2E zgodnie z wymaganiami:

✅ Global teardown uruchamiany po wszystkich testach  
✅ Usuwanie wpisów z tabeli `products` (prywatnych użytkownika)  
✅ Usuwanie powiązanych danych (fridge, recipes, history)  
✅ Wykorzystanie zmiennych środowiskowych z `.env.test`  
✅ Dokumentacja i przykłady użycia

## 🎯 Co zostało zaimplementowane

### 1. Global Teardown (`e2e/global.teardown.ts`)

Automatyczny teardown uruchamiany po zakończeniu wszystkich testów:

- ✅ Usuwa `cooking_history` dla użytkownika testowego
- ✅ Usuwa `user_products` (lodówka) dla użytkownika testowego
- ✅ Usuwa `recipe_tags` dla przepisów użytkownika
- ✅ Usuwa `recipe_ingredients` dla przepisów użytkownika
- ✅ Usuwa `recipes` użytkownika testowego
- ✅ Usuwa `products` prywatne użytkownika (user_id = test user)
- ✅ Zachowuje globalne produkty (user_id = NULL)
- ✅ Loguje szczegółowe informacje o czyszczeniu

**Kluczowe cechy:**

- Używa service role key (omija RLS)
- Usuwa dane w odpowiedniej kolejności (foreign keys)
- Nie blokuje testów jeśli cleanup fail
- Wyświetla szczegółowe logi z ilością usuniętych rekordów

### 2. Helper funkcje czyszczenia (`e2e/helpers/db-cleanup.ts`)

Biblioteka pomocnicza do selektywnego czyszczenia podczas testów:

```typescript
import {
  cleanupUserData, // Wszystkie dane użytkownika
  cleanupUserProducts, // Tylko produkty
  cleanupFridge, // Tylko lodówka
  cleanupRecipes, // Tylko przepisy
  cleanupCookingHistory, // Tylko historia
} from "./helpers/db-cleanup";
```

**Zastosowanie:**

- Czyszczenie przed testem (guaranteed clean state)
- Czyszczenie po teście (cleanup test data)
- Debugowanie (inspect data after failed test)

### 3. Konfiguracja Playwright (`playwright.config.ts`)

Zaktualizowano konfigurację:

```typescript
// Global teardown runs after all projects complete
globalTeardown: './e2e/global.teardown.ts',
```

**Lifecycle testów:**

```
1. Setup (auth.setup.ts)      ← Logowanie (1x)
2. Tests (*.spec.ts)           ← Testy E2E (parallel)
3. Global Teardown             ← Czyszczenie (1x po wszystkim)
```

### 4. Zmienne środowiskowe (`.env.test`)

⚠️ **UWAGA:** Musisz utworzyć plik `.env.test` w katalogu głównym!

```env
# Test User Credentials
E2E_USERNAME=test@foodnager.pl
E2E_PASSWORD=TestPassword123!

# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # ⚠️ WYMAGANE!

# Test User UUID
E2E_USERNAME_ID=your-test-user-uuid  # ⚠️ WYMAGANE!
```

**Gdzie znaleźć wartości:**

| Zmienna                     | Źródło                                    |
| --------------------------- | ----------------------------------------- |
| `SUPABASE_URL`              | Dashboard → Settings → API → Project URL  |
| `SUPABASE_KEY`              | Dashboard → Settings → API → anon/public  |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → Settings → API → service_role |
| `E2E_USERNAME_ID`           | Dashboard → Authentication → Users → id   |

### 5. Dokumentacja

Utworzono szczegółową dokumentację:

| Plik                                   | Opis                                                |
| -------------------------------------- | --------------------------------------------------- |
| `ENV_TEST_SETUP.md`                    | 🚀 Przewodnik konfiguracji .env.test (START TUTAJ!) |
| `e2e/DB_CLEANUP_GUIDE.md`              | 📚 Kompletny przewodnik czyszczenia bazy            |
| `e2e/QUICK_START.md`                   | ⚡ Aktualizowany quick start z teardown             |
| `e2e/README.md`                        | 📖 Zaktualizowana główna dokumentacja E2E           |
| `e2e/examples/cleanup-example.spec.ts` | 💡 Przykłady użycia cleanup                         |

## 🚀 Jak uruchomić

### Krok 1: Skonfiguruj `.env.test`

```bash
# Zobacz szczegółowe instrukcje w:
ENV_TEST_SETUP.md
```

**Minimalna konfiguracja:**

1. Utwórz `.env.test` w katalogu głównym
2. Wypełnij wymagane zmienne (zobacz sekcję 4 powyżej)
3. Upewnij się, że użytkownik testowy istnieje w Supabase

### Krok 2: Uruchom testy

```bash
# Uruchom wszystkie testy (z cleanup)
npm run test:e2e

# Lub w trybie UI (polecane)
npm run test:e2e:ui
```

### Krok 3: Sprawdź logi cleanup

Po zakończeniu testów powinieneś zobaczyć:

```
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

## 📁 Struktura plików

```
foodnager/
├── .env.test                          # ⚠️ MUSISZ UTWORZYĆ! (gitignore)
├── ENV_TEST_SETUP.md                  # 🚀 START TUTAJ - Przewodnik setup
├── E2E_TEARDOWN_IMPLEMENTATION.md     # 📋 Ten plik - podsumowanie
│
├── playwright.config.ts               # ✅ Zaktualizowane (globalTeardown)
│
├── e2e/
│   ├── global.teardown.ts             # ✨ NOWY - Global cleanup
│   ├── auth.setup.ts                  # (istniejący - bez zmian)
│   │
│   ├── helpers/
│   │   ├── db-cleanup.ts              # ✨ NOWY - Cleanup helpers
│   │   └── test-helpers.ts            # (istniejący - bez zmian)
│   │
│   ├── examples/
│   │   └── cleanup-example.spec.ts   # ✨ NOWY - Przykłady użycia
│   │
│   ├── DB_CLEANUP_GUIDE.md            # ✨ NOWY - Szczegółowy guide
│   ├── QUICK_START.md                 # ✅ Zaktualizowany
│   ├── README.md                      # ✅ Zaktualizowany
│   └── .gitignore                     # ✨ NOWY - Gitignore dla E2E
│
└── src/db/
    └── database.types.ts              # (istniejący - używany w cleanup)
```

## 🔐 Bezpieczeństwo

### ✅ Co jest bezpieczne

- `.env.test` jest w `.gitignore` (nie zostanie commitowany)
- Service role key używany TYLKO lokalnie
- Cleanup działa TYLKO na danych test usera (nie globalnych)
- Foreign keys chronią przed przypadkowym usunięciem

### ⚠️ WAŻNE OSTRZEŻENIA

- **NIGDY** nie commituj `.env.test` do Git
- **NIGDY** nie używaj produkcyjnej bazy do testów
- **NIGDY** nie udostępniaj `SUPABASE_SERVICE_ROLE_KEY`
- Używaj **TYLKO** z testową/developerską bazą danych

## 🧪 Przykłady użycia

### Przykład 1: Basic cleanup w teście

```typescript
import { cleanupFridge } from "./helpers/db-cleanup";

test("should start with empty fridge", async ({ page }) => {
  // Clean before test
  await cleanupFridge(process.env.E2E_USERNAME_ID!);

  await page.goto("/fridge");
  await expect(page.getByText("Lodówka jest pusta")).toBeVisible();
});
```

### Przykład 2: Setup/Teardown pattern

```typescript
test.describe("Fridge Tests", () => {
  test.beforeEach(async () => {
    await cleanupFridge(process.env.E2E_USERNAME_ID!);
  });

  test.afterEach(async () => {
    await cleanupFridge(process.env.E2E_USERNAME_ID!);
  });

  test("test 1", async ({ page }) => {
    // Guaranteed clean state
  });
});
```

### Przykład 3: Selective cleanup

```typescript
import { cleanupRecipes, cleanupCookingHistory } from "./helpers/db-cleanup";

// Clean only recipes
await cleanupRecipes(TEST_USER_ID);

// Clean only history
await cleanupCookingHistory(TEST_USER_ID);
```

**Więcej przykładów:** Zobacz `e2e/examples/cleanup-example.spec.ts`

## 🔍 Debugging & Troubleshooting

### Problem: "Skipping database cleanup: SUPABASE_SERVICE_ROLE_KEY not configured"

**Rozwiązanie:**

1. Otwórz Supabase Dashboard → Settings → API
2. Skopiuj "service_role" key
3. Dodaj do `.env.test`:
   ```env
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   ```

### Problem: "Skipping database cleanup: E2E_USERNAME_ID not configured"

**Rozwiązanie:**

1. Supabase Dashboard → Authentication → Users
2. Znajdź `test@foodnager.pl`
3. Skopiuj UUID (id)
4. Dodaj do `.env.test`:
   ```env
   E2E_USERNAME_ID=a1b2c3d4-e5f6-...
   ```

### Problem: Cleanup nie usuwa danych

**Rozwiązanie:**

1. Sprawdź logi - czy cleanup się uruchamia?
2. Sprawdź `E2E_USERNAME_ID` - czy to poprawny UUID?
3. Sprawdź service role key - czy jest poprawny?
4. Sprawdź RLS policies - czy są włączone?

**Debug:**

```sql
-- Check test user data
SELECT COUNT(*) FROM user_products
WHERE user_id = 'your-test-user-id';
```

### Problem: Foreign key violations podczas cleanup

**Rozwiązanie:**

- Cleanup usuwa dane we właściwej kolejności
- Jeśli błąd występuje, sprawdź czy nie ma cyklicznych foreign keys
- Zobacz logi - który table wywołuje błąd?

**Więcej troubleshooting:** Zobacz `e2e/DB_CLEANUP_GUIDE.md`

## 📊 Co jest czyszczone

| Tabela               | Warunek                       | Ile rekordów   |
| -------------------- | ----------------------------- | -------------- |
| `cooking_history`    | `user_id = test user`         | Wszystkie      |
| `user_products`      | `user_id = test user`         | Wszystkie      |
| `recipe_tags`        | `recipe_id IN (user recipes)` | Wszystkie      |
| `recipe_ingredients` | `recipe_id IN (user recipes)` | Wszystkie      |
| `recipes`            | `user_id = test user`         | Wszystkie      |
| `products`           | `user_id = test user`         | Tylko prywatne |

**Co NIE jest czyszczone:**

- ❌ Globalne produkty (`user_id = NULL`)
- ❌ Jednostki (`units`)
- ❌ Tagi (`tags`)
- ❌ Sam użytkownik testowy (`auth.users`)

## 🎓 Kolejne kroki

1. **[START TUTAJ]** Przeczytaj `ENV_TEST_SETUP.md` - konfiguracja .env.test
2. Utwórz plik `.env.test` z wymaganymi zmiennymi
3. Uruchom testy: `npm run test:e2e`
4. Sprawdź logi cleanup
5. Zobacz przykłady w `e2e/examples/cleanup-example.spec.ts`
6. Przeczytaj szczegółowy guide: `e2e/DB_CLEANUP_GUIDE.md`

## 📚 Dokumentacja

| Dokument                               | Dla kogo     | Czas czytania |
| -------------------------------------- | ------------ | ------------- |
| `ENV_TEST_SETUP.md`                    | Wszyscy      | 5 min         |
| `e2e/QUICK_START.md`                   | Początkujący | 3 min         |
| `e2e/README.md`                        | Wszyscy      | 10 min        |
| `e2e/DB_CLEANUP_GUIDE.md`              | Advanced     | 15 min        |
| `e2e/examples/cleanup-example.spec.ts` | Developerzy  | 5 min         |

## ✅ Checklist

Przed pierwszym uruchomieniem testów:

- [ ] Przeczytałem `ENV_TEST_SETUP.md`
- [ ] Utworzyłem plik `.env.test`
- [ ] Dodałem `SUPABASE_URL`, `SUPABASE_KEY`
- [ ] Dodałem `SUPABASE_SERVICE_ROLE_KEY` (⚠️ service role!)
- [ ] Dodałem `E2E_USERNAME_ID`
- [ ] Utworzyłem użytkownika testowego w Supabase
- [ ] Email użytkownika jest potwierdzony
- [ ] Uruchomiłem testy: `npm run test:e2e`
- [ ] Widzę logi cleanup w konsoli

## 🎉 Gotowe!

Twoje testy E2E są teraz w pełni skonfigurowane z automatycznym czyszczeniem bazy danych!

**Następne uruchomienie:**

```bash
npm run test:e2e
```

**W razie problemów:**

- Zobacz `ENV_TEST_SETUP.md` - setup guide
- Zobacz `e2e/DB_CLEANUP_GUIDE.md` - troubleshooting
- Sprawdź logi w konsoli
- Sprawdź konfigurację `.env.test`

---

**Pytania?** Zobacz dokumentację w katalogu `e2e/`
