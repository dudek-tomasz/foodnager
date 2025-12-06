import { test as teardown } from '@playwright/test';
import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/db/database.types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.test file
config({ path: resolve(__dirname, '../.env.test') });

/**
 * Global teardown for E2E tests
 * Cleans up test data from Supabase database after all tests complete
 * 
 * This runs AFTER all test projects have completed
 */
teardown('cleanup database', async () => {
  console.log('🧹 Starting E2E database cleanup...');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const testUserId = process.env.E2E_TEST_USER_ID;

  // Validate required environment variables
  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(
      '⚠️  Skipping database cleanup: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not configured in .env.test'
    );
    return;
  }

  if (!testUserId) {
    console.warn(
      '⚠️  Skipping database cleanup: E2E_TEST_USER_ID not configured in .env.test'
    );
    return;
  }

  // Create Supabase admin client (bypasses RLS)
  const supabase = createClient<Database>(
    supabaseUrl,
    supabaseServiceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );

  try {
    // Clean up in reverse order of foreign key dependencies
    // This prevents foreign key constraint violations

    console.log('  ➜ Cleaning cooking_history...');
    const { error: historyError, count: historyCount } = await supabase
      .from('cooking_history')
      .delete({ count: 'exact' })
      .eq('user_id', testUserId);

    if (historyError) {
      console.error('  ✗ Error cleaning cooking_history:', historyError.message);
    } else {
      console.log(`  ✓ Deleted ${historyCount ?? 0} cooking_history records`);
    }

    console.log('  ➜ Cleaning user_products (fridge)...');
    const { error: fridgeError, count: fridgeCount } = await supabase
      .from('user_products')
      .delete({ count: 'exact' })
      .eq('user_id', testUserId);

    if (fridgeError) {
      console.error('  ✗ Error cleaning user_products:', fridgeError.message);
    } else {
      console.log(`  ✓ Deleted ${fridgeCount ?? 0} user_products records`);
    }

    // Get user's recipes to clean up related data
    console.log('  ➜ Finding user recipes...');
    const { data: userRecipes, error: recipesQueryError } = await supabase
      .from('recipes')
      .select('id')
      .eq('user_id', testUserId);

    if (recipesQueryError) {
      console.error('  ✗ Error querying recipes:', recipesQueryError.message);
    } else if (userRecipes && userRecipes.length > 0) {
      const recipeIds = userRecipes.map((r) => r.id);
      console.log(`  ➜ Found ${recipeIds.length} recipes to clean`);

      // Clean recipe_tags
      console.log('  ➜ Cleaning recipe_tags...');
      const { error: tagsError, count: tagsCount } = await supabase
        .from('recipe_tags')
        .delete({ count: 'exact' })
        .in('recipe_id', recipeIds);

      if (tagsError) {
        console.error('  ✗ Error cleaning recipe_tags:', tagsError.message);
      } else {
        console.log(`  ✓ Deleted ${tagsCount ?? 0} recipe_tags records`);
      }

      // Clean recipe_ingredients
      console.log('  ➜ Cleaning recipe_ingredients...');
      const { error: ingredientsError, count: ingredientsCount } = await supabase
        .from('recipe_ingredients')
        .delete({ count: 'exact' })
        .in('recipe_id', recipeIds);

      if (ingredientsError) {
        console.error('  ✗ Error cleaning recipe_ingredients:', ingredientsError.message);
      } else {
        console.log(`  ✓ Deleted ${ingredientsCount ?? 0} recipe_ingredients records`);
      }

      // Clean recipes
      console.log('  ➜ Cleaning recipes...');
      const { error: recipesError, count: recipesCount } = await supabase
        .from('recipes')
        .delete({ count: 'exact' })
        .eq('user_id', testUserId);

      if (recipesError) {
        console.error('  ✗ Error cleaning recipes:', recipesError.message);
      } else {
        console.log(`  ✓ Deleted ${recipesCount ?? 0} recipes records`);
      }
    } else {
      console.log('  ➜ No user recipes found to clean');
    }

    // Clean user's private products
    console.log('  ➜ Cleaning private products...');
    const { error: productsError, count: productsCount } = await supabase
      .from('products')
      .delete({ count: 'exact' })
      .eq('user_id', testUserId);

    if (productsError) {
      console.error('  ✗ Error cleaning products:', productsError.message);
    } else {
      console.log(`  ✓ Deleted ${productsCount ?? 0} private products`);
    }

    console.log('✅ Database cleanup completed successfully');
  } catch (error) {
    console.error('❌ Database cleanup failed:', error);
    // Don't throw - we don't want to fail the entire test run if cleanup fails
    // Tests have already completed at this point
  }
});

