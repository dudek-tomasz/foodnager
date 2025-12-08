# Specyfikacja Techniczna Modułu Autentykacji - Foodnager

## Przegląd

Niniejsza specyfikacja definiuje architekturę systemu autentykacji dla aplikacji Foodnager zgodnie z wymaganiem US-001 z PRD. System wykorzystuje Supabase Auth jako provider autentykacji w połączeniu z Astro server-side rendering i React dla komponentów interaktywnych.

## ⚠️ Wyjaśnienia i Uproszczenia dla MVP

### Zakres Publicznych Stron

**PRD US-001.5** mówi: _"Dla niezalogowanych użytkowników dostępny jest tylko i wyłącznie dedykowany widok logowania/rejestracji"_

**Wyjaśnienie**: Strony `/forgot-password` i `/reset-password` są **niezbędne** dla realizacji **US-001.7** (odzyskiwanie hasła) i są traktowane jako rozszerzenie funkcjonalności logowania. Są to jedyne dodatkowe publiczne strony poza `/login` i `/register`.

### Email Verification - MVP Simplification

**PRD nie wymaga** weryfikacji email przed pierwszym logowaniem.

**Decyzja dla MVP**:

- Supabase wysyła email weryfikacyjny po rejestracji (wymóg US-001.3: "potwierdzenie rejestracji")
- Użytkownik **MOŻE zalogować się bez klikania linku** weryfikacyjnego
- Sprawdzanie `email_confirmed_at` jest **WYŁĄCZONE** dla MVP
- W przyszłości można włączyć wymóg weryfikacji

**Zmiany w implementacji**:

- W `authService.login()` - USUNĄĆ sprawdzanie `email_confirmed_at`
- W komunikatach błędów - USUNĄĆ "EMAIL_NOT_VERIFIED"

### Funkcjonalności Opcjonalne dla MVP (Do Usunięcia/Uproszczenia)

#### 1. Terms & Conditions Checkbox

- **Status**: USUNĄĆ z MVP
- **Powód**: PRD nie wymaga akceptacji regulaminu
- **Działanie**: Usunąć pole `termsAccepted` z RegisterForm i walidacji

#### 2. "Remember Me" Checkbox

- **Status**: USUNĄĆ z MVP
- **Powód**: PRD nie wymaga tej funkcjonalności, Supabase automatycznie persystuje sesje
- **Działanie**: Usunąć pole `remember` z LoginForm i logiki API

#### 3. Display Name

- **Status**: UPROŚCIĆ dla MVP
- **Powód**: PRD nie wspomina o nazwie wyświetlanej
- **Działanie**:
  - Pole `display_name` w tabeli `profiles` może pozostać (NULL dla MVP)
  - Nie wyświetlać w UI, używać tylko email
  - UserInfoDisplay pokazuje tylko email (bez displayName)

#### 4. Avatar URL

- **Status**: USUNĄĆ z MVP
- **Powód**: PRD nie wspomina o avatarach
- **Działanie**: Usunąć pole `avatar_url` z tabeli profiles i wszystkich komponentów

#### 5. Statystyki w Profilu

- **Status**: UPROŚCIĆ dla MVP
- **Powód**: PRD nie wymaga statystyk w profilu
- **Działanie**: ProfileView może pokazać podstawowe info (email, data rejestracji) bez statystyk

### ⚠️ WAŻNE: Tabela Profiles NIE JEST POTRZEBNA dla MVP

**Decyzja**: Tabela `profiles` jest **ZBĘDNA** dla MVP.

**Uzasadnienie**:

- Supabase Auth (`auth.users`) już zawiera wszystkie potrzebne dane: `id`, `email`, `created_at`, `updated_at`
- Dla MVP nie potrzebujemy żadnych dodatkowych pól
- `display_name` można w przyszłości zapisać w `raw_user_meta_data` jeśli będzie potrzebne
- Zmniejsza to złożoność systemu i liczbę migracji

**Dane dostępne z auth.users przez session/user object**:

- `user.id` - UUID użytkownika
- `user.email` - email użytkownika
- `user.created_at` - data rejestracji
- `user.email_confirmed_at` - data weryfikacji email (opcjonalnie)
- `user.user_metadata` - dodatkowe dane (dla przyszłości)

## 1. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 1.1. Struktura Layoutów

#### 1.1.1. AuthLayout (nowy) - `src/layouts/AuthLayout.astro`

**Cel**: Dedykowany layout dla stron autentykacji (login, register, forgot-password, reset-password)

**Charakterystyka**:

- Brak nawigacji (sidebar/bottom nav)
- Pełnoekranowy layout z wycentrowanym contentem
- Gradient background dla lepszej estetyki
- Responsywny design
- Włącza globalny toast system dla komunikatów

**Struktura**:

```astro
---
interface Props {
  title: string;
  description?: string;
}
---

<!doctype html>
<html lang="pl">
  <head>
    <!-- Meta tags, title, favicon -->
  </head>
  <body>
    <div class="auth-layout">
      <slot />
    </div>
    <Toaster client:load />
  </body>
</html>
```

**Style**:

- Full viewport height
- Centered content (flexbox)
- Gradient background (podobny do obecnego w login.astro)
- Brak marginesów dla sidebar/bottom nav

#### 1.1.2. Layout (rozszerzenie) - `src/layouts/Layout.astro`

**Modyfikacje**:

- Dodanie sekcji user info w Sidebar (desktop)
- Przekazanie user data do Sidebar i BottomNavigation
- Protected layout - wymaga zalogowanego użytkownika

**Nowa struktura Props**:

```typescript
interface Props {
  title?: string;
  description?: string;
  user?: {
    id: string;
    email: string;
  };
}
```

**Logika server-side**:

- Sprawdzenie sesji użytkownika w context.locals
- Przekierowanie do /login jeśli brak sesji
- Pobranie danych użytkownika z Supabase Auth

### 1.2. Strony Autentykacji

#### 1.2.1. Strona Logowania - `src/pages/login.astro`

**Status**: Refaktoryzacja istniejącej (mock → production)

**Layout**: AuthLayout

**Rendering**: Server-side (`export const prerender = false`)

**Komponenty**:

- LoginForm (React) - `src/components/auth/LoginForm.tsx`

**Logika server-side**:

- Sprawdzenie czy użytkownik jest już zalogowany
- Jeśli tak → redirect do /fridge
- Jeśli nie → renderuj formularz

**Struktura strony**:

```astro
---
import AuthLayout from "@/layouts/AuthLayout.astro";
import LoginForm from "@/components/auth/LoginForm";

export const prerender = false;

// Sprawdź czy użytkownik jest już zalogowany
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();
if (session) {
  return Astro.redirect("/fridge");
}

// Pobierz redirect URL z query params (opcjonalnie)
const redirectTo = Astro.url.searchParams.get("redirect") || "/fridge";
---

<AuthLayout title="Logowanie - Foodnager">
  <LoginForm client:load redirectTo={redirectTo} />
</AuthLayout>
```

#### 1.2.2. Strona Rejestracji - `src/pages/register.astro`

**Status**: Refaktoryzacja istniejącej (mock → production)

**Layout**: AuthLayout

**Rendering**: Server-side (`export const prerender = false`)

**Komponenty**:

- RegisterForm (React) - `src/components/auth/RegisterForm.tsx`

**Logika server-side**:

- Sprawdzenie czy użytkownik jest już zalogowany
- Jeśli tak → redirect do /fridge
- Jeśli nie → renderuj formularz

**Struktura strony**:

```astro
---
import AuthLayout from "@/layouts/AuthLayout.astro";
import RegisterForm from "@/components/auth/RegisterForm";

export const prerender = false;

// Sprawdź czy użytkownik jest już zalogowany
const {
  data: { session },
} = await Astro.locals.supabase.auth.getSession();
if (session) {
  return Astro.redirect("/fridge");
}
---

<AuthLayout title="Rejestracja - Foodnager">
  <RegisterForm client:load />
</AuthLayout>
```

#### 1.2.3. Strona Odzyskiwania Hasła - `src/pages/forgot-password.astro` (nowa)

**Layout**: AuthLayout

**Rendering**: Server-side (`export const prerender = false`)

**Komponenty**:

- ForgotPasswordForm (React) - `src/components/auth/ForgotPasswordForm.tsx`

**Logika**:

- Formularz z polem email
- Po wysłaniu → email z linkiem resetującym
- Komunikat o sukcesie (toast)

#### 1.2.4. Strona Resetowania Hasła - `src/pages/reset-password.astro` (nowa)

**Layout**: AuthLayout

**Rendering**: Server-side (`export const prerender = false`)

**Komponenty**:

- ResetPasswordForm (React) - `src/components/auth/ResetPasswordForm.tsx`

**Logika server-side**:

- Walidacja tokenu z URL (query param lub hash)
- Jeśli token nieprawidłowy → komunikat błędu + link do forgot-password

**Struktura**:

```astro
---
import AuthLayout from "@/layouts/AuthLayout.astro";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";

export const prerender = false;

// Pobierz token z URL
const token = Astro.url.searchParams.get("token") || Astro.url.hash;

if (!token) {
  return Astro.redirect("/forgot-password?error=invalid_token");
}
---

<AuthLayout title="Resetowanie hasła - Foodnager">
  <ResetPasswordForm client:load token={token} />
</AuthLayout>
```

#### 1.2.5. Strona Profilu - `src/pages/profile.astro` (nowa)

**Layout**: Layout (standardowy z nawigacją)

**Rendering**: Server-side (`export const prerender = false`)

**Komponenty**:

- ProfileView (React) - `src/components/profile/ProfileView.tsx`
- UserInfoCard (React) - `src/components/profile/UserInfoCard.tsx`
- LogoutButton (React) - `src/components/profile/LogoutButton.tsx`

**Logika server-side**:

- Protected route - wymaga zalogowanego użytkownika
- Pobranie danych użytkownika z Astro.locals.user (z auth.users)
- Opcjonalnie: pobranie podstawowych statystyk (liczba przepisów, produktów - dla przyszłości)

**Funkcjonalności**:

- Wyświetlenie informacji o użytkowniku (email, data rejestracji)
- Statystyki użytkownika
- Przycisk wylogowania (dla mobile, na desktop będzie w sidebar)
- Link do zmiany hasła (opcjonalnie w MVP)

### 1.3. Komponenty React dla Autentykacji

#### 1.3.1. LoginForm - `src/components/auth/LoginForm.tsx`

**Props**:

```typescript
interface LoginFormProps {
  redirectTo?: string;
}
```

**State**:

```typescript
{
  email: string;
  password: string;
  isLoading: boolean;
  error: string | null;
}
```

**Funkcjonalności**:

- Formularz z polami: email, password
- Walidacja client-side (Zod schema)
- Obsługa błędów z backendu
- Loading state podczas logowania
- Link do rejestracji
- Link do zapomnienia hasła
- Wykorzystanie Shadcn/ui components (Card, Input, Button, Label)

**API call**:

- POST /api/auth/login
- W przypadku sukcesu → redirect do redirectTo (domyślnie /fridge)
- W przypadku błędu → wyświetlenie komunikatu

**Walidacja**:

```typescript
const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});
```

**Komunikaty błędów**:

- "Nieprawidłowy email lub hasło" - dla błędów autoryzacji
- "Wystąpił błąd podczas logowania. Spróbuj ponownie." - dla innych błędów

#### 1.3.2. RegisterForm - `src/components/auth/RegisterForm.tsx`

**State**:

```typescript
{
  email: string;
  password: string;
  passwordConfirm: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}
```

**Funkcjonalności**:

- Formularz z polami: email, password, passwordConfirm
- Walidacja client-side (Zod schema)
- Sprawdzenie zgodności haseł
- Obsługa błędów z backendu
- Loading state podczas rejestracji
- Link do logowania
- Komunikat o wysłaniu maila weryfikacyjnego po rejestracji (opcjonalny dla MVP - użytkownik może się zalogować bez weryfikacji)
- Wykorzystanie Shadcn/ui components

**API call**:

- POST /api/auth/register
- W przypadku sukcesu → wyświetlenie komunikatu o wysłaniu maila weryfikacyjnego
- Po weryfikacji → przekierowanie do /login?verified=true

**Walidacja**:

```typescript
const registerSchema = z
  .object({
    email: z.string().email("Nieprawidłowy format email"),
    password: z
      .string()
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać przynajmniej jedną wielką literę")
      .regex(/[a-z]/, "Hasło musi zawierać przynajmniej jedną małą literę")
      .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę"),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hasła nie są zgodne",
    path: ["passwordConfirm"],
  });
```

**Komunikaty błędów**:

- "Ten email jest już zarejestrowany" - dla duplikatów
- "Hasło musi spełniać wymagania bezpieczeństwa" - dla słabych haseł
- "Wystąpił błąd podczas rejestracji. Spróbuj ponownie." - dla innych błędów

**Komunikat sukcesu (MVP - Uproszczony)**:

- "Konto zostało utworzone! Możesz się teraz zalogować."
- Opcjonalnie można dodać: "Sprawdź swoją skrzynkę email aby potwierdzić adres (opcjonalne)."

#### 1.3.3. ForgotPasswordForm - `src/components/auth/ForgotPasswordForm.tsx`

**State**:

```typescript
{
  email: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}
```

**Funkcjonalności**:

- Pojedyncze pole email
- Walidacja email
- Loading state
- Komunikat sukcesu
- Link powrotny do logowania

**API call**:

- POST /api/auth/forgot-password
- Zawsze zwraca sukces (security best practice - nie ujawnia czy email istnieje)

**Walidacja**:

```typescript
const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
});
```

**Komunikat sukcesu**:

- "Jeśli konto z tym adresem email istnieje, wysłaliśmy instrukcje resetowania hasła."

#### 1.3.4. ResetPasswordForm - `src/components/auth/ResetPasswordForm.tsx`

**Props**:

```typescript
interface ResetPasswordFormProps {
  token: string;
}
```

**State**:

```typescript
{
  password: string;
  passwordConfirm: string;
  isLoading: boolean;
  error: string | null;
  success: boolean;
}
```

**Funkcjonalności**:

- Pola: password, passwordConfirm
- Walidacja siły hasła
- Sprawdzenie zgodności haseł
- Loading state
- Po sukcesie → redirect do /login?reset=success

**API call**:

- POST /api/auth/reset-password
- Body: { token, newPassword }

**Walidacja**:

- Taka sama jak dla password w RegisterForm

**Komunikaty**:

- Sukces: "Hasło zostało zmienione. Możesz się teraz zalogować."
- Błąd: "Link resetujący wygasł lub jest nieprawidłowy."

#### 1.3.5. ProfileView - `src/components/profile/ProfileView.tsx`

**Props**:

```typescript
interface ProfileViewProps {
  user: {
    id: string;
    email: string;
    createdAt: string;
  };
}
```

**Funkcjonalności (MVP - Uproszczone)**:

- Wyświetlenie informacji o użytkowniku (email, data rejestracji)
- Przycisk wylogowania (dla mobile)
- Sekcja "Moje konto" z podstawowymi danymi

**Komponenty wewnętrzne**:

- UserInfoCard - karta z danymi użytkownika
- LogoutButton - przycisk wylogowania

**Uwaga**: Statystyki (liczba przepisów, produktów itp.) mogą być dodane w przyszłości jako rozszerzenie.

#### 1.3.6. UserInfoDisplay - `src/components/auth/UserInfoDisplay.tsx`

**Props**:

```typescript
interface UserInfoDisplayProps {
  user: {
    email: string;
  };
  variant: "sidebar" | "mobile";
}
```

**Funkcjonalności (MVP - Uproszczone)**:

- Wyświetlenie avatar (inicjały z email - pierwsze litery przed @)
- Wyświetlenie email
- Przycisk wylogowania (tylko dla variant="sidebar")
- Responsywny design

**Lokalizacja**:

- Desktop: Na dole Sidebar
- Mobile: Na stronie /profile

### 1.4. Modyfikacje Komponentów Nawigacji

#### 1.4.1. Sidebar - `src/components/navigation/Sidebar.astro`

**Modyfikacje**:

- Dodanie sekcji user info na dole sidebar (przed CTA button lub po nim)
- Przyjmowanie props user
- Wyświetlenie UserInfoDisplay tylko gdy user jest zalogowany

**Nowa struktura**:

```astro
---
interface Props {
  currentPath: string;
  user?: {
    email: string;
  };
}
---

<aside class="sidebar">
  <!-- Logo, Navigation (bez zmian) -->

  <!-- User Section (nowe) -->
  {
    user && (
      <div class="sidebar-user">
        <UserInfoDisplay user={user} variant="sidebar" client:load />
      </div>
    )
  }

  <!-- CTA Button -->
  <div class="sidebar-footer">
    <!-- ... -->
  </div>
</aside>
```

#### 1.4.2. BottomNavigation - `src/components/navigation/BottomNavigation.astro`

**Modyfikacje**:

- Zmiana linku "Profil" z /login na /profile
- Link aktywny gdy jesteśmy na /profile

**Zmiana w navItems**:

```typescript
{
  href: '/profile',  // zmienione z /login
  label: 'Profil',
  icon: '👤',
  isActive: isActive('/profile'),
  isCTA: false,
}
```

### 1.5. Walidacja i Komunikaty Błędów

#### 1.5.1. Schemat Walidacji Zod

Wszystkie schematy walidacji będą w dedykowanym pliku:

**`src/lib/validations/auth.validation.ts`**

```typescript
import { z } from "zod";

// Schema dla logowania (MVP - uproszczone, bez remember)
export const loginSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
  password: z.string().min(1, "Hasło jest wymagane"),
});

// Schema dla rejestracji (MVP - bez termsAccepted)
export const registerSchema = z
  .object({
    email: z.string().email("Nieprawidłowy format email"),
    password: z
      .string()
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać przynajmniej jedną wielką literę")
      .regex(/[a-z]/, "Hasło musi zawierać przynajmniej jedną małą literę")
      .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę"),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hasła nie są zgodne",
    path: ["passwordConfirm"],
  });

// Schema dla zapomnienia hasła
export const forgotPasswordSchema = z.object({
  email: z.string().email("Nieprawidłowy format email"),
});

// Schema dla resetowania hasła
export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, "Token jest wymagany"),
    password: z
      .string()
      .min(8, "Hasło musi mieć minimum 8 znaków")
      .regex(/[A-Z]/, "Hasło musi zawierać przynajmniej jedną wielką literę")
      .regex(/[a-z]/, "Hasło musi zawierać przynajmniej jedną małą literę")
      .regex(/[0-9]/, "Hasło musi zawierać przynajmniej jedną cyfrę"),
    passwordConfirm: z.string(),
  })
  .refine((data) => data.password === data.passwordConfirm, {
    message: "Hasła nie są zgodne",
    path: ["passwordConfirm"],
  });

// Typy TypeScript dla validacji
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
```

#### 1.5.2. Komunikaty Toast

Wykorzystanie biblioteki Sonner (już zintegrowanej w projekcie):

**Typy komunikatów**:

- `toast.success()` - dla operacji zakończonych sukcesem
- `toast.error()` - dla błędów
- `toast.info()` - dla informacji
- `toast.loading()` - dla operacji w toku

**Przykłady (MVP - Zaktualizowane)**:

```typescript
// Sukces logowania
toast.success("Zalogowano pomyślnie!");

// Błąd logowania
toast.error("Nieprawidłowy email lub hasło");

// Sukces rejestracji (MVP - uproszczony komunikat)
toast.success("Konto utworzone! Możesz się teraz zalogować.");

// Błąd rejestracji
toast.error("Ten email jest już zarejestrowany");

// Wysłanie linku resetującego
toast.success("Link do resetowania hasła został wysłany na Twój email");

// Sukces zmiany hasła
toast.success("Hasło zostało zmienione");

// Wylogowanie
toast.success("Wylogowano pomyślnie");
```

### 1.6. Obsługa Scenariuszy

#### 1.6.1. Scenariusz: Udane Logowanie

1. Użytkownik wchodzi na /login
2. Wypełnia formularz (email, hasło)
3. Kliknięcie "Zaloguj się"
4. Loading state na przycisku
5. Wywołanie POST /api/auth/login
6. Backend tworzy sesję (cookie)
7. Redirect do /fridge (lub redirectTo z query params)
8. Toast success: "Zalogowano pomyślnie!"

#### 1.6.2. Scenariusz: Nieudane Logowanie - Złe Hasło

1. Użytkownik wchodzi na /login
2. Wypełnia formularz z nieprawidłowym hasłem
3. Kliknięcie "Zaloguj się"
4. Wywołanie POST /api/auth/login
5. Backend zwraca 401 Unauthorized
6. Wyświetlenie toast error: "Nieprawidłowy email lub hasło"
7. Użytkownik pozostaje na /login

#### 1.6.3. Scenariusz: Udana Rejestracja (MVP - Uproszczona)

1. Użytkownik wchodzi na /register
2. Wypełnia formularz (email, hasło, potwierdzenie hasła)
3. Kliknięcie "Zarejestruj się"
4. Loading state na przycisku
5. Wywołanie POST /api/auth/register
6. Backend tworzy konto w Supabase Auth
7. Supabase wysyła email weryfikacyjny (opcjonalny)
8. Wyświetlenie komunikatu sukcesu
9. Automatyczne przekierowanie do /login po 3 sekundach
10. Toast success: "Konto utworzone! Możesz się teraz zalogować."
11. **User może się zalogować od razu bez klikania linku weryfikacyjnego**

#### 1.6.4. Scenariusz: Nieudana Rejestracja - Email Już Istnieje

1. Użytkownik wchodzi na /register
2. Wypełnia formularz z emailem który już istnieje
3. Kliknięcie "Zarejestruj się"
4. Wywołanie POST /api/auth/register
5. Backend zwraca 409 Conflict
6. Toast error: "Ten email jest już zarejestrowany"
7. Focus na pole email

#### 1.6.5. Scenariusz: Zapomniałem Hasła

1. Użytkownik na stronie /login klika "Zapomniałeś hasła?"
2. Przekierowanie na /forgot-password
3. Wpisuje email
4. Kliknięcie "Wyślij link resetujący"
5. Wywołanie POST /api/auth/forgot-password
6. Backend wysyła email z linkiem (via Supabase)
7. Toast success: "Link do resetowania hasła został wysłany"
8. Automatyczne przekierowanie do /login po 3 sekundach

#### 1.6.6. Scenariusz: Reset Hasła

1. Użytkownik klika link z emaila
2. Link: /reset-password?token=XXX
3. Strona weryfikuje token server-side
4. Jeśli token prawidłowy → renderuje formularz
5. Użytkownik wpisuje nowe hasło i potwierdzenie
6. Kliknięcie "Zmień hasło"
7. Wywołanie POST /api/auth/reset-password
8. Backend zmienia hasło w Supabase Auth
9. Toast success: "Hasło zostało zmienione"
10. Redirect do /login?reset=success

#### 1.6.7. Scenariusz: Próba Dostępu do Chronionej Strony Bez Logowania

1. Niezalogowany użytkownik próbuje wejść na /fridge
2. Middleware sprawdza sesję
3. Brak sesji → redirect do /login?redirect=/fridge
4. Toast info: "Musisz się zalogować aby uzyskać dostęp"
5. Po zalogowaniu → automatyczny redirect do /fridge

#### 1.6.8. Scenariusz: Wylogowanie (Desktop)

1. Zalogowany użytkownik klika przycisk "Wyloguj" w Sidebar
2. Wywołanie POST /api/auth/logout
3. Backend usuwa sesję (cookie)
4. Redirect do /login
5. Toast success: "Wylogowano pomyślnie"

#### 1.6.9. Scenariusz: Wylogowanie (Mobile)

1. Zalogowany użytkownik wchodzi na zakładkę "Profil" (bottom nav)
2. Strona /profile wyświetla informacje i przycisk "Wyloguj"
3. Kliknięcie "Wyloguj"
4. Wywołanie POST /api/auth/logout
5. Backend usuwa sesję
6. Redirect do /login
7. Toast success: "Wylogowano pomyślnie"

---

## 2. LOGIKA BACKENDOWA

### 2.1. Endpointy API

Wszystkie endpointy autentykacji będą w katalogu `src/pages/api/auth/`

#### 2.1.1. POST /api/auth/login - `src/pages/api/auth/login.ts`

**Cel**: Logowanie użytkownika

**Request Body**:

```typescript
{
  email: string;
  password: string;
}
```

**Response Success (200)**:

```typescript
{
  success: true;
  data: {
    user: {
      id: string;
      email: string;
    }
    session: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    }
  }
}
```

**Response Error (401)**:

```typescript
{
  success: false;
  error: {
    message: string;
    code: "INVALID_CREDENTIALS";
  }
}
```

**Logika (MVP - Uproszczona)**:

1. Walidacja danych wejściowych (Zod)
2. Wywołanie authService.login(email, password)
3. Utworzenie sesji w Supabase Auth (Supabase zarządza automatycznie)
4. Ustawienie cookies (access_token, refresh_token - automatycznie przez Supabase)
5. Zwrócenie danych użytkownika z auth.users

**Obsługa błędów**:

- 400 Bad Request - nieprawidłowe dane wejściowe
- 401 Unauthorized - złe hasło lub email
- 500 Internal Server Error - błąd serwera

**Uwaga MVP**: Sprawdzanie weryfikacji email jest WYŁĄCZONE dla MVP (zgodnie z PRD).

#### 2.1.2. POST /api/auth/register - `src/pages/api/auth/register.ts`

**Cel**: Rejestracja nowego użytkownika

**Request Body**:

```typescript
{
  email: string;
  password: string;
  passwordConfirm: string;
}
```

**Response Success (201)**:

```typescript
{
  success: true;
  data: {
    message: string; // MVP: "Konto utworzone. Możesz się teraz zalogować."
    user: {
      id: string;
      email: string;
    }
  }
}
```

**Response Error (409)**:

```typescript
{
  success: false;
  error: {
    message: string;
    code: "EMAIL_ALREADY_EXISTS";
  }
}
```

**Logika**:

1. Walidacja danych wejściowych (Zod)
2. Sprawdzenie czy email już istnieje
3. Wywołanie authService.register(email, password)
4. Supabase Auth tworzy użytkownika i wysyła email weryfikacyjny
5. Zwrócenie sukcesu (user musi potwierdzić email)

**Obsługa błędów**:

- 400 Bad Request - nieprawidłowe dane
- 409 Conflict - email już istnieje
- 500 Internal Server Error - błąd serwera

#### 2.1.3. POST /api/auth/logout - `src/pages/api/auth/logout.ts`

**Cel**: Wylogowanie użytkownika

**Request**: Brak body (sesja z cookies)

**Response Success (200)**:

```typescript
{
  success: true;
  data: {
    message: "Wylogowano pomyślnie";
  }
}
```

**Logika**:

1. Pobranie sesji z cookies
2. Wywołanie authService.logout()
3. Usunięcie cookies
4. Zwrócenie sukcesu

**Obsługa błędów**:

- 401 Unauthorized - brak sesji
- 500 Internal Server Error

#### 2.1.4. POST /api/auth/forgot-password - `src/pages/api/auth/forgot-password.ts`

**Cel**: Wysłanie linku resetującego hasło

**Request Body**:

```typescript
{
  email: string;
}
```

**Response Success (200)**:

```typescript
{
  success: true;
  data: {
    message: string; // Zawsze ten sam komunikat (security)
  }
}
```

**Logika**:

1. Walidacja email (Zod)
2. Wywołanie authService.forgotPassword(email)
3. Supabase wysyła email z linkiem resetującym (jeśli email istnieje)
4. Zawsze zwracamy sukces (nie ujawniamy czy email istnieje)

**Obsługa błędów**:

- 400 Bad Request - nieprawidłowy email
- 500 Internal Server Error

#### 2.1.5. POST /api/auth/reset-password - `src/pages/api/auth/reset-password.ts`

**Cel**: Zmiana hasła używając tokenu z emaila

**Request Body**:

```typescript
{
  token: string;
  newPassword: string;
  passwordConfirm: string;
}
```

**Response Success (200)**:

```typescript
{
  success: true;
  data: {
    message: "Hasło zostało zmienione";
  }
}
```

**Response Error (400)**:

```typescript
{
  success: false;
  error: {
    message: string;
    code: "INVALID_TOKEN" | "TOKEN_EXPIRED";
  }
}
```

**Logika**:

1. Walidacja danych (Zod)
2. Weryfikacja tokenu
3. Wywołanie authService.resetPassword(token, newPassword)
4. Supabase zmienia hasło
5. Zwrócenie sukcesu

**Obsługa błędów**:

- 400 Bad Request - nieprawidłowy token lub dane
- 500 Internal Server Error

#### 2.1.6. GET /api/auth/verify - `src/pages/api/auth/verify.ts`

**Cel**: Weryfikacja emaila po kliknięciu linku z emaila

**Request**: Query params z tokenem (obsługiwane przez Supabase)

**Response**:

- Redirect do /login?verified=true (sukces)
- Redirect do /login?error=verification_failed (błąd)

**Logika**:

1. Supabase automatycznie obsługuje weryfikację
2. Endpoint tylko przekierowuje z odpowiednimi parametrami

#### 2.1.7. GET /api/auth/session - `src/pages/api/auth/session.ts`

**Cel**: Pobranie aktualnej sesji użytkownika

**Request**: Brak (sesja z cookies)

**Response Success (200)**:

```typescript
{
  success: true;
  data: {
    user: {
      id: string;
      email: string;
      emailVerified: boolean;
    } | null;
    session: {
      access_token: string;
      expires_at: number;
    } | null;
  };
}
```

**Logika**:

1. Pobranie sesji z cookies
2. Walidacja sesji w Supabase
3. Zwrócenie danych użytkownika lub null

**Użycie**:

- Client-side dla sprawdzenia czy użytkownik jest zalogowany
- Refresh komponentów wymagających danych użytkownika

### 2.2. Serwis Autentykacji

**Plik**: `src/lib/services/auth.service.ts`

**Cel**: Centralizacja logiki autentykacji z Supabase Auth

**Interface**:

```typescript
export interface AuthService {
  // Logowanie
  login(email: string, password: string): Promise<AuthResponse>;

  // Rejestracja
  register(email: string, password: string): Promise<AuthResponse>;

  // Wylogowanie
  logout(): Promise<void>;

  // Zapomnienie hasła
  forgotPassword(email: string): Promise<void>;

  // Reset hasła
  resetPassword(token: string, newPassword: string): Promise<void>;

  // Pobranie aktualnej sesji
  getSession(): Promise<Session | null>;

  // Pobranie użytkownika
  getUser(): Promise<User | null>;

  // Sprawdzenie czy użytkownik jest zalogowany
  isAuthenticated(): Promise<boolean>;

  // Refresh tokenu
  refreshSession(): Promise<Session | null>;
}
```

**Implementacja kluczowych metod**:

```typescript
import { supabaseClient } from "@/db/supabase.client";
import type { User, Session } from "@supabase/supabase-js";

class AuthServiceImpl implements AuthService {
  async login(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new AuthError(error.message, "INVALID_CREDENTIALS");
    }

    // MVP: Nie sprawdzamy email_confirmed_at - użytkownik może się zalogować bez weryfikacji
    // W przyszłości można dodać:
    // if (!data.user.email_confirmed_at) {
    //   throw new AuthError('Email nie został zweryfikowany', 'EMAIL_NOT_VERIFIED');
    // }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async register(email: string, password: string): Promise<AuthResponse> {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${import.meta.env.PUBLIC_APP_URL}/api/auth/verify`,
      },
    });

    if (error) {
      if (error.message.includes("already registered")) {
        throw new AuthError("Ten email jest już zarejestrowany", "EMAIL_ALREADY_EXISTS");
      }
      throw new AuthError(error.message, "REGISTRATION_FAILED");
    }

    return {
      user: data.user,
      session: data.session,
    };
  }

  async logout(): Promise<void> {
    const { error } = await supabaseClient.auth.signOut();

    if (error) {
      throw new AuthError(error.message, "LOGOUT_FAILED");
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: `${import.meta.env.PUBLIC_APP_URL}/reset-password`,
    });

    // Nie rzucamy błędu nawet jeśli email nie istnieje (security)
    if (error && !error.message.includes("not found")) {
      throw new AuthError(error.message, "FORGOT_PASSWORD_FAILED");
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    // Najpierw weryfikujemy token i ustawiamy sesję
    const { error: verifyError } = await supabaseClient.auth.verifyOtp({
      token_hash: token,
      type: "recovery",
    });

    if (verifyError) {
      throw new AuthError("Token jest nieprawidłowy lub wygasł", "INVALID_TOKEN");
    }

    // Następnie zmieniamy hasło
    const { error: updateError } = await supabaseClient.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new AuthError(updateError.message, "RESET_PASSWORD_FAILED");
    }
  }

  async getSession(): Promise<Session | null> {
    const { data } = await supabaseClient.auth.getSession();
    return data.session;
  }

  async getUser(): Promise<User | null> {
    const { data } = await supabaseClient.auth.getUser();
    return data.user;
  }

  async isAuthenticated(): Promise<boolean> {
    const session = await this.getSession();
    return session !== null;
  }

  async refreshSession(): Promise<Session | null> {
    const { data, error } = await supabaseClient.auth.refreshSession();

    if (error) {
      return null;
    }

    return data.session;
  }
}

export const authService = new AuthServiceImpl();
```

**Obsługa błędów**:

```typescript
// src/lib/errors/auth.error.ts
export class AuthError extends Error {
  constructor(
    message: string,
    public code: AuthErrorCode,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AuthError";
  }
}

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_ALREADY_EXISTS"
  | "REGISTRATION_FAILED"
  | "LOGOUT_FAILED"
  | "FORGOT_PASSWORD_FAILED"
  | "INVALID_TOKEN"
  | "TOKEN_EXPIRED"
  | "RESET_PASSWORD_FAILED"
  | "SESSION_EXPIRED"
  | "UNAUTHORIZED";

// Uwaga MVP: EMAIL_NOT_VERIFIED usunięte - weryfikacja email opcjonalna dla MVP
```

### 2.3. Middleware

**Plik**: `src/middleware/index.ts` (rozszerzenie istniejącego)

**Cel**: Automatyczne zarządzanie sesjami, przekierowania, ochrona route'ów

**Rozszerzona implementacja**:

```typescript
import { defineMiddleware } from "astro:middleware";
import { supabaseClient } from "../db/supabase.client.ts";

// Publiczne ścieżki (nie wymagają autentykacji)
const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify",
];

// Ścieżki tylko dla niezalogowanych (redirect jeśli zalogowany)
const AUTH_ONLY_PATHS = ["/login", "/register", "/forgot-password", "/reset-password"];

export const onRequest = defineMiddleware(async (context, next) => {
  // Dodaj supabase do locals
  context.locals.supabase = supabaseClient;

  const { pathname } = context.url;

  // Sprawdź sesję użytkownika
  const {
    data: { session },
  } = await supabaseClient.auth.getSession();

  // Dodaj sesję i user do locals
  context.locals.session = session;
  context.locals.user = session?.user || null;

  // Jeśli użytkownik zalogowany próbuje wejść na stronę auth → redirect do /fridge
  if (session && AUTH_ONLY_PATHS.some((path) => pathname.startsWith(path))) {
    return context.redirect("/fridge");
  }

  // Jeśli ścieżka jest publiczna → kontynuuj
  if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
    return next();
  }

  // Jeśli ścieżka chroniona i brak sesji → redirect do /login
  if (!session) {
    const redirectUrl = encodeURIComponent(pathname);
    return context.redirect(`/login?redirect=${redirectUrl}`);
  }

  // MVP: Weryfikacja email WYŁĄCZONA - użytkownik może korzystać z aplikacji bez potwierdzenia emaila
  // W przyszłości można dodać:
  // if (session.user && !session.user.email_confirmed_at) {
  //   return context.redirect('/verify-email');
  // }

  // Kontynuuj request
  return next();
});
```

**Rozszerzenie Astro.locals**:

```typescript
// src/env.d.ts
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    supabase: import("@/db/supabase.client").SupabaseClient;
    session: import("@supabase/supabase-js").Session | null;
    user: import("@supabase/supabase-js").User | null;
  }
}
```

### 2.4. Aktualizacja Server-Side Rendering

Wszystkie chronione strony muszą zostać zaktualizowane aby wykorzystywać dane sesji z `Astro.locals`:

**Przykład - fridge.astro**:

```astro
---
import Layout from "@/layouts/Layout.astro";
import FridgeView from "@/components/fridge/FridgeView";

export const prerender = false;

// Pobierz użytkownika z locals (middleware już sprawdził sesję)
const user = Astro.locals.user;

// Opcjonalnie: dodatkowa walidacja (middleware już to robi)
if (!user) {
  return Astro.redirect("/login?redirect=/fridge");
}

// Przygotuj dane użytkownika dla Layout (MVP - tylko email)
const userData = {
  id: user.id,
  email: user.email,
};
---

<Layout title="Lodówka - Foodnager" user={userData}>
  <FridgeView client:load userId={user.id} />
</Layout>
```

**Podobnie dla innych stron**:

- recipes.astro
- recipes/[id].astro
- recipes/search.astro
- history.astro
- profile.astro (nowa)

### 2.5. Zarządzanie Cookies

**Konfiguracja cookies dla sesji**:

Supabase Auth automatycznie zarządza cookies, ale możemy je skonfigurować:

```typescript
// W authService lub middleware
const cookieOptions = {
  maxAge: 60 * 60 * 24 * 7, // 7 dni
  httpOnly: true,
  secure: import.meta.env.PROD, // tylko HTTPS w produkcji
  sameSite: "lax" as const,
  path: "/",
};
```

**Cookies używane przez Supabase Auth**:

- `sb-access-token` - JWT access token
- `sb-refresh-token` - refresh token
- `sb-auth-token` - combined token (w niektórych konfiguracjach)

---

## 3. SYSTEM AUTENTYKACJI

### 3.1. Integracja z Supabase Auth

#### 3.1.1. Konfiguracja Supabase

**Plik**: `src/db/supabase.client.ts` (aktualizacja)

**Aktualna konfiguracja**:

```typescript
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

export const supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export type SupabaseClient = typeof supabaseClient;
```

**Zmienne środowiskowe** (`.env`):

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_KEY=your-anon-key

# App
PUBLIC_APP_URL=http://localhost:3000
```

#### 3.1.2. Konfiguracja Email Templates w Supabase

W panelu Supabase (Authentication > Email Templates) skonfigurować:

**1. Confirm signup (Email verification)**:

- Subject: "Potwierdź swoje konto w Foodnager"
- Redirect URL: `{{ .SiteURL }}/api/auth/verify?token={{ .TokenHash }}`

**2. Reset password**:

- Subject: "Resetowanie hasła - Foodnager"
- Redirect URL: `{{ .SiteURL }}/reset-password?token={{ .TokenHash }}`

**3. Magic link** (opcjonalnie dla przyszłości):

- Subject: "Twój link do logowania - Foodnager"

### 3.2. Baza Danych - BRAK Dodatkowych Tabel dla MVP

**⚠️ WAŻNE**: Dla MVP **NIE TWORZYMY** tabeli `profiles`.

**Uzasadnienie**:

- Wszystkie potrzebne dane są już w `auth.users` (zarządzane przez Supabase Auth)
- Supabase Auth zapewnia: `id`, `email`, `created_at`, `updated_at`, `email_confirmed_at`
- MVP nie wymaga żadnych dodatkowych pól użytkownika
- Upraszcza to architekturę i zmniejsza liczbę migracji

**Dostęp do danych użytkownika**:

```typescript
// Z session object (w middleware lub API endpoints)
const user = Astro.locals.user;
// user.id - UUID użytkownika
// user.email - email użytkownika
// user.created_at - data rejestracji
// user.email_confirmed_at - data weryfikacji (opcjonalnie)

// Lub bezpośrednio z Supabase
const {
  data: { user },
} = await supabaseClient.auth.getUser();
```

**Przyszłość** (Post-MVP):

- Jeśli będą potrzebne dodatkowe pola (avatar, bio, preferences), można wtedy utworzyć tabelę `profiles`
- Alternatywnie: można używać `user_metadata` w `auth.users` dla prostych dodatkowych danych

**Typy TypeScript**:

```typescript
// Używamy typów z @supabase/supabase-js
import type { User } from "@supabase/supabase-js";

// User zawiera już wszystkie potrzebne pola
interface User {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  email_confirmed_at?: string;
  user_metadata: Record<string, any>;
  // ... inne pola Supabase Auth
}
```

### 3.3. Row Level Security (RLS)

#### 3.3.1. Polityki RLS dla Istniejących Tabel

Wszystkie istniejące tabele muszą mieć zaktualizowane polityki RLS aby używały `auth.uid()` zamiast hardcoded USER_ID:

**Plik**: `supabase/migrations/20251031000000_update_rls_policies.sql`

```sql
-- ============================================================================
-- Aktualizacja polityk RLS - użycie auth.uid() zamiast hardcoded user_id
-- ============================================================================

-- Najpierw usuń istniejące polityki (jeśli były wyłączone)
-- Obecny stan: polityki są wyłączone przez migracje disable_*_policies.sql

-- ============================================================================
-- USER_PRODUCTS - wirtualna lodówka
-- ============================================================================

-- Polityka SELECT: użytkownik widzi tylko swoje produkty
CREATE POLICY "user_products_select_policy"
  ON public.user_products
  FOR SELECT
  USING (auth.uid() = user_id);

-- Polityka INSERT: użytkownik może dodawać tylko swoje produkty
CREATE POLICY "user_products_insert_policy"
  ON public.user_products
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Polityka UPDATE: użytkownik może edytować tylko swoje produkty
CREATE POLICY "user_products_update_policy"
  ON public.user_products
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Polityka DELETE: użytkownik może usuwać tylko swoje produkty
CREATE POLICY "user_products_delete_policy"
  ON public.user_products
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RECIPES - przepisy
-- ============================================================================

-- Polityka SELECT: użytkownik widzi tylko swoje przepisy
CREATE POLICY "recipes_select_policy"
  ON public.recipes
  FOR SELECT
  USING (auth.uid() = user_id);

-- Polityka INSERT: użytkownik może dodawać przepisy ze swoim user_id
CREATE POLICY "recipes_insert_policy"
  ON public.recipes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Polityka UPDATE: użytkownik może edytować tylko swoje przepisy
CREATE POLICY "recipes_update_policy"
  ON public.recipes
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Polityka DELETE: użytkownik może usuwać tylko swoje przepisy
CREATE POLICY "recipes_delete_policy"
  ON public.recipes
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- RECIPE_INGREDIENTS - składniki przepisów
-- ============================================================================

-- Użytkownik może zarządzać składnikami tylko swoich przepisów
CREATE POLICY "recipe_ingredients_select_policy"
  ON public.recipe_ingredients
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "recipe_ingredients_insert_policy"
  ON public.recipe_ingredients
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "recipe_ingredients_update_policy"
  ON public.recipe_ingredients
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "recipe_ingredients_delete_policy"
  ON public.recipe_ingredients
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = recipe_ingredients.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- ============================================================================
-- RECIPE_TAGS - tagi przepisów
-- ============================================================================

-- Podobne polityki jak dla recipe_ingredients
CREATE POLICY "recipe_tags_select_policy"
  ON public.recipe_tags
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "recipe_tags_insert_policy"
  ON public.recipe_tags
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

CREATE POLICY "recipe_tags_delete_policy"
  ON public.recipe_tags
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.recipes
      WHERE recipes.id = recipe_tags.recipe_id
      AND recipes.user_id = auth.uid()
    )
  );

-- ============================================================================
-- COOKING_HISTORY - historia gotowania
-- ============================================================================

-- Polityka SELECT: użytkownik widzi tylko swoją historię
CREATE POLICY "cooking_history_select_policy"
  ON public.cooking_history
  FOR SELECT
  USING (auth.uid() = user_id);

-- Polityka INSERT: użytkownik może dodawać tylko swoją historię
CREATE POLICY "cooking_history_insert_policy"
  ON public.cooking_history
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Polityka DELETE: użytkownik może usuwać tylko swoją historię (opcjonalnie)
CREATE POLICY "cooking_history_delete_policy"
  ON public.cooking_history
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PRODUCTS - produkty globalne i prywatne
-- ============================================================================

-- Polityka SELECT: użytkownik widzi produkty globalne (user_id IS NULL)
-- i swoje prywatne (user_id = auth.uid())
CREATE POLICY "products_select_policy"
  ON public.products
  FOR SELECT
  USING (user_id IS NULL OR auth.uid() = user_id);

-- Polityka INSERT: użytkownik może dodawać produkty ze swoim user_id lub NULL
CREATE POLICY "products_insert_policy"
  ON public.products
  FOR INSERT
  WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Polityka UPDATE: użytkownik może edytować tylko swoje prywatne produkty
CREATE POLICY "products_update_policy"
  ON public.products
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Polityka DELETE: użytkownik może usuwać tylko swoje prywatne produkty
CREATE POLICY "products_delete_policy"
  ON public.products
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- UNITS i TAGS - słowniki (read-only dla użytkowników)
-- ============================================================================

-- Polityka SELECT: wszyscy zalogowani użytkownicy mogą odczytać
CREATE POLICY "units_select_policy"
  ON public.units
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "tags_select_policy"
  ON public.tags
  FOR SELECT
  USING (auth.uid() IS NOT NULL);
```

### 3.4. Aktualizacja Istniejących Serwisów

Wszystkie istniejące serwisy muszą zostać zaktualizowane aby używały `user_id` z sesji zamiast `DEFAULT_USER_ID`:

#### 3.4.1. Przykład - Fridge Service

**Przed**:

```typescript
export async function getUserProducts() {
  const { data, error } = await supabaseClient.from("user_products").select("*").eq("user_id", DEFAULT_USER_ID);
  // ...
}
```

**Po**:

```typescript
export async function getUserProducts(userId: string) {
  const { data, error } = await supabaseClient.from("user_products").select("*").eq("user_id", userId);
  // ...
}
```

#### 3.4.2. Aktualizacja API Endpoints

Wszystkie endpointy API muszą pobierać `user_id` z sesji w `Astro.locals`:

**Przykład - /api/fridge/index.ts**:

**Przed**:

```typescript
export async function GET() {
  const products = await fridgeService.getUserProducts();
  // ...
}
```

**Po**:

```typescript
export async function GET(context: APIContext) {
  const user = context.locals.user;

  if (!user) {
    return new Response(
      JSON.stringify({
        success: false,
        error: { message: "Unauthorized", code: "UNAUTHORIZED" },
      }),
      { status: 401 }
    );
  }

  const products = await fridgeService.getUserProducts(user.id);
  // ...
}
```

### 3.5. Security Best Practices

#### 3.5.1. Zabezpieczenia Hasła

- Minimalna długość: 8 znaków
- Wymóg co najmniej jednej wielkiej litery
- Wymóg co najmniej jednej małej litery
- Wymóg co najmniej jednej cyfry
- Opcjonalnie: znak specjalny (w przyszłości)

#### 3.5.2. Rate Limiting

Supabase Auth ma wbudowany rate limiting, ale można dodatkowo skonfigurować:

**Konfiguracja w Supabase Dashboard**:

- Max failed login attempts: 5
- Lockout duration: 15 minut
- Rate limit per hour: 20 requests

**Opcjonalnie - custom rate limiting w middleware**:

```typescript
// Można dodać prostą implementację rate limiting dla endpointów auth
// Użycie Redis lub in-memory cache (dla MVP można pominąć)
```

#### 3.5.3. CSRF Protection

Astro ma wbudowaną ochronę CSRF dla form submissions:

```typescript
// W formularzu (automatycznie dodawane przez Astro)
<form method="POST">
  <input type="hidden" name="_csrf" value="{csrfToken}" />
  <!-- ... -->
</form>
```

#### 3.5.4. XSS Protection

- Walidacja wszystkich danych wejściowych (Zod)
- Sanityzacja HTML w textarea (jeśli będzie używana)
- CSP headers (opcjonalnie)

```typescript
// W middleware lub Astro.config.mjs
export default defineConfig({
  // ...
  vite: {
    server: {
      headers: {
        "Content-Security-Policy":
          "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';",
      },
    },
  },
});
```

#### 3.5.5. HTTPS

- W produkcji: tylko HTTPS
- Secure cookies tylko na HTTPS
- HSTS header (opcjonalnie)

### 3.6. Email Verification Flow (MVP - Uproszczony)

**⚠️ MVP: Email verification jest OPCJONALNA**

PRD nie wymaga weryfikacji email przed logowaniem. Zgodnie z US-001.3 wymagane jest tylko "potwierdzenie rejestracji" (wysłanie emaila), ale nie blokowanie dostępu.

**Uproszczony flow dla MVP**:

1. **Rejestracja**:
   - User wypełnia formularz /register
   - Backend tworzy konto w Supabase Auth
   - Supabase wysyła email z linkiem weryfikacyjnym (opcjonalny)
   - User widzi komunikat: "Konto utworzone! Możesz się teraz zalogować."
   - **User może się zalogować OD RAZU** bez klikania linku

2. **Kliknięcie linku w emailu** (opcjonalne):
   - Link: `https://yourapp.com/api/auth/verify?token=XXX`
   - Endpoint /api/auth/verify przetwarza token
   - Supabase weryfikuje email
   - Redirect do /login?verified=true
   - Toast info: "Email zweryfikowany!"

3. **Logowanie bez weryfikacji**:
   - User może się zalogować bez klikania linku weryfikacyjnego
   - Backend **NIE sprawdza** `email_confirmed_at`
   - Logowanie działa normalnie

4. **Przyszłość - Wymuszenie weryfikacji**:
   - W przyszłości można włączyć wymóg weryfikacji
   - Dodać sprawdzenie `email_confirmed_at` w authService.login()
   - Dodać endpoint /api/auth/resend-verification

### 3.7. Session Management

#### 3.7.1. Refresh Token Flow

Supabase Auth automatycznie odświeża tokeny, ale można to obsłużyć ręcznie:

```typescript
// W middleware lub komponencie
const { data, error } = await supabaseClient.auth.refreshSession();

if (error) {
  // Sesja wygasła → redirect do login
  return context.redirect("/login?session_expired=true");
}
```

#### 3.7.2. Session Expiry

- Access token: 60 minut (domyślnie)
- Refresh token: 7 dni (domyślnie)
- Auto-refresh: włączony w konfiguracji Supabase

#### 3.7.3. Session Persistence (MVP - Automatyczna)

**MVP: Funkcjonalność "Remember Me" USUNIĘTA**

Supabase automatycznie persystuje sesje zgodnie z konfiguracją:

- `persistSession: true` - włączone domyślnie w konfiguracji klienta
- Sesje są automatycznie zapisywane w localStorage
- Użytkownik pozostaje zalogowany do wygaśnięcia refresh tokenu (7 dni domyślnie)

**Przyszłość**: Można dodać checkbox "Remember Me" który przedłuża sesję do 30 dni.

---

## 4. TESTOWANIE

### 4.1. Testy Jednostkowe

**Narzędzia**: Vitest

**Co testować**:

- Walidacja Zod schemas
- AuthService methods
- Error handling

**Przykład testu**:

```typescript
// src/lib/services/__tests__/auth.service.test.ts
import { describe, it, expect, vi } from "vitest";
import { authService } from "../auth.service";

describe("AuthService", () => {
  it("should login with valid credentials", async () => {
    // Mock Supabase response
    vi.mock("@/db/supabase.client", () => ({
      supabaseClient: {
        auth: {
          signInWithPassword: vi.fn().mockResolvedValue({
            data: { user: { id: "123", email: "test@example.com" } },
            error: null,
          }),
        },
      },
    }));

    const result = await authService.login("test@example.com", "password123");
    expect(result.user).toBeDefined();
  });

  it("should throw error for invalid credentials", async () => {
    // Test błędnych danych
  });
});
```

### 4.2. Testy Integracyjne

**Co testować**:

- Pełny flow rejestracji
- Pełny flow logowania
- Pełny flow reset hasła
- RLS policies

### 4.3. Testy E2E

**Narzędzia**: Playwright (opcjonalnie)

**Scenariusze**:

- Rejestracja → weryfikacja → logowanie
- Logowanie → wylogowanie
- Zapomnienie hasła → reset → logowanie

---

## 5. MIGRACJA I DEPLOYMENT

### 5.1. Plan Migracji

**Krok 1: Przygotowanie bazy danych**

```bash
# Uruchom migrację RLS policies
npx supabase db push

# Lub indywidualnie
psql $DATABASE_URL -f supabase/migrations/20251031000000_update_rls_policies.sql
```

**Uwaga**: Nie ma potrzeby tworzenia tabeli `profiles` dla MVP - wszystkie dane są w `auth.users`

**Krok 2: Aktualizacja kodu**

- Implementacja wszystkich komponentów auth
- Aktualizacja middleware
- Aktualizacja istniejących serwisów
- Aktualizacja API endpoints

**Krok 3: Konfiguracja Supabase**

- Email templates
- Redirect URLs
- Rate limiting
- SMTP settings (dla emaili)

**Krok 4: Testowanie**

- Testy jednostkowe
- Testy integracyjne
- Testy manualne

**Krok 5: Deployment**

- Deploy do staging
- Testy E2E
- Deploy do production

### 5.2. Zmienne Środowiskowe

**Development** (`.env`):

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_KEY=your-anon-key

# App
PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

**Production** (DigitalOcean env vars):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_KEY=your-anon-key
PUBLIC_APP_URL=https://foodnager.com
NODE_ENV=production
```

### 5.3. Rollback Plan

W przypadku problemów:

1. **Rollback kodu**: Powrót do poprzedniej wersji (git revert)
2. **Rollback bazy danych**:

   ```sql
   -- Usunięcie nowych polityk RLS
   DROP POLICY IF EXISTS "user_products_select_policy" ON public.user_products;
   DROP POLICY IF EXISTS "user_products_insert_policy" ON public.user_products;
   DROP POLICY IF EXISTS "user_products_update_policy" ON public.user_products;
   DROP POLICY IF EXISTS "user_products_delete_policy" ON public.user_products;
   -- itd. dla pozostałych tabel

   -- Przywrócenie starych polityk (disable)
   -- ...
   ```

3. **Tymczasowe wyłączenie RLS** (ostateczność):
   ```sql
   ALTER TABLE public.user_products DISABLE ROW LEVEL SECURITY;
   -- Uwaga: tylko na czas debugowania!
   ```

---

## 6. DOKUMENTACJA DLA DEWELOPERÓW

### 6.1. Struktura Plików (podsumowanie)

```
src/
├── components/
│   ├── auth/                    # Komponenty autentykacji (NOWE)
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   ├── ForgotPasswordForm.tsx
│   │   ├── ResetPasswordForm.tsx
│   │   └── UserInfoDisplay.tsx
│   ├── profile/                 # Komponenty profilu (NOWE)
│   │   ├── ProfileView.tsx
│   │   ├── UserInfoCard.tsx
│   │   ├── StatsCard.tsx
│   │   └── LogoutButton.tsx
│   ├── navigation/              # Nawigacja (MODYFIKACJA)
│   │   ├── Sidebar.astro        # + sekcja user info
│   │   └── BottomNavigation.astro  # zmiana /login → /profile
│   └── ...
├── layouts/
│   ├── AuthLayout.astro         # NOWY - layout dla stron auth
│   └── Layout.astro             # MODYFIKACJA - dodanie user props
├── lib/
│   ├── services/
│   │   ├── auth.service.ts      # NOWY - serwis autentykacji
│   │   ├── fridge.service.ts    # MODYFIKACJA - userId jako param
│   │   ├── recipe.service.ts    # MODYFIKACJA
│   │   └── ...
│   ├── validations/
│   │   └── auth.validation.ts   # NOWY - schematy Zod dla auth
│   └── errors/
│       └── auth.error.ts        # NOWY - klasy błędów auth
├── middleware/
│   └── index.ts                 # MODYFIKACJA - sprawdzanie sesji, RLS
├── pages/
│   ├── api/
│   │   ├── auth/                # NOWE - endpointy auth
│   │   │   ├── login.ts
│   │   │   ├── register.ts
│   │   │   ├── logout.ts
│   │   │   ├── forgot-password.ts
│   │   │   ├── reset-password.ts
│   │   │   ├── verify.ts
│   │   │   └── session.ts
│   │   ├── fridge/              # MODYFIKACJA - userId z locals
│   │   ├── recipes/             # MODYFIKACJA
│   │   └── ...
│   ├── login.astro              # REFAKTOR - produkcja zamiast mock
│   ├── register.astro           # REFAKTOR
│   ├── forgot-password.astro    # NOWY
│   ├── reset-password.astro     # NOWY
│   ├── profile.astro            # NOWY
│   ├── fridge.astro             # MODYFIKACJA - protected route
│   ├── recipes.astro            # MODYFIKACJA
│   └── ...
├── db/
│   ├── supabase.client.ts       # MODYFIKACJA - config auth
│   └── database.types.ts        # BEZ ZMIAN - profiles nie jest potrzebne
└── env.d.ts                     # MODYFIKACJA - Astro.locals types

supabase/
└── migrations/
    └── 20251031000000_update_rls_policies.sql            # NOWA - aktualizacja RLS dla auth.uid()
```

### 6.2. Checklisty dla Deweloperów

#### Checklist: Dodawanie Nowej Chronionej Strony

- [ ] Dodać `export const prerender = false`
- [ ] Sprawdzić sesję z `Astro.locals.user`
- [ ] Opcjonalnie: redirect jeśli brak sesji (middleware to robi automatycznie)
- [ ] Przekazać `user` do Layout
- [ ] Przekazać `userId` do komponentów React jeśli potrzebują

#### Checklist: Dodawanie Nowego API Endpoint

- [ ] Dodać walidację Zod dla request body
- [ ] Pobrać `user` z `context.locals.user`
- [ ] Sprawdzić czy user istnieje (401 jeśli nie)
- [ ] Przekazać `user.id` do serwisu
- [ ] Obsłużyć błędy (try-catch)
- [ ] Zwrócić standardowy format response

#### Checklist: Aktualizacja Istniejącego Serwisu

- [ ] Dodać parametr `userId: string` do wszystkich metod
- [ ] Użyć `userId` w queries zamiast `DEFAULT_USER_ID`
- [ ] Usunąć import `DEFAULT_USER_ID`
- [ ] Zaktualizować wszystkie wywołania serwisu w API endpoints

---

## 7. PODSUMOWANIE

### 7.1. Kluczowe Komponenty

**Frontend**:

1. **AuthLayout** - dedykowany layout dla stron auth bez nawigacji
2. **LoginForm, RegisterForm, ForgotPasswordForm, ResetPasswordForm** - formularze React z walidacją
3. **ProfileView** - strona profilu użytkownika
4. **UserInfoDisplay** - wyświetlenie info o użytkowniku w Sidebar
5. **Sidebar + BottomNavigation** - modyfikacje dla wyświetlania user info

**Backend**:

1. **AuthService** - centralna logika autentykacji z Supabase Auth
2. **API Endpoints** - `/api/auth/*` dla login, register, logout, forgot, reset
3. **Middleware** - sprawdzanie sesji, przekierowania, ochrona route'ów
4. **Walidacje Zod** - schematy dla wszystkich formularzy auth

**Database**:

1. **BRAK dodatkowych tabel** - używamy `auth.users` z Supabase Auth
2. **RLS Policies** - zabezpieczenie wszystkich tabel używając `auth.uid()`
3. **Dane użytkownika** - pobierane bezpośrednio z session/user object

### 7.2. Przepływ Danych

**Rejestracja**:

```
RegisterForm → POST /api/auth/register → authService.register()
→ Supabase Auth → Email verification → Login
```

**Logowanie**:

```
LoginForm → POST /api/auth/login → authService.login()
→ Supabase Auth → Set cookies → Redirect to /fridge
```

**Protected Route**:

```
User → /fridge → Middleware → Check session →
If OK: render page | If NOT: redirect to /login
```

**Wylogowanie**:

```
LogoutButton → POST /api/auth/logout → authService.logout()
→ Supabase Auth → Clear cookies → Redirect to /login
```

### 7.3. Zgodność z Wymaganiami PRD

**US-001: Rejestracja i logowanie** ✅

- [x] Rejestracja z email i hasłem
- [x] Walidacja danych
- [x] Bezpieczne przechowywanie haseł (Supabase Auth)
- [x] Potwierdzenie rejestracji (wysłanie emaila - US-001.3)
- [x] Reset hasła (US-001.7)
- [x] Dostęp tylko dla zalogowanych (US-001.4)
- [x] Publiczne strony tylko login/register (+ forgot/reset dla US-001.7) (US-001.5)
- [x] Info o użytkowniku w nav-bar desktop (US-001.6)
- [x] Profil i wylogowanie w zakładce mobilnej (US-001.6)

**Uwagi MVP**:

- Email verification wysyła email, ale NIE blokuje logowania (PRD tego nie wymaga)
- Usunięto: terms checkbox, remember me, avatar, display name UI (nadmiarowości)
- Uproszczono: profil bez statystyk, profiles table bez avatar_url

**Pozostałe US (US-002 - US-007)**: Nie naruszone

- Istniejąca funkcjonalność lodówki, przepisów, historii pozostaje bez zmian
- Wszystkie endpointy zaktualizowane do używania `userId` z sesji
- RLS policies zapewniają izolację danych między użytkownikami

### 7.4. Bezpieczeństwo

- ✅ Silne hasła (8+ znaków, wielkie/małe litery, cyfry)
- ✅ Email verification
- ✅ Rate limiting (Supabase built-in)
- ✅ RLS policies na wszystkich tabelach
- ✅ Secure cookies (httpOnly, secure w prod)
- ✅ CSRF protection (Astro built-in)
- ✅ Walidacja danych (Zod na frontend i backend)
- ✅ Error handling bez ujawniania szczegółów

### 7.5. Następne Kroki (Post-MVP)

**Funkcjonalności usunięte z MVP (do dodania w przyszłości)**:

1. **Email verification enforcement** - wymuszenie kliknięcia linku przed logowaniem
2. **"Remember Me" checkbox** - przedłużona sesja (30 dni)
3. **Terms & Conditions acceptance** - checkbox z linkiem do regulaminu
4. **Avatar upload** - możliwość dodania zdjęcia profilowego
5. **Display name** - niestandardowa nazwa zamiast email
6. **Profile statistics** - liczba przepisów, produktów, historia gotowania
7. **Resend verification email** - ponowne wysłanie linku weryfikacyjnego

**Dodatkowe funkcjonalności do rozważenia**: 8. **Tabela `profiles`** - jeśli będą potrzebne dodatkowe pola (avatar, bio, preferences, ustawienia) 9. **OAuth providers** (Google, Facebook login) 10. **Two-factor authentication** (2FA) 11. **Email change** z weryfikacją 12. **Account deletion** z potwierdzeniem 13. **Session management** - wyświetlenie aktywnych sesji 14. **Security logs** - historia logowań 15. **Password strength meter** w formularzu rejestracji 16. **Remember device** - trusted devices 17. **Magic links** zamiast hasła (passwordless)

---

## KONIEC SPECYFIKACJI

Ta specyfikacja zawiera wszystkie niezbędne informacje do implementacji modułu autentykacji w aplikacji Foodnager zgodnie z wymaganiami PRD (US-001) oraz stackiem technologicznym (Astro 5, React 19, TypeScript 5, Tailwind 4, Shadcn/ui, Supabase).

Specyfikacja zapewnia:

- ✅ Pełną zgodność z wymaganiami funkcjonalnymi
- ✅ Bezpieczeństwo i walidację danych
- ✅ Izolację użytkowników poprzez RLS
- ✅ Dobrą architekturę i separację odpowiedzialności
- ✅ Skalowalność i łatwość utrzymania
- ✅ Brak naruszenia istniejącej funkcjonalności

Dokument gotowy do przekazania zespołowi deweloperów w celu implementacji.
