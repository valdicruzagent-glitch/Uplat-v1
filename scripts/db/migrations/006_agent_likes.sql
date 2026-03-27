-- Uplat V1: agent likes system
-- Creates agent_likes table, adds likes_count to profiles, and sets up triggers.

begin;

-- 1) agent_likes table
create table if not exists public.agent_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  agent_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, agent_id)
);

create index if not exists agent_likes_user_id_idx on public.agent_likes(user_id);
create index if not exists agent_likes_agent_id_idx on public.agent_likes(agent_id);

-- 2) Add likes_count to profiles
alter table public.profiles
  add column if not exists likes_count integer not null default 0;

-- 3) Triggers to maintain likes_count
create or replace function public.handle_agent_like() returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.profiles set likes_count = coalesce(likes_count,0) + 1 where id = NEW.agent_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update public.profiles set likes_count = greatest(0, coalesce(likes_count,0) - 1) where id = OLD.agent_id;
    return OLD;
  end if;
end;
$$ language plpgsql;

drop trigger if exists agent_likes_after_insert on public.agent_likes;
drop trigger if exists agent_likes_after_delete on public.agent_likes;

create trigger agent_likes_after_insert
after insert on public.agent_likes
for each row execute function public.handle_agent_like();

create trigger agent_likes_after_delete
after delete on public.agent_likes
for each row execute function public.handle_agent_like();

-- RLS: users can manage their own likes; public can read likes
alter table public.agent_likes enable row level security;

create policy "users can manage own likes"
on public.agent_likes
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Public can read likes (for counts)
create policy "public can read likes"
on public.agent_likes
for select
to anon, authenticated
using (true);

commit;