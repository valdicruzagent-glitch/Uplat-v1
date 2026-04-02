-- Ratings para perfiles (realtors, agencias)
-- Rango 1-10. Un usuario puede cambiar su rating (overwrite).

CREATE TABLE IF NOT EXISTS profile_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  to_profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 10),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(from_profile_id, to_profile_id)
);

COMMENT ON TABLE profile_ratings IS 'Ratings de usuarios a perfiles de realtors/agencias';

CREATE OR REPLACE FUNCTION get_profile_rating_stats(p_to_profile_id uuid)
RETURNS TABLE(average numeric, count bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(AVG(rating::numeric), 0) AS average,
    COUNT(*)::bigint AS count
  FROM profile_ratings
  WHERE to_profile_id = p_to_profile_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_updated_at_to_now()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_profile_ratings ON profile_ratings;
CREATE TRIGGER set_updated_at_profile_ratings
  BEFORE UPDATE ON profile_ratings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at_to_now();

CREATE INDEX IF NOT EXISTS idx_profile_ratings_to_profile ON profile_ratings(to_profile_id);
CREATE INDEX IF NOT EXISTS idx_profile_ratings_from_profile ON profile_ratings(from_profile_id);