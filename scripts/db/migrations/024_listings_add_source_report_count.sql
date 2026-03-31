-- Add source and report_count to listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS report_count integer NOT NULL DEFAULT 0;

-- Enable RLS if not already
alter table public.listings enable row level security;

-- Policy: authenticated users can insert listings with profile_id = auth.uid()
drop policy if exists "authenticated can insert own listings" on public.listings;
create policy "authenticated can insert own listings"
  on public.listings
  for insert
  to authenticated
  with check (profile_id = auth.uid());

-- Policy: anyone can read live listings (public)
drop policy if exists "public can view live listings" on public.listings;
create policy "public can view live listings"
  on public.listings
  for select
  using (status = 'live');

-- (Existing policies for admins may already exist; keep them)
