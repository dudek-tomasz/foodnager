# 🚀 Quick Start - Logowanie Foodnager

## ✅ Status Instalacji

### Co Działa

- ✅ Pakiet `@supabase/ssr` v0.7.0 zainstalowany
- ✅ Brak błędów TypeScript/Linting
- ✅ Wszystkie pliki zaimplementowane
- ✅ Endpoint `/api/auth/login` gotowy
- ✅ Middleware authentication skonfigurowany
- ✅ LoginForm z API integration

### ⚠️ Do Zrobienia (1 krok!)

#### Dodaj PUBLIC_APP_URL do .env

W pliku `.env` (stwórz jeśli nie istnieje) dodaj:

```env
# Istniejące zmienne (powinny już być)
SUPABASE_URL=https://twoj-projekt.supabase.co
SUPABASE_KEY=twoj-anon-key

# DODAJ TĘ LINIĘ:
PUBLIC_APP_URL=http://localhost:4321
```

**Dlaczego?** Ta zmienna jest używana w:

- Email verification redirects (authService.register)
- Password reset redirects (authService.forgotPassword)

---

## 🧪 Test Lokalny (3 kroki)

### 1. Dodaj Zmienną (jeśli jeszcze nie ma)

```bash
# Dodaj do .env
PUBLIC_APP_URL=http://localhost:4321
```

### 2. Uruchom Serwer

```bash
npm run dev
```

### 3. Testuj Logowanie

Otwórz: `http://localhost:4321/login`

**Test 1: Sprawdź redirect dla zalogowanych**

- Jeśli jesteś zalogowany → automatyczne przekierowanie do `/fridge`

**Test 2: Spróbuj się zalogować**

- Email: (użyj istniejącego użytkownika z Supabase)
- Hasło: (prawidłowe hasło)
- Kliknij "Zaloguj się"
- Powinno przekierować do `/fridge`

**Test 3: Błędne dane**

- Email: test@test.pl
- Hasło: wrongpassword
- Powinno pokazać: "Nieprawidłowy email lub hasło"

---

## 🔍 Jak Sprawdzić Czy Działa?

### Console Browser (DevTools)

1. Otwórz DevTools (F12)
2. Przejdź na zakładkę **Network**
3. Zaloguj się
4. Powinien pojawić się request:
   - **POST** `/api/auth/login`
   - Status: **200 OK**
   - Response: `{ success: true, data: { user: {...}, session: {...} } }`

### Cookies (DevTools → Application)

Po zalogowaniu sprawdź cookies:

- `sb-<project>-auth-token` lub podobne
- httpOnly: true
- secure: false (dev), true (prod)

### Console Log (Opcjonalnie)

W `src/middleware/index.ts` możesz dodać debug:

```typescript
console.log("🔐 Middleware - User:", user?.email || "not logged in");
console.log("📍 Path:", pathname);
```

---

## ❌ Troubleshooting

### "Cannot redirect to /fridge"

**Przyczyna**: Strona `/fridge` wymaga uwierzytelnienia
**Rozwiązanie**: Middleware przekieruje do `/login` jeśli nie jesteś zalogowany. To jest prawidłowe zachowanie.

### "Invalid login credentials"

**Możliwe przyczyny**:

1. User nie istnieje w Supabase (sprawdź: Supabase Dashboard → Authentication → Users)
2. Błędne hasło
3. Błędne `SUPABASE_URL` lub `SUPABASE_KEY` w `.env`

**Fix**: Utwórz test usera w Supabase Dashboard:

- Authentication → Users → Invite user
- Lub użyj istniejącego

### "Module not found: @supabase/ssr"

**Fix**: `npm install @supabase/ssr` (już zrobione ✅)

### "PUBLIC_APP_URL is not defined"

**Fix**: Dodaj `PUBLIC_APP_URL=http://localhost:4321` do `.env`

---

## 📊 Checklist Przed Produkcją

- [ ] `PUBLIC_APP_URL` ustawione na produkcyjny URL
- [ ] Supabase Email Templates skonfigurowane (Site URL)
- [ ] HTTPS włączony (secure cookies)
- [ ] Rate limiting skonfigurowany w Supabase
- [ ] RLS policies włączone na tabelach

---

## 🎉 Gotowe!

Jeśli wszystko działa:

1. Logowanie powinno przekierowywać do `/fridge`
2. Niezalogowani users na `/fridge` → redirect do `/login`
3. Zalogowani users na `/login` → redirect do `/fridge`

**Następne kroki**: Implementacja Register, Forgot Password, Logout (authService już ma metody!)

---

**Pytania?** Zobacz `IMPLEMENTATION_GUIDE.md` dla szczegółowej dokumentacji.
