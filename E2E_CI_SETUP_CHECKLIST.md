# ✅ E2E CI Setup Checklist

Użyj tej checklisty aby skonfigurować testy E2E na GitHub Actions.

## 📋 Checklist

### 1. Przygotowanie test usera w Supabase

- [ ] Otwórz Supabase Dashboard → Authentication → Users
- [ ] Kliknij "Add user" → "Create new user"
- [ ] Wprowadź email dla test usera (np. `test@foodnager.com`)
- [ ] Wprowadź silne hasło
- [ ] Potwierdź usera (jeśli email confirmation jest włączone)
- [ ] Skopiuj UUID usera (będzie potrzebny w kroku 3)

### 2. Pobranie kluczy z Supabase

- [ ] Otwórz Supabase Dashboard → Settings → API
- [ ] Skopiuj **Project URL** (np. `https://xxxxx.supabase.co`)
- [ ] Skopiuj **anon public** key (długi token zaczynający się od `eyJhbGc...`)
- [ ] Skopiuj **service_role** key (⚠️ **UWAGA:** Ten klucz daje pełny dostęp do bazy!)

### 3. Konfiguracja sekretów w GitHub

- [ ] Przejdź do swojego repo na GitHub
- [ ] Kliknij **Settings** (w menu repo)
- [ ] W lewym menu: **Secrets and variables** → **Actions**
- [ ] Kliknij **"New repository secret"**
- [ ] Dodaj następujące sekrety (jeden po drugim):

#### Sekret 1: SUPABASE_URL
- [ ] Name: `SUPABASE_URL`
- [ ] Secret: Wklej Project URL z kroku 2
- [ ] Kliknij "Add secret"

#### Sekret 2: SUPABASE_KEY
- [ ] Name: `SUPABASE_KEY`
- [ ] Secret: Wklej anon public key z kroku 2
- [ ] Kliknij "Add secret"

#### Sekret 3: SUPABASE_SERVICE_ROLE_KEY
- [ ] Name: `SUPABASE_SERVICE_ROLE_KEY`
- [ ] Secret: Wklej service_role key z kroku 2
- [ ] Kliknij "Add secret"

#### Sekret 4: E2E_USERNAME
- [ ] Name: `E2E_USERNAME`
- [ ] Secret: Wklej email test usera z kroku 1
- [ ] Kliknij "Add secret"

#### Sekret 5: E2E_PASSWORD
- [ ] Name: `E2E_PASSWORD`
- [ ] Secret: Wklej hasło test usera z kroku 1
- [ ] Kliknij "Add secret"

#### Sekret 6: E2E_USERNAME_ID
- [ ] Name: `E2E_USERNAME_ID` ⚠️ **UWAGA:** Dokładnie ta nazwa!
- [ ] Secret: Wklej UUID test usera z kroku 1
- [ ] Kliknij "Add secret"

### 4. Weryfikacja sekretów

- [ ] W GitHub Settings → Secrets and variables → Actions
- [ ] Sprawdź czy widzisz wszystkie 6 sekretów:
  - ✓ SUPABASE_URL
  - ✓ SUPABASE_KEY
  - ✓ SUPABASE_SERVICE_ROLE_KEY
  - ✓ E2E_USERNAME
  - ✓ E2E_PASSWORD
  - ✓ E2E_USERNAME_ID

### 5. Uruchomienie CI

- [ ] Zrób commit i push zmian z tego PR
- [ ] Przejdź do zakładki **Actions** w GitHub
- [ ] Poczekaj aż workflow się uruchomi
- [ ] Sprawdź krok **"Create .env files"**
- [ ] Powinieneś zobaczyć:
  ```
  ✓ SUPABASE_URL
  ✓ SUPABASE_KEY
  ✓ SUPABASE_SERVICE_ROLE_KEY
  ✓ E2E_USERNAME
  ✓ E2E_PASSWORD
  ✓ E2E_USERNAME_ID
  ```

### 6. Weryfikacja testów

- [ ] Poczekaj aż workflow zakończy wszystkie kroki
- [ ] Sprawdź czy krok **"Run E2E tests"** przeszedł pomyślnie
- [ ] Jeśli są błędy, sprawdź sekcję Troubleshooting poniżej

## 🎉 Gotowe!

Jeśli wszystkie kroki są zaznaczone, Twoje testy E2E powinny działać na CI!

## 🔧 Troubleshooting

### ❌ "Invalid API key" w testach

**Problem:** Niepoprawny lub brakujący `SUPABASE_SERVICE_ROLE_KEY`

**Rozwiązanie:**
1. Sprawdź czy sekret jest ustawiony w GitHub
2. Upewnij się że skopiowałeś **service_role** key (nie anon key)
3. Sprawdź czy nie ma spacji na początku/końcu klucza

### ❌ "✗ E2E_USERNAME_ID MISSING!"

**Problem:** Sekret ma złą nazwę lub nie jest ustawiony

**Rozwiązanie:**
1. Sprawdź czy nazwa sekretu to dokładnie: `E2E_USERNAME_ID`
2. Nie może być: `E2E_TEST_USER_ID` ani `E2E_USER_ID` (poprawna nazwa to `E2E_USERNAME_ID`)
3. Jeśli nazwa jest zła, usuń sekret i dodaj ponownie z poprawną nazwą

### ❌ Test authentication fails

**Problem:** Test user nie istnieje lub złe credentials

**Rozwiązanie:**
1. Sprawdź czy user istnieje w Supabase Auth
2. Sprawdź czy email i hasło w sekretach są poprawne
3. Upewnij się że user jest potwierdzony (email verified)

### ❌ Workflow failuje na "Create .env files"

**Problem:** Brakuje wymaganych sekretów

**Rozwiązanie:**
1. Sprawdź logi tego kroku
2. Poszukaj komunikatów "MISSING!"
3. Dodaj brakujące sekrety według checklisty powyżej

## 📚 Dodatkowe zasoby

- **Szczegółowa dokumentacja:** `docs/GITHUB_SECRETS.md`
- **E2E testy lokalnie:** `e2e/README.md`
- **Podsumowanie zmian:** `docs/E2E_CI_FIX_SUMMARY.md`

## 💡 Wskazówki

1. **Service role key** to NIE to samo co anon key - upewnij się że kopiujesz właściwy!
2. **UUID** test usera znajdziesz klikając na usera w Supabase Auth → Users
3. Jeśli chcesz testować lokalnie, stwórz plik `.env.test` (patrz `e2e/README.md`)
4. Możesz pominąć testy E2E w CI: Actions → Run workflow → zaznacz "Pomiń testy E2E"

---

**Pytania?** Sprawdź dokumentację w `docs/` lub logi workflow w GitHub Actions.

