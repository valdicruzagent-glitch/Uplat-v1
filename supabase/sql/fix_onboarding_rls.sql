-- 1) Make role nullable to allow profile creation before role selection
ALTER TABLE public.profiles ALTER COLUMN role DROP NOT NULL;

-- 2) Allow authenticated users to insert their own profile row
CREATE POLICY "users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3) Allow authenticated users to update their own profile row (already exists but included for completeness)
-- (If already present, this will error; can be skipped)
CREATE POLICY "users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
