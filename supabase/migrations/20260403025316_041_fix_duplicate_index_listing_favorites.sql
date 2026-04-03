-- 041_fix_duplicate_index_listing_favorites.sql

-- Drop duplicate index; keep listing_favorites_user_id_idx
DROP INDEX IF EXISTS idx_listing_favorites_user_id;
