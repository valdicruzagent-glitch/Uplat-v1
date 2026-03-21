-- Optional alternative seed (runs inside Supabase SQL Editor)
-- Creates 100 synthetic demo listings and wipes prior demo rows.
-- Requires listings.meta jsonb column (see migrations/001_listings_schema.sql).

begin;

delete from public.listings where (meta->>'demo')::boolean is true;

with cities as (
  select * from (
    values
      ('Nicaragua','Managua',12.1364,-86.2514),
      ('Nicaragua','Granada',11.9299,-85.9560),
      ('Nicaragua','San Juan del Sur',11.2520,-85.8700),
      ('Costa Rica','San José',9.9281,-84.0907),
      ('Costa Rica','Tamarindo',10.2993,-85.8410),
      ('Panama','Panama City',8.9824,-79.5199),
      ('Panama','Boquete',8.7818,-82.4413),
      ('Honduras','Tegucigalpa',14.0723,-87.1921),
      ('Guatemala','Antigua Guatemala',14.5586,-90.7333),
      ('El Salvador','San Salvador',13.6929,-89.2182),
      ('Belize','San Pedro',17.9150,-87.9650)
  ) as t(country, city, lat, lng)
),
base as (
  select
    gs as n,
    case when gs <= 70 then 'active' else 'comp' end as status,
    (array['buy','rent'])[1+floor(random()*2)::int] as mode,
    (array['house','apartment','land'])[1+floor(random()*3)::int] as type,
    c.country,
    c.city,
    (c.lat + (random()-0.5)*0.08) as lat,
    (c.lng + (random()-0.5)*0.08) as lng
  from generate_series(1,100) gs
  join lateral (
    select * from cities order by random() limit 1
  ) c on true
),
priced as (
  select
    *,
    (
      case country
        when 'Nicaragua' then 70000
        when 'Costa Rica' then 180000
        when 'Panama' then 220000
        when 'Honduras' then 90000
        when 'Guatemala' then 140000
        when 'El Salvador' then 120000
        when 'Belize' then 200000
        else 120000
      end
      * case when type='land' then 0.9 when type='apartment' then 1.1 else 1 end
      * case when mode='rent' then 0.015 else 1 end
      * case when status='comp' then 0.95 else 1 end
      * (0.65 + random()*1.1)
    ) as price_raw
  from base
)
insert into public.listings (
  title, price_usd, type, mode, city, country, status, category,
  beds, baths, area_m2, area_ha, lat, lng, cover_image_url, description, meta
)
select
  case
    when type='land' then 'Ocean-view lot ' || (case when mode='rent' then 'for rent' else 'for sale' end) || ' in ' || city || ', ' || country
    when type='apartment' then 'Modern apartment ' || (case when mode='rent' then 'for rent' else 'for sale' end) || ' in ' || city || ', ' || country
    else 'Family home ' || (case when mode='rent' then 'for rent' else 'for sale' end) || ' in ' || city || ', ' || country
  end as title,
  case when mode='rent' then round(greatest(350, least(price_raw, 6500)) / 25) * 25
       else round(greatest(35000, least(price_raw, 1200000)) / 1000) * 1000
  end as price_usd,
  type,
  mode,
  city,
  country,
  status,
  case when type='land' then 'land' else 'residential' end as category,
  case when type='land' then null when type='apartment' then (1+floor(random()*3))::int else (2+floor(random()*4))::int end as beds,
  case when type='land' then null when type='apartment' then (1+floor(random()*2))::int else (1+floor(random()*4))::int end as baths,
  case when type='land' then null when type='apartment' then (45+floor(random()*116))::int else (70+floor(random()*311))::int end as area_m2,
  case when type='land' then round(((0.15 + random()*8.0))::numeric, 2) else null end as area_ha,
  lat,
  lng,
  'https://source.unsplash.com/800x600/?' ||
    case when type='land' then 'land,landscape,tropical'
         when type='apartment' then 'apartment,interior,modern'
         else 'house,home,architecture'
    end ||
    '&sig=' || n as cover_image_url,
  'Synthetic demo listing for Uplat (' || mode || '). Located near ' || city || ', ' || country || '. Details to be verified.' as description,
  jsonb_build_object('demo', true, 'seed', 'sql_seed_' || to_char(now(), 'YYYY-MM-DD')) as meta
from priced;

commit;
