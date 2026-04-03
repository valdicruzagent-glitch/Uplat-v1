-- 043_rls_policies_for_listings.sql

-- Asegurar RLS
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public can view published listings" ON public.listings;
CREATE POLICY "public can view published listings"
  ON public.listings FOR SELECT
  USING (status = 'published');

DROP POLICY IF EXISTS "authenticated can insert listings" ON public.listings;
CREATE POLICY "authenticated can insert listings"
  ON public.listings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND profile_id = auth.uid());

DROP POLICY IF EXISTS "users can update own listings" ON public.listings;
CREATE POLICY "users can update own listings"
  ON public.listings FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "users can delete own listings" ON public.listings;
CREATE POLICY "users can delete own listings"
  ON public.listings FOR DELETE
  USING (profile_id = auth.uid());
