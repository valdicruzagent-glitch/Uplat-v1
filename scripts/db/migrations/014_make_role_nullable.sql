-- Make role column nullable to allow profile creation before role selection

begin;

alter table public.profiles alter column role drop not null;

commit;
