-- Uplat V1: reconcile legacy listings schema to canonical V1 schema
-- Safe to re-run where possible. Review before production execution.

begin;

create extension if not exists pgcrypto;

-- 1) Ensure canonical columns exist
alter table public.listings
  add column if not exists slug text,
  add column if not exists headline text,
  add column if not exists listing_type text,
  add column if not exists property_type text,
  add column if not exists address_text text,
  add column if not exists image_urls text[],
  add column if not exists contact_name text,
  add column if not exists contact_whatsapp text,
  add column if not exists published_at timestamptz,
  add column if not exists updated_at timestamptz not null default now();

-- 2) Backfill canonical columns from legacy columns
update public.listings
set listing_type = case
  when listing_type is not null then listing_type
  when mode = 'buy' then 'sale'
  when mode = 'rent' then 'rent'
  else null
end
where listing_type is null;

update public.listings
set property_type = coalesce(property_type, type)
where property_type is null and type is not null;

update public.listings
set image_urls = case
  when image_urls is not null then image_urls
  when cover_image_url is not null and btrim(cover_image_url) <> '' then array[cover_image_url]
  else image_urls
end
where image_urls is null;

update public.listings
set published_at = coalesce(published_at, created_at)
where published_at is null
  and status in ('active', 'live', 'published');

-- 3) Normalize status to locked V1 values
update public.listings
set status = case
  when status = 'active' then 'published'
  when status = 'live' then 'published'
  when status = 'comp' then 'archived'
  when status in ('draft', 'published', 'inactive', 'archived') then status
  when status is null then 'draft'
  else 'draft'
end;

-- 4) Generate slugs where missing
update public.listings
set slug = lower(
  trim(both '-' from regexp_replace(
    coalesce(title, 'listing') || '-' || left(id::text, 8),
    '[^a-zA-Z0-9]+',
    '-',
    'g'
  ))
)
where slug is null or btrim(slug) = '';

-- 5) Tighten listing_type values
update public.listings
set listing_type = 'sale'
where listing_type not in ('sale', 'rent') or listing_type is null;

-- 6) Keep updated_at fresh
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_listings_updated_at on public.listings;
create trigger set_listings_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

-- 7) Constraints / indexes for canonical V1
alter table public.listings drop constraint if exists listings_listing_type_check;
alter table public.listings drop constraint if exists listings_status_v1_check;
alter table public.listings drop constraint if exists listings_slug_key;

alter table public.listings
  add constraint listings_listing_type_check
    check (listing_type in ('sale', 'rent')),
  add constraint listings_status_v1_check
    check (status in ('draft', 'published', 'inactive', 'archived'));

create unique index if not exists listings_slug_idx on public.listings (slug);
create index if not exists listings_listing_type_idx on public.listings (listing_type);
create index if not exists listings_property_type_idx on public.listings (property_type);
create index if not exists listings_published_at_idx on public.listings (published_at desc);

-- 8) Public browse should only expose published listings in V1
-- Replace permissive read policy if it exists.
drop policy if exists "public can read listings" on public.listings;
create policy "public can read published listings"
on public.listings
for select
to anon, authenticated
using (status = 'published');

commit;
