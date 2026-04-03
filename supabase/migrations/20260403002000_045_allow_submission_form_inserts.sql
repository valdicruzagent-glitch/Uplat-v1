-- 045_allow_submission_form_inserts.sql
-- Allow manual intake / submit-listing inserts.

begin;

drop policy if exists "authenticated can insert listings" on public.listings;
create policy "authenticated can insert listings"
  on public.listings
  for insert
  with check (
    auth.uid() is not null
    or source = 'submission_form'
  );

commit;
