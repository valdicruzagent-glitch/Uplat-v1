-- Add location fields to listings (country, department, city)

ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS country_code text,
  ADD COLUMN IF NOT EXISTS department_code text,
  ADD COLUMN IF NOT EXISTS city text;
