alter table public.listings
  add column if not exists moderation_status text default 'active';

create or replace function public.apply_listing_report_thresholds()
returns trigger
language plpgsql
as $$
declare
  unique_reports integer;
begin
  select count(distinct reported_by)
    into unique_reports
  from public.listing_reports
  where listing_id = new.listing_id;

  if unique_reports >= 3 then
    update public.listings
    set moderation_status = 'under_review'
    where id = new.listing_id;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_apply_listing_report_thresholds on public.listing_reports;
create trigger trg_apply_listing_report_thresholds
after insert on public.listing_reports
for each row execute function public.apply_listing_report_thresholds();
