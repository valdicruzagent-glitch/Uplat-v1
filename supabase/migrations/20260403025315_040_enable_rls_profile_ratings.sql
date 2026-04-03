-- 040_enable_rls_profile_ratings.sql

-- Habilitar RLS
ALTER TABLE public.profile_ratings ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent)
DROP POLICY IF EXISTS "public can read profile_ratings" ON public.profile_ratings;
CREATE POLICY "public can read profile_ratings"
  ON public.profile_ratings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "authenticated can insert profile_ratings" ON public.profile_ratings;
CREATE POLICY "authenticated can insert profile_ratings"
  ON public.profile_ratings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND from_profile_id = auth.uid());

DROP POLICY IF EXISTS "users can update own ratings" ON public.profile_ratings;
CREATE POLICY "users can update own ratings"
  ON public.profile_ratings FOR UPDATE
  USING (from_profile_id = auth.uid())
  WITH CHECK (from_profile_id = auth.uid());

DROP POLICY IF EXISTS "users can delete own ratings" ON public.profile_ratings;
CREATE POLICY "users can delete own ratings"
  ON public.profile_ratings FOR DELETE
  USING (from_profile_id = auth.uid());
