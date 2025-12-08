# Dokumentacja Testów - Foodnager

## Struktura Testów

```
foodnager/
├── src/tests/              # Testy jednostkowe i komponentów
│   ├── setup.ts            # Globalna konfiguracja testów
│   ├── utils/              # Narzędzia pomocnicze
│   │   └── test-utils.tsx  # Custom render z providerami
│   ├── mocks/              # MSW handlers dla API
│   │   ├── handlers.ts     # Definicje mock handlers
│   │   ├── server.ts       # MSW server (Node.js)
│   │   └── browser.ts      # MSW worker (przeglądarka)
│   ├── unit/               # Testy jednostkowe
│   └── components/         # Testy komponentów React
├── e2e/                    # Testy E2E (Playwright)
│   ├── example.spec.ts     # Przykładowy test E2E
│   ├── fixtures/           # Custom fixtures
│   └── helpers/            # Funkcje pomocnicze
├── vitest.config.ts        # Konfiguracja Vitest
└── playwright.config.ts    # Konfiguracja Playwright
```

## Skrypty Testowe

### Vitest (Testy Jednostkowe i Komponentów)

```bash
# Uruchom testy w trybie watch
npm run test

# Uruchom testy z UI
npm run test:ui

# Uruchom testy raz (CI mode)
npm run test:run

# Uruchom testy z pokryciem kodu
npm run test:coverage

# Uruchom testy w trybie watch z filtrem
npm run test:watch -- -t "nazwa testu"
```

### Playwright (Testy E2E)

```bash
# Uruchom wszystkie testy E2E
npm run test:e2e

# Uruchom testy E2E w UI mode
npm run test:e2e:ui

# Uruchom testy E2E w trybie debug
npm run test:e2e:debug

# Pokaż raport z testów
npm run test:e2e:report

# Generuj testy interaktywnie (codegen)
npm run test:e2e:codegen
```

## Pisanie Testów Jednostkowych

### Podstawowy test jednostkowy

```typescript
import { describe, it, expect } from "vitest";

describe("myFunction", () => {
  it("should return correct value", () => {
    const result = myFunction(1, 2);
    expect(result).toBe(3);
  });
});
```

### Test z mockami

```typescript
import { describe, it, expect, vi } from "vitest";

describe("apiCall", () => {
  it("should call fetch with correct URL", async () => {
    const mockFetch = vi.fn().mockResolvedValue({ json: () => ({ data: "test" }) });
    global.fetch = mockFetch;

    await apiCall("/api/data");

    expect(mockFetch).toHaveBeenCalledWith("/api/data");
  });
});
```

## Pisanie Testów Komponentów

### Podstawowy test komponentu

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../utils/test-utils';
import { MyComponent } from '@/components/MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent title="Test" />);

    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

### Test z interakcją użytkownika

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, userEvent } from '../utils/test-utils';
import { Button } from '@/components/Button';

describe('Button', () => {
  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    await user.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

## Pisanie Testów E2E

### Podstawowy test E2E

```typescript
import { test, expect } from "@playwright/test";

test.describe("Login Flow", () => {
  test("user can log in", async ({ page }) => {
    await page.goto("/login");

    await page.fill('[name="email"]', "test@example.com");
    await page.fill('[name="password"]', "password");
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL("/dashboard");
  });
});
```

### Test z Page Object Model

```typescript
// e2e/pages/login.page.ts
export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.page.fill('[name="email"]', email);
    await this.page.fill('[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}

// e2e/login.spec.ts
test("user can log in with POM", async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login("test@example.com", "password");

  await expect(page).toHaveURL("/dashboard");
});
```

## Mockowanie API z MSW

### Dodawanie nowych handlers

Edytuj `src/tests/mocks/handlers.ts`:

```typescript
export const handlers = [
  http.get("/api/products", () => {
    return HttpResponse.json([{ id: 1, name: "Product 1" }]);
  }),

  http.post("/api/products", async ({ request }) => {
    const data = await request.json();
    return HttpResponse.json({ id: 2, ...data }, { status: 201 });
  }),
];
```

### Używanie MSW w testach

MSW jest automatycznie skonfigurowany w `setup.ts` i działa globalnie dla wszystkich testów.

## Best Practices

### Testy Jednostkowe (Vitest)

1. **Używaj `describe` do grupowania** - logicznie grupuj powiązane testy
2. **Jeden assert na test** - każdy test powinien sprawdzać jedną rzecz
3. **Używaj spies zamiast mocks** - gdy wystarczy monitorowanie
4. **Testuj edge cases** - nie tylko happy path
5. **Użyj inline snapshots** - dla czytelności

### Testy Komponentów (React Testing Library)

1. **Testuj z perspektywy użytkownika** - używaj `getByRole`, `getByLabelText`
2. **Unikaj testowania implementacji** - testuj zachowanie, nie szczegóły
3. **Używaj `userEvent`** - zamiast `fireEvent` dla realistycznych interakcji
4. **Testuj dostępność** - sprawdzaj role, labels, aria-attributes

### Testy E2E (Playwright)

1. **Używaj lokatorów semantycznych** - `getByRole`, `getByLabel`
2. **Czekaj na sieć** - używaj `waitForLoadState('networkidle')`
3. **Implementuj Page Object Model** - dla czytelności i reużywalności
4. **Testuj critical paths** - nie wszystko, tylko najważniejsze ścieżki
5. **Używaj fixtures** - dla setup/teardown logiki

## Konfiguracja CI/CD

Dodaj do swojego workflow GitHub Actions:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "22"

      - name: Install dependencies
        run: npm ci

      - name: Run unit tests
        run: npm run test:run

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

## Debugging

### Debug Vitest

```bash
# W VS Code, dodaj breakpoint i uruchom test w debug mode
# Lub użyj console.log w testach
```

### Debug Playwright

```bash
# Tryb debug z step-by-step execution
npm run test:e2e:debug

# Uruchom UI mode dla interaktywnego debugowania
npm run test:e2e:ui
```

## Troubleshooting

### Problem: Testy komponentów nie widzą importów z `@/`

**Rozwiązanie**: Sprawdź czy `vitest.config.ts` ma poprawnie skonfigurowane aliasy:

```typescript
resolve: {
  alias: {
    '@': resolve(__dirname, './src'),
  },
}
```

### Problem: MSW nie przechwytuje requestów

**Rozwiązanie**: Upewnij się, że `setupFiles` w `vitest.config.ts` zawiera ścieżkę do setup.ts

### Problem: Playwright nie może znaleźć elementu

**Rozwiązanie**: Użyj `page.waitForSelector()` lub zwiększ timeout:

```typescript
await page.waitForSelector("button", { timeout: 10000 });
```

## Dodatkowe Zasoby

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright Documentation](https://playwright.dev/)
- [MSW Documentation](https://mswjs.io/)
