-- Uplat V1: terms acceptance tracking for onboarding
begin;

alter table public.profiles
  add column if not exists terms_accepted boolean not null default false,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text;

-- Index for quick checks of completion
create index if not exists profiles_terms_accepted_idx on public.profiles(terms_accepted) where terms_accepted = true;

commit;