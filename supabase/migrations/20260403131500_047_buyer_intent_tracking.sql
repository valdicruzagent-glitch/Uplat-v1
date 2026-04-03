create table if not exists public.listing_view_events (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  profile_id uuid null references public.profiles(id) on delete set null,
  session_id text null,
  price_usd numeric null,
  city text null,
  department_code text null,
  country_code text null,
  property_type text null,
  listing_mode text null,
  viewed_at timestamptz not null default now()
);

create index if not exists idx_listing_view_events_profile_id on public.listing_view_events(profile_id);
create index if not exists idx_listing_view_events_session_id on public.listing_view_events(session_id);
create index if not exists idx_listing_view_events_viewed_at on public.listing_view_events(viewed_at desc);

create table if not exists public.buyer_intent_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  avg_viewed_price numeric null,
  median_viewed_price numeric null,
  max_viewed_price numeric null,
  viewed_listing_count integer not null default 0,
  favorite_price_avg numeric null,
  inquiry_price_avg numeric null,
  top_country_code text null,
  top_department_code text null,
  top_city text null,
  top_property_type text null,
  top_listing_mode text null,
  price_band_affinity text null,
  updated_at timestamptz not null default now()
);
