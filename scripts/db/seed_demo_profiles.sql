-- Uplat V1: seed demo realtor profiles and assign existing listings
-- Run after 003_profiles_schema.sql
-- WARNING: updates existing published listings to assign a random realtor profile

begin;

-- 1) Insert demo realtor profiles for all countries present in listings (LATAM)
-- Use deterministic UUIDs; on conflict do nothing to keep idempotency.
insert into public.profiles (id, role, full_name, phone, avatar_url, bio, country, department, city)
values
  (
    '550e8400-e29b-41d4-a716-446655440001'::uuid,
    'realtor',
    'María González',
    '+505 8123 4567',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    'Especialista en propiedades residenciales en Managua.',
    'Nicaragua',
    'Managua',
    'Managua'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440002'::uuid,
    'realtor',
    'Carlos Ruiz',
    '+506 6123 4567',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop',
    'Agente con amplia cartera en San José, Costa Rica.',
    'Costa Rica',
    'San José',
    'San José'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440003'::uuid,
    'realtor',
    'Ana Valdez',
    '+507 6321 9876',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop',
    'Experta en inversiones inmobiliarias en Ciudad de Panamá.',
    'Panama',
    'Panamá',
    'Panama City'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440004'::uuid,
    'realtor',
    'Luis Méndez',
    '+504 9786 1234',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop',
    'Realtor enfocado en propiedades en Tegucigalpa.',
    'Honduras',
    'Francisco Morazán',
    'Tegucigalpa'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440005'::uuid,
    'realtor',
    'Sofía Castillo',
    '+502 5312 3456',
    'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop',
    'Especialista en terrenos y casas en Antigua, Guatemala.',
    'Guatemala',
    'Sacatepéquez',
    'Antigua Guatemala'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440006'::uuid,
    'realtor',
    'Ricardo Morales',
    '+503 7890 1234',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    'Agente en San Salvador, El Salvador.',
    'El Salvador',
    'San Salvador',
    'San Salvador'
  ),
  (
    '550e8400-e29b-41d4-a716-446655440007'::uuid,
    'realtor',
    'Elena Cruz',
    '+501 6123 4567',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop',
    'Especialista en propiedades en San Pedro, Belize.',
    'Belize',
    'Belize',
    'San Pedro'
  )
on conflict (id) do nothing;

-- 2) Assign all published listings to a realtor from the SAME country
-- If no realtor exists for that country, profile_id remains NULL.
update public.listings l
set profile_id = p.id
from (
  select distinct on (country) country, id
  from public.profiles
  where role = 'realtor'
) p
where l.status = 'published'
  and l.country is not null
  and l.country = p.country;

commit;