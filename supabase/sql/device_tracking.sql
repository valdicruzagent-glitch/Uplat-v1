-- Device tracking columns (mobile/tablet/desktop) for form submissions
-- Run in Supabase SQL editor.

alter table if exists public.realtor_leads
  add column if not exists device_type text,
  add column if not exists os text,
  add column if not exists browser text,
  add column if not exists viewport_w int,
  add column if not exists viewport_h int,
  add column if not exists is_touch boolean;

alter table if exists public.listing_submissions
  add column if not exists device_type text,
  add column if not exists os text,
  add column if not exists browser text,
  add column if not exists viewport_w int,
  add column if not exists viewport_h int,
  add column if not exists is_touch boolean;
