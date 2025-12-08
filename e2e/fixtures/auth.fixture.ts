import { test as base } from "@playwright/test";
import { login, getTestUserCredentials } from "../helpers/test-helpers";

/**
 * Auth fixtures for authenticated user tests
 *
 * Usage:
 * 1. Import: import { test, expect } from './fixtures/auth.fixture';
 * 2. Use: test('my test', async ({ authenticatedPage }) => { ... });
 */
interface AuthFixtures {
  authenticatedPage: any;
}

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Setup: Perform authentication using test user credentials
    const { email, password } = getTestUserCredentials();

    // Use UI login to properly set cookies in browser context
    // API login doesn't share cookies between page.request and page context
    await login(page, email, password);

    // Verify we're logged in by checking we're not on login page
    const currentURL = page.url();
    if (currentURL.includes("/login")) {
      throw new Error(`Authentication failed - still on login page. Credentials: ${email}`);
    }

    // Verify we actually landed on an authenticated page
    if (!currentURL.match(/\/(fridge|recipes|history|profile)/)) {
      throw new Error(`Authentication succeeded but unexpected redirect to: ${currentURL}`);
    }

    // Use the authenticated page
    // eslint-disable-next-line react-hooks/rules-of-hooks
    await use(page);

    // Teardown: No cleanup needed (session expires after test)
    // If you want to explicitly logout: await logout(page);
  },
});

export { expect } from "@playwright/test";
