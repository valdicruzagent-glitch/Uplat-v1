-- 019_listing_lifecycle.sql
-- Add listing lifecycle fields; normalize invalid statuses to 'pending'; add constraint; update RLS

begin;

-- 1) Add new columns (safe to re-run)
alter table public.listings
  add column if not exists status text,
  add column if not exists beds integer,
  add column if not exists baths numeric(3,1),
  add column if not exists area_m2 integer,
  add column if not exists price_original_usd numeric,
  add column if not exists price_reduced_at timestamptz,
  add column if not exists sold_at timestamptz;

-- 2) Safe normalization: set any NULL or non-canonical status to 'pending'
update public.listings
set status = 'pending'
where status is null or status not in ('pending','live','paused','sold');

-- 3) Add constraint (data is now clean)
alter table public.listings
  drop constraint if exists listings_status_check,
  add constraint listings_status_check
    check (status in ('pending','live','paused','sold'));

-- 4) Update RLS: allow public reads only for status = 'live'
drop policy if exists "public can read published listings" on public.listings;

create policy "public can read live listings"
  on public.listings
  for select
  to anon, authenticated
  using (status = 'live');

commit;
