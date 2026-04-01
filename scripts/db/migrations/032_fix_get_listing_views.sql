-- Uplat V1: Fix get_listing_views function
-- - Use listing_id column (not meta)
-- - Security definer so anon can call it
-- - Grant execute to anon, authenticated

begin;

drop function if exists public.get_listing_views(uuid);

create function public.get_listing_views(p_listing uuid)
returns integer
language sql
stable
security definer
as $$
  select count(distinct (meta->>'visitor_id'))::integer
  from public.events
  where type = 'listing_view' and listing_id = p_listing;
$$;

grant execute on function public.get_listing_views(uuid) to anon, authenticated;

commit;
