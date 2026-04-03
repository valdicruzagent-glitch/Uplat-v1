-- 044_fix_listings_insert_rls.sql
-- Make listing inserts work reliably for authenticated users.
-- 1) Force profile_id = auth.uid() on insert when auth session exists
-- 2) Relax insert policy to authenticated-only, since trigger enforces ownership

begin;

create or replace function public.set_listing_profile_id()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.profile_id := auth.uid();
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_listing_profile_id on public.listings;
create trigger trg_set_listing_profile_id
before insert on public.listings
for each row
execute function public.set_listing_profile_id();

alter table public.listings enable row level security;

drop policy if exists "authenticated can insert listings" on public.listings;
create policy "authenticated can insert listings"
  on public.listings
  for insert
  with check (auth.uid() is not null);

commit;
