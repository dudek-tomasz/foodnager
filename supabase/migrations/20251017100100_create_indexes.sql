-- migration: create_indexes
-- description: creates performance indexes on all tables
-- tables affected: products, user_products, recipes, recipe_ingredients, recipe_tags, cooking_history
-- notes: includes indexes for foreign keys, full-text search, and commonly queried columns

-- ============================================================================
-- indexes on foreign keys
-- ============================================================================

-- products table indexes
create index products_user_id_idx on public.products (user_id);

-- user_products table indexes
create index user_products_user_id_idx on public.user_products (user_id);
create index user_products_product_id_idx on public.user_products (product_id);
create index user_products_unit_id_idx on public.user_products (unit_id);

-- recipes table indexes
create index recipes_user_id_idx on public.recipes (user_id);

-- recipe_ingredients table indexes
create index recipe_ingredients_recipe_id_idx on public.recipe_ingredients (recipe_id);
create index recipe_ingredients_product_id_idx on public.recipe_ingredients (product_id);
create index recipe_ingredients_unit_id_idx on public.recipe_ingredients (unit_id);

-- recipe_tags table indexes
create index recipe_tags_recipe_id_idx on public.recipe_tags (recipe_id);
create index recipe_tags_tag_id_idx on public.recipe_tags (tag_id);

-- cooking_history table indexes
create index cooking_history_user_id_idx on public.cooking_history (user_id);
create index cooking_history_recipe_id_idx on public.cooking_history (recipe_id);

-- ============================================================================
-- custom indexes for performance optimization
-- ============================================================================

-- index on expiry_date for quickly filtering expired products
create index user_products_expiry_date_idx on public.user_products (expiry_date);

comment on index user_products_expiry_date_idx is 'enables fast filtering of products by expiration date';

-- index on recipe source for filtering recipes by origin
create index recipes_source_idx on public.recipes (source);

comment on index recipes_source_idx is 'enables fast filtering of recipes by source (user/api/ai)';

-- full-text search index on product names
create index products_name_fts_idx on public.products using gin (to_tsvector('english', name));

comment on index products_name_fts_idx is 'enables full-text search on product names';

-- full-text search index on recipe titles and instructions
create index recipes_fts_idx on public.recipes using gin (to_tsvector('english', title || ' ' || coalesce(description, '') || ' ' || instructions));

comment on index recipes_fts_idx is 'enables full-text search on recipe title, description, and instructions';

-- case-insensitive index on product names for uniqueness checks at api level
create index products_lower_name_idx on public.products (lower(name));

comment on index products_lower_name_idx is 'enables fast case-insensitive product name lookups for uniqueness validation';

-- index on cooking_history timestamp for chronological queries
create index cooking_history_cooked_at_idx on public.cooking_history (cooked_at desc);

comment on index cooking_history_cooked_at_idx is 'enables fast chronological queries on cooking history';

