-- Security hardening y cleanup de listing_submissions
-- Fecha: 2026-04-02

-- =================================================================
-- 1. Recrear funciones con search_path fijo y SECURITY DEFINER donde corresponda
-- =================================================================

-- get_listing_viewspublic. CREATE OR REPLACE FUNCTION public.get_listing_views(listing uuid)
--  RETURNS integer
--  LANGUAGE plpgsql
--  SECURITY DEFINER
-- AS $function$
-- BEGIN
--   RETURN (
--     SELECT COUNT(*)
--     FROM public.events
--     WHERE type = 'listing_view' AND listing_id = listing
--   );
-- END;
-- $function$;

-- Recreamos con search_path explícito
CREATE OR REPLACE FUNCTION public.get_listing_views(listing uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM public.events
    WHERE type = 'listing_view' AND listing_id = listing
  );
END;
$function$;

-- update_listing_favorites_count
-- (definición basada en migración 026)
CREATE OR REPLACE FUNCTION public.update_listing_favorites_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.listings
  SET favorites_count = (
    SELECT COUNT(*)
    FROM public.favorites
    WHERE listing_id = NEW.listing_id
  )
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$function$;

-- should_pause_listing (definición basada en migración 023)
CREATE OR REPLACE FUNCTION public.should_pause_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF (SELECT report_count FROM public.listings WHERE id = NEW.listing_id) >= 5 THEN
    UPDATE public.listings
    SET status = 'paused'
    WHERE id = NEW.listing_id;
  END IF;
  RETURN NULL;
END;
$function$;

-- increment_favorites_count (definición basada en migración 024)
CREATE OR REPLACE FUNCTION public.increment_favorites_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.listings
  SET favorites_count = favorites_count + 1
  WHERE id = NEW.listing_id;
  RETURN NEW;
END;
$function$;

-- set_listing_inquiries_updated_at (migración 027)
CREATE OR REPLACE FUNCTION public.set_listing_inquiries_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- auto_pause_on_report_count (migración 022)
CREATE OR REPLACE FUNCTION public.auto_pause_on_report_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF (SELECT report_count FROM public.listings WHERE id = NEW.listing_id) >= 5 THEN
    UPDATE public.listings
    SET status = 'paused'
    WHERE id = NEW.listing_id;
  END IF;
  RETURN NULL;
END;
$function$;

-- set_updated_at (trigger helper)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- =================================================================
-- 2. Limpiar listing_submissions
-- =================================================================

-- Eliminar policy insegura
DROP POLICY IF EXISTS "public can insert listing submissions" ON public.listing_submissions;

-- Eliminar tabla (si no se usa). Comentado por seguridad; descomentar si se confirma que no se usa.
-- DROP TABLE IF EXISTS public.listing_submissions CASCADE;

-- NOTA: Se recomienda eliminar la tabla tras verificar que no hay dependencias en la app.

-- =================================================================
-- 3. Asegurar RLS en listings (ya está activa, pero verificamos policies)
-- =================================================================

-- Políticas existentes (no modificar salvo que se necesite ajuste)

-- =================================================================
-- 4. Activar Leaked Password Protection (se hace en Auth Settings de Supabase Dashboard)
-- =================================================================
-- Este cambio no es SQL; se debe activar manualmente en:
-- Supabase Dashboard → Authentication → Password Protection → "Leaked Password Protection"

-- =================================================================
-- FIN
-- =================================================================