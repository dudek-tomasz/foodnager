import { test, expect } from "@playwright/test";

/**
 * Example E2E test for the home page
 * This test demonstrates basic Playwright usage
 */
test.describe("Home Page", () => {
  test("should load the home page", async ({ page }) => {
    // Navigate to the home page
    await page.goto("/");

    // Wait for the page to be fully loaded
    await page.waitForLoadState("networkidle");

    // Check if the page title is correct
    await expect(page).toHaveTitle(/Foodnager/i);
  });

  test("should have main navigation", async ({ page }) => {
    await page.goto("/");

    // Check if navigation elements are present
    // Adjust selectors based on your actual navigation structure
    const nav = page.locator("nav");
    await expect(nav).toBeVisible();
  });
});
