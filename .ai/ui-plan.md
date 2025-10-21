# Architektura UI dla Foodnager

## 1. Przegląd struktury UI

Foodnager to aplikacja webowa oparta na Astro 5 z React 19 jako framework dla interaktywnych komponentów (Astro Islands). Architektura UI została zaprojektowana z myślą o maksymalnej prostocie implementacji, wydajności i dostępności.

### Kluczowe założenia architektoniczne:
- **Routing:** Płaska struktura URL bez zagnieżdżonych route'ów (/, /fridge, /recipes, /recipes/:id, /history, /login, /register)
- **Nawigacja:** Adaptywna - persistent sidebar (desktop ≥1024px) i bottom navigation (mobile <1024px)
- **State Management:** Minimalistyczny - lokalne stany (useState), callbacki, refresh przez GET; brak zewnętrznych bibliotek
- **Hydration Strategy:** Selektywna - critical (client:load), below-fold (client:visible), secondary (client:idle)
- **Responsywność:** Desktop-first dla szybszego testowania MVP, pełna responsywność dla mobile/tablet
- **Design System:** Shadcn/ui + Tailwind 4, minimalistyczna paleta kolorów (amber primary, green secondary, grays)
- **Domyślny widok:** Lodówka (/fridge) zamiast dashboardu

## 2. Lista widoków

### 2.1 Lodówka (Virtual Fridge)
- **Ścieżka:** `/fridge`
- **Główny cel:** Zarządzanie produktami w wirtualnej lodówce - przeglądanie, dodawanie, edycja, usuwanie
- **Endpointy API:** 
  - GET `/api/fridge` (lista z query params: expired, expiring_soon, search, sort, order, page, limit)
  - POST `/api/fridge` (dodawanie)
  - PATCH `/api/fridge/:id` (edycja)
  - DELETE `/api/fridge/:id` (usuwanie)

**Kluczowe informacje:**
- Lista produktów z nazwą, ilością, jednostką, datą ważności
- Color coding terminu ważności: zielony (>3 dni), pomarańczowy (≤3 dni), czerwony (przeterminowane)
- Licznik produktów ogółem i przeterminowanych

**Kluczowe komponenty:**
- **Toolbar:** Search bar (full-text search) + Dropdown sortowania (nazwa/ilość/data ważności/data dodania, asc/desc)
- **Flat List:** Każdy item pokazuje nazwę, ilość+jednostka, datę ważności z color coding, quick actions (edytuj, usuń)
- **Modal "Dodaj produkt":**
  - Autocomplete "Wybierz produkt" (GET `/api/products` z scope=all, search) - globalne + prywatne, opcja "+ Dodaj nowy produkt" (POST `/api/products`)
  - Ilość (number input) + Jednostka (dropdown z GET `/api/units`) w tym samym wierszu
  - Data ważności (date picker, opcjonalne)
  - Footer: "Anuluj" (secondary) + "Dodaj produkt" (primary)
  - Po dodaniu: toast success + opcja "Dodaj kolejny produkt"
- **Modal "Edytuj produkt":** Analogiczny do dodawania, prefilowane wartości
- **Empty State:** "Twoja lodówka jest pusta" + opis korzyści + przycisk "Dodaj pierwszy produkt"

**UX, dostępność i bezpieczeństwo:**
- Semantic HTML (main, section, ul/li dla listy)
- Aria-labels dla przycisków akcji (edytuj, usuń)
- Focus trap w modalach
- Inline validation: data ważności nie może być w przeszłości (przy tworzeniu), ilość musi być >= 0
- Debouncing dla search (300ms)
- Confirmation dialog przed usunięciem ("Czy na pewno usunąć [nazwa produktu]?")
- Error handling: Toast dla błędów API, fallback dla failed loads z przyciskiem "Spróbuj ponownie"

### 2.2 Przepisy (Recipes)
- **Ścieżka:** `/recipes`
- **Główny cel:** Przeglądanie, wyszukiwanie i zarządzanie przepisami użytkownika
- **Endpointy API:**
  - GET `/api/recipes` (query params: search, source, difficulty, tags, max_cooking_time, sort, order, page, limit)
  - POST `/api/recipes` (tworzenie)
  - PATCH `/api/recipes/:id` (edycja)
  - DELETE `/api/recipes/:id` (usuwanie)

**Kluczowe informacje:**
- Grid cards przepisów z tytułem, źródłem, pierwszymi składnikami, czasem, trudnością
- Licznik przepisów ogółem i według źródeł (USER/API/AI)

**Kluczowe komponenty:**
- **Toolbar:**
  - Search bar (40% szerokości, full-text search w title i instructions)
  - Dropdown "Sortuj" (najnowsze/najstarsze/A-Z/czas gotowania)
  - Multi-select "Filtruj" (źródło: USER/API/AI, trudność: easy/medium/hard, tagi)
  - Button "Dodaj przepis" (primary)
- **Grid Cards:** 3 kolumny desktop, 2 tablet, 1 mobile
  - Badge źródła (prawy górny róg): USER (niebieski #3b82f6), API (fioletowy #8b5cf6), AI (pomarańczowy #f59e0b)
  - Tytuł (h3, 2-line truncate)
  - Match score (jeśli z wyszukiwania): % z color coding (>80% zielony, 60-80% pomarańczowy, <60% czerwony)
  - 3-4 pierwsze składniki (1-line truncate) + "i X więcej"
  - Footer: Ikona+czas gotowania, ikona+trudność, "Szczegóły" (secondary), "Ugotuj" (primary)
- **Modal "Dodaj/Edytuj przepis":**
  - Full-screen na mobile, centered 600px na desktop
  - Sticky header: "Dodaj przepis" / "Edytuj przepis" + close button
  - Sekcja 1 - Podstawowe info: Tytuł (input, required), Opis (textarea, optional)
  - Sekcja 2 - Składniki: Dynamiczna lista (minimum 1):
    - Autocomplete produkt (GET `/api/products`) + Ilość (number) + Jednostka (dropdown) + Usuń (icon button)
    - "+ Dodaj składnik" button (auto-focus na nowym wierszu)
  - Sekcja 3 - Instrukcje: Textarea (required, min 10 znaków)
  - Sekcja 4 - Meta: Czas gotowania (number, minutes, optional), Trudność (radio buttons: easy/medium/hard, optional), Tagi (multi-select z GET `/api/tags` + opcja "+ Dodaj tag" POST `/api/tags`)
  - Sticky footer: "Anuluj" + "Zapisz przepis"
- **Empty State:** "Nie masz jeszcze przepisów" + opis + "Dodaj przepis" + "Znajdź przepis"

**UX, dostępność i bezpieczeństwo:**
- Grid responsive z smooth transitions
- Keyboard navigation w formularzu składników (Enter = nowy wiersz, Escape = cancel)
- Validation: tytuł required, instrukcje required, minimum 1 składnik, ilość > 0, cooking_time > 0 jeśli podane
- Confirmation przed usunięciem przepisu
- Loading states podczas save (disabled buttons, spinner)
- Error boundary dla recipe cards (fallback component)

### 2.3 Szczegóły przepisu (Recipe Details)
- **Ścieżka:** `/recipes/:id`
- **Główny cel:** Pełna prezentacja przepisu z możliwością wykonania akcji (ugotuj, zapisz, edytuj, usuń)
- **Endpointy API:**
  - GET `/api/recipes/:id`
  - POST `/api/cooking-history` (ugotuj)
  - POST `/api/shopping-list/generate` (lista zakupów)

**Kluczowe informacje:**
- Pełne dane przepisu: tytuł, opis, składniki z ilościami, instrukcje, meta (czas, trudność, tagi)
- Dostępność składników w lodówce (color coding)
- Match score (jeśli przyszło z wyszukiwania)

**Kluczowe komponenty:**
- **Header:**
  - Custom back button (ikona strzałki + tekst "Wróć do przepisów" / "Wróć do wyników")
  - Tytuł przepisu (h1)
  - Badge źródła
  - Match score badge (jeśli applicable)
  - Dropdown menu (three dots) z akcjami:
    - "Edytuj" (tylko USER source)
    - "Usuń" (tylko USER source)
    - "Zapisz do moich przepisów" (API/AI source - tworzy kopię jako USER)
    - "Udostępnij" (out of scope dla MVP)
- **Sekcja Meta:**
  - Ikony + wartości: czas gotowania, trudność, tagi jako badges
- **Sekcja Składniki:**
  - Lista jako checklist z color coding dostępności:
    - Zielony checkbox: produkt dostępny w pełnej ilości
    - Pomarańczowy checkbox: produkt dostępny w częściowej ilości (pokazuje: dostępne/wymagane)
    - Czerwony checkbox: produkt niedostępny
  - Pod listą: "Generuj listę zakupów" (secondary button) jeśli są brakujące składniki
- **Sekcja Instrukcje:**
  - Numerowana lista kroków (auto-split przez newlines lub numerację w tekście)
- **Sticky Bottom Bar:**
  - "Ugotuj to" (primary) + "Zapisz przepis" (secondary, tylko dla API/AI)
  - Bar pojawia się po zescrollowaniu poniżej fold

**UX, dostępność i bezpieczeństwo:**
- Proper heading hierarchy (h1 → h2 → h3)
- Checklist składników jako semantic checklist (role="list")
- Color coding z ikonami (nie tylko kolor dla color-blind users)
- Confirmation dialog przed "Ugotuj to" (pokazuje składniki do odjęcia)
- Success toast + redirect do /history po ugotowaniu
- Error handling: insufficient ingredients (toast + highlight brakujących)

### 2.4 Wyszukiwanie przepisów (Recipe Search)
- **Ścieżka:** `/recipes/search` (step 1), `/recipes/search?source=X` (step 2-3)
- **Główny cel:** Hierarchiczne wyszukiwanie przepisów przez wybór źródła (własne/API/AI/wszystkie)
- **Endpointy API:**
  - POST `/api/recipes/search-by-fridge` (hierarchical search)
  - POST `/api/recipes/generate` (AI generation)

**Krok 1 - Wybór źródła:**

**Kluczowe informacje:**
- 4 kafelki wyboru: "Moje przepisy", "API przepisów", "Generuj AI", "Wszystkie źródła"
- Status lodówki (liczba produktów)

**Kluczowe komponenty:**
- **Warning Banner** (jeśli lodówka pusta):
  - "⚠️ Twoja lodówka jest pusta. Wyszukiwanie będzie mniej precyzyjne. [Dodaj produkty]"
- **Grid 2x2** (desktop) / **1x4** (mobile) dużych kafelków:
  - Każdy kafelek (~200px height):
    - Duża ikona (64px)
    - Tytuł źródła (h3)
    - Krótki opis (1-2 zdania)
    - Badge z liczbą (tylko dla "Moje przepisy": liczba USER recipes)
  - Hover state: scale(1.02), shadow
  - Click → redirect do `/recipes/search?source=X&use_all_fridge_items=true`

**Krok 2 - Loading:**

**Kluczowe komponenty:**
- **Skeleton Screen:**
  - Grid 6 cards (2×3 desktop, 6×1 mobile)
  - Shimmer animation (gradient linear left-to-right, 1.5s loop)
  - Struktura skeleton card: badge placeholder (top-right), title (2 lines), 3-4 ingredient lines, footer (2 buttons)
- **Timeout Message** (po 30 sek):
  - "Generowanie trwa dłużej niż zwykle... Proszę czekać."
  - Animated spinner

**Krok 3 - Wyniki:**

**Kluczowe informacje:**
- Lista znalezionych przepisów z match scores
- Metadata wyszukiwania (źródło, liczba wyników, czas)

**Kluczowe komponenty:**
- **Header:** Back button "Wróć do wyboru źródła" + Tytuł "Wyniki wyszukiwania: [źródło]"
- **Search Metadata Bar:** "Znaleziono X przepisów z [źródło] w Y ms"
- **Grid Cards:** Identyczne jak w `/recipes`, ale z wyświetlanym match score
- **Empty State (no results):**
  - "Nie znaleziono przepisów" + sugestie (dodaj więcej produktów, spróbuj innego źródła)
  - Przyciski: "Wróć do wyboru źródła" + "Generuj AI" (fallback)

**UX, dostępność i bezpieczeństwo:**
- Loading state z meaningful skeleton (nie generic spinner)
- Error handling: API timeout (30s), API failure (fallback message + retry), AI generation error (user-friendly message)
- Proper aria-live regions dla loading states
- Cancel button podczas ładowania (abort request)

### 2.5 Historia gotowania (Cooking History)
- **Ścieżka:** `/history`
- **Główny cel:** Przeglądanie historii ugotowanych przepisów z możliwością undo (24h) i ponownego ugotowania
- **Endpointy API:**
  - GET `/api/cooking-history` (query params: recipe_id, from_date, to_date, page, limit)
  - POST `/api/cooking-history` (undo by reversing transaction - out of scope dla MVP, będzie manualny flow)

**Kluczowe informacje:**
- Chronologiczna lista (najnowsze na górze)
- Dla każdego wpisu: data+czas, przepis, użyte składniki, status (czy undo dostępne)

**Kluczowe komponenty:**
- **Timeline List:**
  - Każdy card:
    - Data+czas (header, format: "Dziś, 18:30" / "Wczoraj, 12:00" / "18.10.2025, 14:00")
    - Tytuł przepisu (link do `/recipes/:id`)
    - Mini-lista użytych składników (max 3 + "i X więcej")
    - Expandable details: Fridge state before/after (collapse/expand button)
    - Actions:
      - "Cofnij" (secondary, enabled tylko jeśli <24h, confirmation dialog)
      - "Ugotuj ponownie" (primary, link do `/recipes/:id`)
- **Empty State:** "Nie ugotowałeś jeszcze żadnego przepisu" + "Znajdź przepis"

**UX, dostępność i bezpieczeństwo:**
- Czytelny format daty (relative dla <48h, absolute dla starszych)
- Disabled state dla "Cofnij" po 24h z tooltipem "Cofnięcie dostępne przez 24h od ugotowania"
- Confirmation dialog dla undo: "Czy na pewno cofnąć gotowanie [nazwa]? Lodówka zostanie przywrócona do stanu sprzed gotowania."
- Success toast po undo + refresh listy historii i lodówki

### 2.6 Lista zakupów (Shopping List Modal)
- **Typ:** Modal (triggered z Recipe Details)
- **Główny cel:** Wygenerowanie i zarządzanie listą brakujących składników
- **Endpoint API:** POST `/api/shopping-list/generate` (body: recipe_id)

**Kluczowe informacje:**
- Lista brakujących produktów z ilościami

**Kluczowe komponenty:**
- **Modal:**
  - Header: "Lista zakupów: [nazwa przepisu]" + close button
  - Edytowalna lista:
    - Każdy item: checkbox (checked domyślnie) + nazwa produktu + ilość+jednostka (edytowalne) + usuń
  - Actions (footer):
    - "Kopiuj do schowka" (plain text format: "- 2 pc Pomidor\n- 100 g Mąka")
    - "Drukuj" (window.print())
    - "Eksportuj .txt" (download)
    - "Zamknij" (secondary)

**UX, dostępność i bezpieczeństwo:**
- Editable quantities (input type="number")
- Checkboxes do toggle items (unchecked items nie kopiują się)
- Success toast po skopiowaniu ("Skopiowano do schowka")
- Format eksportu: plain text, każdy item w nowej linii, prefiks "- "

### 2.7 Logowanie (Login)
- **Ścieżka:** `/login`
- **Główny cel:** Autentykacja użytkownika (MVP: zmockowane, bez Supabase Auth)
- **Endpoint API:** N/A dla MVP (mock)

**Kluczowe informacje:**
- Formularz logowania

**Kluczowe komponenty:**
- **Centered Form Card:**
  - Logo + Tytuł "Zaloguj się do Foodnager"
  - Email (input type="email", required)
  - Hasło (input type="password", required, show/hide toggle)
  - "Zapamiętaj mnie" (checkbox)
  - "Zaloguj się" (primary button, full width)
  - "Nie masz konta? [Zarejestruj się]" (link do /register)
  - "Zapomniałeś hasła?" (out of scope dla MVP)

**UX, dostępność i bezpieczeństwo:**
- Inline validation: email format, required fields
- Error state: "Nieprawidłowy email lub hasło" (generic message dla bezpieczeństwa)
- Loading state podczas submit
- Redirect do /fridge po sukcesie
- For MVP: mock credentials (email: test@foodnager.pl, password: Test123!)

### 2.8 Rejestracja (Register)
- **Ścieżka:** `/register`
- **Główny cel:** Rejestracja nowego użytkownika (MVP: zmockowane)
- **Endpoint API:** N/A dla MVP (mock)

**Kluczowe informacje:**
- Formularz rejestracji

**Kluczowe komponenty:**
- **Centered Form Card:**
  - Logo + Tytuł "Zarejestruj się"
  - Email (required, validation)
  - Hasło (required, min 8 znaków, pattern validation)
  - Potwierdzenie hasła (required, musi się zgadzać)
  - Username (optional dla MVP)
  - "Akceptuję regulamin" (checkbox, required)
  - "Zarejestruj się" (primary button)
  - "Masz już konto? [Zaloguj się]" (link do /login)

**UX, dostępność i bezpieczeństwo:**
- Real-time validation z visual feedback (checkmarks/errors)
- Password strength indicator (weak/medium/strong)
- Show/hide toggle dla hasła
- For MVP: auto-redirect do /login po "sukcesie"

### 2.9 Dashboard (opcjonalny, redirect do /fridge)
- **Ścieżka:** `/` (redirect to /fridge)
- **Główny cel:** Quick overview + hero CTA (out of primary scope, bo domyślnie redirect)
- **Endpointy API:** Aggregated data z GET `/api/fridge`, `/api/recipes`, `/api/cooking-history`

**Kluczowe komponenty (gdyby był używany):**
- **Hero Section:** Heading + opis + large CTA "Znajdź przepis teraz"
- **3 Preview Sections:**
  - Lodówka: Liczniki (produktów, przeterminowanych, wygasających) + link "Zobacz lodówkę"
  - Przepisy: 3 ostatnie jako horizontal mini-cards + link "Zobacz wszystkie"
  - Historia: 2-3 ostatnie wpisy + link "Zobacz historię"

## 3. Mapa podróży użytkownika

### Główny Use Case: Wyszukiwanie i ugotowanie przepisu na podstawie lodówki

**Krok 1: Logowanie**
- User → `/login`
- Wprowadza credentials (mock)
- Submit → Redirect `/fridge`

**Krok 2: Sprawdzenie/Aktualizacja lodówki**
- User na `/fridge`
- Przegląda produkty
- (Opcjonalnie) Dodaje brakujące produkty:
  - Click "Dodaj produkt" → Modal
  - Autocomplete produkt → Wybiera z listy lub tworzy nowy
  - Wpisuje ilość + jednostka + data ważności
  - Submit → Toast success + refresh list
  - (Opcjonalnie) "Dodaj kolejny" → Repeat

**Krok 3: Wyszukiwanie przepisu**
- User click CTA "Znajdź przepis" (sidebar/bottom nav)
- Redirect `/recipes/search`
- Widzi 4 kafelki źródeł
- Wybiera źródło (np. "Wszystkie źródła")
- Click kafelek → Redirect `/recipes/search?source=all&use_all_fridge_items=true`
- Loading screen (skeleton) → Request POST `/api/recipes/search-by-fridge`
- Wyniki → Grid cards z match scores

**Krok 4: Wybór przepisu**
- User przegląda wyniki
- Click "Szczegóły" na wybranej karcie
- Redirect `/recipes/:id`
- Widzi pełne info + checklist składników z color coding

**Krok 5: Generowanie listy zakupów (jeśli brakuje składników)**
- User click "Generuj listę zakupów"
- Modal z listą brakujących produktów
- (Opcjonalnie) Edytuje ilości, odznacza niepotrzebne
- Click "Kopiuj do schowka" → Toast success
- Zamyka modal

**Krok 6: Gotowanie przepisu**
- User click "Ugotuj to" (sticky bottom bar)
- Confirmation dialog:
  - Pokazuje składniki do odjęcia z lodówki
  - "Czy na pewno ugotować [nazwa]?"
- Click "Potwierdź" → Request POST `/api/cooking-history`
- Loading → Success
- Toast "Przepis ugotowany! Lodówka zaktualizowana"
- Redirect `/history`

**Krok 7: Weryfikacja w historii**
- User na `/history`
- Widzi nowy wpis na górze listy
- (Opcjonalnie) Expand details → Zobacz fridge state before/after
- (Opcjonalnie) Jeśli pomyłka → Click "Cofnij" (w ciągu 24h)

### Alternatywny Use Case: Ręczne przeglądanie przepisów

**Krok 1:** User → `/recipes`
**Krok 2:** Przegląda listę, używa search/filters
**Krok 3:** Click przepis → `/recipes/:id`
**Krok 4:** Ugotuj → Confirmation → History

### Alternatywny Use Case: Dodanie własnego przepisu

**Krok 1:** User → `/recipes`
**Krok 2:** Click "Dodaj przepis" → Modal
**Krok 3:** Wypełnia formularz:
- Tytuł, opis
- Dodaje składniki (autocomplete + ilości)
- Instrukcje
- Meta (czas, trudność, tagi)
**Krok 4:** Submit → POST `/api/recipes` → Toast success → Refresh list
**Krok 5:** (Opcjonalnie) Click nowy przepis → Ugotuj

### Edge Cases i Error Flows:

**Empty Fridge → Search:**
- Warning banner na `/recipes/search`
- Search działa, ale match scores niskie
- Sugestia: "Dodaj produkty dla lepszych wyników"

**Insufficient Ingredients → Cook:**
- Click "Ugotuj to"
- Validation error (backend): 400 "Insufficient ingredients"
- Toast error: "Nie masz wystarczającej ilości: [lista produktów]"
- Highlight brakujących składników na czerwono
- Sugestia: "Generuj listę zakupów"

**API/AI Failure → Search:**
- Loading timeout (30s)
- Error message: "Nie udało się wyszukać przepisów. Spróbuj ponownie lub wybierz inne źródło."
- Przyciski: "Spróbuj ponownie" + "Wróć do wyboru"

**Network Error → Any Action:**
- Toast error: "Brak połączenia. Sprawdź internet i spróbuj ponownie."
- Retry button w toast

## 4. Układ i struktura nawigacji

### 4.1 Desktop Navigation (≥1024px)

**Persistent Sidebar (240px, fixed left):**

```
┌─────────────────────┐
│                     │
│  [Logo Foodnager]   │
│                     │
├─────────────────────┤
│                     │
│  ◉ Lodówka          │ ← /fridge (active state: amber bg)
│  ○ Przepisy         │ ← /recipes
│  ○ Historia         │ ← /history
│                     │
│                     │
│  (spacer)           │
│                     │
│                     │
├─────────────────────┤
│                     │
│ [Znajdź przepis] 🔍 │ ← CTA button (primary, full width)
│                     │
└─────────────────────┘
```

**Main Content Area (calc(100vw - 240px)):**
- Header z breadcrumbs/back button (gdzie applicable)
- Content

### 4.2 Mobile/Tablet Navigation (<1024px)

**Top Header (sticky):**
- Logo (left) + Page title (center) + Menu icon (right, dla settings - out of scope)

**Bottom Navigation (fixed, 64px height):**

```
┌──────┬──────┬────────┬──────┬──────┐
│      │      │        │      │      │
│  🏠  │  🥘  │  [🔍]  │  📜  │  👤  │
│Strona│Prze- │ ZNAJDŹ │Histo-│Profil│
│głów. │pisy  │PRZEPIS │ria   │      │
│      │      │ (large)│      │      │
└──────┴──────┴────────┴──────┴──────┘
```

**Routing map:**
- 🏠 Strona główna → `/fridge` (redirect)
- 🥘 Przepisy → `/recipes`
- 🔍 ZNAJDŹ PRZEPIS → `/recipes/search` (wyeksponowany, większy)
- 📜 Historia → `/history`
- 👤 Profil → `/login` (dla MVP, potem `/profile`)

**Main Content Area (full width, padding bottom 64px):**

### 4.3 Breadcrumbs i Back Navigation

**Widoki szczegółowe używają custom back button zamiast breadcrumbs:**

- `/recipes/:id` (z `/recipes`): "← Wróć do przepisów"
- `/recipes/:id` (z `/recipes/search`): "← Wróć do wyników"
- Back button implementation: `history.back()` lub explicit link (depends on referrer)

**Nie używamy breadcrumbs** (zbyt skomplikowane dla płaskiej struktury)

### 4.4 Navigation States

**Active state:**
- Sidebar: Amber background (#f59e0b light), bold text
- Bottom nav: Amber icon color, label visible

**Hover state:**
- Sidebar: Light gray background transition (150ms)
- Bottom nav: Scale(1.1) icon transition

**Focus state:**
- Visible focus ring (2px amber, offset 2px)

### 4.5 Responsive Breakpoints

```
Mobile:   < 768px   → Bottom nav, 1 column grids, full-screen modals
Tablet:   768-1023px → Bottom nav, 2 column grids, full-screen modals
Desktop:  ≥ 1024px   → Sidebar, 3 column grids, centered modals (600px)
```

## 5. Kluczowe komponenty

### 5.1 Layout Components (Astro - statyczne)

**`Layout.astro`**
- Base HTML structure, head, meta tags
- Global CSS imports
- Props: title, description

**`Sidebar.astro`** (≥1024px)
- Logo, navigation links, CTA button
- Props: currentPath (dla active state)

**`BottomNavigation.astro`** (<1024px)
- 5 buttons, middle one enlarged
- Props: currentPath

**`Header.astro`**
- Page title, optional back button, optional actions
- Props: title, backHref?, backLabel?, actions?

### 5.2 UI Components (Shadcn/ui - React islands)

**Base components:**
- Button (variants: default, primary, secondary, ghost, link)
- Input (text, number, email, password, date)
- Textarea
- Select / Dropdown
- Dialog / Modal
- Card
- Badge
- Toast / Notification
- Checkbox
- Radio Group
- Skeleton

**Composite components:**

**`<SearchBar>`** (React island, client:load)
- Input z search icon, clear button
- Debounced onChange (300ms)
- Props: placeholder, value, onChange, autoFocus?

**`<Autocomplete>`** (React island, client:load)
- Combobox pattern (Headless UI lub Downshift)
- Search input + dropdown results
- Keyboard navigation (Arrow up/down, Enter, Escape)
- Props: fetchFunction, onSelect, placeholder, allowCreate?, createLabel?
- Integration: GET `/api/products?search=...`

**`<ProductAutocomplete>`** (wrapper dla `<Autocomplete>`)
- Pre-configured dla products
- Shows "Globalne" / "Moje" badges
- "+ Dodaj nowy produkt" option

**`<FridgeList>`** (React island, client:visible)
- List z toolbar (search, sort)
- Fetch GET `/api/fridge`
- Pagination
- Item actions (edit, delete)
- Props: initialData?
- State: products, loading, error, page, filters

**`<FridgeItemModal>`** (React island, lazy)
- Add/Edit modal
- Form validation
- POST/PATCH `/api/fridge`
- Props: mode (add/edit), item?, onSuccess

**`<RecipeGrid>`** (React island, client:visible)
- Grid z toolbar (search, filters, sort)
- Fetch GET `/api/recipes`
- Pagination
- Card actions
- Props: initialData?, showMatchScore?

**`<RecipeCard>`** (React component)
- Badge source, title, ingredients preview, meta, actions
- Props: recipe, showMatchScore?, onCook?, onDetails?

**`<RecipeFormModal>`** (React island, lazy)
- Full-screen/centered modal
- Sections: basic, ingredients (dynamic list), instructions, meta
- Validation
- POST/PATCH `/api/recipes`
- Props: mode, recipe?, onSuccess

**`<RecipeDetails>`** (React island, client:load)
- Header, meta, ingredients checklist, instructions, actions
- Fetch GET `/api/recipes/:id` + GET `/api/fridge` (dla availability)
- Calculates ingredient availability
- Props: recipeId, initialRecipe?

**`<IngredientsChecklist>`** (React component)
- List with color-coded items
- Props: ingredients, availability

**`<CookConfirmationDialog>`** (React island, lazy)
- Dialog z listą ingredients
- POST `/api/cooking-history`
- Props: recipe, onSuccess

**`<ShoppingListModal>`** (React island, lazy)
- Editable list
- Actions: copy, print, export
- Props: recipeId, missingIngredients

**`<SearchSourceGrid>`** (React component)
- 4 large tiles
- Props: fridgeItemCount
- Integration: links do `/recipes/search?source=X`

**`<SearchResults>`** (React island, client:load)
- Loading skeleton → Results grid
- POST `/api/recipes/search-by-fridge`
- Props: source, preferences

**`<SkeletonRecipeCard>`** (React component)
- Shimmer animation
- Mimics RecipeCard structure

**`<CookingHistoryList>`** (React island, client:visible)
- Timeline list
- Expandable details
- Undo action (manual flow dla MVP)
- Props: initialData?

**`<EmptyState>`** (React component)
- Icon, message, description, CTA button
- Props: icon, title, description, actionLabel, actionHref

**`<Toast>`** (React island, client:load, singleton)
- Top-right notifications
- Auto-dismiss (5s)
- Types: success, error, info, warning
- Global state (Context lub custom hook)

### 5.3 Utility Components

**`<ColorCodedDate>`** (React component)
- Displays date with color based on expiry
- Props: date, thresholds

**`<SourceBadge>`** (React component)
- Badge with color and icon based on source
- Props: source (USER|API|AI)

**`<MatchScoreBadge>`** (React component)
- Percentage badge with color coding
- Props: score (0-100)

**`<BackButton>`** (React component)
- Arrow icon + label
- Props: href?, label?, onClick?

### 5.4 Forms i Validation

**Validation strategy:**
- Client-side: Inline validation (onChange/onBlur)
- Visual feedback: Error messages below fields, red borders
- Server-side: API validation, errors shown as toasts
- Libraries: React Hook Form (optional, can use plain useState)

**Common validations:**
- Required fields
- Email format
- Number min/max
- Date constraints (expiry date not in past)
- Min length (password 8, instructions 10)
- Quantity > 0
- At least 1 ingredient

### 5.5 Loading States

**Strategies:**
- Skeleton screens (preferred dla lists/grids)
- Spinners (dla button actions)
- Progress bars (dla long operations - out of scope dla MVP)
- Optimistic updates (optional - dla better UX)

**Implementation:**
- `loading` state boolean
- Conditional rendering: `{loading ? <Skeleton /> : <Content />}`
- Disabled state dla buttons podczas loading

### 5.6 Error Handling

**Levels:**
1. **Inline validation errors:** Pod formularzem, czerwony tekst
2. **Toast notifications:** Dla akcji success/error
3. **Empty states z error:** Dla failed data loads, z retry button
4. **Error boundary:** Dla krytycznych React errors, fallback UI

**Error messages (user-friendly, po polsku):**
- Network error: "Brak połączenia. Sprawdź internet."
- 404: "Nie znaleziono. Zasób mógł zostać usunięty."
- 401/403: "Brak dostępu. Zaloguj się ponownie."
- 500: "Wystąpił błąd. Spróbuj ponownie później."
- Validation: Specific messages (np. "Ilość musi być większa od 0")

### 5.7 Accessibility Considerations

**Semantic HTML:**
- `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`
- Proper heading hierarchy (h1 → h2 → h3)
- `<ul>`/`<ol>` dla list
- `<button>` vs `<a>` (actions vs links)

**ARIA:**
- `aria-label` dla icon buttons
- `aria-labelledby`, `aria-describedby` dla forms
- `aria-live` dla dynamic content (toasts, loading states)
- `role="dialog"`, `aria-modal="true"` dla modals

**Keyboard Navigation:**
- Tab order logical
- Focus visible (custom ring styling)
- Escape closes modals
- Enter submits forms
- Arrow keys dla autocomplete/dropdowns
- Focus trap w modalach

**Color Contrast:**
- WCAG AA compliance (4.5:1 dla tekstu)
- Color coding + icons (nie tylko kolor)
- Tested z color-blind simulators

**Screen Reader:**
- Alt texts (gdzie applicable, mimo że MVP nie optymalizuje dla SR)
- Descriptive link texts (nie "Kliknij tutaj")

### 5.8 Performance Optimizations

**Astro Islands Strategy:**
- Static content: Astro components (0 JS)
- Critical interactivity: `client:load` (search bar, recipe details)
- Below fold: `client:visible` (lists, grids)
- Secondary features: `client:idle` (modals, tooltips)

**Code Splitting:**
- Lazy load modals (React.lazy + Suspense)
- Dynamic imports dla heavy components

**Data Fetching:**
- Fetch w Astro components (SSR), pass jako props
- Re-fetch w islands tylko gdy needed
- Pagination dla długich list
- Debouncing dla search (300ms)

**Caching (optional dla MVP):**
- localStorage dla user preferences (filters, sort)
- Memory cache dla GET `/api/units`, `/api/tags` (dictionaries)
- No cache dla fridge, recipes (always fresh)

**Images (out of scope dla MVP):**
- Lazy loading
- Optimized formats (WebP)
- Responsive sizes

### 5.9 Styling System

**Tailwind 4 utilities:**
- Spacing: p-*, m-*, gap-*
- Layout: flex, grid, container
- Typography: text-*, font-*
- Colors: Custom palette (amber, green, grays)
- Responsive: sm:, md:, lg:, xl:

**Custom CSS (minimal):**
- Animations (shimmer, fade, scale)
- Focus rings
- Scrollbar styling (optional)

**Color Palette:**
```css
/* Primary */
--color-primary: #f59e0b; /* Amber 500 */
--color-primary-dark: #d97706; /* Amber 600 */
--color-primary-light: #fbbf24; /* Amber 400 */

/* Secondary */
--color-secondary: #10b981; /* Green 500 */
--color-secondary-dark: #059669; /* Green 600 */

/* Neutrals */
--color-gray-50: #f9fafb;
--color-gray-100: #f3f4f6;
--color-gray-300: #d1d5db;
--color-gray-500: #6b7280;
--color-gray-700: #374151;
--color-gray-900: #111827;

/* Semantic */
--color-success: #10b981; /* Green */
--color-warning: #f59e0b; /* Amber */
--color-error: #ef4444; /* Red 500 */
--color-info: #3b82f6; /* Blue 500 */

/* Sources */
--color-source-user: #3b82f6; /* Blue */
--color-source-api: #8b5cf6; /* Purple */
--color-source-ai: #f59e0b; /* Amber */
```

**Typography:**
```css
/* System font stack */
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;

/* Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

**Spacing:**
- Container padding: 16px (mobile), 24px (tablet), 32px (desktop)
- Section gaps: 24px (mobile), 32px (desktop)
- Card padding: 16px
- Modal padding: 24px

**Borders & Shadows:**
```css
--border-radius: 8px;
--border-radius-lg: 12px;
--border-radius-full: 9999px;

--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1);
```

### 5.10 Animations & Transitions

**Subtle, performance-oriented:**

```css
/* Modal open/close */
.modal-enter {
  animation: modal-fade-in 200ms ease-out;
}
.modal-exit {
  animation: modal-fade-out 200ms ease-in;
}
@keyframes modal-fade-in {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

/* Toast slide in */
.toast-enter {
  animation: toast-slide-in 300ms ease-out;
}
@keyframes toast-slide-in {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

/* Skeleton shimmer */
.skeleton {
  background: linear-gradient(90deg, #f3f4f6 0%, #e5e7eb 50%, #f3f4f6 100%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
}
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* Hover states */
.button:hover {
  transition: background-color 150ms ease;
}

/* CTA pulse (optional) */
.cta-button {
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.02); }
}
```

**No page transitions** (instant routing dla lepszej responsywności MVP)

## 6. State Management Strategy

### 6.1 Filozofia: Maksymalna prostota

**NO:**
- Redux, Zustand, Jotai
- React Context dla shared state (każdy island izolowany)
- React Query, SWR
- WebSockets, real-time updates

**YES:**
- Local `useState` w komponentach
- URL params dla filters/search
- LocalStorage dla user preferences
- Simple fetch w useEffect
- Callbacks dla parent-child communication

### 6.2 Patterns

**Pattern 1: Server State w Astro → Props do Islands**
```javascript
// src/pages/recipes.astro
const recipes = await fetch('/api/recipes').then(r => r.json());
---
<RecipeGrid initialData={recipes} />
```

**Pattern 2: Client-side Fetch w Islands**
```javascript
// RecipeGrid.tsx
const [recipes, setRecipes] = useState(initialData);
const [loading, setLoading] = useState(false);

useEffect(() => {
  if (!initialData) {
    fetchRecipes();
  }
}, []);

const fetchRecipes = async () => {
  setLoading(true);
  const data = await fetch('/api/recipes').then(r => r.json());
  setRecipes(data);
  setLoading(false);
};
```

**Pattern 3: Action → Callback → Refresh**
```javascript
// FridgeList.tsx
const handleDelete = async (id) => {
  await fetch(`/api/fridge/${id}`, { method: 'DELETE' });
  showToast('Produkt usunięty');
  // Refresh by re-fetching
  fetchFridgeItems();
};
```

**Pattern 4: URL Params dla Filters**
```javascript
// Recipes.astro
const searchParams = new URL(Astro.request.url).searchParams;
const source = searchParams.get('source');
const difficulty = searchParams.get('difficulty');
---
<RecipeGrid initialFilters={{ source, difficulty }} />

// RecipeGrid.tsx - update URL on filter change
const handleFilterChange = (key, value) => {
  const url = new URL(window.location);
  url.searchParams.set(key, value);
  window.history.pushState({}, '', url);
  fetchRecipes(); // with new filters
};
```

**Pattern 5: LocalStorage dla Preferences**
```javascript
// usePreferences.ts
export const usePreferences = () => {
  const [sortOrder, setSortOrder] = useState(() => {
    return localStorage.getItem('recipes.sortOrder') || 'created_at';
  });

  const updateSortOrder = (value) => {
    setSortOrder(value);
    localStorage.setItem('recipes.sortOrder', value);
  };

  return { sortOrder, updateSortOrder };
};
```

### 6.3 Data Flow Diagram

```
Astro Page (SSR)
  │
  ├─> Fetch API (server-side)
  │
  └─> Pass data as props
         │
         ▼
      React Island
         │
         ├─> Local useState (UI state)
         ├─> useEffect fetch (if needed)
         │
         └─> User Action
               │
               ├─> API Call (POST/PATCH/DELETE)
               │
               ├─> Success → Toast + Callback
               │
               └─> Refresh (re-fetch GET)
```

### 6.4 Form State

**Simple forms (useState):**
```javascript
const [formData, setFormData] = useState({
  product_id: '',
  quantity: 0,
  unit_id: '',
  expiry_date: ''
});

const handleChange = (field, value) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

**Complex forms (React Hook Form - optional):**
```javascript
import { useForm } from 'react-hook-form';

const { register, handleSubmit, formState: { errors } } = useForm();

const onSubmit = async (data) => {
  await fetch('/api/recipes', {
    method: 'POST',
    body: JSON.stringify(data)
  });
};
```

### 6.5 Global State (minimal)

**Only for:**
- Toast notifications (singleton)
- Authentication state (dla post-MVP)

**Implementation (simple Context):**
```javascript
// ToastContext.tsx
const ToastContext = createContext();

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer toasts={toasts} />
    </ToastContext.Provider>
  );
};

// Usage w Astro layout
<ToastProvider client:load>
  <slot />
</ToastProvider>
```

## 7. API Integration Patterns

### 7.1 API Client (utility)

```javascript
// src/lib/api-client.ts
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const apiClient = {
  async get(endpoint: string, params?: Record<string, any>) {
    const url = new URL(endpoint, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.set(key, String(val));
        }
      });
    }

    const res = await fetch(url.toString());
    if (!res.ok) {
      throw new ApiError(res.status, await res.text());
    }
    return res.json();
  },

  async post(endpoint: string, body: any) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) {
      throw new ApiError(res.status, await res.text());
    }
    return res.status === 204 ? null : res.json();
  },

  // Similar dla PATCH, DELETE
};
```

### 7.2 Error Handling

```javascript
try {
  const data = await apiClient.get('/api/recipes');
  setRecipes(data.data);
} catch (error) {
  if (error instanceof ApiError) {
    if (error.status === 404) {
      showToast('Nie znaleziono', 'error');
    } else if (error.status >= 500) {
      showToast('Błąd serwera. Spróbuj później.', 'error');
    } else {
      showToast(error.message, 'error');
    }
  } else {
    showToast('Brak połączenia', 'error');
  }
}
```

### 7.3 Przykładowe integracje

**Fridge List:**
- GET `/api/fridge?search=...&sort=...&page=...`
- Response: `{ data: [...], pagination: {...} }`

**Recipe Search:**
- POST `/api/recipes/search-by-fridge`
- Body: `{ use_all_fridge_items: true, preferences: {...} }`
- Response: `{ results: [...], search_metadata: {...} }`

**Cook Recipe:**
- POST `/api/cooking-history`
- Body: `{ recipe_id: 123 }`
- Response: `{ id, recipe, fridge_state_before, fridge_state_after, updated_fridge_items }`

## 8. Mapowanie User Stories → UI

### US-001: Rejestracja i logowanie
- **Widoki:** `/login`, `/register`
- **Komponenty:** Form cards, validation, mock authentication
- **Flow:** Login → Redirect `/fridge`

### US-002: Zarządzanie wirtualną lodówką
- **Widoki:** `/fridge`
- **Komponenty:** `<FridgeList>`, `<FridgeItemModal>`, toolbar, color-coded dates
- **API:** GET/POST/PATCH/DELETE `/api/fridge`, GET `/api/products`, GET `/api/units`
- **Features:** Search, sort, filter (expired), add, edit, delete

### US-003: Zarządzanie przepisami
- **Widoki:** `/recipes`, `/recipes/:id`
- **Komponenty:** `<RecipeGrid>`, `<RecipeCard>`, `<RecipeFormModal>`, `<RecipeDetails>`
- **API:** GET/POST/PATCH/DELETE `/api/recipes`, GET `/api/tags`
- **Features:** List, search, filter, add, edit, delete, view details

### US-004: Wyszukiwanie przepisu na podstawie dostępnych produktów
- **Widoki:** `/recipes/search`, `/recipes/search?source=X`
- **Komponenty:** `<SearchSourceGrid>`, `<SearchResults>`, `<SkeletonRecipeCard>`
- **API:** POST `/api/recipes/search-by-fridge`, POST `/api/recipes/generate`
- **Features:** Wybór źródła (USER/API/AI/ALL), hierarchical search, match scoring, loading states

### US-005: Generowanie listy zakupów
- **Widoki:** Modal w `/recipes/:id`
- **Komponenty:** `<ShoppingListModal>`, `<IngredientsChecklist>`
- **API:** POST `/api/shopping-list/generate`
- **Features:** Lista brakujących składników, edycja, kopiowanie, eksport, drukowanie

### US-006: Alternatywne scenariusze wyszukiwania
- **Widoki:** `/recipes` (manual search)
- **Komponenty:** `<SearchBar>`, filters (difficulty, tags, cooking time)
- **API:** GET `/api/recipes?search=...&difficulty=...&tags=...&max_cooking_time=...`
- **Features:** Full-text search, multi-filters

### (Implied) Historia gotowania
- **Widoki:** `/history`
- **Komponenty:** `<CookingHistoryList>`, `<CookConfirmationDialog>`
- **API:** GET `/api/cooking-history`, POST `/api/cooking-history`
- **Features:** Timeline, expandable details, undo (manual dla MVP), cook again

## 9. Nierozwiązane kwestie i rekomendacje

### 9.1 Do rozwiązania przed implementacją:

1. **Autocomplete Library:**
   - Rekomendacja: Headless UI Combobox (lightweight, accessible)
   - Alternatywa: Downshift (bardziej konfigurowalne)
   - Config: Debounce 300ms, minimum 2 znaki do wyszukiwania

2. **External API Integration:**
   - Wymaga: Nazwa API, endpoint, authentication, rate limits
   - Format odpowiedzi: Do zmapowania w `external-recipe-mapper.ts`

3. **Cache Strategy:**
   - Rekomendacja dla MVP: Brak cache dla user data (fridge, recipes, history)
   - Cache tylko dla dictionaries (units, tags) - memory cache, 1h TTL
   - LocalStorage tylko dla UI preferences (filters, sort order)

4. **Offline Support:**
   - MVP: Brak offline support (wymaga internet)
   - Post-MVP: Service Worker dla offline fallback (pokazanie cached data z komunikatem)

5. **Field Limits (validation):**
   - Tytuł przepisu: Max 100 znaków
   - Opis przepisu: Max 500 znaków
   - Instrukcje: Min 10 znaków, max 5000 znaków
   - Nazwa produktu: Max 50 znaków
   - Max składników w przepisie: 50
   - Query search: Max 100 znaków

6. **Shopping List Export Format:**
   ```
   Lista zakupów: [Nazwa przepisu]
   
   - 2 pc Pomidor
   - 100 g Mąka
   - 1 szt Cebula
   ```
   - Plain text, UTF-8,每 item w nowej linii, prefiks "- "

7. **Unit Conversion:**
   - MVP: Brak automatycznej konwersji (user musi używać tych samych jednostek)
   - Post-MVP: Conversion factors table (g↔kg, ml↔l, etc.)

8. **Tags/Categories:**
   - Source: User-generated (POST `/api/tags`)
   - Global tags (seeded): vegetarian, vegan, gluten-free, quick meal, etc.
   - Nie są obowiązkowe

9. **Match Score Algorithm:**
   - Percentage = (available ingredients / total ingredients) * 100
   - Weighted by quantity: Jeśli masz 50% required quantity, składnik liczy się jako 0.5
   - Formula: `sum(min(available, required) / required) / total_ingredients * 100`
   - Threshold dla "good match": ≥70%

### 9.2 Techniczne TODOs:

1. Setup Astro project z React integration
2. Install Shadcn/ui components
3. Configure Tailwind 4 z custom colors
4. Create API client utility
5. Implement Toast context
6. Setup mock authentication dla MVP
7. Create base layout (Sidebar, BottomNav, Header)
8. Implement core components (SearchBar, Autocomplete, Cards)
9. Build widoki iteracyjnie (Fridge → Recipes → Search → History)
10. Test responsywność na różnych breakpointach
11. Accessibility audit (keyboard nav, ARIA, contrast)
12. Performance audit (Lighthouse, islands hydration strategy)

## 10. Podsumowanie

Architektura UI Foodnager została zaprojektowana z naciskiem na:

✅ **Prostotę implementacji** - minimalistyczny state management, płaska struktura route'ów
✅ **Wydajność** - Astro Islands, selective hydration, code splitting
✅ **Dostępność** - semantic HTML, ARIA, keyboard navigation, color contrast
✅ **Responsywność** - adaptywna nawigacja, mobile-first grids, responsive modals
✅ **UX** - intuitive flows, clear feedback (toasts), meaningful loading states, comprehensive error handling
✅ **Zgodność z API** - wszystkie widoki zmapowane do endpointów, proper validation
✅ **Zgodność z PRD** - wszystkie user stories pokryte, hierarchical search, fridge management, history tracking

Architektura jest **skalowalna** (łatwo dodać nowe widoki/features) i **maintainable** (jasna separacja Astro/React, modular components).

Gotowa do implementacji! 🚀

