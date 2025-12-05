import { test as setup, expect } from '@playwright/test';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.test file
config({ path: resolve(__dirname, '../.env.test') });

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

setup('authenticate', async ({ page }) => {
  // Get credentials from env
  const email = process.env.E2E_USERNAME;
  const password = process.env.E2E_PASSWORD;

  console.log('🔐 Login attempt with:', { email, password: password ? '***' : 'MISSING!' });

  if (!email || !password) {
    throw new Error(
      'E2E_USERNAME and E2E_PASSWORD must be set in .env.test\n' +
      `Current values: email=${email}, password=${password ? 'set' : 'MISSING'}`
    );
  }

  // Navigate to login page
  await page.goto('/login');
  
  // Wait for form to be ready
  await page.waitForLoadState('domcontentloaded');
  
  // Fill login form using labels (more reliable with React)
  const emailInput = page.getByLabel('Email');
  const passwordInput = page.getByLabel('Hasło');
  
  // Wait for inputs to be visible
  await emailInput.waitFor({ state: 'visible', timeout: 5000 });
  await passwordInput.waitFor({ state: 'visible', timeout: 5000 });
  
  // Small delay for React to fully hydrate the form
  await page.waitForTimeout(500);
  
  // Clear and fill (one character at a time for better React compatibility)
  await emailInput.clear();
  await emailInput.fill(email, { timeout: 10000 });
  
  await passwordInput.clear();
  await passwordInput.fill(password, { timeout: 10000 });
  
  console.log('✅ Form filled, clicking submit...');
  
  // Submit and wait for redirect
  await page.getByRole('button', { name: /zaloguj się/i }).click();

  // Wait until we're redirected to /fridge (or other authenticated page)
  await page.waitForURL(/\/(fridge|recipes|history|profile)/, { timeout: 15000 });

  // Wait for the page to be fully loaded and verify authentication
  // Use first() to avoid strict mode violation (there might be multiple headings)
  await expect(page.getByRole('heading', { name: /Twoja lodówka|Przepisy|Historia/i }).first()).toBeVisible();
  
  console.log('✅ Successfully authenticated and navigated to:', page.url());

  // Save signed-in state
  await page.context().storageState({ path: authFile });
});

