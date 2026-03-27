-- Uplat V1: seed agencies, members, a normal user, and a user-owned listing
-- Run after 005_agencies_schema.sql and 003_profiles_schema.sql

begin;

-- 1) Create an agency in Nicaragua (Managua)
insert into public.agencies (id, name, country, department, city, logo_url)
values (
  '770e8400-e29b-41d4-a716-446655550001'::uuid,
  'Nicaragua Real Estate Group',
  'Nicaragua',
  'Managua',
  'Managua',
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=150&h=150&fit=crop'
)
on conflict (id) do nothing;

-- 2) Assign 2 existing Nicaragua realtor profiles to this agency as 'realtor'
-- We'll pick by known IDs from seed if they exist; otherwise, pick any two Nicaraguan realtors
with target_profiles as (
  select id from public.profiles
  where role = 'realtor' and country = 'Nicaragua'
  limit 2
)
insert into public.agency_members (agency_id, profile_id, role)
select
  '770e8400-e29b-41d4-a716-446655550001'::uuid,
  id,
  'realtor'
from target_profiles
on conflict (agency_id, profile_id) do nothing;

-- Also mark those profiles with agency_id for quick lookup
update public.profiles
set agency_id = '770e8400-e29b-41d4-a716-446655550001'::uuid
where role = 'realtor'
  and country = 'Nicaragua'
  and id in (select profile_id from public.agency_members where agency_id = '770e8400-e29b-41d4-a716-446655550001'::uuid);

-- 3) Create a normal user profile (role = 'user') in Nicaragua
insert into public.profiles (id, role, full_name, phone, avatar_url, bio, country, department, city)
values (
  '880e8400-e29b-41d4-a716-446655550002'::uuid,
  'user',
  'Rafael Cruz',
  '+505 8888 9999',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
  'Usuario registrado en Uplat.',
  'Nicaragua',
  'Managua',
  'Managua'
)
on conflict (id) do nothing;

-- 4) Create one listing owned by this user (status published)
insert into public.listings (
  id, title, price_usd, listing_type, property_type, city, country, status,
  beds, baths, area_m2, lat, lng, description, profile_id, meta
)
values (
  '990e8400-e29b-41d4-a716-446655550003'::uuid,
  'Linda casa en Managua',
  250000,
  'sale',
  'house',
  'Managua',
  'Nicaragua',
  'published',
  3, 2, 180,
  12.1364, -86.2514,
  'PropiedadExample de usuario normal en Uplat.',
  '880e8400-e29b-41d4-a716-446655550002'::uuid,
  jsonb_build_object('demo', true, 'seed', 'user_listing_seed')
)
on conflict (id) do nothing;

commit;