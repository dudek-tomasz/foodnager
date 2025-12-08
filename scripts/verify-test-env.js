#!/usr/bin/env node

/**
 * Verify E2E test environment configuration
 *
 * This script checks if all required environment variables are set
 * for running E2E tests locally or in CI.
 */

import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.test
const envPath = resolve(__dirname, "../.env.test");
config({ path: envPath });

console.log("🔍 Verifying E2E test environment configuration...\n");

// Check if .env.test exists
if (!existsSync(envPath)) {
  console.error("❌ .env.test file not found!");
  console.error("   Create it in the project root with required variables.");
  console.error("   See e2e/README.md for setup instructions.\n");
  process.exit(1);
}

console.log("✓ .env.test file exists\n");

// Required environment variables
const requiredVars = [
  {
    name: "SUPABASE_URL",
    description: "Supabase project URL",
    example: "https://xxxxx.supabase.co",
  },
  {
    name: "SUPABASE_KEY",
    description: "Supabase anon/public key",
    example: "eyJhbGc...",
  },
  {
    name: "SUPABASE_SERVICE_ROLE_KEY",
    description: "Supabase service role key (admin)",
    example: "eyJhbGc...",
  },
  {
    name: "E2E_USERNAME",
    description: "Test user email",
    example: "test@example.com",
  },
  {
    name: "E2E_PASSWORD",
    description: "Test user password",
    example: "TestPassword123!",
  },
  {
    name: "E2E_USERNAME_ID",
    description: "Test user UUID",
    example: "00000000-0000-0000-0000-000000000000",
  },
  {
    name: "PLAYWRIGHT_TEST_BASE_URL",
    description: "Base URL for tests",
    example: "http://localhost:3000",
    optional: true,
  },
];

let hasErrors = false;
let hasWarnings = false;

console.log("Checking environment variables:\n");

for (const variable of requiredVars) {
  const value = process.env[variable.name];
  const isSet = value && value.trim() !== "";

  if (isSet) {
    // Mask sensitive values
    const displayValue =
      variable.name.includes("KEY") || variable.name.includes("PASSWORD")
        ? "***" + value.slice(-4)
        : value.length > 50
          ? value.slice(0, 20) + "..." + value.slice(-10)
          : value;

    console.log(`✓ ${variable.name}`);
    console.log(`  Value: ${displayValue}`);
  } else {
    if (variable.optional) {
      console.log(`⚠ ${variable.name} (optional)`);
      console.log(`  Not set, using default: ${variable.example}`);
      hasWarnings = true;
    } else {
      console.log(`✗ ${variable.name} (required)`);
      console.log(`  Description: ${variable.description}`);
      console.log(`  Example: ${variable.example}`);
      hasErrors = true;
    }
  }
  console.log();
}

// Validation checks
console.log("Running validation checks:\n");

// Check SUPABASE_URL format
const supabaseUrl = process.env.SUPABASE_URL;
if (supabaseUrl && !supabaseUrl.startsWith("https://")) {
  console.log("⚠ SUPABASE_URL should start with https://");
  hasWarnings = true;
}

// Check E2E_USERNAME_ID format (UUID)
const testUserId = process.env.E2E_USERNAME_ID;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if (testUserId && !uuidRegex.test(testUserId)) {
  console.log("⚠ E2E_USERNAME_ID should be a valid UUID");
  hasWarnings = true;
}

// Check E2E_USERNAME format (email)
const testUsername = process.env.E2E_USERNAME;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (testUsername && !emailRegex.test(testUsername)) {
  console.log("⚠ E2E_USERNAME should be a valid email address");
  hasWarnings = true;
}

// Check SUPABASE_SERVICE_ROLE_KEY is different from SUPABASE_KEY
const supabaseKey = process.env.SUPABASE_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (supabaseKey && serviceRoleKey && supabaseKey === serviceRoleKey) {
  console.log("⚠ SUPABASE_SERVICE_ROLE_KEY should be different from SUPABASE_KEY");
  console.log("  Make sure you're using the service_role key, not anon key");
  hasWarnings = true;
}

if (!hasWarnings && !hasErrors) {
  console.log("✓ All validation checks passed\n");
}

// Summary
console.log("─".repeat(60));
console.log();

if (hasErrors) {
  console.error("❌ Configuration is incomplete!");
  console.error("   Fix the errors above and try again.");
  console.error("   See e2e/README.md for setup instructions.\n");
  process.exit(1);
}

if (hasWarnings) {
  console.log("⚠️  Configuration has warnings");
  console.log("   Review the warnings above.");
  console.log("   Tests may still work, but some issues were detected.\n");
  process.exit(0);
}

console.log("✅ E2E test environment is properly configured!");
console.log("   You can now run: npm run test:e2e\n");
process.exit(0);
