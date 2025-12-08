/**
 * Database cleanup utilities for E2E tests
 *
 * These helpers allow individual tests to clean up their own data
 * during test execution (not just at global teardown)
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/db/database.types";

/**
 * Create a Supabase admin client for test cleanup
 * Uses service role key to bypass RLS policies
 */
export function createTestSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env.test for database cleanup");
  }

  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Clean all test data for a specific user
 * Useful for resetting state between test runs
 *
 * @param userId - The UUID of the test user
 */
export async function cleanupUserData(userId: string) {
  const supabase = createTestSupabaseClient();

  console.log(`🧹 Cleaning up data for user: ${userId}`);

  try {
    // Clean in reverse order of foreign key dependencies

    // 1. Cooking history
    await supabase.from("cooking_history").delete().eq("user_id", userId);

    // 2. User products (fridge)
    await supabase.from("user_products").delete().eq("user_id", userId);

    // 3. Get user recipes
    const { data: recipes } = await supabase.from("recipes").select("id").eq("user_id", userId);

    if (recipes && recipes.length > 0) {
      const recipeIds = recipes.map((r) => r.id);

      // 4. Recipe tags
      await supabase.from("recipe_tags").delete().in("recipe_id", recipeIds);

      // 5. Recipe ingredients
      await supabase.from("recipe_ingredients").delete().in("recipe_id", recipeIds);

      // 6. Recipes
      await supabase.from("recipes").delete().eq("user_id", userId);
    }

    // 7. User's private products
    await supabase.from("products").delete().eq("user_id", userId);

    console.log("✅ User data cleaned successfully");
  } catch (error) {
    console.error("❌ Error cleaning user data:", error);
    throw error;
  }
}

/**
 * Clean only products created by test user
 * Lighter cleanup for product-specific tests
 *
 * @param userId - The UUID of the test user
 */
export async function cleanupUserProducts(userId: string) {
  const supabase = createTestSupabaseClient();

  console.log(`🧹 Cleaning up products for user: ${userId}`);

  try {
    // Clean user_products first (foreign key dependency)
    await supabase.from("user_products").delete().eq("user_id", userId);

    // Clean private products
    const { error } = await supabase.from("products").delete().eq("user_id", userId);

    if (error) {
      throw error;
    }

    console.log("✅ User products cleaned successfully");
  } catch (error) {
    console.error("❌ Error cleaning user products:", error);
    throw error;
  }
}

/**
 * Clean only fridge items for test user
 * Useful for fridge-specific tests
 *
 * @param userId - The UUID of the test user
 */
export async function cleanupFridge(userId: string) {
  const supabase = createTestSupabaseClient();

  console.log(`🧹 Cleaning up fridge for user: ${userId}`);

  try {
    const { error } = await supabase.from("user_products").delete().eq("user_id", userId);

    if (error) {
      throw error;
    }

    console.log("✅ Fridge cleaned successfully");
  } catch (error) {
    console.error("❌ Error cleaning fridge:", error);
    throw error;
  }
}

/**
 * Clean only recipes for test user
 * Useful for recipe-specific tests
 *
 * @param userId - The UUID of the test user
 */
export async function cleanupRecipes(userId: string) {
  const supabase = createTestSupabaseClient();

  console.log(`🧹 Cleaning up recipes for user: ${userId}`);

  try {
    // Get user recipes
    const { data: recipes } = await supabase.from("recipes").select("id").eq("user_id", userId);

    if (recipes && recipes.length > 0) {
      const recipeIds = recipes.map((r) => r.id);

      // Clean recipe tags
      await supabase.from("recipe_tags").delete().in("recipe_id", recipeIds);

      // Clean recipe ingredients
      await supabase.from("recipe_ingredients").delete().in("recipe_id", recipeIds);

      // Clean recipes
      await supabase.from("recipes").delete().eq("user_id", userId);
    }

    console.log("✅ Recipes cleaned successfully");
  } catch (error) {
    console.error("❌ Error cleaning recipes:", error);
    throw error;
  }
}

/**
 * Clean only cooking history for test user
 * Useful for history-specific tests
 *
 * @param userId - The UUID of the test user
 */
export async function cleanupCookingHistory(userId: string) {
  const supabase = createTestSupabaseClient();

  console.log(`🧹 Cleaning up cooking history for user: ${userId}`);

  try {
    const { error } = await supabase.from("cooking_history").delete().eq("user_id", userId);

    if (error) {
      throw error;
    }

    console.log("✅ Cooking history cleaned successfully");
  } catch (error) {
    console.error("❌ Error cleaning cooking history:", error);
    throw error;
  }
}
