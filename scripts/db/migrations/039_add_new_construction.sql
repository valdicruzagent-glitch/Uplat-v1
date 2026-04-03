-- Add new_construction column to listings

ALTER TABLE public.listings 
  ADD COLUMN IF NOT EXISTS new_construction boolean DEFAULT false;
