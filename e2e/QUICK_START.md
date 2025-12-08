# 🚀 Quick Start - Testy E2E

## Krok 1: Utwórz użytkownika testowego

### Opcja A: Ręcznie przez UI

1. Uruchom serwer dev:

   ```bash
   npm run dev
   ```

2. Otwórz http://localhost:3000/register

3. Zarejestruj się z danymi:
   - **Email**: `test@foodnager.pl`
   - **Hasło**: `TestPassword123!`

### Opcja B: Przez bazę danych (jeśli masz dostęp do Supabase)

1. Zaloguj się do Supabase Dashboard
2. Przejdź do Authentication > Users
3. Dodaj nowego użytkownika:
   - Email: `test@foodnager.pl`
   - Password: `TestPassword123!`
   - Email confirmed: YES

## Krok 2: Uruchom testy

```bash
# UI Mode (interaktywny - POLECANE)
npm run test:e2e:ui

# Lub normalny tryb
npm run test:e2e
```

## 🎯 Co się stanie:

**Pierwszy raz:**

1. ⚡ Uruchomi się **setup project** (`auth.setup.ts`)
2. 🔐 Zaloguje użytkownika i zapisze sesję do `playwright/.auth/user.json`
3. ✅ Wszystkie testy będą używać tej sesji (szybko!)
4. 🧹 Po wszystkich testach uruchomi się **teardown** (`global.teardown.ts`)
5. 🗑️ Usunie wszystkie dane testowe z bazy danych

**Kolejne uruchomienia:**

- Setup uruchomi się tylko jeśli plik sesji nie istnieje
- Testy startują od razu z zapisaną sesją (mega szybko! ⚡)
- Teardown zawsze czyści bazę po zakończeniu testów

W Playwright UI:

1. Znajdź test "should add a new product with all required fields"
2. Kliknij play ▶️
3. Obserwuj jak:
   - ✅ Strona lodówki otwiera się już zalogowana
   - ✅ Otwiera się modal dodawania produktu
   - ✅ Wypełnia się formularz
   - ✅ Produkt zostaje dodany

## 🐛 Problemy?

### "Authentication failed"

- Sprawdź czy użytkownik testowy istnieje
- Sprawdź czy hasło jest poprawne
- Sprawdź czy email jest potwierdzony

### "Port 3000 already in use"

- Zatrzymaj inny serwer dev
- Lub zmień port w `playwright.config.ts`

### "Cannot connect to localhost:3000"

- Upewnij się że `npm run dev` działa
- Sprawdź czy aplikacja odpowiada na http://localhost:3000

## 📝 Konfiguracja danych testowych

**WAŻNE:** Musisz mieć plik `.env.test` w katalogu głównym projektu:

```env
# Test User Credentials
E2E_USERNAME=test@foodnager.pl
E2E_PASSWORD=TestPassword123!

# Supabase Configuration (required for database cleanup)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-anon-key

# Service Role Key (required for teardown)
# Get from: Supabase Dashboard -> Settings -> API -> service_role key
# WARNING: Use only with test/dev database! Never production!
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Test User UUID (required for cleanup)
# Get from: Supabase Dashboard -> Authentication -> Users
E2E_USERNAME_ID=your-test-user-uuid-here
```

### Jak znaleźć potrzebne wartości:

1. **SUPABASE_URL i SUPABASE_KEY**:
   - Supabase Dashboard → Settings → API
   - URL: "Project URL"
   - KEY: "anon public"

2. **SUPABASE_SERVICE_ROLE_KEY**:
   - Supabase Dashboard → Settings → API
   - Znajdź "service_role" (secret!)
   - ⚠️ NIGDY nie commituj tego klucza!

3. **E2E_USERNAME_ID**:
   - Supabase Dashboard → Authentication → Users
   - Znajdź użytkownika testowego (test@foodnager.pl)
   - Skopiuj UUID (np. `a1b2c3d4-e5f6-...`)

Jeśli chcesz użyć innych danych:

1. Edytuj plik `.env.test`:

   ```env
   E2E_USERNAME=moj@email.pl
   E2E_PASSWORD=MojeHaslo123!
   ```

2. Zarejestruj użytkownika z tymi danymi

3. Zaktualizuj E2E_USERNAME_ID w `.env.test`

4. Uruchom testy ponownie

## 🧹 Database Cleanup (Teardown)

Po zakończeniu wszystkich testów automatycznie uruchamia się cleanup bazy danych:

**Co jest czyszczone:**

- ✅ Produkty utworzone przez użytkownika testowego
- ✅ Produkty w lodówce (`user_products`)
- ✅ Przepisy i ich składniki
- ✅ Historia gotowania
- ✅ Powiązania przepis-tag

**Dlaczego to ważne:**

- 🔄 Każde uruchomienie testów zaczyna od czystego stanu
- 🚀 Nie ma konfliktów między kolejnymi uruchomieniami
- 📊 Baza testowa pozostaje czysta

**Ręczne czyszczenie (opcjonalne):**

Jeśli potrzebujesz wyczyścić bazę w trakcie developmentu:

```typescript
import { cleanupUserData } from "./helpers/db-cleanup";

// W teście lub standalone skrypcie
await cleanupUserData(process.env.E2E_USERNAME_ID!);
```

## ✅ Gotowe!

Jeśli wszystko działa, powinieneś zobaczyć:

- 🔐 Sukces logowania w setup
- ✅ Zielone checkmarki przy testach
- 🧹 Cleanup bazy po zakończeniu testów
