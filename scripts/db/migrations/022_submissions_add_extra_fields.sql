ALTER TABLE public.listing_submissions
  ADD COLUMN IF NOT EXISTS year_built integer,
  ADD COLUMN IF NOT EXISTS new_construction boolean,
  ADD COLUMN IF NOT EXISTS amenities text[];
