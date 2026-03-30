-- Add email column to profiles and backfill from auth.users

begin;

-- Add email column (nullable initially)
alter table public.profiles
  add column if not exists email text;

-- Populate existing rows from auth.users
update public.profiles p
set email = au.email
from auth.users au
where p.id = au.id and p.email is null;

-- Make email non-nullable after backfill (optional; keep nullable if some users may not have email)
-- alter table public.profiles alter column email set not null;

commit;
