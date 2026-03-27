-- Uplat V1: introduce profiles table extending auth.users
-- Safe to re-run where possible. Review before production execution.

begin;

-- 1) profiles table
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('agency','realtor','user')),
  full_name text,
  phone text,
  avatar_url text,
  bio text,
  country text,
  department text,
  city text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- create or replace function for profiles updated_at
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

-- RLS on profiles
alter table public.profiles enable row level security;

-- Policies: users manage their own profile
create policy "users can read own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "users can update own profile"
on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

-- 2) Add profile_id to listings (nullable initially)
alter table public.listings
  add column if not exists profile_id uuid references public.profiles(id) on delete set null;

-- Index for faster joins
create index if not exists listings_profile_id_idx on public.listings(profile_id);

commit;