-- Uplat V1: allow users to insert their own profile row
-- This enables clean first-time sync when a new user takes a protected action

begin;

create policy "users can insert own profile"
on public.profiles
for insert
with check (auth.uid() = id);

commit;