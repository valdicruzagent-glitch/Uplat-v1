-- Migración 028: Crear bucket 'listing-photos' y políticas de acceso

-- 1) Crear bucket (si no existe) y asegurar que sea público
INSERT INTO storage.buckets (id, name, public, created_at, updated_at)
VALUES ('listing-photos', 'listing-photos', true, now(), now())
ON CONFLICT (id) DO UPDATE SET public = true, updated_at = now();

-- 2) Política: usuarios autenticados pueden subir solo a su propia carpeta (userId/*)
INSERT INTO storage.policies (bucket_id, name, definition, check, created_at, updated_at)
VALUES (
  'listing-photos',
  'User upload to own folder',
  'auth.role() = ''authenticated''',
  '(storage.foldername(name))[1] = auth.uid()',
  now(),
  now()
)
ON CONFLICT (bucket_id, name) DO NOTHING;

-- 3) Política: lectura pública (anyone can SELECT objects)
INSERT INTO storage.policies (bucket_id, name, definition, created_at, updated_at)
VALUES (
  'listing-photos',
  'Public read access',
  'true',
  now(),
  now()
)
ON CONFLICT (bucket_id, name) DO NOTHING;
