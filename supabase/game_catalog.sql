-- Public SWGoH catalog: characters, ships, farms, relics, and assault battles.
-- Run this in the Supabase SQL editor. Safe to run again.
--
-- The anon/publishable key can only read these tables. It cannot insert,
-- update, delete, or run SQL. Load rows with `npm run seed:catalog`, which
-- uses the secret key outside the browser.
--
-- REST (PostgREST) is the API, for example:
--   GET /rest/v1/characters?select=id,name,alignment,sources&order=name.asc
--   GET /rest/v1/farms?collection=eq.catalog&select=event,category,characters,ships
--   GET /rest/v1/relic_level_costs?select=level,costs&order=level.asc

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

revoke all on function public.touch_updated_at() from public, anon, authenticated;

create table if not exists public.units (
  id text primary key,
  name text not null,
  kind text not null,
  alignment text,
  icon text not null,
  sources jsonb not null default '[]'::jsonb,
  sort_order integer not null,
  updated_at timestamptz not null default now(),
  constraint units_kind_check check (kind in ('character', 'ship')),
  constraint units_sources_array check (jsonb_typeof(sources) = 'array')
);

create index if not exists units_kind_name_idx on public.units (kind, name);

create table if not exists public.farms (
  id text primary key,
  collection text not null,
  sort_order integer not null,
  event text not null,
  category text not null,
  reward jsonb not null,
  characters jsonb not null,
  ships jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  constraint farms_collection_check check (collection in ('priority', 'catalog')),
  constraint farms_collection_order_key unique (collection, sort_order),
  constraint farms_characters_array check (jsonb_typeof(characters) = 'array'),
  constraint farms_ships_array check (jsonb_typeof(ships) = 'array')
);

create index if not exists farms_collection_order_idx on public.farms (collection, sort_order);

create table if not exists public.relic_materials (
  id text primary key,
  name text not null,
  icon text not null,
  material_group text not null,
  sort_order integer not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.relic_level_costs (
  level integer primary key,
  costs jsonb not null,
  updated_at timestamptz not null default now(),
  constraint relic_level_costs_range check (level between 1 and 10),
  constraint relic_level_costs_object check (jsonb_typeof(costs) = 'object')
);

create table if not exists public.assault_battles (
  id text primary key,
  event_key text not null,
  name text not null,
  summary text not null default '',
  format text not null default '',
  sort_order integer not null,
  payload jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.assault_battle_teams (
  battle_id text primary key,
  teams jsonb not null,
  updated_at timestamptz not null default now(),
  constraint assault_battle_teams_array check (jsonb_typeof(teams) = 'array')
);

create table if not exists public.recommended_squads (
  event text primary key,
  units jsonb not null,
  source text,
  source_label text,
  caveat text,
  updated_at timestamptz not null default now(),
  constraint recommended_squads_units_array check (jsonb_typeof(units) = 'array')
);

create table if not exists public.alternate_farming_sources (
  unit_id text primary key,
  sources jsonb not null,
  updated_at timestamptz not null default now(),
  constraint alternate_farming_sources_array check (jsonb_typeof(sources) = 'array')
);

create table if not exists public.store_currencies (
  store_name text primary key,
  currency text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.pool_requirements (
  event text primary key,
  squad_count integer not null,
  label text not null,
  updated_at timestamptz not null default now(),
  constraint pool_requirements_count_check check (squad_count between 1 and 7)
);

create table if not exists public.catalog_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create or replace view public.characters
with (security_invoker = true) as
  select id, name, alignment, icon, sources, sort_order, updated_at
  from public.units
  where kind = 'character';

create or replace view public.ships
with (security_invoker = true) as
  select id, name, alignment, icon, sources, sort_order, updated_at
  from public.units
  where kind = 'ship';

do $$
declare
  catalog_table text;
begin
  foreach catalog_table in array array[
    'units',
    'farms',
    'relic_materials',
    'relic_level_costs',
    'assault_battles',
    'assault_battle_teams',
    'recommended_squads',
    'alternate_farming_sources',
    'store_currencies',
    'pool_requirements',
    'catalog_settings'
  ]
  loop
    execute format('alter table public.%I enable row level security', catalog_table);
    execute format('alter table public.%I force row level security', catalog_table);
    execute format('revoke all on table public.%I from public, anon, authenticated', catalog_table);
    execute format('grant select on table public.%I to anon, authenticated', catalog_table);
    execute format('drop trigger if exists %I on public.%I', catalog_table || '_touch_updated_at', catalog_table);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.touch_updated_at()',
      catalog_table || '_touch_updated_at',
      catalog_table
    );
  end loop;
end $$;

revoke all on table public.characters from public, anon, authenticated;
revoke all on table public.ships from public, anon, authenticated;
grant select on table public.characters to anon, authenticated;
grant select on table public.ships to anon, authenticated;

drop policy if exists units_public_read on public.units;
create policy units_public_read on public.units for select to anon, authenticated using (true);

drop policy if exists farms_public_read on public.farms;
create policy farms_public_read on public.farms for select to anon, authenticated using (true);

drop policy if exists relic_materials_public_read on public.relic_materials;
create policy relic_materials_public_read on public.relic_materials for select to anon, authenticated using (true);

drop policy if exists relic_level_costs_public_read on public.relic_level_costs;
create policy relic_level_costs_public_read on public.relic_level_costs for select to anon, authenticated using (true);

drop policy if exists assault_battles_public_read on public.assault_battles;
create policy assault_battles_public_read on public.assault_battles for select to anon, authenticated using (true);

drop policy if exists assault_battle_teams_public_read on public.assault_battle_teams;
create policy assault_battle_teams_public_read on public.assault_battle_teams for select to anon, authenticated using (true);

drop policy if exists recommended_squads_public_read on public.recommended_squads;
create policy recommended_squads_public_read on public.recommended_squads for select to anon, authenticated using (true);

drop policy if exists alternate_farming_sources_public_read on public.alternate_farming_sources;
create policy alternate_farming_sources_public_read on public.alternate_farming_sources for select to anon, authenticated using (true);

drop policy if exists store_currencies_public_read on public.store_currencies;
create policy store_currencies_public_read on public.store_currencies for select to anon, authenticated using (true);

drop policy if exists pool_requirements_public_read on public.pool_requirements;
create policy pool_requirements_public_read on public.pool_requirements for select to anon, authenticated using (true);

drop policy if exists catalog_settings_public_read on public.catalog_settings;
create policy catalog_settings_public_read on public.catalog_settings for select to anon, authenticated using (true);
