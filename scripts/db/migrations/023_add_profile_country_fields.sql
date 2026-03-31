-- Add country detail fields to profiles
-- Columns: country_code (ISO), country_name, dial_code

begin;

alter table public.profiles
  add column if not exists country_code text,
  add column if not exists country_name text,
  add column if not exists dial_code text;

commit;
