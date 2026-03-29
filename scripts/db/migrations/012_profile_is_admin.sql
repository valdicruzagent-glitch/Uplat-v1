-- Uplat V1: admin flag for internal access control
begin;

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- Optional index for quick admin lookups
create index if not exists profiles_is_admin_idx on public.profiles(is_admin) where is_admin = true;

commit;