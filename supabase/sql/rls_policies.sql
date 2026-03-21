-- Uplat baseline RLS policies (V1)
-- Safe defaults for public browse + public lead capture.
-- Review carefully before running in production.

-- LISTINGS: public read-only
alter table public.listings enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='listings' and policyname='public can read listings'
  ) then
    create policy "public can read listings"
    on public.listings
    for select
    to anon, authenticated
    using (true);
  end if;
end $$;

-- REALTOR_LEADS: allow insert only, no reads
alter table public.realtor_leads enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='realtor_leads' and policyname='public can insert realtor leads'
  ) then
    create policy "public can insert realtor leads"
    on public.realtor_leads
    for insert
    to anon, authenticated
    with check (true);
  end if;
end $$;

-- LISTING_SUBMISSIONS: allow insert only, no reads
alter table public.listing_submissions enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='listing_submissions' and policyname='public can insert listing submissions'
  ) then
    create policy "public can insert listing submissions"
    on public.listing_submissions
    for insert
    to anon, authenticated
    with check (true);
  end if;
end $$;

-- EVENTS: allow insert only; tighten allowed event types
alter table public.events enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='events' and policyname='public can insert limited events'
  ) then
    create policy "public can insert limited events"
    on public.events
    for insert
    to anon, authenticated
    with check (type in ('listing_view','whatsapp_click'));
  end if;
end $$;

-- WHATSAPP TABLES: RLS ON, no public policies (service role still works)
-- (Run this only after whatsapp_tables.sql created them)
alter table public.whatsapp_contacts enable row level security;
alter table public.whatsapp_messages enable row level security;

-- NOTE on RPC get_listing_views:
-- If you rely on get_listing_views(), prefer SECURITY DEFINER and GRANT EXECUTE to anon.
