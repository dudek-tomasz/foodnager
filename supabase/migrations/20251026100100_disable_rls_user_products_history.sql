-- migration: disable_rls_user_products_history
-- description: disables row level security for user_products and cooking_history tables (FOR TESTING ONLY)
-- tables affected: user_products, cooking_history
-- WARNING: This removes all access control - everyone can read/modify/delete all user products and cooking history
-- NOTE: This should NEVER be used in production

-- ============================================================================
-- disable row level security on user_products and cooking_history tables
-- ============================================================================

ALTER TABLE public.user_products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.cooking_history DISABLE ROW LEVEL SECURITY;

