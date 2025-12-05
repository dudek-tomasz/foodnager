-- migration: seed_test_fridge_data
-- description: adds test user, products and fridge items for development
-- tables affected: auth.users, products, user_products
-- notes: temporary test data for development purposes

-- ============================================================================
-- enable pgcrypto extension for password hashing
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================================
-- create test user in auth.users
-- ============================================================================

-- test user id (matches DEFAULT_USER_ID from src/db/supabase.client.ts)
insert into auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role,
  created_at,
  updated_at
) values (
  '0bdb5b8e-a145-4d13-9f5c-921c5b8d0db9',
  '00000000-0000-0000-0000-000000000000',
  'test@foodnager.local',
  extensions.crypt('testpassword123', extensions.gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  'authenticated',
  'authenticated',
  now(),
  now()
) on conflict (id) do nothing;

-- ============================================================================
-- seed products table with test products
-- ============================================================================

insert into public.products (user_id, name) values
  (null, 'pomidor'),
  (null, 'makaron'),
  (null, 'mięso mielone')
on conflict do nothing;

-- ============================================================================
-- seed user_products (virtual fridge) for default test user
-- ============================================================================

-- test user id (matches DEFAULT_USER_ID from src/db/supabase.client.ts)
do $$
declare
  test_user_id uuid := '0bdb5b8e-a145-4d13-9f5c-921c5b8d0db9';
  pomidor_id bigint;
  makaron_id bigint;
  mieso_id bigint;
  szt_unit_id bigint;
  g_unit_id bigint;
  kg_unit_id bigint;
begin
  -- get product ids
  select id into pomidor_id from public.products where name = 'pomidor' and user_id is null limit 1;
  select id into makaron_id from public.products where name = 'makaron' and user_id is null limit 1;
  select id into mieso_id from public.products where name = 'mięso mielone' and user_id is null limit 1;
  
  -- get unit ids
  select id into szt_unit_id from public.units where abbreviation = 'szt' limit 1;
  select id into g_unit_id from public.units where abbreviation = 'g' limit 1;
  select id into kg_unit_id from public.units where abbreviation = 'kg' limit 1;
  
  -- add products to virtual fridge
  insert into public.user_products (user_id, product_id, quantity, unit_id, expiry_date) values
    (test_user_id, pomidor_id, 5, szt_unit_id, current_date + interval '7 days'),
    (test_user_id, makaron_id, 500, g_unit_id, current_date + interval '180 days'),
    (test_user_id, mieso_id, 0.5, kg_unit_id, current_date + interval '3 days')
  on conflict do nothing;
end $$;

