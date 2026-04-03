update public.listings
set profile_id = (
  select p.id
  from public.profiles p
  where p.whatsapp_number is not distinct from listings.contact_whatsapp
  order by p.created_at asc
  limit 1
)
where profile_id is null
  and contact_whatsapp is not null;
