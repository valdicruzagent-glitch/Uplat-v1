-- listing_submissions: public intake (moderated)
create table if not exists public.listing_submissions (
  id uuid primary key default gen_random_uuid(),
  locale text check (locale in ('en','es')),
  contact_whatsapp text not null check (length(contact_whatsapp) <= 20),
  contact_name text check (length(contact_name) <= 100),
  title text not null check (length(title) <= 200),
  price_usd numeric check (price_usd is null or price_usd > 0),
  city text check (length(city) <= 100),
  mode text check (mode in ('buy','rent')),
  type text check (type in ('house','apartment','land','farm')),
  description text check (length(description) <= 2000),
  photo_links text[] check (array_length(photo_links, 1) <= 10),
  device_info jsonb,
  website text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- trigger for updated_at
create or replace function public.set_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists set_listing_submissions_updated_at on public.listing_submissions;
create trigger set_listing_submissions_updated_at
before update on public.listing_submissions
for each row execute function public.set_updated_at();

alter table public.listing_submissions enable row level security;

-- Grants: anon/authenticated can insert; authenticated can select/update/delete (filtered by policies)
grant insert on public.listing_submissions to anon, authenticated;
grant select, update, delete on public.listing_submissions to authenticated;

-- Idempotent policy drops
drop policy if exists "public insert submissions" on public.listing_submissions;
drop policy if exists "admins manage submissions" on public.listing_submissions;

-- Public insert (anon + authenticated)
create policy "public insert submissions"
  on public.listing_submissions
  for insert
  to anon, authenticated
  using (true)
  with check (true);

-- Admin full access (authenticated with is_admin)
create policy "admins manage submissions"
  on public.listing_submissions
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );
