-- Uplat V1: ensure listings.profile_id references profiles.id
-- Idempotent: adds the FK if missing and reloads schema

begin;

-- 1) Ensure column exists (already added in 003, but safe to re-run)
alter table public.listings
  add column if not exists profile_id uuid references public.profiles(id) on delete set null;

-- 2) If the FK constraint exists but is broken, drop and re-add
do $$
declare
  r record;
begin
  for r in (
    select conname, conrelid, confrelid
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'listings'
      and c.contype = 'f'
      and pg_get_constraintdef(c.oid) like '%profile_id%'
  ) loop
    execute format('alter table public.listings drop constraint if exists %I', r.conname);
  end loop;
end $$;

-- Re-add the proper FK
alter table public.listings
  add constraint if not exists listings_profile_id_fkey
    foreign key (profile_id) references public.profiles(id) on delete set null;

-- 3) Force PostgREST schema cache reload
notify pgrst, 'reload schema';

commit;