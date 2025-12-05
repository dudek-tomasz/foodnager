# E2E Tests - Foodnager

## 🚀 Setup

### 1. Create Test User

Before running E2E tests, you need to create a test user in your database:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to http://localhost:3000/register

3. Register a test user with credentials:
   - Email: `test@foodnager.pl`
   - Password: `TestPassword123!`

4. (Optional) Verify email if required

### 2. Configure Environment Variables

Create a `.env.test` file in the root directory with your test user credentials:

```env
E2E_USERNAME=test@foodnager.pl
E2E_PASSWORD=TestPassword123!
```

Optional variables:

```env
# Custom base URL (defaults to http://localhost:3000)
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

### 3. Install Playwright Browsers

```bash
npx playwright install chromium
```

## 🧪 Running Tests

### Run all E2E tests

```bash
npm run test:e2e
```

### Run specific test file

```bash
npm run test:e2e e2e/fridge-add-product.spec.ts
```

### Run in UI mode (interactive)

```bash
npm run test:e2e:ui
```

### Run in debug mode

```bash
npm run test:e2e:debug
```

### Run with headed browser

```bash
npx playwright test --headed
```

### View test report

```bash
npm run test:e2e:report
```

## 📂 Directory Structure

```
e2e/
├── fixtures/
│   └── auth.fixture.ts          # Authentication fixture for logged-in tests
├── helpers/
│   └── test-helpers.ts          # Reusable helper functions
├── pages/
│   ├── components/              # Reusable component POM classes
│   │   ├── ProductAutocompleteComponent.ts
│   │   ├── UnitSelectComponent.ts
│   │   └── DatePickerComponent.ts
│   ├── FridgePage.page.ts       # Fridge page POM
│   ├── AddProductModal.page.ts  # Add product modal POM
│   ├── index.ts                 # Exports
│   ├── README.md                # POM documentation
│   └── ARCHITECTURE.md          # Architecture diagrams
├── example.spec.ts              # Example test
└── fridge-add-product.spec.ts   # Fridge tests
```

## 🔐 Authentication

Tests use **setup project** pattern recommended by Playwright:

1. `e2e/auth.setup.ts` runs **once before all tests**
2. Logs in and saves session to `playwright/.auth/user.json`
3. All tests reuse this saved session automatically

This approach is **fast** and **reliable** - login happens only once!

### How it works

**Setup project** (runs first):
```typescript
// e2e/auth.setup.ts
setup('authenticate', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input#email', email);
  await page.fill('input#password', password);
  await page.click('button[type="submit"]');
  
  // Save session to file
  await page.context().storageState({ path: 'playwright/.auth/user.json' });
});
```

**Tests** (use saved session):
```typescript
import { test } from '@playwright/test';

test('my test', async ({ page }) => {
  // page is already authenticated! 🎉
  await page.goto('/fridge');
});
```

Configuration automatically loads the saved session for all tests.

## 📝 Writing Tests

### Page Object Model (POM)

All tests use the Page Object Model pattern. See `e2e/pages/README.md` for details.

### Example Test

```typescript
import { test, expect } from './fixtures/auth.fixture';
import { FridgePage } from './pages';

test.describe('My Feature', () => {
  test('should do something', async ({ authenticatedPage }) => {
    const fridge = new FridgePage(authenticatedPage);
    
    await fridge.goto();
    await fridge.openAddProductModal();
    await fridge.addProductModal.quickAdd('Mleko', 1, 'litr');
    
    await fridge.assertProductExists('Mleko');
  });
});
```

## 🐛 Debugging

### Visual debugging with UI Mode

```bash
npm run test:e2e:ui
```

This opens an interactive UI where you can:
- See test execution in real-time
- Inspect locators
- View screenshots and videos
- Step through tests

### Debug mode

```bash
npm run test:e2e:debug
```

This runs tests with Playwright Inspector for step-by-step debugging.

### Trace Viewer

If a test fails, a trace is automatically saved. View it with:

```bash
npx playwright show-trace trace.zip
```

### Screenshots and Videos

- Screenshots: Automatically taken on failure
- Videos: Recorded for failed tests
- Location: `test-results/` directory

## ⚙️ Configuration

Edit `playwright.config.ts` to customize:
- Test timeout
- Retry attempts
- Browser settings
- Screenshots/videos
- Reports

## 🔍 Troubleshooting

### "Authentication failed" error

**Solution:**
1. Verify test user exists in database
2. Check credentials in `.env.test` (must have `E2E_USERNAME` and `E2E_PASSWORD`)
3. Ensure user is not locked out
4. Verify `.env.test` file is in the root directory (same level as `playwright.config.ts`)

### "Port 3000 already in use"

**Solution:**
1. Stop existing dev server
2. Or change port in `playwright.config.ts`

### "Timeout waiting for redirect"

**Solution:**
1. Increase timeout in `login()` helper
2. Check network tab for API errors
3. Verify middleware is running

### Tests are slow

**Solution:**
1. Use `loginViaAPI()` instead of UI login
2. Run tests in parallel: `npx playwright test --workers 4`
3. Use `test.skip()` for slow tests during development

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/docs/intro)
- [Page Object Model Guide](./pages/README.md)
- [Test Helpers](./helpers/test-helpers.ts)
- [Auth Fixture](./fixtures/auth.fixture.ts)

## 🚧 Known Issues

1. **Slow first load**: First test may be slow due to cold start. Subsequent tests are faster.
2. **Flaky toast assertions**: Toast messages may disappear quickly. Use `waitFor()` with longer timeout if needed.
3. **Modal animations**: Wait for modal to be fully open before interacting with form fields.

## 📊 Coverage

Current coverage:
- ✅ Fridge - Add Product (12 tests)
- 🚧 Fridge - Edit Product (TODO)
- 🚧 Fridge - Delete Product (TODO)
- 🚧 Recipes - Search (TODO)
- 🚧 Cooking History (TODO)

## 🎯 CI/CD

Tests run automatically on GitHub Actions for PRs and commits to main.

To run tests in CI mode locally:

```bash
CI=true npm run test:e2e
```

This enables:
- Retries on failure
- Headless mode
- Single worker
- Full traces

