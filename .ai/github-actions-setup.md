# 🚀 Konfiguracja GitHub Actions CI/CD

## 📋 Przegląd

Projekt używa GitHub Actions do automatycznego uruchamiania testów i buildu. Workflow wykonuje:

1. **Lint** - ESLint + Prettier
2. **Build** - Budowanie wersji produkcyjnej (`npm run build`)
3. **Unit Tests** - Testy jednostkowe i komponentów (Vitest)
4. **E2E Tests** - Testy end-to-end (Playwright) ← **z możliwością wyłączenia**

## 🎯 Triggery

Workflow uruchamia się:

- ✅ **Automatycznie** po pushu do brancha `master`
- ✅ **Manualnie** z poziomu GitHub UI (Actions → CI - Tests & Build → Run workflow)
  - Z opcją pominięcia testów E2E (checkbox "Pomiń testy E2E")

## 🔐 Konfiguracja GitHub Secrets

### Krok 1: Przejdź do ustawień Secrets

1. Otwórz swoje repozytorium na GitHub
2. Przejdź do **Settings** → **Secrets and variables** → **Actions**
3. Kliknij **New repository secret**

### Krok 2: Dodaj wymagane Secrets

#### Zmienne z pliku `.env` (wymagane do buildu)

| Secret Name         | Opis                  | Gdzie znaleźć                                         |
| ------------------- | --------------------- | ----------------------------------------------------- |
| `SUPABASE_URL`      | URL projektu Supabase | Supabase Dashboard → Settings → API → Project URL     |
| `SUPABASE_ANON_KEY` | Publiczny klucz API   | Supabase Dashboard → Settings → API → anon/public key |

**Dodaj w GitHub:**

```
Name: SUPABASE_URL
Secret: https://your-project.supabase.co

Name: SUPABASE_ANON_KEY
Secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Zmienne z pliku `.env.test` (wymagane do testów E2E)

⚠️ **UWAGA:** Używaj TYLKO danych z dedykowanej testowej instancji Supabase!

| Secret Name                 | Opis                           | Gdzie znaleźć                                      |
| --------------------------- | ------------------------------ | -------------------------------------------------- |
| `E2E_USERNAME`              | Email użytkownika testowego    | Twój testowy użytkownik (np. `test@foodnager.pl`)  |
| `E2E_PASSWORD`              | Hasło użytkownika testowego    | Hasło testowe (np. `TestPassword123!`)             |
| `E2E_TEST_USER_ID`          | UUID użytkownika testowego     | Supabase Dashboard → Authentication → Users        |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (dla cleanup) | Supabase Dashboard → Settings → API → service_role |

**Dodaj w GitHub:**

```
Name: E2E_USERNAME
Secret: test@foodnager.pl

Name: E2E_PASSWORD
Secret: TestPassword123!

Name: E2E_TEST_USER_ID
Secret: a1b2c3d4-e5f6-7890-abcd-1234567890ab

Name: SUPABASE_SERVICE_ROLE_KEY
Secret: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Krok 3: Weryfikacja

Po dodaniu wszystkich secrets, lista powinna wyglądać tak:

```
✅ SUPABASE_URL
✅ SUPABASE_ANON_KEY
✅ E2E_USERNAME
✅ E2E_PASSWORD
✅ E2E_TEST_USER_ID
✅ SUPABASE_SERVICE_ROLE_KEY
```

## 🎬 Uruchamianie workflow

### Automatyczne uruchomienie

Workflow uruchomi się automatycznie po:

```bash
git push origin master
```

### Manualne uruchomienie

1. Przejdź do zakładki **Actions** w repozytorium
2. Wybierz workflow **"CI - Tests & Build"**
3. Kliknij **"Run workflow"**
4. (Opcjonalnie) Zaznacz **"Pomiń testy E2E"** jeśli chcesz tylko szybką weryfikację
5. Kliknij **"Run workflow"**

## 🔧 Wyłączanie testów E2E

Testy E2E można wyłączyć na dwa sposoby:

### Opcja 1: Podczas manualnego uruchomienia

- Zaznacz checkbox **"Pomiń testy E2E"** w UI GitHub Actions

### Opcja 2: Edycja workflow (trwałe wyłączenie)

Edytuj `.github/workflows/ci.yml` i dodaj warunek do kroku E2E:

```yaml
- name: 🎬 Run E2E tests
  if: false # ← Dodaj tę linię aby wyłączyć E2E
  run: npm run test:e2e
```

## 📊 Raporty i Artefakty

Workflow automatycznie zapisuje:

1. **Coverage Report** - Raport pokrycia kodu testami (zawsze)
   - Dostępny w: Actions → konkretny run → Artifacts → `coverage-report`
2. **Playwright Report** - Raport testów E2E (tylko przy błędach)
   - Dostępny w: Actions → konkretny run → Artifacts → `playwright-report`
3. **Test Videos** - Nagrania testów E2E (tylko przy błędach)
   - Dostępny w: Actions → konkretny run → Artifacts → `test-videos`

Artefakty są przechowywane przez **7 dni**.

## ⚡ Optymalizacje

### Cache Dependencies

Workflow używa cache dla `node_modules`:

```yaml
- uses: actions/setup-node@v4
  with:
    cache: "npm" # ← Automatyczny cache
```

### Retry na błędy (E2E)

Testy E2E automatycznie powtarzają się 2 razy przy błędzie (tylko w CI):

```typescript
// playwright.config.ts
retries: process.env.CI ? 2 : 0;
```

## 🐛 Troubleshooting

### ❌ "Secrets not found"

**Problem:** Workflow nie może znaleźć secrets.

**Rozwiązanie:**

- Sprawdź czy wszystkie secrets są dodane w Settings → Secrets
- Sprawdź wielkość liter - nazwy muszą się zgadzać dokładnie

### ❌ "E2E tests failed - Authentication error"

**Problem:** Testy E2E nie mogą się zalogować.

**Rozwiązanie:**

- Sprawdź czy użytkownik testowy istnieje w Supabase
- Sprawdź czy `E2E_USERNAME` i `E2E_PASSWORD` są poprawne
- Sprawdź czy email jest potwierdzony (confirmed)

### ❌ "Build failed - Missing environment variables"

**Problem:** Build nie może znaleźć zmiennych środowiskowych.

**Rozwiązanie:**

- Upewnij się, że `SUPABASE_URL` i `SUPABASE_ANON_KEY` są dodane do secrets
- Sprawdź czy są one użyte w sekcji `env:` w workflow

### ⚠️ "E2E database cleanup failed"

**Problem:** Czyszczenie bazy testowej nie działa.

**Rozwiązanie:**

- Sprawdź czy `SUPABASE_SERVICE_ROLE_KEY` jest poprawny
- Upewnij się, że używasz dedykowanej testowej instancji Supabase
- ⚠️ NIGDY nie używaj klucza service_role z produkcyjnej bazy!

## 📋 Checklist przed pierwszym uruchomieniem

- [ ] Dodany secret: `SUPABASE_URL`
- [ ] Dodany secret: `SUPABASE_ANON_KEY`
- [ ] Dodany secret: `E2E_USERNAME`
- [ ] Dodany secret: `E2E_PASSWORD`
- [ ] Dodany secret: `E2E_TEST_USER_ID`
- [ ] Dodany secret: `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Użytkownik testowy istnieje w testowej bazie Supabase
- [ ] Email użytkownika testowego jest potwierdzony
- [ ] Workflow file: `.github/workflows/ci.yml` jest w repozytorium
- [ ] Plik `.nvmrc` istnieje (określa wersję Node.js)

## 🎉 Gotowe!

Po skonfigurowaniu wszystkich secrets możesz:

```bash
git add .
git commit -m "feat: add CI/CD workflow"
git push origin master
```

Workflow uruchomi się automatycznie i zobaczysz rezultaty w zakładce **Actions** na GitHub.

## 📚 Więcej informacji

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Playwright CI Documentation](https://playwright.dev/docs/ci)
- [Vitest Documentation](https://vitest.dev/)
- Dokumentacja testów w projekcie: `TESTING_SETUP.md`, `ENV_TEST_SETUP.md`
