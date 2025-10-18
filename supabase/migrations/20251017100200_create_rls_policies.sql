-- migration: create_rls_policies
-- description: creates row level security policies for all tables
-- tables affected: units, tags, products, user_products, recipes, recipe_ingredients, recipe_tags, cooking_history
-- notes: granular policies - one per operation per role (anon/authenticated) for fine-grained access control

-- ============================================================================
-- units table policies (public read-only dictionary)
-- ============================================================================

-- anonymous users can read all units
create policy "units: anon users can read all units"
  on public.units
  for select
  to anon
  using (true);

-- authenticated users can read all units
create policy "units: authenticated users can read all units"
  on public.units
  for select
  to authenticated
  using (true);

-- ============================================================================
-- tags table policies (public read-only dictionary)
-- ============================================================================

-- anonymous users can read all tags
create policy "tags: anon users can read all tags"
  on public.tags
  for select
  to anon
  using (true);

-- authenticated users can read all tags
create policy "tags: authenticated users can read all tags"
  on public.tags
  for select
  to authenticated
  using (true);

-- ============================================================================
-- products table policies
-- ============================================================================

-- anonymous users can read all global products (user_id is null)
create policy "products: anon users can read global products"
  on public.products
  for select
  to anon
  using (user_id is null);

-- authenticated users can read global products and their own private products
create policy "products: authenticated users can read global and own products"
  on public.products
  for select
  to authenticated
  using (user_id is null or auth.uid() = user_id);

-- authenticated users can create new private products (setting user_id to their own id)
create policy "products: authenticated users can create own products"
  on public.products
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- authenticated users can update only their own private products
create policy "products: authenticated users can update own products"
  on public.products
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- authenticated users can delete only their own private products
create policy "products: authenticated users can delete own products"
  on public.products
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- user_products table policies (virtual fridge)
-- ============================================================================

-- authenticated users can read only their own fridge items
create policy "user_products: authenticated users can read own products"
  on public.user_products
  for select
  to authenticated
  using (auth.uid() = user_id);

-- authenticated users can add products to their own fridge
create policy "user_products: authenticated users can insert own products"
  on public.user_products
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- authenticated users can update only their own fridge items
create policy "user_products: authenticated users can update own products"
  on public.user_products
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- authenticated users can delete only their own fridge items
create policy "user_products: authenticated users can delete own products"
  on public.user_products
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- recipes table policies
-- ============================================================================

-- anonymous users can read all recipes
create policy "recipes: anon users can read all recipes"
  on public.recipes
  for select
  to anon
  using (true);

-- authenticated users can read all recipes
create policy "recipes: authenticated users can read all recipes"
  on public.recipes
  for select
  to authenticated
  using (true);

-- authenticated users can create their own recipes
create policy "recipes: authenticated users can create own recipes"
  on public.recipes
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- authenticated users can update only their own recipes
create policy "recipes: authenticated users can update own recipes"
  on public.recipes
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- authenticated users can delete only their own recipes
create policy "recipes: authenticated users can delete own recipes"
  on public.recipes
  for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================================
-- recipe_ingredients table policies
-- ============================================================================

-- anonymous users can read all recipe ingredients
create policy "recipe_ingredients: anon users can read all ingredients"
  on public.recipe_ingredients
  for select
  to anon
  using (true);

-- authenticated users can read all recipe ingredients
create policy "recipe_ingredients: authenticated users can read all ingredients"
  on public.recipe_ingredients
  for select
  to authenticated
  using (true);

-- authenticated users can add ingredients to their own recipes only
create policy "recipe_ingredients: authenticated users can insert for own recipes"
  on public.recipe_ingredients
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- authenticated users can update ingredients of their own recipes only
create policy "recipe_ingredients: authenticated users can update for own recipes"
  on public.recipe_ingredients
  for update
  to authenticated
  using (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
      and recipes.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- authenticated users can delete ingredients from their own recipes only
create policy "recipe_ingredients: authenticated users can delete from own recipes"
  on public.recipe_ingredients
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_ingredients.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- ============================================================================
-- recipe_tags table policies
-- ============================================================================

-- anonymous users can read all recipe tags
create policy "recipe_tags: anon users can read all tags"
  on public.recipe_tags
  for select
  to anon
  using (true);

-- authenticated users can read all recipe tags
create policy "recipe_tags: authenticated users can read all tags"
  on public.recipe_tags
  for select
  to authenticated
  using (true);

-- authenticated users can add tags to their own recipes only
create policy "recipe_tags: authenticated users can insert for own recipes"
  on public.recipe_tags
  for insert
  to authenticated
  with check (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_tags.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- authenticated users can update tags of their own recipes only
create policy "recipe_tags: authenticated users can update for own recipes"
  on public.recipe_tags
  for update
  to authenticated
  using (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_tags.recipe_id
      and recipes.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_tags.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- authenticated users can delete tags from their own recipes only
create policy "recipe_tags: authenticated users can delete from own recipes"
  on public.recipe_tags
  for delete
  to authenticated
  using (
    exists (
      select 1 from public.recipes
      where recipes.id = recipe_tags.recipe_id
      and recipes.user_id = auth.uid()
    )
  );

-- ============================================================================
-- cooking_history table policies
-- ============================================================================

-- authenticated users can read only their own cooking history
create policy "cooking_history: authenticated users can read own history"
  on public.cooking_history
  for select
  to authenticated
  using (auth.uid() = user_id);

-- authenticated users can add entries to their own cooking history
create policy "cooking_history: authenticated users can insert own history"
  on public.cooking_history
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- authenticated users can update only their own cooking history
create policy "cooking_history: authenticated users can update own history"
  on public.cooking_history
  for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- authenticated users can delete only their own cooking history
create policy "cooking_history: authenticated users can delete own history"
  on public.cooking_history
  for delete
  to authenticated
  using (auth.uid() = user_id);

