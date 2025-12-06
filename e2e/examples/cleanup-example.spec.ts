/**
 * Example E2E Test with Database Cleanup
 * 
 * This test demonstrates how to use database cleanup helpers
 * to ensure clean state between tests
 */

import { test, expect } from '@playwright/test';
import { cleanupFridge, cleanupUserData } from '../helpers/db-cleanup';

// Get test user ID from environment
const TEST_USER_ID = process.env.E2E_TEST_USER_ID!;

test.describe('Database Cleanup Examples', () => {
  
  /**
   * Example 1: Clean fridge before test
   * Ensures we start with empty fridge
   */
  test('should start with empty fridge', async ({ page }) => {
    // Clean fridge before test
    await cleanupFridge(TEST_USER_ID);

    // Navigate to fridge page
    await page.goto('/fridge');
    
    // Verify fridge is empty
    await expect(page.getByText(/lodówka jest pusta/i)).toBeVisible();
  });

  /**
   * Example 2: Clean fridge after test
   * Cleanup test data after test completes
   */
  test('should add product and clean up after', async ({ page }) => {
    // Add a product (test logic here)
    await page.goto('/fridge');
    
    // ... test adding product ...
    
    // Clean up after test
    test.afterEach(async () => {
      await cleanupFridge(TEST_USER_ID);
    });
  });

  /**
   * Example 3: Clean all user data before test suite
   * Useful for integration tests that need completely clean state
   */
  test.describe('Integration Tests', () => {
    // Clean everything before this test suite
    test.beforeAll(async () => {
      await cleanupUserData(TEST_USER_ID);
    });

    test('should work with clean database', async ({ page }) => {
      // Database is completely clean here
      await page.goto('/fridge');
      await expect(page.getByText(/lodówka jest pusta/i)).toBeVisible();
    });
  });

  /**
   * Example 4: Conditional cleanup
   * Only cleanup if test failed
   */
  test('should cleanup on failure', async ({ page }, testInfo) => {
    try {
      // Your test logic here
      await page.goto('/fridge');
      
      // This might fail
      await expect(page.getByText('Some text')).toBeVisible();
    } finally {
      // Clean up only if test failed
      if (testInfo.status === 'failed') {
        console.log('Test failed, cleaning up...');
        await cleanupUserData(TEST_USER_ID);
      }
    }
  });
});

/**
 * Example 5: Test with setup and teardown hooks
 * 
 * Best practice pattern for tests that create data
 */
test.describe('Best Practice: Setup/Teardown Pattern', () => {
  
  // Clean before each test
  test.beforeEach(async () => {
    await cleanupFridge(TEST_USER_ID);
  });

  // Clean after each test
  test.afterEach(async () => {
    await cleanupFridge(TEST_USER_ID);
  });

  test('test 1 - starts clean', async ({ page }) => {
    await page.goto('/fridge');
    // Fridge is guaranteed to be empty
  });

  test('test 2 - also starts clean', async ({ page }) => {
    await page.goto('/fridge');
    // Fridge is guaranteed to be empty (cleaned after test 1)
  });
});

/**
 * Example 6: Selective cleanup
 * Clean only what you need
 */
test.describe('Selective Cleanup', () => {
  
  test('clean only recipes', async ({ page }) => {
    const { cleanupRecipes } = await import('../helpers/db-cleanup');
    await cleanupRecipes(TEST_USER_ID);
    
    // Recipes are clean, but fridge/products remain
    await page.goto('/recipes');
  });

  test('clean only cooking history', async ({ page }) => {
    const { cleanupCookingHistory } = await import('../helpers/db-cleanup');
    await cleanupCookingHistory(TEST_USER_ID);
    
    // History is clean, but everything else remains
    await page.goto('/history');
  });
});

/**
 * IMPORTANT NOTES:
 * 
 * 1. Global teardown (e2e/global.teardown.ts) runs automatically after ALL tests
 * 2. You don't need to cleanup after every test - global teardown handles it
 * 3. Only use per-test cleanup when:
 *    - You need guaranteed clean state DURING test execution
 *    - Tests depend on each other
 *    - You're debugging and want to inspect data after tests
 * 
 * 4. Available cleanup functions:
 *    - cleanupUserData(userId) - Clean ALL user data
 *    - cleanupUserProducts(userId) - Clean only products
 *    - cleanupFridge(userId) - Clean only fridge items
 *    - cleanupRecipes(userId) - Clean only recipes
 *    - cleanupCookingHistory(userId) - Clean only cooking history
 * 
 * 5. Always use TEST_USER_ID from environment:
 *    const TEST_USER_ID = process.env.E2E_TEST_USER_ID!;
 * 
 * 6. Cleanup functions require:
 *    - SUPABASE_URL in .env.test
 *    - SUPABASE_SERVICE_ROLE_KEY in .env.test
 *    - E2E_TEST_USER_ID in .env.test
 */

