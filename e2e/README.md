# E2E Tests Documentation

This directory contains End-to-End (E2E) tests for Foodnager using Playwright.

## Prerequisites

1. **Node.js** - Version specified in `.nvmrc` (22.14.0)
2. **Playwright browsers** - Installed automatically with `npm ci` or manually with `npx playwright install chromium`
3. **Test environment configuration** - `.env.test` file with test credentials

## Setup

### 1. Create `.env.test` file

Create a `.env.test` file in the project root with the following variables:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# E2E Test User Credentials
E2E_USERNAME=test@example.com
E2E_PASSWORD=your-test-password
E2E_USERNAME_ID=00000000-0000-0000-0000-000000000000

# Playwright Configuration
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
```

### 2. Create Test User in Supabase

1. Go to Supabase Dashboard → Authentication → Users
2. Create a new user with the email and password from `.env.test`
3. Confirm the user (if email confirmation is enabled)
4. Copy the user's UUID and set it as `E2E_USERNAME_ID`

### 3. Install Dependencies

```bash
npm ci
```

This will also install Playwright browsers automatically.

## Running Tests

### Run all E2E tests

```bash
npm run test:e2e
```

This command:
- Starts the dev server in test mode (`npm run dev:e2e`)
- Runs authentication setup
- Executes all E2E tests
- Cleans up test data after completion

### Run tests in UI mode (interactive)

```bash
npm run test:e2e:ui
```

Great for debugging and developing tests. Shows the browser and allows step-by-step execution.

### Run tests in debug mode

```bash
npm run test:e2e:debug
```

Opens Playwright Inspector for detailed debugging.

### View test report

```bash
npm run test:e2e:report
```

Opens the HTML report from the last test run.

### Generate test code

```bash
npm run test:e2e:codegen
```

Opens Playwright Codegen tool to record interactions and generate test code.

## Test Structure

```
e2e/
├── auth.setup.ts           # Authentication setup (runs first)
├── global.teardown.ts      # Global cleanup (runs last)
├── example.spec.ts         # Example tests
├── fridge-add-product.spec.ts  # Fridge feature tests
├── examples/
│   └── cleanup-example.spec.ts  # Database cleanup examples
├── helpers/
│   └── db-cleanup.ts       # Database cleanup utilities
└── pages/
    ├── AddProductModal.page.ts  # Page Object for Add Product Modal
    └── components/
        └── ProductAutocompleteComponent.ts  # Component Object
```

## Test Patterns

### Authentication

Tests use a shared authentication state to avoid logging in for each test:

```typescript
// Tests automatically use authenticated state
test("my test", async ({ page }) => {
  // Already logged in
  await page.goto("/fridge");
});
```

### Database Cleanup

Use cleanup helpers to ensure tests start with a clean state:

```typescript
import { cleanupFridge, cleanupUserData } from "./helpers/db-cleanup";

test.describe("My Tests", () => {
  const TEST_USER_ID = process.env.E2E_USERNAME_ID!;

  // Clean before each test
  test.beforeEach(async () => {
    await cleanupFridge(TEST_USER_ID);
  });

  test("my test", async ({ page }) => {
    // Fridge is empty
  });
});
```

See `e2e/examples/cleanup-example.spec.ts` for more patterns.

### Page Objects

Use Page Objects to encapsulate page interactions:

```typescript
import { AddProductModal } from "./pages/AddProductModal.page";

test("add product", async ({ page }) => {
  const modal = new AddProductModal(page);
  
  await page.goto("/fridge");
  await modal.open();
  await modal.fillAndSubmit({
    productName: "Mleko",
    quantity: "1",
    unit: "litr"
  });
  
  await expect(page.getByText("Mleko")).toBeVisible();
});
```

## CI/CD

Tests run automatically on GitHub Actions when pushing to `master` branch.

### Required GitHub Secrets

The following secrets must be configured in GitHub repository settings:

- `SUPABASE_URL`
- `SUPABASE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `E2E_USERNAME`
- `E2E_PASSWORD`
- `E2E_USERNAME_ID`

See `docs/GITHUB_SECRETS.md` for detailed setup instructions.

### Skip E2E Tests in CI

You can manually trigger the workflow and skip E2E tests:

1. Go to Actions tab in GitHub
2. Select "CI - Tests & Build" workflow
3. Click "Run workflow"
4. Check "Pomiń testy E2E"
5. Click "Run workflow"

## Troubleshooting

### "Invalid API key" errors

- Check that `.env.test` exists and contains all required variables
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct (not the anon key)
- Ensure there are no extra spaces or newlines in the values

### Tests timeout waiting for elements

- Check if the dev server is running (`npm run dev:e2e` in another terminal)
- Verify the test user exists and is confirmed in Supabase
- Check browser console for errors (run with `--headed` flag)

### Authentication fails

- Verify `E2E_USERNAME` and `E2E_PASSWORD` match a real user in Supabase
- Check that the user is confirmed (email verified)
- Ensure `E2E_USERNAME_ID` matches the user's UUID

### Database cleanup fails

- Verify `SUPABASE_SERVICE_ROLE_KEY` is set correctly
- Check Supabase RLS policies allow service role to delete data
- Review `e2e/global.teardown.ts` logs for specific errors

## Best Practices

1. **Always clean up test data** - Use `beforeEach` or `afterEach` hooks
2. **Use meaningful test descriptions** - Describe what the test does
3. **Keep tests independent** - Tests should not depend on each other
4. **Use Page Objects** - Encapsulate page interactions
5. **Wait for elements properly** - Use `waitFor()` or `expect().toBeVisible()`
6. **Handle async operations** - Always `await` Playwright actions
7. **Use data-testid attributes** - For stable selectors in production code

## Writing New Tests

1. Create a new `.spec.ts` file in the `e2e/` directory
2. Import necessary helpers and page objects
3. Use `test.describe()` to group related tests
4. Add cleanup hooks if needed
5. Write tests using Page Objects
6. Run tests locally before committing

Example:

```typescript
import { test, expect } from "@playwright/test";
import { cleanupFridge } from "./helpers/db-cleanup";

test.describe("My Feature", () => {
  const TEST_USER_ID = process.env.E2E_USERNAME_ID!;

  test.beforeEach(async () => {
    await cleanupFridge(TEST_USER_ID);
  });

  test("should do something", async ({ page }) => {
    await page.goto("/my-page");
    // Test logic here
  });
});
```

## Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Supabase Documentation](https://supabase.com/docs)
