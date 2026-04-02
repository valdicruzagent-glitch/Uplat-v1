-- Likes/ratings a perfiles
-- Un usuario puede dar like a un perfil ( realtors, agencias, owners)
-- Se registra quién dio el like y cuándo.

CREATE TABLE IF NOT EXISTS profile_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  to_profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(from_profile_id, to_profile_id)
);

-- Comentario
COMMENT ON TABLE profile_likes IS 'Likes de usuarios a perfiles de inmobiliarios/agentes';

-- Trigger para impedir auto-likes (opcional, se valida en app)
-- CREATE OR REPLACE FUNCTION prevent_self_like() RETURNS trigger AS $$
-- BEGIN
--   IF NEW.from_profile_id = NEW.to_profile_id THEN
--     RAISE EXCEPTION 'No puedes darte like a ti mismo';
--   END IF;
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
-- CREATE TRIGGER tr_prevent_self_like BEFORE INSERT ON profile_likes
--   FOR EACH ROW EXECUTE FUNCTION prevent_self_like();