import { Page } from '@playwright/test';

/**
 * Helper functions for E2E tests
 */

/**
 * Wait for a specific element to be visible
 */
export async function waitForElement(page: Page, selector: string, timeout = 5000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
}

/**
 * Fill a form with data
 */
export async function fillForm(page: Page, formData: Record<string, string>) {
  for (const [name, value] of Object.entries(formData)) {
    await page.fill(`[name="${name}"]`, value);
  }
}

/**
 * Take a screenshot with a custom name
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
}

/**
 * Mock API response
 */
export async function mockApiResponse(
  page: Page,
  url: string,
  response: any,
  status = 200
) {
  await page.route(url, (route) => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    });
  });
}

/**
 * Login helper - logs in a user via UI
 * @param page - Playwright page object
 * @param email - User email
 * @param password - User password
 */
export async function login(page: Page, email: string, password: string): Promise<void> {
  // Navigate to login page
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('domcontentloaded');

  // Wait for form to be visible
  await page.locator('input#email').waitFor({ state: 'visible', timeout: 5000 });

  // Fill login form
  await page.locator('input#email').fill(email);
  await page.locator('input#password').fill(password);

  // Submit form and wait for navigation
  const navigationPromise = page.waitForURL(/\/(fridge|recipes|history|profile)/, { timeout: 15000 });
  await page.locator('button[type="submit"]').click();
  await navigationPromise;
  
  // Wait for page to be ready
  await page.waitForLoadState('domcontentloaded');
  
  // Small delay to ensure all cookies and session data are set
  await page.waitForTimeout(1000);
}

/**
 * Login helper using API - faster alternative to UI login
 * @param page - Playwright page object
 * @param email - User email
 * @param password - User password
 */
export async function loginViaAPI(page: Page, email: string, password: string): Promise<void> {
  // Make API call to login endpoint
  const response = await page.request.post('/api/auth/login', {
    data: {
      email,
      password,
    },
  });

  if (!response.ok()) {
    const errorData = await response.json();
    throw new Error(`Login failed: ${errorData.error?.message || 'Unknown error'}`);
  }

  // Navigate to fridge page (cookies will be set automatically)
  await page.goto('/fridge', { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('domcontentloaded');
}

/**
 * Logout helper
 * @param page - Playwright page object
 */
export async function logout(page: Page): Promise<void> {
  await page.goto('/api/auth/logout');
  await page.waitForLoadState('networkidle');
}

/**
 * Setup test user credentials
 * Uses environment variables from .env.test file
 * Variables: E2E_USERNAME and E2E_PASSWORD
 */
export function getTestUserCredentials(): { email: string; password: string } {
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  if (!email || !password) {
    throw new Error(
      'E2E test credentials not found! Please create .env.test file with:\n' +
      'E2E_USERNAME=your-email@example.com\n' +
      'E2E_PASSWORD=your-password'
    );
  }

  return {
    email,
    password,
  };
}

