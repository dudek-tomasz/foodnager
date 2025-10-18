-- migration: disable_all_policies
-- description: drops all rls policies from all tables
-- tables affected: units, tags, products, user_products, recipes, recipe_ingredients, recipe_tags, cooking_history
-- notes: rls remains enabled on tables, but all policies are removed - effectively blocking all access until new policies are added

-- ============================================================================
-- drop all policies from units table
-- ============================================================================

drop policy if exists "units: anon users can read all units" on public.units;
drop policy if exists "units: authenticated users can read all units" on public.units;

-- ============================================================================
-- drop all policies from tags table
-- ============================================================================

drop policy if exists "tags: anon users can read all tags" on public.tags;
drop policy if exists "tags: authenticated users can read all tags" on public.tags;

-- ============================================================================
-- drop all policies from products table
-- ============================================================================

drop policy if exists "products: anon users can read global products" on public.products;
drop policy if exists "products: authenticated users can read global and own products" on public.products;
drop policy if exists "products: authenticated users can create own products" on public.products;
drop policy if exists "products: authenticated users can update own products" on public.products;
drop policy if exists "products: authenticated users can delete own products" on public.products;

-- ============================================================================
-- drop all policies from user_products table
-- ============================================================================

drop policy if exists "user_products: authenticated users can read own products" on public.user_products;
drop policy if exists "user_products: authenticated users can insert own products" on public.user_products;
drop policy if exists "user_products: authenticated users can update own products" on public.user_products;
drop policy if exists "user_products: authenticated users can delete own products" on public.user_products;

-- ============================================================================
-- drop all policies from recipes table
-- ============================================================================

drop policy if exists "recipes: anon users can read all recipes" on public.recipes;
drop policy if exists "recipes: authenticated users can read all recipes" on public.recipes;
drop policy if exists "recipes: authenticated users can create own recipes" on public.recipes;
drop policy if exists "recipes: authenticated users can update own recipes" on public.recipes;
drop policy if exists "recipes: authenticated users can delete own recipes" on public.recipes;

-- ============================================================================
-- drop all policies from recipe_ingredients table
-- ============================================================================

drop policy if exists "recipe_ingredients: anon users can read all ingredients" on public.recipe_ingredients;
drop policy if exists "recipe_ingredients: authenticated users can read all ingredients" on public.recipe_ingredients;
drop policy if exists "recipe_ingredients: authenticated users can insert for own recipes" on public.recipe_ingredients;
drop policy if exists "recipe_ingredients: authenticated users can update for own recipes" on public.recipe_ingredients;
drop policy if exists "recipe_ingredients: authenticated users can delete from own recipes" on public.recipe_ingredients;

-- ============================================================================
-- drop all policies from recipe_tags table
-- ============================================================================

drop policy if exists "recipe_tags: anon users can read all tags" on public.recipe_tags;
drop policy if exists "recipe_tags: authenticated users can read all tags" on public.recipe_tags;
drop policy if exists "recipe_tags: authenticated users can insert for own recipes" on public.recipe_tags;
drop policy if exists "recipe_tags: authenticated users can update for own recipes" on public.recipe_tags;
drop policy if exists "recipe_tags: authenticated users can delete from own recipes" on public.recipe_tags;

-- ============================================================================
-- drop all policies from cooking_history table
-- ============================================================================

drop policy if exists "cooking_history: authenticated users can read own history" on public.cooking_history;
drop policy if exists "cooking_history: authenticated users can insert own history" on public.cooking_history;
drop policy if exists "cooking_history: authenticated users can update own history" on public.cooking_history;
drop policy if exists "cooking_history: authenticated users can delete own history" on public.cooking_history;

