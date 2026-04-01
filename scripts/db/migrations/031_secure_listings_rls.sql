-- Uplat V1: Secure listings RLS policy (published only)
-- Replaces overly permissive "public can read listings" policy
-- Ensures public/anonymous users can only see listings with status = 'published'
-- Admins and owners keep access via other policies (to be defined if needed)

begin;

-- Drop old policy if exists (name may vary; we attempt the known name)
drop policy if exists "public can read listings" on public.listings;

-- Create new restrictive policy
create policy "public can read published listings"
on public.listings
for select
to anon, authenticated
using (status = 'published');

-- Note: Internal/admin queries that need to read non-published listings should
-- use the service role key or dedicated admin policies (add later if needed).

commit;
