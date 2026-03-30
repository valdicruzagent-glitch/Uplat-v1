-- Uplat V1: listing favorites (user saved listings)
begin;

create table if not exists public.listing_favorites (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(listing_id, user_id)
);

create index if not exists listing_favorites_user_id_idx on public.listing_favorites(user_id);
create index if not exists listing_favorites_listing_id_idx on public.listing_favorites(listing_id);

-- RLS
alter table public.listing_favorites enable row level security;

-- Users can manage their own favorites
create policy "users can manage own favorites"
on public.listing_favorites
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Public can read favorite counts (optional; already used in MapSection)
create policy "public can read favorite counts"
on public.listing_favorites
for select
to anon, authenticated
using (true);

commit;
