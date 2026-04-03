-- 046_drop_listings_city_check.sql
-- Remove legacy city CHECK constraint so submit-listing can store real city values.

begin;

alter table public.listings drop constraint if exists listings_city_check;

commit;
