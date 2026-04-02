-- Agency onboarding: tabla y función para crear agencia asociada a un perfil
-- Fecha: 2026-04-02

-- =================================================================
-- Tabla agencies
-- =================================================================

CREATE TABLE IF NOT EXISTS public.agencies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  country_code text,
  department_code text,
  city text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.agencies IS 'Agencias de bienes raíces';