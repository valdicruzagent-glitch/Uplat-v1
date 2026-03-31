create or replace function public.auto_pause_listing() returns trigger as $$
begin
  -- Auto-pause if report_count reaches threshold (3)
  if NEW.report_count >= 3 and (OLD.report_count is null or NEW.report_count > OLD.report_count) then
    NEW.status = 'paused';
  end if;
  return NEW;
end;
$$ language plpgsql security definer;

drop trigger if exists auto_pause_on_report_count on public.listings;
create trigger auto_pause_on_report_count
  before update on public.listings
  for each row
  when (OLD.report_count is distinct from NEW.report_count)
  execute function public.auto_pause_on_report_count();
