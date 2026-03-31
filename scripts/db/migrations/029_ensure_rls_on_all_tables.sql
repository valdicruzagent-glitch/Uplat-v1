-- Migration 029: Ensure RLS is enabled on all application tables
-- This addresses the "Table publicly accessible" security alerts by enabling RLS where missing.
-- Existing policies remain intact. Idempotent.

ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.listing_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.listing_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.listing_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.listing_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agency_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.agent_reviews_reports ENABLE ROW LEVEL SECURITY;
