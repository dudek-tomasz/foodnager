# ⚡ CI/CD Quick Start

## 🎯 Cel

Minimalny setup GitHub Actions dla weryfikacji kodu:
- ✅ Lint (ESLint + Prettier)
- ✅ Build (produkcyjny)
- ✅ Unit Tests (Vitest)
- ✅ E2E Tests (Playwright) - opcjonalne

## 📦 Co zostało przygotowane

```
.github/workflows/ci.yml          ← Główny workflow
.env.example                      ← Szablon zmiennych środowiskowych
.ai/github-actions-setup.md       ← Szczegółowa dokumentacja konfiguracji
.ai/github-action.mdc             ← Reguły dla AI + konfiguracja projektu
```

## 🚀 Szybka konfiguracja (5 minut)

### Krok 1: Dodaj GitHub Secrets

Przejdź do: **GitHub Repository** → **Settings** → **Secrets and variables** → **Actions**

Dodaj następujące secrets:

#### Build (z twojego pliku `.env`)
```
SUPABASE_URL            = <twój URL>
SUPABASE_ANON_KEY       = <twój anon key>
```

#### E2E Tests (z twojego pliku `.env.test`)
```
E2E_USERNAME                 = test@foodnager.pl
E2E_PASSWORD                 = TestPassword123!
E2E_TEST_USER_ID             = <UUID z Supabase>
SUPABASE_SERVICE_ROLE_KEY    = <service role key>
```

> 💡 **Podpowiedź:** Otwórz swoje lokalne pliki `.env` i `.env.test` i skopiuj wartości

### Krok 2: Commit i Push

```bash
git add .github/workflows/ci.yml .env.example
git commit -m "feat: add CI/CD workflow"
git push origin master
```

### Krok 3: Sprawdź wynik

1. Przejdź do zakładki **Actions** w GitHub
2. Powinieneś zobaczyć workflow **"CI - Tests & Build"** w trakcie wykonywania
3. Czekaj na zielony checkmark ✅

## 🎮 Użycie

### Automatyczne uruchomienie
Workflow uruchamia się automatycznie przy każdym pushu do `master`:
```bash
git push origin master
```

### Manualne uruchomienie
1. GitHub → **Actions** → **CI - Tests & Build**
2. Kliknij **"Run workflow"**
3. (Opcjonalnie) Zaznacz **"Pomiń testy E2E"** dla szybszej weryfikacji
4. Kliknij **"Run workflow"**

## 🔧 Wyłączanie E2E (jeśli potrzeba)

### Tymczasowo (jeden run)
- Użyj checkboxa "Pomiń testy E2E" podczas manualnego uruchomienia

### Trwale
Edytuj `.github/workflows/ci.yml` i zmień:
```yaml
- name: 🎬 Run E2E tests
  if: false  # ← Zmień z '${{ !inputs.skip_e2e }}' na 'false'
  run: npm run test:e2e
```

## 📊 Co zobaczysz w Actions

Workflow wykonuje następujące kroki:

```
📥 Checkout code
🟢 Setup Node.js (22.14.0 z .nvmrc)
📦 Install dependencies (npm ci)
🔍 Run ESLint
✨ Check code formatting (Prettier)
🏗️ Build production
🧪 Run unit tests
📊 Generate coverage report
📤 Upload coverage report
🎭 Install Playwright browsers (jeśli E2E włączone)
🎬 Run E2E tests (jeśli E2E włączone)
📤 Upload Playwright report (jeśli błąd)
📹 Upload test videos (jeśli błąd)
✅ CI Summary
```

## 🎯 Interpretacja wyników

### ✅ Wszystko zielone
Kod jest gotowy do merge/deploy!

### ❌ Czerwony status

**Lint failed:**
```bash
npm run lint         # Sprawdź błędy lokalnie
npm run lint:fix     # Auto-fix
```

**Build failed:**
- Sprawdź czy wszystkie zmienne środowiskowe są w secrets
- Sprawdź błędy kompilacji TypeScript

**Unit tests failed:**
```bash
npm run test:run     # Uruchom lokalnie
npm run test:ui      # Debuguj w UI
```

**E2E tests failed:**
- Sprawdź czy użytkownik testowy istnieje
- Sprawdź czy credentials są poprawne
- Pobierz artifacts "playwright-report" i "test-videos"

## 📚 Więcej informacji

- **Szczegółowa dokumentacja:** `.ai/github-actions-setup.md`
- **Konfiguracja testów E2E:** `ENV_TEST_SETUP.md`
- **Konfiguracja testów:** `TESTING_SETUP.md`

## ✅ Checklist

Przed pierwszym uruchomieniem upewnij się, że:

- [ ] Dodałeś wszystkie 6 secrets w GitHub
- [ ] Użytkownik testowy istnieje w Supabase (testowa instancja!)
- [ ] Email użytkownika testowego jest potwierdzony
- [ ] Workflow file `.github/workflows/ci.yml` jest w repo
- [ ] Plik `.nvmrc` istnieje (określa Node.js version)
- [ ] Commitujesz i pushujesz do brancha `master`

## 🎉 Gotowe!

Po pierwszym uruchomieniu możesz:
- 👀 Monitorować każdy push w zakładce Actions
- 📊 Pobierać raporty coverage
- 🎬 Debugować E2E testy przez videos
- ⚡ Szybko weryfikować kod przed merge

---

**Problemy?** Zobacz `.ai/github-actions-setup.md` → sekcja "Troubleshooting"

