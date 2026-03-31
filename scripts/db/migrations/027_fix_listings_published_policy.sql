-- Fix listings select policy to use 'published' instead of 'live'
-- This migrates existing installations from the earlier 'live' value to 'published'

drop policy if exists "public can view live listings" on public.listings;

create policy "public can view published listings"
  on public.listings
  for select
  using (status = 'published');
