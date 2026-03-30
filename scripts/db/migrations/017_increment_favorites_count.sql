-- Uplat V1: increment favorites_count on listings
begin;

create or replace function public.increment_favorites_count(lid uuid, delta integer)
returns void as $$
begin
  update public.listings
  set favorites_count = coalesce(favorites_count, 0) + delta
  where id = lid;
end;
$$ language plpgsql;

commit;
