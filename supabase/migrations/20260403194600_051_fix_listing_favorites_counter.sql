create or replace function public.recalc_listing_favorites_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_listing_id uuid;
begin
  target_listing_id := coalesce(new.listing_id, old.listing_id);

  update public.listings
  set favorites_count = (
    select count(*)
    from public.listing_favorites
    where listing_id = target_listing_id
  )
  where id = target_listing_id;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_recalc_listing_favorites_count_insert on public.listing_favorites;
create trigger trg_recalc_listing_favorites_count_insert
after insert on public.listing_favorites
for each row execute function public.recalc_listing_favorites_count();

drop trigger if exists trg_recalc_listing_favorites_count_delete on public.listing_favorites;
create trigger trg_recalc_listing_favorites_count_delete
after delete on public.listing_favorites
for each row execute function public.recalc_listing_favorites_count();

update public.listings l
set favorites_count = (
  select count(*)
  from public.listing_favorites f
  where f.listing_id = l.id
);
