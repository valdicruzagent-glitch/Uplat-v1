-- 047_allow_owners_read_own_listings.sql

begin;

drop policy if exists "users can read own listings" on public.listings;
create policy "users can read own listings"
  on public.listings
  for select
  using (
    auth.uid() is not null
    and profile_id = auth.uid()
  );

commit;
