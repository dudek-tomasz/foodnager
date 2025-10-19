-- migration: disable_rls_units_tags
-- description: disables row level security for units and tags tables (FOR TESTING ONLY)
-- tables affected: units, tags
-- WARNING: This removes all access control - everyone can read/modify/delete all units and tags
-- NOTE: This should NEVER be used in production

-- ============================================================================
-- disable row level security on dictionary tables
-- ============================================================================

ALTER TABLE public.units DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags DISABLE ROW LEVEL SECURITY;

