-- Saved SWGoH accounts for the signed-in user.
-- Run this in the Supabase SQL editor. Safe to run again.
--
-- The anon/publishable key used by the app cannot send arbitrary SQL.
-- PostgREST only allows the grants below, and row level security
-- limits every row to auth.uid(). Dropping a table or database is not
-- possible through that key.

create table if not exists public.player_accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  description text not null default '',
  ally_code text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_accounts_name_length check (char_length(btrim(name)) between 1 and 80),
  constraint player_accounts_description_length check (char_length(description) <= 500),
  constraint player_accounts_ally_code_format check (ally_code ~ '^\d{9}$'),
  constraint player_accounts_user_ally_code_key unique (user_id, ally_code)
);

create index if not exists player_accounts_user_name_idx
  on public.player_accounts (user_id, name);

alter table public.player_accounts enable row level security;
alter table public.player_accounts force row level security;

revoke all on table public.player_accounts from public, anon, authenticated;
grant select, insert, update, delete on table public.player_accounts to authenticated;

-- Ownership and timestamps are assigned in the database. A forged request
-- that tries to set them is rejected before the row is written.
revoke insert (id, user_id, created_at, updated_at),
       update (id, user_id, created_at, updated_at)
  on table public.player_accounts
  from public, anon, authenticated;

drop policy if exists player_accounts_select_own on public.player_accounts;
create policy player_accounts_select_own
  on public.player_accounts
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists player_accounts_insert_own on public.player_accounts;
create policy player_accounts_insert_own
  on public.player_accounts
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists player_accounts_update_own on public.player_accounts;
create policy player_accounts_update_own
  on public.player_accounts
  for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists player_accounts_delete_own on public.player_accounts;
create policy player_accounts_delete_own
  on public.player_accounts
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create or replace function public.protect_player_account_row()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  if tg_op = 'INSERT' then
    if (
      select count(*)
      from public.player_accounts
      where user_id = auth.uid()
    ) >= 50 then
      raise exception 'Account limit reached';
    end if;

    new.user_id = auth.uid();
    new.created_at = pg_catalog.now();
  else
    if new.user_id is distinct from old.user_id
       or new.id is distinct from old.id
       or new.created_at is distinct from old.created_at then
      raise exception 'Cannot change account owner';
    end if;
    new.user_id = old.user_id;
    new.id = old.id;
    new.created_at = old.created_at;
  end if;

  new.updated_at = pg_catalog.now();
  return new;
end;
$$;

drop trigger if exists player_accounts_protect_row on public.player_accounts;
create trigger player_accounts_protect_row
  before insert or update on public.player_accounts
  for each row
  execute function public.protect_player_account_row();

drop trigger if exists player_accounts_touch_updated_at on public.player_accounts;
drop function if exists public.touch_player_account_updated_at();

-- The signed-in role must be allowed to execute this, or insert and update
-- fail with "permission denied for function". PostgREST does not expose
-- trigger functions as RPC. Anon stays blocked.
revoke all on function public.protect_player_account_row() from public, anon;
grant execute on function public.protect_player_account_row() to authenticated;
