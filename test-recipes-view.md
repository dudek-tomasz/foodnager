# Test Plan - Recipe View

Dokument testowy dla widoku Przepisy (`/recipes`)

## Test Environment

- **URL**: http://localhost:4321/recipes
- **Auth**: Wymagane zalogowanie (Bearer token)
- **Browser**: Chrome/Firefox/Safari (latest)
- **Screen sizes**: Mobile (375px), Tablet (768px), Desktop (1280px)

---

## 1. Podstawowe Funkcjonalności

### 1.1 Wyświetlenie Listy Przepisów

**Kroki:**
1. Przejdź do `/recipes`
2. Poczekaj na załadowanie danych

**Oczekiwane wyniki:**
- [ ] Lista przepisów wyświetla się poprawnie
- [ ] Każda karta zawiera: tytuł, składniki, source badge
- [ ] Grid jest responsywny (3/2/1 kolumny)
- [ ] Loading skeleton pojawia się podczas ładowania
- [ ] Statystyki w headerze są poprawne (Total, USER, API, AI)

### 1.2 Paginacja

**Kroki:**
1. Przejdź do strony z więcej niż 20 przepisami
2. Kliknij "Następna"
3. Kliknij numer strony
4. Kliknij "Poprzednia"

**Oczekiwane wyniki:**
- [ ] Pagination controls wyświetlają się poprawnie
- [ ] Przejście do następnej strony działa
- [ ] Przejście do konkretnej strony działa
- [ ] Przejście do poprzedniej strony działa
- [ ] Disabled state działa na pierwszej/ostatniej stronie
- [ ] Info "Strona X z Y" jest poprawna

---

## 2. Wyszukiwanie i Filtrowanie

### 2.1 Wyszukiwanie

**Kroki:**
1. Wpisz "pomidorowa" w search bar
2. Poczekaj 300ms (debouncing)
3. Sprawdź wyniki

**Oczekiwane wyniki:**
- [ ] Debouncing działa (nie wysyła requestu przy każdym znaku)
- [ ] Wyniki zawierają frazę "pomidorowa"
- [ ] Loading indicator pojawia się w input
- [ ] Clear button (X) jest widoczny
- [ ] Kliknięcie X czyści wyszukiwanie

### 2.2 Filtrowanie po Źródle

**Kroki:**
1. Kliknij "Filtruj"
2. Zaznacz "Moje przepisy"
3. Zamknij dropdown

**Oczekiwane wyniki:**
- [ ] Filtr działa - pokazują się tylko przepisy USER
- [ ] Badge z liczbą aktywnych filtrów (1) jest widoczny
- [ ] "Wyczyść wszystkie" czyści filtry

### 2.3 Filtrowanie po Trudności

**Kroki:**
1. Kliknij "Filtruj"
2. Zaznacz "Łatwy"
3. Zamknij dropdown

**Oczekiwane wyniki:**
- [ ] Pokazują się tylko przepisy "easy"
- [ ] Badge counter zwiększa się

### 2.4 Filtrowanie po Tagach

**Kroki:**
1. Kliknij "Filtruj"
2. Zaznacz 2-3 tagi
3. Zamknij dropdown

**Oczekiwane wyniki:**
- [ ] Pokazują się przepisy z wybranymi tagami
- [ ] Multi-select działa poprawnie

### 2.5 Filtrowanie po Czasie Gotowania

**Kroki:**
1. Kliknij "Filtruj"
2. Wpisz "30" w "Max czas gotowania"
3. Zamknij dropdown

**Oczekiwane wyniki:**
- [ ] Pokazują się przepisy ≤ 30 minut
- [ ] Filtr działa poprawnie

---

## 3. Sortowanie

### 3.1 Sortowanie po Nazwie

**Kroki:**
1. Wybierz "Nazwa (A-Z)" z dropdown sortowania
2. Kliknij przycisk order (arrow up/down)

**Oczekiwane wyniki:**
- [ ] Przepisy sortują się alfabetycznie (A-Z)
- [ ] Zmiana order na desc sortuje Z-A
- [ ] Icon strzałki zmienia się

### 3.2 Sortowanie po Czasie Gotowania

**Kroki:**
1. Wybierz "Czas gotowania"
2. Sprawdź order

**Oczekiwane wyniki:**
- [ ] Przepisy sortują się według czasu gotowania
- [ ] Asc = od najmniejszego do największego

### 3.3 Sortowanie po Dacie Dodania

**Kroki:**
1. Wybierz "Data dodania"
2. Order desc (domyślnie)

**Oczekiwane wyniki:**
- [ ] Najnowsze przepisy na górze
- [ ] Sortowanie działa poprawnie

---

## 4. Dodawanie Przepisu

### 4.1 Dodanie Przepisu - Pełne Dane

**Kroki:**
1. Kliknij "Dodaj przepis"
2. Wypełnij wszystkie pola:
   - Tytuł: "Testowa Zupa"
   - Opis: "Pyszna testowa zupa"
   - Składniki: Dodaj 3 składniki (pomidor 5 szt., sól 1 łyżeczka, woda 1 litr)
   - Instrukcje: "1. Pokrój pomidory\n2. Gotuj 30 min"
   - Czas gotowania: 30
   - Trudność: Łatwy
   - Tagi: wybierz 2 tagi
3. Kliknij "Dodaj przepis"

**Oczekiwane wyniki:**
- [ ] Modal otwiera się poprawnie
- [ ] Wszystkie pola działają
- [ ] Autocomplete produktów działa
- [ ] Dodawanie składników działa (+ button)
- [ ] Usuwanie składników działa (trash icon)
- [ ] Walidacja liczników znaków działa (opis, instrukcje)
- [ ] Wybór trudności działa (buttons)
- [ ] Multi-select tagów działa
- [ ] Submit działa
- [ ] Toast success pojawia się
- [ ] Modal zamyka się
- [ ] Przepis pojawia się na liście

### 4.2 Dodanie Przepisu - Tylko Wymagane Pola

**Kroki:**
1. Kliknij "Dodaj przepis"
2. Wypełnij tylko wymagane:
   - Tytuł: "Minimalna Zupa"
   - Składniki: 1 składnik
   - Instrukcje: "Gotuj 10 min"
3. Kliknij "Dodaj przepis"

**Oczekiwane wyniki:**
- [ ] Submit działa z minimum danych
- [ ] Przepis zapisuje się poprawnie

### 4.3 Walidacja Formularza

**Kroki:**
1. Kliknij "Dodaj przepis"
2. Zostaw puste pola
3. Kliknij "Dodaj przepis"

**Oczekiwane wyniki:**
- [ ] Błędy walidacji pojawiają się pod polami
- [ ] "Tytuł jest wymagany"
- [ ] "Instrukcje są wymagane"
- [ ] "Dodaj przynajmniej jeden składnik"
- [ ] Czerwone obramowania pól z błędami

### 4.4 Dodanie Nowego Produktu Inline

**Kroki:**
1. W formularzu przepisu kliknij autocomplete produktu
2. Wpisz nazwę nieistniejącego produktu "TestowyProdukt123"
3. Kliknij "+ Dodaj nowy produkt"
4. Potwierdź

**Oczekiwane wyniki:**
- [ ] Opcja dodania nowego produktu pojawia się
- [ ] Inline form otwiera się
- [ ] Nowy produkt tworzy się
- [ ] Automatycznie wybiera się w autocomplete

---

## 5. Edycja Przepisu

### 5.1 Edycja Przepisu USER

**Kroki:**
1. Znajdź przepis USER (niebieski badge)
2. Kliknij three dots (...)
3. Wybierz "Edytuj"
4. Zmień tytuł na "Edytowana Zupa"
5. Dodaj składnik
6. Kliknij "Zapisz zmiany"

**Oczekiwane wyniki:**
- [ ] Dropdown menu pojawia się tylko dla USER recipes
- [ ] Modal otwiera się z prefilowanymi danymi
- [ ] Wszystkie pola zawierają aktualne wartości
- [ ] Edycja działa
- [ ] Submit działa
- [ ] Toast success pojawia się
- [ ] Lista odświeża się z nowymi danymi

### 5.2 Brak Edycji dla API/AI

**Kroki:**
1. Znajdź przepis API lub AI
2. Sprawdź czy są three dots

**Oczekiwane wyniki:**
- [ ] Three dots NIE pojawiają się dla API/AI recipes
- [ ] Brak opcji Edit/Delete

---

## 6. Usuwanie Przepisu

### 6.1 Usunięcie Przepisu

**Kroki:**
1. Znajdź przepis USER
2. Kliknij three dots
3. Wybierz "Usuń"
4. Przeczytaj dialog potwierdzenia
5. Kliknij "Usuń"

**Oczekiwane wyniki:**
- [ ] Dialog potwierdzenia pojawia się
- [ ] Wyświetla nazwę przepisu
- [ ] Ostrzeżenie o trwałym usunięciu
- [ ] Przycisk "Usuń" jest czerwony (destructive)
- [ ] Loading state podczas usuwania
- [ ] Toast success po usunięciu
- [ ] Przepis znika z listy
- [ ] Jeśli ostatni na stronie → przejście do poprzedniej strony

### 6.2 Anulowanie Usunięcia

**Kroki:**
1. Rozpocznij usuwanie
2. Kliknij "Anuluj" w dialogu

**Oczekiwane wyniki:**
- [ ] Dialog zamyka się
- [ ] Przepis NIE jest usunięty

---

## 7. Akcja "Ugotuj"

### 7.1 Ugotowanie Przepisu

**Kroki:**
1. Upewnij się, że masz składniki w lodówce
2. Na karcie przepisu kliknij "Ugotuj"

**Oczekiwane wyniki:**
- [ ] Request POST /api/cooking-history
- [ ] Toast success pojawia się
- [ ] Składniki odejmują się z lodówki (sprawdź /fridge)
- [ ] Cooking history entry tworzy się

### 7.2 Ugotowanie bez Składników

**Kroki:**
1. Wybierz przepis bez składników w lodówce
2. Kliknij "Ugotuj"

**Oczekiwane wyniki:**
- [ ] Toast error: "Nie udało się ugotować przepisu..."
- [ ] Przepis NIE jest ugotowany

---

## 8. Empty States

### 8.1 Brak Przepisów

**Kroki:**
1. Usuń wszystkie przepisy (lub użyj świeżego konta)
2. Odśwież stronę

**Oczekiwane wyniki:**
- [ ] Empty state pojawia się
- [ ] Tekst: "Nie masz jeszcze przepisów"
- [ ] Przyciski: "Dodaj przepis" + "Znajdź przepis"
- [ ] Ikona wyświetla się

### 8.2 Brak Wyników Wyszukiwania

**Kroki:**
1. Wpisz w search "xyznonexistent123"
2. Poczekaj na wyniki

**Oczekiwane wyniki:**
- [ ] Empty state dla search results
- [ ] Tekst: "Nie znaleziono przepisów pasujących do 'xyznonexistent123'"
- [ ] Przycisk "Dodaj przepis"

---

## 9. Responsywność

### 9.1 Mobile (375px)

**Kroki:**
1. Zmień viewport na 375px szerokości
2. Sprawdź layout

**Oczekiwane wyniki:**
- [ ] Grid: 1 kolumna
- [ ] Toolbar: vertical stack
- [ ] "Dodaj przepis" button widoczny w toolbar
- [ ] Modal: full-screen
- [ ] Składniki form: vertical stack
- [ ] Pagination: compact (bez page numbers)
- [ ] Header: vertical stack
- [ ] Search bar: full width

### 9.2 Tablet (768px)

**Kroki:**
1. Zmień viewport na 768px

**Oczekiwane wyniki:**
- [ ] Grid: 2 kolumny
- [ ] Toolbar: częściowo horizontal
- [ ] Layout poprawny

### 9.3 Desktop (1280px)

**Kroki:**
1. Zmień viewport na 1280px

**Oczekiwane wyniki:**
- [ ] Grid: 3 kolumny
- [ ] Toolbar: full horizontal
- [ ] "Dodaj przepis" tylko w header
- [ ] Modal: centered 600px
- [ ] Full layout

---

## 10. Accessibility

### 10.1 Keyboard Navigation

**Kroki:**
1. Użyj tylko klawiatury (Tab, Enter, Escape)
2. Nawiguj przez stronę

**Oczekiwane wyniki:**
- [ ] Tab order jest logiczny
- [ ] Focus visible na wszystkich elementach
- [ ] Enter otwiera modal/submituje form
- [ ] Escape zamyka modal
- [ ] Arrow keys w dropdownach
- [ ] Focus trap w modalu

### 10.2 Screen Reader

**Kroki:**
1. Włącz screen reader (NVDA/JAWS/VoiceOver)
2. Nawiguj przez stronę

**Oczekiwane wyniki:**
- [ ] Landmarks oznaczone (`<main>`, `<header>`)
- [ ] Heading hierarchy poprawna
- [ ] Aria-labels na icon buttons
- [ ] Form labels powiązane z inputs
- [ ] Error messages ogłaszane
- [ ] Loading states ogłaszane

---

## 11. Performance

### 11.1 Loading Time

**Kroki:**
1. Odśwież stronę (cache disabled)
2. Zmierz czas do first contentful paint

**Oczekiwane wyniki:**
- [ ] Initial load < 2s
- [ ] Skeleton pojawia się natychmiast
- [ ] SSR data pomaga (jeśli dostępne)

### 11.2 Re-renders

**Kroki:**
1. Otwórz React DevTools Profiler
2. Wpisz w search
3. Zmień filtry

**Oczekiwane wyniki:**
- [ ] RecipeCard nie re-renderuje się niepotrzebnie (memo)
- [ ] PaginationControls nie re-renderuje się (memo)
- [ ] useCallback używany w hookach

---

## 12. Error Handling

### 12.1 Network Error

**Kroki:**
1. Wyłącz internet
2. Spróbuj załadować przepisy

**Oczekiwane wyniki:**
- [ ] Error state pojawia się
- [ ] Toast: "Brak połączenia z internetem"
- [ ] Button "Spróbuj ponownie"

### 12.2 API Error (500)

**Kroki:**
1. Symuluj 500 error z API

**Oczekiwane wyniki:**
- [ ] Toast: "Wystąpił błąd serwera"
- [ ] Graceful handling

### 12.3 Validation Error (422)

**Kroki:**
1. Wyślij niepoprawne dane w formularzu

**Oczekiwane wyniki:**
- [ ] Błędy wyświetlają się pod polami
- [ ] Form nie submituje się

---

## Summary

**Total Tests**: 60+
**Critical Tests**: ~30
**Estimated Time**: 2-3 hours

### Test Coverage:
- ✅ Funkcjonalność podstawowa
- ✅ CRUD operations
- ✅ Search, filter, sort
- ✅ Walidacja
- ✅ Responsywność
- ✅ Accessibility
- ✅ Performance
- ✅ Error handling

### Notes:
- Testy można automatyzować z Playwright/Cypress
- UI testy E2E zalecane dla critical paths
- Performance monitoring w production zalecany

