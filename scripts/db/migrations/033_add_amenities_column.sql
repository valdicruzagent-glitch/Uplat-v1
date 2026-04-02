-- Add amenities column to listings
-- Type: text[] (array of strings)
-- Para almacenar los amenities seleccionados (wifi, pool, gym, etc.)

ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS amenities text[] DEFAULT '{}';

-- Comentario opcional
COMMENT ON COLUMN public.listings.amenities IS 'Lista de comodidades/amenidades de la propiedad';