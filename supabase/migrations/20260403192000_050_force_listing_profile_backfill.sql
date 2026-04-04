update public.listings
set profile_id = p.id
from public.profiles p
where public.listings.profile_id is null
  and public.listings.contact_whatsapp is not null
  and p.whatsapp_number is not distinct from public.listings.contact_whatsapp;
