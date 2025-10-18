-- migration: seed_initial_data
-- description: populates dictionary tables with initial data
-- tables affected: units, tags
-- notes: includes common measurement units and popular recipe tags in polish

-- ============================================================================
-- seed units table with common measurement units
-- ============================================================================

insert into public.units (name, abbreviation) values
  -- weight units
  ('kilogram', 'kg'),
  ('gram', 'g'),
  ('miligram', 'mg'),
  
  -- volume units
  ('litr', 'l'),
  ('mililitr', 'ml'),
  ('łyżka', 'łyż'),
  ('łyżeczka', 'łyżecz'),
  ('szklanka', 'szkl'),
  ('garść', 'garść'),
  
  -- count units
  ('sztuka', 'szt'),
  ('opakowanie', 'opak'),
  ('pęczek', 'pęcz'),
  ('plaster', 'plast'),
  ('ząbek', 'ząb'),
  ('główka', 'głów'),
  
  -- other
  ('szczypta', 'szcz'),
  ('do smaku', 'd.s.')
on conflict (name) do nothing;

-- ============================================================================
-- seed tags table with common recipe categories
-- ============================================================================

insert into public.tags (name) values
  -- dietary preferences
  ('wegańskie'),
  ('wegetariańskie'),
  ('bezglutenowe'),
  ('niskokaloryczne'),
  ('wysokobiałkowe'),
  
  -- meal types
  ('śniadanie'),
  ('obiad'),
  ('kolacja'),
  ('przekąska'),
  ('deser'),
  
  -- cuisine types
  ('kuchnia polska'),
  ('kuchnia włoska'),
  ('kuchnia azjatycka'),
  ('kuchnia meksykańska'),
  ('kuchnia śródziemnomorska'),
  
  -- cooking characteristics
  ('szybkie'),
  ('łatwe'),
  ('dla początkujących'),
  ('jednogarnkowe'),
  ('na imprezę'),
  ('dla dzieci'),
  ('romantyczna kolacja'),
  
  -- seasonal
  ('letnie'),
  ('zimowe'),
  ('jesienne'),
  ('wiosenne'),
  
  -- dietary restrictions
  ('bez laktozy'),
  ('bez orzechów'),
  ('paleo'),
  ('keto'),
  ('low carb')
on conflict (name) do nothing;

