-- migration: disable_rls_recipes
-- description: disables row level security for recipes-related tables (FOR TESTING ONLY)
-- tables affected: recipes, recipe_ingredients, recipe_tags
-- WARNING: This removes all access control - everyone can read/modify/delete all recipes
-- NOTE: This should NEVER be used in production

-- ============================================================================
-- disable row level security on recipes tables
-- ============================================================================

ALTER TABLE public.recipes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_ingredients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_tags DISABLE ROW LEVEL SECURITY;

