# E2E CI Fix Summary

## Problem

Testy E2E nie działały na GitHub Actions z następującymi błędami:

1. **Invalid API key** - brak zmiennych środowiskowych Supabase
2. **Dotenv ładuje 0 zmiennych** - `[dotenv@17.2.3] injecting env (0)`
3. **Błędy strukturalne testów:**
   - `global.teardown.ts` używał niepoprawnego API
   - `cleanup-example.spec.ts` miał błędne użycie `test.afterEach()`
   - `example.spec.ts` miał strict mode violation (2 elementy `nav`)

## Rozwiązanie

### 1. Naprawiono `e2e/global.teardown.ts`

**Problem:** Plik używał `test()` zamiast eksportować funkcję.

**Rozwiązanie:** Zmieniono na eksport domyślnej funkcji:

```typescript
// Przed:
import { test as teardown } from "@playwright/test";
teardown("cleanup database", async () => { ... });

// Po:
export default async function globalTeardown() { ... }
```

### 2. Naprawiono `e2e/examples/cleanup-example.spec.ts`

**Problem:** `test.afterEach()` był wywoływany wewnątrz testu (zabronione).

**Rozwiązanie:** Przeniesiono do `test.describe()`:

```typescript
// Przed:
test("should add product", async ({ page }) => {
  test.afterEach(async () => { ... }); // ❌ Błąd!
});

// Po:
test.describe("Product Management", () => {
  test.afterEach(async () => { ... }); // ✅ Poprawnie

  test("should add product", async ({ page }) => { ... });
});
```

### 3. Naprawiono `e2e/example.spec.ts`

**Problem:** Strict mode violation - 2 elementy `nav` (sidebar + bottom navigation).

**Rozwiązanie:** Użyto `.first()`:

```typescript
// Przed:
const nav = page.locator("nav"); // ❌ 2 elementy

// Po:
const nav = page.locator("nav").first(); // ✅ Wybiera pierwszy
```

### 4. Naprawiono `.github/workflows/ci.yml`

**Problem:** Oryginalnie w kodzie była niekonsekwencja - sekret w GitHub nazywał się `E2E_USERNAME_ID`, ale kod używał `E2E_TEST_USER_ID`.

**Rozwiązanie:**

- Zunifikowano nazewnictwo - wszędzie używamy `E2E_USERNAME_ID`
- Sekret w GitHub: `E2E_USERNAME_ID`
- Zmienna środowiskowa w kodzie: `E2E_USERNAME_ID`
- Dodano walidację wszystkich wymaganych sekretów
- Workflow teraz failuje wcześnie jeśli brakuje sekretów

```yaml
# Poprawnie - wszędzie E2E_USERNAME_ID:
E2E_TEST_USER_ID: ${{ secrets.E2E_USERNAME_ID }} # ✅ Mapowanie w CI
echo "E2E_TEST_USER_ID=${{ secrets.E2E_USERNAME_ID }}" >> .env.test # ✅ Dla kompatybilności
```

### 5. Usunięto projekt "teardown" z `playwright.config.ts`

**Problem:** Duplikacja - był zarówno projekt "teardown" jak i `globalTeardown`.

**Rozwiązanie:** Usunięto projekt, pozostawiono tylko `globalTeardown`.

## Nowe pliki i dokumentacja

### 1. `docs/GITHUB_SECRETS.md`

Szczegółowa dokumentacja konfiguracji sekretów GitHub:

- Lista wszystkich wymaganych sekretów
- Instrukcje gdzie je znaleźć
- Jak stworzyć test usera w Supabase
- Troubleshooting

### 2. `e2e/README.md`

Kompletna dokumentacja E2E testów:

- Setup lokalny
- Uruchamianie testów
- Struktura testów
- Wzorce testowe (Page Objects, cleanup)
- Best practices
- Troubleshooting

### 3. `scripts/verify-test-env.js`

Skrypt weryfikujący konfigurację środowiska testowego:

- Sprawdza czy `.env.test` istnieje
- Waliduje wszystkie wymagane zmienne
- Sprawdza formaty (UUID, email, URL)
- Daje jasne komunikaty błędów

Użycie:

```bash
npm run test:e2e:verify
```

### 4. Zaktualizowano `README.md`

Dodano sekcję o E2E testach z linkami do dokumentacji.

## Wymagane akcje użytkownika

### Krok 1: Skonfiguruj sekrety w GitHub

Przejdź do: **Repository → Settings → Secrets and variables → Actions**

Dodaj następujące sekrety:

| Nazwa                       | Opis                  | Gdzie znaleźć                             |
| --------------------------- | --------------------- | ----------------------------------------- |
| `SUPABASE_URL`              | URL projektu Supabase | Dashboard → Settings → API                |
| `SUPABASE_KEY`              | Anon key              | Dashboard → Settings → API → anon public  |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key      | Dashboard → Settings → API → service_role |
| `E2E_USERNAME`              | Email test usera      | Twój test user                            |
| `E2E_PASSWORD`              | Hasło test usera      | Twoje hasło                               |
| `E2E_USERNAME_ID`           | UUID test usera       | Dashboard → Auth → Users                  |

### Krok 2: Stwórz test usera w Supabase

1. Przejdź do: **Supabase Dashboard → Authentication → Users**
2. Kliknij **"Add user" → "Create new user"**
3. Wprowadź email i hasło (te same co w sekretach GitHub)
4. Potwierdź usera (jeśli email confirmation jest włączone)
5. Skopiuj UUID usera (to będzie `E2E_USERNAME_ID`)

### Krok 3: Weryfikacja lokalnie (opcjonalnie)

Jeśli chcesz uruchomić testy lokalnie:

1. Stwórz plik `.env.test` w głównym katalogu:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
E2E_USERNAME=test@example.com
E2E_PASSWORD=your-password
E2E_USERNAME_ID=00000000-0000-0000-0000-000000000000
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

2. Zweryfikuj konfigurację:

```bash
npm run test:e2e:verify
```

3. Uruchom testy:

```bash
npm run test:e2e
```

### Krok 4: Uruchom CI ponownie

Po skonfigurowaniu sekretów:

1. Zrób commit i push zmian
2. Lub uruchom workflow manualnie: **Actions → CI - Tests & Build → Run workflow**

## Weryfikacja poprawności

### W CI workflow powinieneś zobaczyć:

```
📋 Checking if required secrets are set:
✓ SUPABASE_URL
✓ SUPABASE_KEY
✓ SUPABASE_SERVICE_ROLE_KEY
✓ E2E_USERNAME
✓ E2E_PASSWORD
✓ E2E_USERNAME_ID
```

### Jeśli brakuje sekretów:

```
✗ SUPABASE_SERVICE_ROLE_KEY MISSING!
❌ Critical Supabase secrets are missing!
```

Workflow failuje wcześnie, przed uruchomieniem testów.

## Troubleshooting

### Problem: "Invalid API key" w testach

**Przyczyna:** Brak lub niepoprawny `SUPABASE_SERVICE_ROLE_KEY`

**Rozwiązanie:**

1. Sprawdź czy sekret jest ustawiony w GitHub
2. Zweryfikuj wartość w Supabase Dashboard → Settings → API → service_role
3. Upewnij się że kopiujesz **service_role** a nie **anon** key

### Problem: "dotenv injecting env (0)"

**Przyczyna:** Plik `.env.test` jest pusty lub sekrety nie są ustawione

**Rozwiązanie:**

1. Sprawdź logi kroku "Create .env files" w CI
2. Poszukaj komunikatów "MISSING!"
3. Dodaj brakujące sekrety w GitHub

### Problem: Test authentication fails

**Przyczyna:** Test user nie istnieje lub niepoprawne credentials

**Rozwiązanie:**

1. Sprawdź czy user istnieje w Supabase Auth
2. Zweryfikuj email i hasło w sekretach
3. Upewnij się że user jest potwierdzony (email verified)
4. Upewnij się że `E2E_USERNAME_ID` jest ustawiony poprawnie

### Problem: Strict mode violation w testach

**Przyczyna:** Selektor znajduje więcej niż 1 element

**Rozwiązanie:** Użyj `.first()`, `.last()` lub bardziej specyficznego selektora

## Zmiany w plikach

### Zmodyfikowane:

- `.github/workflows/ci.yml` - poprawiono sekrety i dodano walidację
- `e2e/global.teardown.ts` - zmieniono na export funkcji
- `e2e/examples/cleanup-example.spec.ts` - poprawiono użycie afterEach
- `e2e/example.spec.ts` - dodano .first() dla nav
- `playwright.config.ts` - usunięto projekt teardown
- `package.json` - dodano skrypt test:e2e:verify
- `README.md` - dodano sekcję o E2E testach

### Nowe:

- `docs/GITHUB_SECRETS.md` - dokumentacja sekretów
- `e2e/README.md` - dokumentacja E2E testów
- `scripts/verify-test-env.js` - skrypt weryfikacji środowiska
- `docs/E2E_CI_FIX_SUMMARY.md` - ten plik

## Następne kroki

1. ✅ Skonfiguruj sekrety w GitHub (Krok 1)
2. ✅ Stwórz test usera w Supabase (Krok 2)
3. ✅ Uruchom CI ponownie (Krok 4)
4. 📖 Przeczytaj `e2e/README.md` dla więcej informacji o testach
5. 📖 Przeczytaj `docs/GITHUB_SECRETS.md` dla szczegółów o sekretach

## Kontakt

Jeśli masz pytania lub problemy:

1. Sprawdź `e2e/README.md` - sekcja Troubleshooting
2. Sprawdź `docs/GITHUB_SECRETS.md` - sekcja Troubleshooting
3. Sprawdź logi CI workflow w GitHub Actions
