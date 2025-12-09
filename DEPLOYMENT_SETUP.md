# Deployment Setup - Cloudflare Pages

## ✅ Zmiany wprowadzone w projekcie

### 1. Adapter Astro

**Zmieniono:** `@astrojs/node` → `@astrojs/cloudflare`

**Plik:** `astro.config.mjs`

```javascript
adapter: cloudflare({
  mode: "directory",
  platformProxy: {
    enabled: true,
  },
});
```

### 2. Konfiguracja Cloudflare

**Utworzono:** `wrangler.toml`

Podstawowa konfiguracja dla Cloudflare Pages:

- Project name: `foodnager`
- Build output: `dist/`
- Compatibility date: 2024-12-09

### 3. GitHub Actions Workflow

**Utworzono:** `.github/workflows/master.yml`

Nowy workflow do automatycznego deploymentu na Cloudflare Pages:

**Triggery:**

- Push do brancha `master`
- Ręczne uruchomienie (workflow_dispatch)

**Struktura (2 joby):**

**Job 1: Build & Test**

1. ✅ Checkout kodu
2. ✅ Setup Node.js (wersja z `.nvmrc`: 22.14.0)
3. ✅ Instalacja zależności (`npm ci`)
4. ✅ Lint (ESLint + Prettier)
5. ✅ Build produkcyjny (`npm run build`)
6. ✅ Testy jednostkowe (`npm run test:run`)
7. ✅ Upload artifact `dist/`

**Job 2: Deploy (wymaga pomyślnego build)**

1. ✅ Checkout kodu
2. ✅ Download artifact `dist/`
3. ✅ Deploy do Cloudflare Pages z:
   - Environment: `production`
   - Permissions: `contents: read`, `deployments: write`
   - GitHubToken dla statusów deploymentu
4. ✅ Summary z Deployment URL

**Różnice względem `ci.yml`:**

- ❌ Brak testów E2E (zbyt czasochłonne dla każdego deployu)
- ✅ Automatyczny deployment po pomyślnym przejściu testów
- ✅ Osobny job deploy z GitHub Environment
- ✅ Deployment tracking i statusy

### 4. Dokumentacja

**Utworzono:**

- `.ai/cloudflare-deployment.md` - szczegółowa dokumentacja deploymentu
- `.ai/github-secrets-setup.md` - instrukcje konfiguracji GitHub Secrets
- `DEPLOYMENT_SETUP.md` - ten plik (podsumowanie zmian)

**Zaktualizowano:**

- `README.md` - dodano sekcję "Deployment"
- `.ai/tech-stack.md` - zaktualizowano hosting na Cloudflare Pages

### 5. Zależności

**Dodano:**

- `@astrojs/cloudflare` - adapter dla Cloudflare Pages

**Usunięto:**

- `@astrojs/node` - nie jest już potrzebny

## 📋 Wymagane kroki do uruchomienia deploymentu

### Krok 1: Utworzenie projektu w Cloudflare Pages

1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Przejdź do `Workers & Pages`
3. Kliknij `Create application` → `Pages` → `Connect to Git`
4. **UWAGA:** Nie łącz repozytorium! Kliknij `Cancel`
5. Zamiast tego, kliknij `Create application` → `Pages` → `Upload assets`
6. Podaj nazwę projektu: `foodnager`
7. Kliknij `Create project`

**Dlaczego nie łączymy z Git?**

- Chcemy pełnej kontroli nad procesem deploymentu przez GitHub Actions
- Unikamy podwójnego deploymentu (Cloudflare + GitHub Actions)
- Możemy dodać dodatkowe kroki w CI/CD (testy, linting, etc.)

### Krok 2: Konfiguracja GitHub Secrets

W repozytorium GitHub (`Settings` → `Secrets and variables` → `Actions`) dodaj:

**Build Secrets:**

- `SUPABASE_URL` - URL Twojej instancji Supabase
- `SUPABASE_KEY` - Klucz publiczny (anon key) Supabase

**Cloudflare Secrets:**

- `CLOUDFLARE_API_TOKEN` - Token API z uprawnieniami do Cloudflare Pages
- `CLOUDFLARE_ACCOUNT_ID` - ID konta Cloudflare

📖 Szczegółowe instrukcje: `.ai/github-secrets-setup.md`

### Krok 3: Konfiguracja zmiennych środowiskowych w Cloudflare

1. W Cloudflare Dashboard przejdź do projektu `foodnager`
2. Kliknij `Settings` → `Environment variables`
3. Dodaj zmienne dla środowiska **Production**:
   - `SUPABASE_URL` - URL Twojej instancji Supabase
   - `SUPABASE_KEY` - Klucz publiczny (anon key) Supabase

### Krok 4: Pierwszy deployment

**Opcja A - Automatyczny (zalecane):**

```bash
git add .
git commit -m "feat: configure Cloudflare Pages deployment"
git push origin master
```

Workflow automatycznie się uruchomi i wdroży aplikację.

**Opcja B - Ręczny:**

1. Przejdź do zakładki `Actions` w repozytorium GitHub
2. Wybierz workflow `Deploy to Cloudflare Pages`
3. Kliknij `Run workflow`
4. Wybierz branch `master`
5. Kliknij `Run workflow`

### Krok 5: Weryfikacja deploymentu

1. Sprawdź status workflow w zakładce `Actions`
2. Po pomyślnym deploymencie, przejdź do Cloudflare Dashboard
3. `Workers & Pages` → `foodnager` → `Deployments`
4. Kliknij na najnowszy deployment aby zobaczyć URL aplikacji
5. Otwórz URL w przeglądarce i zweryfikuj działanie aplikacji

## 🔧 Testowanie lokalne

Przed deploymentem zawsze testuj lokalnie:

```bash
# Instalacja zależności
npm ci

# Lint
npm run lint

# Build
npm run build

# Testy jednostkowe
npm run test:run
```

Jeśli wszystkie kroki przejdą pomyślnie lokalnie, deployment również powinien się udać.

## 🚨 Troubleshooting

### Build fails lokalnie:

```bash
# Sprawdź czy wszystkie zależności są zainstalowane
npm ci

# Sprawdź czy zmienne środowiskowe są ustawione
cat .env

# Spróbuj wyczyścić cache
rm -rf node_modules dist .astro
npm ci
npm run build
```

### Deployment fails w GitHub Actions:

1. Sprawdź logi w zakładce `Actions`
2. Upewnij się, że wszystkie GitHub Secrets są poprawnie ustawione
3. Zweryfikuj czy `CLOUDFLARE_API_TOKEN` ma odpowiednie uprawnienia
4. Sprawdź czy `CLOUDFLARE_ACCOUNT_ID` jest poprawny

### Aplikacja nie działa po deploymencie:

1. Sprawdź czy zmienne środowiskowe są ustawione w Cloudflare Dashboard
2. Zweryfikuj logi w Cloudflare Pages Dashboard
3. Sprawdź czy Supabase credentials są poprawne
4. Zweryfikuj czy RLS policies w Supabase są poprawnie skonfigurowane

## 📚 Przydatne linki

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Wrangler Action](https://github.com/cloudflare/wrangler-action)
- [GitHub Actions Docs](https://docs.github.com/en/actions)

## 🎯 Następne kroki

Po pomyślnym deploymencie:

1. ✅ Skonfiguruj custom domain w Cloudflare Pages (opcjonalnie)
2. ✅ Dodaj monitoring i alerty
3. ✅ Skonfiguruj preview deployments dla PR (opcjonalnie)
4. ✅ Zoptymalizuj performance (Lighthouse CI)
5. ✅ Dodaj analytics (Cloudflare Web Analytics)

## 📝 Notatki

- Workflow `ci.yml` nadal istnieje i służy do testowania (z E2E)
- Workflow `master.yml` służy do deploymentu (bez E2E)
- Możesz uruchomić oba workflow ręcznie z zakładki `Actions`
- Deployment zajmuje ~2-3 minuty (bez E2E)
- Cloudflare Pages automatycznie cachuje statyczne assety
- HTTPS jest automatycznie skonfigurowane
