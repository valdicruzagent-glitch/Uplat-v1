-- 046_open_insert_for_listings_v1.sql
-- Temporary V1 unblock: allow inserts into listings.

begin;

drop policy if exists "authenticated can insert listings" on public.listings;
create policy "authenticated can insert listings"
  on public.listings
  for insert
  with check (true);

commit;
