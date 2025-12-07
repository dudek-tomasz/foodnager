# Konfiguracja .env.test dla testów E2E

## 🚀 Szybki start

### Krok 1: Utwórz plik `.env.test`

W katalogu głównym projektu (obok `playwright.config.ts`) utwórz plik `.env.test`:

```bash
# Na Windows (PowerShell)
New-Item -Path .env.test -ItemType File

# Na Mac/Linux
touch .env.test
```

### Krok 2: Wypełnij plik `.env.test`

Otwórz `.env.test` w edytorze i wklej:

```env
# ===================================
# Test User Credentials
# ===================================
E2E_USERNAME=test@foodnager.pl
E2E_PASSWORD=TestPassword123!

# ===================================
# Supabase Configuration
# ===================================
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# Service Role Key (REQUIRED for database cleanup)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Test User UUID
E2E_TEST_USER_ID=your-test-user-uuid

# ===================================
# Optional: Application URL
# ===================================
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

### Krok 3: Znajdź wartości w Supabase Dashboard

#### 3.1 SUPABASE_URL i SUPABASE_KEY

1. Otwórz [Supabase Dashboard](https://app.supabase.com)
2. Wybierz swój projekt
3. Przejdź do **Settings** → **API**
4. Skopiuj:
   - **Project URL** → `SUPABASE_URL`
   - **anon/public** key → `SUPABASE_KEY`

```env
SUPABASE_URL=https://xyzabc123.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### 3.2 SUPABASE_SERVICE_ROLE_KEY ⚠️

⚠️ **UWAGA:** Ten klucz omija wszystkie zabezpieczenia! Używaj TYLKO z bazą testową!

1. W Supabase Dashboard → **Settings** → **API**
2. Znajdź **service_role** key (pod "Service role (secret)")
3. Kliknij "Reveal" i skopiuj
4. Wklej do `.env.test`

```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

✅ **Bezpieczeństwo:**
- ✅ Plik `.env.test` jest w `.gitignore` (nie zostanie commitowany)
- ✅ Używaj TYLKO z testową/developerską bazą
- ❌ NIGDY nie używaj z produkcyjną bazą danych!

#### 3.3 E2E_TEST_USER_ID

**Opcja A: Przez Dashboard**

1. Supabase Dashboard → **Authentication** → **Users**
2. Znajdź użytkownika `test@foodnager.pl`
3. Skopiuj wartość z kolumny `id` (UUID)

```env
E2E_TEST_USER_ID=a1b2c3d4-e5f6-7890-abcd-1234567890ab
```

**Opcja B: Przez SQL Editor**

1. Supabase Dashboard → **SQL Editor**
2. Uruchom:

```sql
SELECT id, email 
FROM auth.users 
WHERE email = 'test@foodnager.pl';
```

3. Skopiuj wartość `id`

### Krok 4: Utwórz użytkownika testowego (jeśli nie istnieje)

**Opcja A: Przez aplikację**

1. Uruchom dev server: `npm run dev`
2. Otwórz http://localhost:3000/register
3. Zarejestruj się z danymi:
   - Email: `test@foodnager.pl`
   - Password: `TestPassword123!`

**Opcja B: Przez Supabase Dashboard**

1. Supabase Dashboard → **Authentication** → **Users**
2. Kliknij "Invite user" lub "Add user"
3. Wypełnij:
   - Email: `test@foodnager.pl`
   - Password: `TestPassword123!`
   - Email confirmed: ✅ YES

### Krok 5: Weryfikacja

Sprawdź czy wszystko działa:

```bash
npm run test:e2e
```

Powinieneś zobaczyć:
```
🔐 Login attempt with: { email: 'test@foodnager.pl', password: '***' }
✅ Successfully authenticated and navigated to: http://localhost:3000/fridge
🧹 Starting E2E database cleanup...
  ➜ Cleaning cooking_history...
  ✓ Deleted 0 cooking_history records
  ...
✅ Database cleanup completed successfully
```

## 📋 Kompletny przykład `.env.test`

```env
# ===================================
# Test User Credentials
# ===================================
E2E_USERNAME=test@foodnager.pl
E2E_PASSWORD=TestPassword123!

# ===================================
# Supabase Configuration
# ===================================
# Project URL from: Supabase Dashboard → Settings → API
SUPABASE_URL=https://xyzabc123.supabase.co

# Anon/public key from: Supabase Dashboard → Settings → API
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiYzEyMyIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjk0NTI2MDAwLCJleHAiOjIwMTAxMDIwMDB9.AbCdEfGhIjKlMnOpQrStUvWxYz

# Service role key from: Supabase Dashboard → Settings → API → service_role
# ⚠️ WARNING: Use ONLY with test/dev database!
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emFiYzEyMyIsInJvbGUiOiJzZXJ2aWNlX3JvbGUiLCJpYXQiOjE2OTQ1MjYwMDAsImV4cCI6MjAxMDEwMjAwMH0.XyZaBcDeFgHiJkLmNoPqRsTuVwXyZ

# Test user UUID from: Supabase Dashboard → Authentication → Users
E2E_TEST_USER_ID=a1b2c3d4-e5f6-7890-abcd-1234567890ab

# ===================================
# Optional: Application URL
# ===================================
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

## 🔧 Troubleshooting

### ❌ "E2E_USERNAME and E2E_PASSWORD must be set"

**Rozwiązanie:**
- Upewnij się, że plik `.env.test` istnieje w katalogu głównym
- Sprawdź czy są ustawione `E2E_USERNAME` i `E2E_PASSWORD`

### ❌ "Authentication failed"

**Rozwiązanie:**
- Sprawdź czy użytkownik `test@foodnager.pl` istnieje w Supabase
- Sprawdź czy hasło jest poprawne (`TestPassword123!`)
- Sprawdź czy email jest potwierdzony (confirmed)

### ⚠️ "Skipping database cleanup: SUPABASE_SERVICE_ROLE_KEY not configured"

**Rozwiązanie:**
- Dodaj `SUPABASE_SERVICE_ROLE_KEY` do `.env.test`
- Sprawdź czy klucz jest poprawny (powinien zaczynać się od `eyJ...`)

### ⚠️ "Skipping database cleanup: E2E_TEST_USER_ID not configured"

**Rozwiązanie:**
- Dodaj `E2E_TEST_USER_ID` do `.env.test`
- UUID powinno mieć format: `a1b2c3d4-e5f6-7890-abcd-1234567890ab`

## 📚 Więcej informacji

- [e2e/QUICK_START.md](./e2e/QUICK_START.md) - Szybki start z testami E2E
- [e2e/DB_CLEANUP_GUIDE.md](./e2e/DB_CLEANUP_GUIDE.md) - Szczegółowy przewodnik czyszczenia bazy
- [e2e/README.md](./e2e/README.md) - Kompletna dokumentacja testów E2E

## ✅ Checklist

Przed uruchomieniem testów upewnij się, że:

- [ ] Plik `.env.test` istnieje w katalogu głównym
- [ ] `E2E_USERNAME` i `E2E_PASSWORD` są ustawione
- [ ] `SUPABASE_URL` jest poprawny
- [ ] `SUPABASE_KEY` (anon) jest poprawny
- [ ] `SUPABASE_SERVICE_ROLE_KEY` jest poprawny (dla cleanup)
- [ ] `E2E_TEST_USER_ID` jest poprawny UUID
- [ ] Użytkownik testowy istnieje w Supabase
- [ ] Email użytkownika jest potwierdzony
- [ ] `.env.test` jest w `.gitignore` (już jest!)

Po zaznaczeniu wszystkich ✅ możesz uruchomić:

```bash
npm run test:e2e
```

🎉 **Gotowe!**

