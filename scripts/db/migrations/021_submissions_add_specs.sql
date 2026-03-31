-- Add extended fields to listing_submissions
ALTER TABLE public.listing_submissions
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS department text,
  ADD COLUMN IF NOT EXISTS lat double precision,
  ADD COLUMN IF NOT EXISTS lng double precision,
  ADD COLUMN IF NOT EXISTS beds integer,
  ADD COLUMN IF NOT EXISTS baths integer,
  ADD COLUMN IF NOT EXISTS area_m2 numeric;

-- Index for future analytics (optional)
CREATE INDEX IF NOT EXISTS idx_listing_submissions_country_department ON public.listing_submissions(country, department);
