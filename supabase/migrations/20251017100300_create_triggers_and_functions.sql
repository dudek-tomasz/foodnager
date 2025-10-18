-- migration: create_triggers_and_functions
-- description: creates database functions and triggers for automated behavior
-- tables affected: recipes
-- notes: includes trigger for auto-updating updated_at timestamp on recipes

-- ============================================================================
-- function to automatically update updated_at timestamp
-- ============================================================================

-- this function will be called by triggers to update the updated_at column
create or replace function public.update_updated_at_column()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.update_updated_at_column is 'automatically updates the updated_at column to current timestamp';

-- ============================================================================
-- trigger for recipes table
-- ============================================================================

-- trigger to automatically update updated_at on recipes table modifications
create trigger recipes_update_updated_at
  before update on public.recipes
  for each row
  execute function public.update_updated_at_column();

comment on trigger recipes_update_updated_at on public.recipes is 'automatically updates updated_at timestamp whenever a recipe is modified';

