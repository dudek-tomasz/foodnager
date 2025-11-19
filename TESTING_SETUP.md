# Środowisko Testowe - Instrukcje Finalizacji

## ✅ Co zostało zrobione

1. ✅ Zainstalowano zależności testowe:
   - Vitest + @vitest/ui
   - jsdom, happy-dom
   - @testing-library/react + @testing-library/jest-dom + @testing-library/user-event
   - Playwright + @playwright/test
   - MSW (Mock Service Worker)

2. ✅ Skonfigurowano Vitest (`vitest.config.ts`)
3. ✅ Skonfigurowano Playwright (`playwright.config.ts`)
4. ✅ Stworzono strukturę katalogów testowych
5. ✅ Dodano skrypty testowe do `package.json`
6. ✅ Stworzono przykładowe testy demonstracyjne
7. ✅ Zaktualizowano `.gitignore`

## 📦 Dodatkowe pakiety do zainstalowania (jeśli jeszcze nie są)

Uruchom w terminalu:

```bash
npm install -D @vitejs/plugin-react @vitest/coverage-v8 msw
```

## 🎬 Inicjalizacja Playwright

Przed uruchomieniem testów E2E, zainstaluj przeglądarki Playwright:

```bash
npx playwright install chromium
```

## 🧪 Weryfikacja Setup - Komendy do uruchomienia

### 1. Sprawdź czy wszystkie zależności są zainstalowane

```bash
npm list vitest @playwright/test msw
```

### 2. Uruchom przykładowe testy jednostkowe

```bash
npm run test:run
```

Powinny przejść 3 przykładowe testy z `src/tests/unit/example.test.ts`.

### 3. Uruchom przykładowe testy komponentów

```bash
npm run test -- components
```

Powinien przejść test komponentu `ExampleButton`.

### 4. Uruchom testy w UI mode (opcjonalnie)

```bash
npm run test:ui
```

Otworzy się interfejs webowy Vitest z interaktywnym exploratorem testów.

### 5. Wygeneruj raport pokrycia kodu

```bash
npm run test:coverage
```

### 6. Uruchom przykładowe testy E2E

**UWAGA**: Przed uruchomieniem upewnij się, że:
- Zainstalowałeś przeglądarki Playwright (`npx playwright install chromium`)
- Masz uruchomioną aplikację (`npm run dev`) LUB pozwól Playwright uruchomić ją automatycznie

```bash
npm run test:e2e
```

### 7. Uruchom Playwright w UI mode (zalecane dla development)

```bash
npm run test:e2e:ui
```

## 📁 Struktura Plików

```
foodnager/
├── vitest.config.ts              # Konfiguracja Vitest
├── playwright.config.ts          # Konfiguracja Playwright
├── src/
│   └── tests/                    # Testy jednostkowe i komponentów
│       ├── setup.ts              # Setup Vitest
│       ├── README.md             # Dokumentacja testów
│       ├── utils/
│       │   └── test-utils.tsx    # Pomocniki do testowania
│       ├── mocks/
│       │   ├── handlers.ts       # MSW handlers
│       │   ├── server.ts         # MSW server (Node.js)
│       │   └── browser.ts        # MSW worker (browser)
│       ├── unit/
│       │   └── example.test.ts   # Przykładowy test jednostkowy
│       └── components/
│           └── example-component.test.tsx  # Przykładowy test komponentu
└── e2e/                          # Testy E2E
    ├── example.spec.ts           # Przykładowy test E2E
    ├── fixtures/
    │   └── auth.fixture.ts       # Custom fixtures
    └── helpers/
        └── test-helpers.ts       # Funkcje pomocnicze

```

## 🎯 Następne Kroki

### 1. Dostosuj konfigurację do swoich potrzeb

**`vitest.config.ts`**:
- Dostosuj progi pokrycia kodu (`coverage.thresholds`)
- Dodaj więcej katalogów do wykluczenia z pokrycia
- Zmień environment na `jsdom` jeśli happy-dom sprawia problemy

**`playwright.config.ts`**:
- Dostosuj `baseURL` jeśli używasz innego portu
- Dodaj więcej przeglądarek (Firefox, WebKit) jeśli potrzeba
- Skonfiguruj retry strategy dla CI

### 2. Napisz pierwsze prawdziwe testy

Zacznij od testowania kluczowych komponentów:
- Formularze (logowanie, rejestracja)
- Komponenty UI (przyciski, inputy)
- Logika biznesowa (utils, helpers)

### 3. Skonfiguruj MSW dla swoich API endpoints

Edytuj `src/tests/mocks/handlers.ts` i dodaj handlery dla:
- `/api/products`
- `/api/recipes`
- `/api/fridge`
- `/api/auth`
- etc.

### 4. Stwórz Page Objects dla testów E2E

Przykład:

```typescript
// e2e/pages/login.page.ts
import { Page } from '@playwright/test';

export class LoginPage {
  constructor(private page: Page) {}
  
  async goto() {
    await this.page.goto('/login');
  }
  
  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}
```

### 5. Dodaj testy do CI/CD

Stwórz `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:run
      
      - name: Install Playwright
        run: npx playwright install chromium --with-deps
      
      - name: Run E2E tests
        run: npm run test:e2e
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
```

## 🐛 Rozwiązywanie Problemów

### Problem: `Cannot find module '@vitejs/plugin-react'`

```bash
npm install -D @vitejs/plugin-react
```

### Problem: `Cannot find module 'msw'`

```bash
npm install -D msw
```

### Problem: Playwright nie może znaleźć przeglądarek

```bash
npx playwright install chromium
```

### Problem: Testy nie znajdują importów z `@/`

Sprawdź czy `vitest.config.ts` ma poprawnie skonfigurowane aliasy. Powinny być zsynchronizowane z `tsconfig.json`.

### Problem: Testy komponentów nie działają

Upewnij się, że masz zainstalowane wszystkie zależności Testing Library:

```bash
npm install -D @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

## 📚 Dokumentacja

Pełna dokumentacja testów znajduje się w:
- `src/tests/README.md` - szczegółowe instrukcje pisania testów

Zewnętrzne zasoby:
- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [MSW Documentation](https://mswjs.io/)

## ✅ Checklist weryfikacji

- [ ] Uruchomiłem `npm run test:run` - testy jednostkowe przeszły
- [ ] Uruchomiłem `npm run test:e2e` - testy E2E przeszły
- [ ] Sprawdziłem `npm run test:ui` - interfejs Vitest działa
- [ ] Sprawdziłem `npm run test:coverage` - raport pokrycia generuje się
- [ ] Dodałem testy do CI/CD pipeline
- [ ] Przeczytałem dokumentację w `src/tests/README.md`

---

**Środowisko testowe jest gotowe do użycia!** 🎉

Jeśli masz pytania lub problemy, sprawdź dokumentację lub otwórz issue w repozytorium.

