# Workflow Improvements - master.yml

## Podsumowanie ulepszeń

Zaimplementowano **best practices** dla GitHub Actions workflow deploymentu na Cloudflare Pages.

## ❌ Poprzednia wersja (problemy)

```yaml
jobs:
  deploy:
    name: Lint, Build & Deploy
    runs-on: ubuntu-latest

    steps:
      # ... lint, build, test ...

      # Deploy w tym samym job
      - name: 🚀 Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=foodnager
```

### Problemy:

1. ❌ **Brak separacji** - build i deploy w jednym job
2. ❌ **Brak GitHub Environment** - brak trackingu deploymentów
3. ❌ **Brak permissions** - nie określono wymaganych uprawnień
4. ❌ **Brak gitHubToken** - brak automatycznych statusów deploymentu
5. ❌ **Brak branch w command** - może deployować z różnych branchy
6. ❌ **Brak outputs** - nie wiadomo gdzie aplikacja została wdrożona
7. ❌ **Brak artifacts** - rebuild przy każdym retry

## ✅ Nowa wersja (best practices)

```yaml
jobs:
  # Job 1: Build & Test
  build:
    name: Lint, Build & Test
    runs-on: ubuntu-latest
    env:
      SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
      SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
    steps:
      # ... lint, build, test ...
      - name: 📤 Upload build artifact
        uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/
          retention-days: 1

  # Job 2: Deploy (tylko po pomyślnym build)
  deploy:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build
    if: success()

    # GitHub Environment
    environment:
      name: production
      url: ${{ steps.deploy.outputs.deployment-url }}

    # Permissions
    permissions:
      contents: read
      deployments: write

    steps:
      - name: 📥 Checkout code
        uses: actions/checkout@v4

      - name: 📥 Download build artifact
        uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/

      - name: 🚀 Deploy to Cloudflare Pages
        id: deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          gitHubToken: ${{ secrets.GITHUB_TOKEN }}
          command: pages deploy dist --project-name=foodnager --branch=master

      - name: ✅ Deployment Summary
        if: success()
        run: |
          echo "✅ Deployment zakończony pomyślnie!"
          echo "🌐 Deployment URL: ${{ steps.deploy.outputs.deployment-url }}"
          echo "🔗 Pages Environment: ${{ steps.deploy.outputs.pages-environment }}"
          echo "🆔 Deployment ID: ${{ steps.deploy.outputs.pages-deployment-id }}"
```

### Ulepszenia:

1. ✅ **Osobne joby** - `build` i `deploy` są rozdzielone
2. ✅ **GitHub Environment: production** - tracking w zakładce Environments
3. ✅ **Permissions** - `contents: read`, `deployments: write`
4. ✅ **gitHubToken** - automatyczne statusy deploymentu w PR/commits
5. ✅ **--branch=master** - wyraźne określenie brancha
6. ✅ **Outputs** - deployment-url, environment, deployment-id
7. ✅ **Artifacts** - można re-deploy bez rebuildu
8. ✅ **needs: build** - deploy tylko po pomyślnym build
9. ✅ **if: success()** - dodatkowe zabezpieczenie
10. ✅ **environment.url** - link w GitHub UI do wdrożonej aplikacji

## Korzyści

### 1. Lepsze zarządzanie

- **Osobne joby**: Jeśli deploy się nie powiedzie, można re-run tylko deploy job
- **Artifacts**: Nie trzeba rebuilować całej aplikacji przy retry
- **Dependency**: Deploy uruchomi się tylko po pomyślnym build

### 2. Lepszy monitoring

- **GitHub Environments**: Widoczność deploymentów w zakładce Environments
- **Deployment URL**: Bezpośredni link do wdrożonej aplikacji
- **Deployment ID**: Łatwe śledzenie konkretnych deploymentów
- **GitHubToken**: Statusy deploymentu w PR i commits

### 3. Lepsze bezpieczeństwo

- **Permissions**: Minimalne wymagane uprawnienia
- **Environment protection**: Możliwość dodania required reviewers
- **Branch protection**: Deploy tylko z master

### 4. Lepsze debugging

- **Outputs**: Widoczne URL, environment, deployment ID w logach
- **Summary**: Jasne podsumowanie deploymentu
- **Osobne joby**: Łatwiej znaleźć gdzie problem

## Parametry wrangler-action

### Używane:

- ✅ **apiToken** - CLOUDFLARE_API_TOKEN
- ✅ **accountId** - CLOUDFLARE_ACCOUNT_ID
- ✅ **gitHubToken** - GITHUB_TOKEN (automatyczny)
- ✅ **command** - `pages deploy dist --project-name=foodnager --branch=master`

### Dostępne (nie używane):

- ⚪ **environment** - dla environments w wrangler.toml (nie dotyczy Pages)
- ⚪ **workingDirectory** - jeśli projekt w podkatalogu
- ⚪ **wranglerVersion** - jeśli potrzebna konkretna wersja
- ⚪ **secrets** - dla Workers (nie dotyczy Pages)
- ⚪ **vars** - dla Workers (nie dotyczy Pages)
- ⚪ **preCommands** - przed deploymentem
- ⚪ **postCommands** - po deploymencie
- ⚪ **quiet** - wyłączenie outputu

### Outputs (używane):

- ✅ **deployment-url** - URL wdrożonej aplikacji
- ✅ **pages-environment** - środowisko (production/preview)
- ✅ **pages-deployment-id** - ID deploymentu

## GitHub Environment

### Co daje Environment `production`:

1. **Tracking**: Historia deploymentów w zakładce Environments
2. **Status**: Aktualny status środowiska (Active, Waiting, Failed)
3. **URL**: Bezpośredni link do aplikacji
4. **Protection rules** (opcjonalne):
   - Required reviewers - wymagaj zatwierdzenia
   - Wait timer - opóźnienie przed deploymentem
   - Deployment branches - ogranicz do master

### Jak skonfigurować:

```
Settings → Environments → New environment → production
```

Opcjonalne protection rules:

- ☑️ Required reviewers: 1-6 osób (np. tech lead)
- ☑️ Wait timer: 0-43200 minut (np. 5 minut)
- ☑️ Deployment branches: Only protected branches lub master

## Permissions

```yaml
permissions:
  contents: read # Odczyt kodu
  deployments: write # Tworzenie deploymentów
```

### Dlaczego `deployments: write`?

- Tworzy deployment events w GitHub
- Widoczne w zakładce Environments
- Integracja z PR (deployment status)
- Deployment comments w PR (z gitHubToken)

### Dlaczego `contents: read`?

- Checkout kodu z repozytorium
- Minimalne uprawnienia (security best practice)

## Artifacts

### Upload (w job build):

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: dist
    path: dist/
    retention-days: 1 # Tylko 1 dzień (build artifacts)
```

### Download (w job deploy):

```yaml
- uses: actions/download-artifact@v4
  with:
    name: dist
    path: dist/
```

### Korzyści:

- ✅ Re-deploy bez rebuildu
- ✅ Szybsze retry przy błędzie deploymentu
- ✅ Możliwość pobrania artifacts z UI
- ✅ Weryfikacja co zostało wdrożone

## GitHubToken

```yaml
gitHubToken: ${{ secrets.GITHUB_TOKEN }}
```

### Co daje:

- ✅ Deployment status w commits
- ✅ Deployment status w PR
- ✅ Komentarze z preview URL w PR (dla preview deployments)
- ✅ Integracja z GitHub Deployments API

### Uwaga:

`GITHUB_TOKEN` jest **automatycznie dostarczany** przez GitHub Actions - nie trzeba go konfigurować jako secret.

## Branch w command

```yaml
command: pages deploy dist --project-name=foodnager --branch=master
```

### Dlaczego `--branch=master`?

- ✅ Wyraźne określenie brancha dla deploymentu
- ✅ Cloudflare wie z którego brancha pochodzi deployment
- ✅ Różnicowanie production (master) vs preview (inne branche)
- ✅ Lepsze śledzenie w Cloudflare Dashboard

## Deployment Summary

```yaml
- name: ✅ Deployment Summary
  if: success()
  run: |
    echo "✅ Deployment zakończony pomyślnie!"
    echo "🌐 Deployment URL: ${{ steps.deploy.outputs.deployment-url }}"
    echo "🔗 Pages Environment: ${{ steps.deploy.outputs.pages-environment }}"
    echo "🆔 Deployment ID: ${{ steps.deploy.outputs.pages-deployment-id }}"
```

### Co wyświetla:

- **Deployment URL**: https://foodnager-xxx.pages.dev
- **Pages Environment**: production
- **Deployment ID**: unique-deployment-id

### Korzyści:

- ✅ Łatwy dostęp do URL w logach
- ✅ Weryfikacja środowiska
- ✅ ID dla debugging w Cloudflare

## Porównanie czasów wykonania

### Poprzednia wersja (1 job):

```
Total: ~2-3 minuty
- Build: ~1.5 minuty
- Deploy: ~1 minuta
```

### Nowa wersja (2 joby):

```
Total: ~2-3 minuty (bez zmian)
Job 1 (build): ~1.5 minuty
Job 2 (deploy): ~1 minuta (parallel setup)
```

**Re-deploy przy błędzie:**

- Poprzednio: ~2-3 minuty (rebuild + deploy)
- Teraz: ~1 minuta (tylko deploy, używa artifact)

## Best Practices zastosowane

1. ✅ **Separation of concerns** - build vs deploy
2. ✅ **Fail fast** - deploy tylko po pomyślnym build
3. ✅ **Minimal permissions** - tylko potrzebne uprawnienia
4. ✅ **Artifacts** - możliwość re-deploy bez rebuildu
5. ✅ **Environment tracking** - GitHub Environments
6. ✅ **Deployment status** - gitHubToken
7. ✅ **Outputs** - deployment URL, environment, ID
8. ✅ **Branch specification** - wyraźny branch w command
9. ✅ **Summary** - jasne podsumowanie deploymentu
10. ✅ **Idempotency** - można re-run deployment

## Rekomendacje dla zespołu

1. **Skonfiguruj Environment `production`** w GitHub Settings
2. **Dodaj required reviewers** (opcjonalnie) dla deploymentów
3. **Monitoruj deployments** w zakładce Environments
4. **Używaj re-run** zamiast nowego push przy błędzie deploymentu
5. **Sprawdzaj outputs** w logach dla deployment URL

## Dodatkowe możliwości

### Preview Deployments dla PR:

Możesz dodać osobny workflow dla PR:

```yaml
on:
  pull_request:
    branches:
      - master

# ... build job ...

deploy:
  environment:
    name: preview-pr-${{ github.event.number }}
    url: ${{ steps.deploy.outputs.deployment-url }}
  # ...
  command: pages deploy dist --project-name=foodnager --branch=${{ github.head_ref }}
```

### Protection rules:

W Environment `production` możesz dodać:

- Required reviewers (np. 1-2 tech leads)
- Wait timer (np. 5 minut buffer)
- Deployment branches (tylko master)

### Notifications:

Możesz dodać notyfikacje (Slack, Discord, Email) po deploymencie używając outputs:

```yaml
- name: Notify Slack
  if: success()
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK }} \
      -H 'Content-Type: application/json' \
      -d '{"text":"Deployed to ${{ steps.deploy.outputs.deployment-url }}"}'
```

## Podsumowanie

Nowy workflow jest **production-ready** i follows GitHub Actions best practices:

- ✅ Separation of concerns
- ✅ Proper permissions
- ✅ Environment tracking
- ✅ Deployment status
- ✅ Re-deployability
- ✅ Monitoring
- ✅ Security

**Czas wykonania**: bez zmian (~2-3 minuty)  
**Re-deploy**: szybszy (tylko ~1 minuta)  
**Monitoring**: lepszy (GitHub Environments)  
**Security**: lepszy (minimal permissions)
