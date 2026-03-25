-- Favorites table (user_id UUID)
CREATE TABLE IF NOT EXISTS listing_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(listing_id, user_id)
);
CREATE INDEX IF NOT EXISTS idx_listing_favorites_listing_id ON listing_favorites(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_favorites_user_id ON listing_favorites(user_id);

-- Cached count
ALTER TABLE listings ADD COLUMN IF NOT EXISTS favorites_count INTEGER DEFAULT 0;

-- Sponsored fields
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_sponsored BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sponsor_rank INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS sponsored_until TIMESTAMPTZ;

-- RPC: atomic increment/decrement with floor at 0
CREATE OR REPLACE FUNCTION increment_favorites_count(
  lid UUID,
  delta INTEGER
) RETURNS void AS $$
BEGIN
  UPDATE listings 
  SET favorites_count = GREATEST(0, COALESCE(favorites_count,0) + delta) 
  WHERE id = lid;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE listing_favorites ENABLE ROW LEVEL SECURITY;

-- Policy: users can insert/delete only their own favorites
CREATE POLICY "user_crud_own_favorites" ON listing_favorites
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
