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

**Kolejne uruchomienia:**
- Setup uruchomi się tylko jeśli plik sesji nie istnieje
- Testy startują od razu z zapisaną sesją (mega szybko! ⚡)

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
E2E_USERNAME=test@foodnager.pl
E2E_PASSWORD=TestPassword123!
```

Jeśli chcesz użyć innych danych:

1. Edytuj plik `.env.test`:
   ```env
   E2E_USERNAME=moj@email.pl
   E2E_PASSWORD=MojeHaslo123!
   ```

2. Zarejestruj użytkownika z tymi danymi

3. Uruchom testy ponownie

## ✅ Gotowe!

Jeśli wszystko działa, powinieneś zobaczyć zielone ✅ przy testach!

