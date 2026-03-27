-- Uplat V1: listing inquiries (private contact)
-- Creates listing_inquiries table with RLS and indexes.

begin;

-- 1) listing_inquiries table
create table if not exists public.listing_inquiries (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid references public.profiles(id) on delete set null,
  agent_id uuid references public.profiles(id) on delete set null,
  message text not null,
  wa_from text,
  status text not null default 'new' check (status in ('new','read','replied','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listing_inquiries_listing_id_idx on public.listing_inquiries(listing_id);
create index if not exists listing_inquiries_user_id_idx on public.listing_inquiries(user_id);
create index if not exists listing_inquiries_agent_id_idx on public.listing_inquiries(agent_id);

-- 2) RLS
alter table public.listing_inquiries enable row level security;

-- Authenticated users can create their own inquiries
create policy "users can create own inquiries"
on public.listing_inquiries
for insert
with check (auth.uid() = user_id);

-- Users can read their own inquiries
create policy "users can read own inquiries"
on public.listing_inquiries
for select
using (auth.uid() = user_id);

-- Listing owners (agents) can read inquiries assigned to them
create policy "agents can read their inquiries"
on public.listing_inquiries
for select
using (auth.uid() = agent_id);

commit;