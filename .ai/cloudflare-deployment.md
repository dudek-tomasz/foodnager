# Cloudflare Pages Deployment - Foodnager

## Przegląd

Projekt Foodnager jest skonfigurowany do automatycznego deploymentu na Cloudflare Pages za pomocą GitHub Actions.

## Konfiguracja projektu

### 1. Adapter Astro

Projekt używa `@astrojs/cloudflare` adapter w trybie `directory`:

```javascript
// astro.config.mjs
adapter: cloudflare({
  mode: "directory",
  platformProxy: {
    enabled: true,
  },
});
```

### 2. Wrangler Configuration

Plik `wrangler.toml` definiuje podstawową konfigurację:

- **name**: foodnager
- **compatibility_date**: 2024-12-09
- **pages_build_output_dir**: dist

### 3. Build Output

Po wykonaniu `npm run build`, pliki produkcyjne są generowane w katalogu `dist/`.

## GitHub Actions Workflow

### Plik: `.github/workflows/master.yml`

Workflow automatycznie uruchamia się przy:

- Push do brancha `master`
- Ręcznym uruchomieniu (workflow_dispatch)

### Struktura workflow (2 joby):

#### Job 1: Build & Test

1. **Checkout kodu** - `actions/checkout@v4`
2. **Setup Node.js** - `actions/setup-node@v4` (wersja z `.nvmrc`: 22.14.0)
3. **Instalacja zależności** - `npm ci`
4. **Lint** - ESLint + Prettier
5. **Build** - `npm run build`
6. **Testy jednostkowe** - `npm run test:run`
7. **Upload artifact** - `dist/` (retention: 1 dzień)

#### Job 2: Deploy (tylko jeśli build się powiódł)

1. **Checkout kodu** - dla wrangler
2. **Download artifact** - `dist/` z poprzedniego joba
3. **Deploy** - `cloudflare/wrangler-action@v3` z:
   - `apiToken` - CLOUDFLARE_API_TOKEN
   - `accountId` - CLOUDFLARE_ACCOUNT_ID
   - `gitHubToken` - GITHUB_TOKEN (automatyczny)
   - `command` - `pages deploy dist --project-name=foodnager --branch=master`
4. **Summary** - wyświetla Deployment URL, Environment, Deployment ID

### Kluczowe features:

- ✅ **Osobny job deploy** - lepsze zarządzanie i monitoring
- ✅ **Environment: production** - integracja z GitHub Environments
- ✅ **Permissions** - `contents: read`, `deployments: write`
- ✅ **GitHubToken** - automatyczne statusy deploymentu
- ✅ **Deployment URL output** - link do wdrożonej aplikacji
- ❌ **Brak testów E2E** (zbyt czasochłonne dla każdego deployu)

### Różnice względem ci.yml:

- ❌ **Brak testów E2E** (dla szybkości deploymentu)
- ✅ **Automatyczny deployment** po pomyślnym przejściu testów
- ✅ **Zmienne środowiskowe** dla buildu (SUPABASE_URL, SUPABASE_KEY)
- ✅ **GitHub Environment** - tracking deploymentów w zakładce Environments
- ✅ **Deployment outputs** - URL, environment, deployment ID

## Wymagane GitHub Secrets

W ustawieniach repozytorium GitHub (`Settings` → `Secrets and variables` → `Actions`) należy dodać:

### Build Secrets:

- `SUPABASE_URL` - URL instancji Supabase
- `SUPABASE_KEY` - Klucz publiczny (anon key) Supabase

### Cloudflare Secrets:

- `CLOUDFLARE_API_TOKEN` - Token API z uprawnieniami do Cloudflare Pages
- `CLOUDFLARE_ACCOUNT_ID` - ID konta Cloudflare

### Jak uzyskać Cloudflare credentials:

1. **API Token:**
   - Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
   - Przejdź do `My Profile` → `API Tokens`
   - Kliknij `Create Token`
   - Użyj template `Edit Cloudflare Workers` lub stwórz custom token z uprawnieniami:
     - Account.Cloudflare Pages: Edit
   - Skopiuj wygenerowany token

2. **Account ID:**
   - W Cloudflare Dashboard przejdź do `Workers & Pages`
   - Account ID znajduje się w prawym panelu

## Zmienne środowiskowe w Cloudflare Pages

Po pierwszym deploymencie, w Cloudflare Dashboard należy dodać zmienne środowiskowe:

1. Przejdź do projektu `foodnager` w `Workers & Pages`
2. Kliknij `Settings` → `Environment variables`
3. Dodaj zmienne dla środowiska **Production**:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`

## Deployment Process

### Automatyczny deployment:

```bash
git add .
git commit -m "feat: nowa funkcjonalność"
git push origin master
```

GitHub Actions automatycznie:

1. Uruchomi testy i lintery
2. Zbuduje projekt
3. Wdroży na Cloudflare Pages

### Ręczny deployment:

1. Przejdź do zakładki `Actions` w repozytorium GitHub
2. Wybierz workflow `Deploy to Cloudflare Pages`
3. Kliknij `Run workflow`
4. Wybierz branch `master`
5. Kliknij `Run workflow`

## Monitorowanie

### GitHub Actions:

- Status workflow: `Actions` tab w repozytorium
- Logi: kliknij na konkretny run workflow

### Cloudflare Pages:

- Dashboard: https://dash.cloudflare.com/
- Deployment history: `Workers & Pages` → `foodnager` → `Deployments`
- Logs: kliknij na konkretny deployment

## Troubleshooting

### Build fails:

1. Sprawdź logi w GitHub Actions
2. Upewnij się, że wszystkie secrets są poprawnie ustawione
3. Zweryfikuj czy build działa lokalnie: `npm run build`

### Deployment fails:

1. Sprawdź czy `CLOUDFLARE_API_TOKEN` ma odpowiednie uprawnienia
2. Zweryfikuj `CLOUDFLARE_ACCOUNT_ID`
3. Sprawdź czy projekt `foodnager` istnieje w Cloudflare Pages

### Runtime errors:

1. Sprawdź czy zmienne środowiskowe są ustawione w Cloudflare Dashboard
2. Zweryfikuj logi w Cloudflare Pages Dashboard
3. Sprawdź czy adapter Cloudflare jest poprawnie skonfigurowany

## Rollback

W przypadku problemów z nowym deploymentem:

1. Przejdź do Cloudflare Dashboard
2. `Workers & Pages` → `foodnager` → `Deployments`
3. Znajdź poprzedni working deployment
4. Kliknij `...` → `Rollback to this deployment`

## Performance

Cloudflare Pages oferuje:

- ✅ Global CDN
- ✅ Automatic HTTPS
- ✅ Unlimited bandwidth
- ✅ Unlimited requests
- ✅ Preview deployments dla PR

## Przydatne linki

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Astro Cloudflare Adapter](https://docs.astro.build/en/guides/integrations-guide/cloudflare/)
- [Wrangler Action](https://github.com/cloudflare/wrangler-action)
