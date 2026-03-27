-- Uplat V1: add pool and waterfront flags to listings
-- Safe to re-run (idempotent).

begin;

-- Add columns if missing
alter table public.listings
  add column if not exists has_pool boolean not null default false,
  add column if not exists is_waterfront boolean not null default false;

-- Optional indexes for filtering
create index if not exists listings_has_pool_idx on public.listings(has_pool);
create index if not exists listings_is_waterfront_idx on public.listings(is_waterfront);

commit;