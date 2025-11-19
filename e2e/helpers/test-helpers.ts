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

