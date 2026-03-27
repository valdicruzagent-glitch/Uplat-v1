-- Uplat V1: agent reviews and reporting
-- Creates agent_reviews and agent_reviews_reports tables, adds aggregates to profiles.

begin;

-- 1) agent_reviews table
create table if not exists public.agent_reviews (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid not null references public.profiles(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(agent_id, user_id)
);

create index if not exists agent_reviews_agent_id_idx on public.agent_reviews(agent_id);

-- 2) agent_reviews_reports table
create table if not exists public.agent_reviews_reports (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.agent_reviews(id) on delete cascade,
  reporter_id uuid not null references public.profiles(id),
  reason text not null check (reason in ('spam','abuse','inappropriate','other')),
  notes text,
  created_at timestamptz not null default now(),
  unique(review_id, reporter_id)
);

create index if not exists agent_reviews_reports_review_id_idx on public.agent_reviews_reports(review_id);

-- 3) Add aggregates to profiles
alter table public.profiles
  add column if not exists review_count integer not null default 0,
  add column if not exists average_rating numeric(3,2) not null default 0;

-- 4) Trigger function to maintain aggregates
create or replace function public.handle_agent_review() returns trigger as $$
begin
  if (TG_OP = 'INSERT') then
    update public.profiles
    set
      review_count = coalesce(review_count,0) + 1,
      average_rating = (
        (coalesce(average_rating,0) * coalesce(review_count,0) + NEW.rating) /
        (coalesce(review_count,0) + 1)
      )
    where id = NEW.agent_id;
    return NEW;
  elsif (TG_OP = 'UPDATE') then
    -- adjust average: subtract old rating, add new
    update public.profiles
    set
      average_rating = (
        (coalesce(average_rating,0) * coalesce(review_count,0) - OLD.rating + NEW.rating) /
        coalesce(review_count,0)
      )
    where id = NEW.agent_id;
    return NEW;
  elsif (TG_OP = 'DELETE') then
    update public.profiles
    set
      review_count = greatest(0, coalesce(review_count,0) - 1),
      average_rating = case
        when coalesce(review_count,0) <= 1 then 0
        else (coalesce(average_rating,0) * coalesce(review_count,0) - OLD.rating) /
             (coalesce(review_count,0) - 1)
      end
    where id = OLD.agent_id;
    return OLD;
  end if;
end;
$$ language plpgsql;

drop trigger if exists agent_reviews_after_insert on public.agent_reviews;
drop trigger if exists agent_reviews_after_update on public.agent_reviews;
drop trigger if exists agent_reviews_after_delete on public.agent_reviews;

create trigger agent_reviews_after_insert
after insert on public.agent_reviews
for each row execute function public.handle_agent_review();

create trigger agent_reviews_after_update
after update on public.agent_reviews
for each row execute function public.handle_agent_review();

create trigger agent_reviews_after_delete
after delete on public.agent_reviews
for each row execute function public.handle_agent_review();

-- 5) RLS policies
alter table public.agent_reviews enable row level security;
alter table public.agent_reviews_reports enable row level security;

-- Reviews: public can read; authenticated users can insert/update/delete own
create policy "public can read reviews" on public.agent_reviews
  for select to anon, authenticated using (true);

create policy "users can manage own reviews" on public.agent_reviews
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Reports: authenticated users can insert; admins can manage; public no read
create policy "users can create reports" on public.agent_reviews_reports
  for insert with check (auth.uid() = reporter_id);

-- (Admin/service role will manage reports; no public read)

commit;