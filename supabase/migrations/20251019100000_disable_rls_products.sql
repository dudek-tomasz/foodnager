-- migration: disable_rls_products
-- description: disables row level security for products table (FOR TESTING ONLY)
-- tables affected: products
-- WARNING: This removes all access control - everyone can read/modify/delete all products
-- NOTE: This should NEVER be used in production

-- ============================================================================
-- disable row level security on products table
-- ============================================================================

ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;

