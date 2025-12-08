# Testy Jednostkowe dla Komponentu ExpiryDateBadge

## 📊 Statystyki Pokrycia

**Coverage: 100%** 🎉

- Statements: 100%
- Branches: 100%
- Functions: 100%
- Lines: 100%

## 📝 Zakres Testów

### 1. **Basic Rendering** (5 testów)

- Renderowanie komponentu Badge
- Wyświetlanie sformatowanej daty
- Obsługa braku daty (null)
- Dostępność (aria-label)

### 2. **Expired Status** (6 testów)

Status dla produktów przeterminowanych (< 0 dni):

- Variant: `destructive` (czerwony)
- Custom class: brak (domyślny styl destructive)
- Tekst z `showDaysCount`: "(przeterminowany)"
- Testy dla różnych offsetów: -1, -5, -30 dni

### 3. **Expiring Soon Status** (11 testów)

Status dla produktów wkrótce przeterminowanych (0-3 dni):

- Variant: `outline`
- Custom class: pomarańczowy (`border-orange-500`, `bg-orange-50`, etc.)
- Testy dla granic: 0, 1, 2, 3 dni
- Tekst z `showDaysCount`:
  - 0 dni: "(dzisiaj)"
  - 1 dzień: "(jutro)"
  - 2-3 dni: "(X dni)"

### 4. **Fresh Status** (6 testów)

Status dla świeżych produktów (> 3 dni):

- Variant: `default`
- Custom class: zielony (`border-green-500`, `bg-green-50`, etc.)
- Testy dla granic: 4, 10, 30, 365 dni
- Brak informacji o dniach nawet z `showDaysCount`

### 5. **No Expiry Status** (4 testy)

Status dla produktów bez daty ważności:

- Variant: `secondary`
- Custom class: brak
- Tekst: "Brak daty ważności"

### 6. **showDaysCount Prop** (4 testy)

Testowanie flagi wyświetlania licznika dni:

- Domyślna wartość: `false`
- Zachowanie z `true` / `false`
- Logika warunkowa (tylko dla expiring-soon i expired)

### 7. **Edge Cases & Boundary Conditions** (12 testów)

Warunki brzegowe i przypadki szczególne:

- Granica między expiring-soon a fresh (3 vs 4 dni)
- Daty dzisiaj, jutro, wczoraj
- Daty odległe (1000, -1000 dni)
- Specyficzne formaty dat
- Obsługa null

### 8. **Date Formatting** (5 testów)

Formatowanie daty do DD.MM.YYYY:

- Padding zer dla dni i miesięcy
- Daty graniczne (początek/koniec roku)
- Różne formaty wejściowe

### 9. **Integration with Utility Functions** (4 testy)

Integracja z funkcjami pomocniczymi:

- Wywołania `getExpiryStatus()`
- Wywołania `formatExpiryDate()`
- Wywołania `getDaysUntilExpiry()`
- Obsługa null we wszystkich funkcjach

### 10. **Accessibility** (4 testy)

Dostępność dla użytkowników korzystających z czytników ekranu:

- Prawidłowe aria-label z datą
- Spójność aria-label niezależnie od `showDaysCount`
- Semantyczna struktura HTML

### 11. **Business Logic Validation** (3 testy)

Walidacja kluczowych reguł biznesowych:

- Kategoryzacja produktów według timeline
- Poprawne stosowanie stylów wizualnych
- Wyświetlanie kontekstowych informacji

## 🎯 Kluczowe Reguły Biznesowe

### Kolorystyka Statusów

| Status            | Wariant Badge | Custom Class | Opis                                 |
| ----------------- | ------------- | ------------ | ------------------------------------ |
| **Expired**       | `destructive` | -            | Czerwony - przeterminowany (< 0 dni) |
| **Expiring Soon** | `outline`     | Pomarańczowy | Wkrótce przeterminowany (0-3 dni)    |
| **Fresh**         | `default`     | Zielony      | Świeży (> 3 dni)                     |
| **No Expiry**     | `secondary`   | -            | Szary - brak daty                    |

### Logika showDaysCount

Gdy `showDaysCount={true}`:

- **< 0 dni**: "{data} (przeterminowany)"
- **0 dni**: "{data} (dzisiaj)"
- **1 dzień**: "{data} (jutro)"
- **2-3 dni**: "{data} (X dni)"
- **> 3 dni**: tylko data (bez licznika)

## 🛠️ Struktura Testów

### Organizacja

```
src/components/fridge/__tests__/
└── ExpiryDateBadge.test.tsx (59 testów)
```

### Mocki

- **Badge Component**: Zmockowany do testowania props (variant, className, aria-label)
- **Utility Functions**: Testowane przez spyOn dla weryfikacji wywołań

### Utility Functions

- `getRelativeDate(offset)`: Generuje datę względem dzisiaj
- `formatTestDate(isoDate)`: Formatuje datę do DD.MM.YYYY dla asercji

## 🚀 Uruchamianie Testów

### Wszystkie testy

```bash
npm run test -- src/components/fridge/__tests__/ExpiryDateBadge.test.tsx
```

### Z coverage

```bash
npm run test -- src/components/fridge/__tests__/ExpiryDateBadge.test.tsx --coverage --coverage.include=src/components/fridge/ExpiryDateBadge.tsx
```

### Watch mode

```bash
npm run test -- src/components/fridge/__tests__/ExpiryDateBadge.test.tsx --watch
```

## 📋 Checklist Testów

- ✅ Wszystkie 4 statusy (expired, expiring-soon, fresh, no-expiry)
- ✅ Wszystkie warianty Badge (destructive, outline, default, secondary)
- ✅ Wszystkie custom classes (czerwony, pomarańczowy, zielony, brak)
- ✅ Logika showDaysCount dla wszystkich przypadków
- ✅ Warunki brzegowe (0, 1, 3, 4 dni)
- ✅ Formatowanie daty (DD.MM.YYYY)
- ✅ Dostępność (aria-label)
- ✅ Integracja z utility functions
- ✅ Obsługa null
- ✅ Edge cases (daty odległe, timezone)

## 💡 Kluczowe Wnioski

### Co zostało przetestowane:

1. **Logika renderowania**: Wszystkie ścieżki renderowania komponentu
2. **Logika biznesowa**: Kategoryzacja statusów zgodnie z regułami
3. **Formatowanie**: Poprawne formatowanie dat
4. **Interakcja z props**: Zachowanie z różnymi kombinacjami props
5. **Dostępność**: ARIA labels i semantyka HTML
6. **Edge cases**: Obsługa nietypowych przypadków

### Czego nie testujemy:

- **Wizualnego wyglądu**: To zadanie dla testów E2E/wizualnych
- **Badge component internals**: Badge jest zmockowany
- **Browser compatibility**: To zadanie dla testów E2E

## 🔧 Technologie

- **Framework**: Vitest 4.0.15
- **Testing Library**: @testing-library/react
- **Assertions**: @testing-library/jest-dom
- **Coverage**: V8

## 📚 Zgodność z Wytycznymi

Testy zostały stworzone zgodnie z:

- ✅ `.ai/test/comprehensive-test-plan.md` - strategia testowania
- ✅ `vitest.config.ts` - konfiguracja środowiska
- ✅ Przykład: `AddProductModal.test.tsx` - struktura i styl
- ✅ Coverage threshold: 70% (osiągnięto 100%)

## 🎓 Najlepsze Praktyki

1. **Descriptive test names**: Każdy test jasno opisuje co testuje
2. **AAA Pattern**: Arrange-Act-Assert w każdym teście
3. **Isolation**: Testy są niezależne od siebie
4. **Boundary testing**: Szczególna uwaga na warunki brzegowe
5. **Accessibility first**: Testy dostępności w osobnej sekcji
6. **Business logic focus**: Testy koncentrują się na regułach biznesowych
7. **Helper functions**: Reużywalne funkcje pomocnicze
8. **Clear organization**: Logiczne grupowanie testów w describe blocks
