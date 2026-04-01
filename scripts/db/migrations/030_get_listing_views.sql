-- Uplat V1: RPC get_listing_views (distinct visitor count)
-- Fixes: views counter in listing detail page (TrackListingView)
-- Drops existing function to avoid parameter name conflicts

begin;

drop function if exists public.get_listing_views(uuid);

create function public.get_listing_views(p_listing uuid)
returns integer
language sql
stable
as $$
  select count(distinct (meta->>'visitor_id'))::integer
  from public.events
  where type = 'listing_view' and (meta->>'listing_id')::uuid = p_listing;
$$;

commit;
