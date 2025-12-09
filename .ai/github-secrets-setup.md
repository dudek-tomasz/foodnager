# GitHub Secrets Setup - Foodnager

Ten dokument opisuje jak skonfigurować GitHub Secrets wymagane do działania CI/CD workflows.

## Przegląd Secrets

Projekt Foodnager wymaga dwóch zestawów secrets:

1. **Build Secrets** - wymagane do zbudowania aplikacji
2. **Cloudflare Secrets** - wymagane do deploymentu na Cloudflare Pages
3. **E2E Test Secrets** - wymagane tylko dla workflow `ci.yml` (testy E2E)

## Jak dodać Secrets w GitHub

1. Przejdź do repozytorium na GitHub
2. Kliknij `Settings` (zakładka na górze)
3. W lewym menu wybierz `Secrets and variables` → `Actions`
4. Kliknij `New repository secret`
5. Wprowadź nazwę i wartość secretu
6. Kliknij `Add secret`

## Konfiguracja GitHub Environment

Workflow używa GitHub Environment `production` dla lepszego trackingu deploymentów.

### Jak utworzyć Environment:

1. W repozytorium przejdź do `Settings`
2. W lewym menu wybierz `Environments`
3. Kliknij `New environment`
4. Nazwa: `production`
5. (Opcjonalnie) Dodaj protection rules:
   - Required reviewers - wymagaj zatwierdzenia przed deploymentem
   - Wait timer - opóźnienie przed deploymentem
   - Deployment branches - ogranicz do `master`
6. Kliknij `Configure environment`

⚠️ **Uwaga:** Environment zostanie automatycznie utworzony przy pierwszym deploymencie jeśli nie istnieje, ale lepiej skonfigurować go wcześniej z odpowiednimi protection rules.

## Wymagane Secrets

### 1. Build Secrets (wymagane dla obu workflows)

#### `SUPABASE_URL`

- **Opis:** URL Twojej instancji Supabase
- **Format:** `https://xxxxxxxxxxxxx.supabase.co`
- **Jak uzyskać:**
  1. Zaloguj się do [Supabase Dashboard](https://supabase.com/dashboard)
  2. Wybierz swój projekt
  3. Przejdź do `Settings` → `API`
  4. Skopiuj wartość z pola `Project URL`

#### `SUPABASE_KEY`

- **Opis:** Publiczny klucz API Supabase (anon key)
- **Format:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Jak uzyskać:**
  1. W Supabase Dashboard → `Settings` → `API`
  2. Skopiuj wartość z pola `anon` `public` w sekcji `Project API keys`

⚠️ **Uwaga:** Używaj klucza `anon`, NIE `service_role` (service_role jest tylko do testów E2E)

### 2. Cloudflare Secrets (wymagane dla `master.yml`)

⚠️ **Uwaga:** `GITHUB_TOKEN` jest automatycznie dostarczany przez GitHub Actions - nie musisz go konfigurować jako secret.

#### `CLOUDFLARE_API_TOKEN`

- **Opis:** Token API z uprawnieniami do Cloudflare Pages
- **Format:** długi string alfanumeryczny
- **Jak uzyskać:**
  1. Zaloguj się do [Cloudflare Dashboard](https://dash.cloudflare.com/)
  2. Kliknij na ikonę profilu (prawy górny róg) → `My Profile`
  3. W lewym menu wybierz `API Tokens`
  4. Kliknij `Create Token`
  5. **Opcja A - Użyj template:**
     - Znajdź template `Edit Cloudflare Workers`
     - Kliknij `Use template`
     - W sekcji `Account Resources` wybierz swoje konto
     - W sekcji `Zone Resources` wybierz `All zones` lub konkretną strefę
     - Kliknij `Continue to summary`
     - Kliknij `Create Token`
  6. **Opcja B - Custom token:**
     - Kliknij `Create Custom Token`
     - Nadaj nazwę: `Foodnager GitHub Actions`
     - W sekcji `Permissions` dodaj:
       - `Account` → `Cloudflare Pages` → `Edit`
     - W sekcji `Account Resources` wybierz:
       - `Include` → `Specific account` → wybierz swoje konto
     - Kliknij `Continue to summary`
     - Kliknij `Create Token`
  7. **Skopiuj token** - będzie pokazany tylko raz!

#### `CLOUDFLARE_ACCOUNT_ID`

- **Opis:** ID Twojego konta Cloudflare
- **Format:** 32-znakowy string heksadecymalny
- **Jak uzyskać:**
  1. W Cloudflare Dashboard
  2. Przejdź do `Workers & Pages`
  3. Account ID znajduje się w prawym panelu pod napisem `Account ID`
  4. Kliknij aby skopiować

### 3. E2E Test Secrets (wymagane tylko dla `ci.yml`)

Te sekrety są potrzebne tylko jeśli uruchamiasz workflow `ci.yml` z testami E2E.

#### `E2E_USERNAME`

- **Opis:** Email testowego użytkownika
- **Format:** `test-user@example.com`
- **Jak uzyskać:** Utwórz testowego użytkownika w Supabase Authentication

#### `E2E_PASSWORD`

- **Opis:** Hasło testowego użytkownika
- **Format:** minimum 8 znaków
- **Jak uzyskać:** Ustaw podczas tworzenia testowego użytkownika

#### `E2E_USERNAME_ID`

- **Opis:** UUID testowego użytkownika w Supabase
- **Format:** `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
- **Jak uzyskać:**
  1. W Supabase Dashboard → `Authentication` → `Users`
  2. Znajdź testowego użytkownika
  3. Skopiuj jego UUID

#### `SUPABASE_SERVICE_ROLE_KEY`

- **Opis:** Service role key Supabase (tylko dla testów!)
- **Format:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Jak uzyskać:**
  1. W Supabase Dashboard → `Settings` → `API`
  2. Skopiuj wartość z pola `service_role` w sekcji `Project API keys`

⚠️ **UWAGA BEZPIECZEŃSTWA:**

- Service role key ma pełne uprawnienia do bazy danych
- Używaj go TYLKO na testowej instancji Supabase
- NIGDY nie używaj production service_role key w CI/CD

## Weryfikacja Secrets

### Sprawdzenie czy secrets są ustawione:

1. Przejdź do `Settings` → `Secrets and variables` → `Actions`
2. Powinieneś zobaczyć listę wszystkich secrets (bez wartości)
3. Sprawdź czy wszystkie wymagane secrets są na liście

### Test workflow:

1. Przejdź do zakładki `Actions`
2. Wybierz workflow `Deploy to Cloudflare Pages`
3. Kliknij `Run workflow`
4. Jeśli workflow przejdzie pomyślnie - secrets są poprawnie skonfigurowane
5. Jeśli workflow się nie powiedzie - sprawdź logi i upewnij się, że wszystkie secrets są poprawne

## Troubleshooting

### "Secret not found" error:

- Upewnij się, że nazwa secretu jest dokładnie taka jak w workflow (case-sensitive)
- Sprawdź czy secret jest dodany na poziomie repozytorium (nie environment)

### "Invalid API token" error:

- Sprawdź czy token Cloudflare ma odpowiednie uprawnienia
- Upewnij się, że token nie wygasł
- Wygeneruj nowy token jeśli potrzeba

### "Account ID not found" error:

- Sprawdź czy CLOUDFLARE_ACCOUNT_ID jest poprawny
- Upewnij się, że nie ma spacji ani innych znaków

### Build fails z "SUPABASE_URL is not defined":

- Sprawdź czy SUPABASE_URL i SUPABASE_KEY są ustawione
- Upewnij się, że wartości są poprawne (możesz je zweryfikować lokalnie)

## Bezpieczeństwo

✅ **Dobre praktyki:**

- Używaj różnych kluczy dla development, testing i production
- Regularnie rotuj API tokeny
- Używaj najmniejszych możliwych uprawnień dla tokenów
- Nigdy nie commituj secrets do repozytorium
- Używaj `.env` lokalnie, GitHub Secrets w CI/CD

❌ **Czego unikać:**

- Nie używaj production service_role key w CI/CD
- Nie udostępniaj secrets publicznie
- Nie loguj secrets w workflow (GitHub automatycznie je maskuje, ale lepiej unikać)
- Nie używaj tych samych credentials dla różnych środowisk

## Aktualizacja Secrets

Jeśli potrzebujesz zaktualizować secret:

1. Przejdź do `Settings` → `Secrets and variables` → `Actions`
2. Znajdź secret na liście
3. Kliknij `Update`
4. Wprowadź nową wartość
5. Kliknij `Update secret`

Nowa wartość będzie użyta przy następnym uruchomieniu workflow.
