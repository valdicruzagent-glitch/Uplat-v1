-- Uplat demo: listings schema migration
-- Safe to re-run (idempotent). Designed for Supabase Postgres.
--
-- Adds/ensures columns:
--   country, status, category, beds, baths, area_m2, area_ha
-- Also adds:
--   meta jsonb (used to tag demo rows for wipe-and-reseed)
--
-- Note: DDL requires elevated DB rights (not anon key).

begin;

-- Create table if missing (minimal viable schema for the app)
create table if not exists public.listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  price_usd numeric null,
  type text not null default 'house',
  mode text not null default 'buy',
  city text not null,
  country text null,
  status text null default 'active',
  category text null,
  beds integer null,
  baths integer null,
  area_m2 numeric null,
  area_ha numeric null,
  lat double precision not null,
  lng double precision not null,
  cover_image_url text null,
  description text null,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Add missing columns (if the table already existed)
alter table public.listings add column if not exists country text;
alter table public.listings add column if not exists status text;
alter table public.listings add column if not exists category text;
alter table public.listings add column if not exists beds integer;
alter table public.listings add column if not exists baths integer;
alter table public.listings add column if not exists area_m2 numeric;
alter table public.listings add column if not exists area_ha numeric;
alter table public.listings add column if not exists cover_image_url text;
alter table public.listings add column if not exists description text;
alter table public.listings add column if not exists meta jsonb not null default '{}'::jsonb;

-- If any early enum-like CHECK constraints exist from prior prototypes, drop them.
-- (We keep these fields flexible for seed + future iterations.)
alter table public.listings drop constraint if exists listings_status_check;
alter table public.listings drop constraint if exists listings_type_check;
alter table public.listings drop constraint if exists listings_mode_check;
alter table public.listings drop constraint if exists listings_city_check;
alter table public.listings drop constraint if exists listings_category_check;

-- Best-effort: drop any other CHECK constraints on status/type/mode/city/category (unknown names)
do $$
declare
  r record;
begin
  for r in (
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'listings'
      and c.contype = 'c'
      and (
        pg_get_constraintdef(c.oid) ilike '%status%'
        or pg_get_constraintdef(c.oid) ilike '%type%'
        or pg_get_constraintdef(c.oid) ilike '%mode%'
        or pg_get_constraintdef(c.oid) ilike '%city%'
        or pg_get_constraintdef(c.oid) ilike '%category%'
      )
  ) loop
    execute format('alter table public.listings drop constraint if exists %I', r.conname);
  end loop;
end $$;

-- Helpful indexes
create index if not exists listings_created_at_idx on public.listings (created_at desc);
create index if not exists listings_status_idx on public.listings (status);
create index if not exists listings_country_idx on public.listings (country);

commit;
