# 🚀 CI/CD Setup - Foodnager

## ⚡ Quick Start

**Dla szczegółowej instrukcji zobacz:** `.ai/CI-CD-QUICK-START.md`

## 📦 Co zostało skonfigurowane

### Pliki

```
✅ .github/workflows/ci.yml           Główny workflow GitHub Actions
✅ .env.example                       Szablon zmiennych środowiskowych (build)
✅ .env.test.example                  Szablon zmiennych testowych (E2E)
✅ .ai/CI-CD-QUICK-START.md           Szybki start (5 min)
✅ .ai/github-actions-setup.md        Szczegółowa dokumentacja
✅ .ai/github-action.mdc              Reguły dla AI
```

### Workflow

**Trigger:**

- ✅ Automatycznie: push do `master`
- ✅ Manualnie: GitHub Actions UI (z opcją pominięcia E2E)

**Kroki:**

1. 🔍 Lint (ESLint + Prettier)
2. 🏗️ Build produkcyjny
3. 🧪 Testy jednostkowe (Vitest)
4. 🎬 Testy E2E (Playwright) - opcjonalne

## 🔐 Wymagane GitHub Secrets

### Z pliku `.env` (build)

```
SUPABASE_URL
SUPABASE_ANON_KEY
```

### Z pliku `.env.test` (E2E)

```
E2E_USERNAME
E2E_PASSWORD
E2E_TEST_USER_ID
SUPABASE_SERVICE_ROLE_KEY
```

**Jak dodać secrets:**
GitHub Repository → Settings → Secrets and variables → Actions → New repository secret

## 🎯 Pierwsze uruchomienie

1. **Dodaj wszystkie 6 secrets w GitHub** (szczegóły w `.ai/github-actions-setup.md`)
2. **Commit i push:**
   ```bash
   git add .
   git commit -m "feat: add CI/CD workflow"
   git push origin master
   ```
3. **Sprawdź status:**
   GitHub → zakładka **Actions**

## 📚 Dokumentacja

- **Quick Start (5 min):** `.ai/CI-CD-QUICK-START.md`
- **Pełna konfiguracja:** `.ai/github-actions-setup.md`
- **Troubleshooting:** `.ai/github-actions-setup.md` → sekcja "Troubleshooting"
- **Konfiguracja testów E2E:** `ENV_TEST_SETUP.md`

## 💡 Tips

### Wyłącz E2E tymczasowo

GitHub → Actions → CI - Tests & Build → Run workflow → ✅ "Pomiń testy E2E"

### Wyłącz E2E na stałe

Edytuj `.github/workflows/ci.yml`:

```yaml
- name: 🎬 Run E2E tests
  if: false # ← zmień na false
```

### Pobierz raporty z błędów

GitHub → Actions → konkretny run → Artifacts → `playwright-report` / `test-videos`

## ✅ Gotowe!

Po skonfigurowaniu wszystko działa automatycznie przy każdym pushu do `master`. 🎉
