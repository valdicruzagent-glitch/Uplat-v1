create table if not exists public.listing_reports (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete cascade,
  reported_by uuid references public.profiles(id) on delete set null,
  reason text not null check (reason in ('spam','fraud','inappropriate','other')),
  details text,
  created_at timestamptz not null default now()
);

-- Index for queries
CREATE INDEX IF NOT EXISTS idx_listing_reports_listing_id ON public.listing_reports(listing_id);

-- RLS: allow authenticated to insert; admins can select/update/delete
alter table public.listing_reports enable row level security;

drop policy if exists "users can create reports" on public.listing_reports;
create policy "users can create reports"
  on public.listing_reports
  for insert
  to authenticated
  using (true)
  with check (reported_by = auth.uid());

drop policy if exists "admins manage reports" on public.listing_reports;
create policy "admins manage reports"
  on public.listing_reports
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
        and profiles.is_admin = true
    )
  );

-- Function: increment report_count on listings when a report is inserted
create or replace function public.handle_listing_report() returns trigger as $$
begin
  update public.listings
  set report_count = coalesce(report_count, 0) + 1
  where id = NEW.listing_id;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists on_listing_report_insert on public.listing_reports;
create trigger on_listing_report_insert
  after insert on public.listing_reports
  for each row
  execute function public.handle_listing_report();
