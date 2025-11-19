import { test as base } from '@playwright/test';

/**
 * Example fixture for authenticated user tests
 * Extend this to add custom fixtures for your tests
 */
type AuthFixtures = {
  authenticatedPage: any;
};

export const test = base.extend<AuthFixtures>({
  authenticatedPage: async ({ page }, use) => {
    // Setup: Perform authentication
    // This is a placeholder - adjust based on your auth flow
    await page.goto('/login');
    // await page.fill('[name="email"]', 'test@example.com');
    // await page.fill('[name="password"]', 'password');
    // await page.click('button[type="submit"]');
    // await page.waitForURL('/dashboard');
    
    // Use the authenticated page
    await use(page);
    
    // Teardown: Clean up if needed
  },
});

export { expect } from '@playwright/test';

