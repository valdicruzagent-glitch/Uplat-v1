-- Uplat V1: agencies and agency membership
-- Safe to re-run where possible. Review before production execution.

begin;

-- 1) agencies table
create table if not exists public.agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  country text,
  department text,
  city text,
  logo_url text,
  created_at timestamptz not null default now()
);

-- 2) agency_members join table
create table if not exists public.agency_members (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references public.agencies(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role text not null check (role in ('admin','realtor')),
  created_at timestamptz not null default now(),
  unique(agency_id, profile_id)
);

-- Indexes for faster joins
create index if not exists agency_members_agency_id_idx on public.agency_members(agency_id);
create index if not exists agency_members_profile_id_idx on public.agency_members(profile_id);

-- 3) Optional: add agency_id to profiles (nullable)
alter table public.profiles
  add column if not exists agency_id uuid references public.agencies(id) on delete set null;

create index if not exists profiles_agency_id_idx on public.profiles(agency_id);

-- RLS on agencies: allow public read, authenticated create/update/delete as needed
alter table public.agencies enable row level security;

-- Public can view all agencies
create policy "public can read agencies"
on public.agencies
for select
to anon, authenticated
using (true);

-- RLS on agency_members: restrict to members and admins
alter table public.agency_members enable row level security;

-- Members can view their own agency membership
create policy "members can read own membership"
on public.agency_members
for select
using (auth.uid() = (select id from profiles where id = agency_members.profile_id));

-- Only agency admins can insert/update/delete membership (simplified: use service role for now)
-- In a real app, you'd add a policy checking that the user is an admin of that agency.

commit;