-- Total de vistas de todos los listings publicados de un perfil

CREATE OR REPLACE FUNCTION public.get_total_views_for_profile(profile_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  total integer;
BEGIN
  SELECT COALESCE(COUNT(*), 0) INTO total
  FROM public.events e
  JOIN public.listings l ON l.id = e.listing_id
  WHERE e.type = 'listing_view'
    AND l.profile_id = profile_id
    AND l.status = 'published';
  RETURN total;
END;
$function$;

COMMENT ON FUNCTION public.get_total_views_for_profile IS 'Total de vistas de listings publicados del perfil (realtor/agency)';