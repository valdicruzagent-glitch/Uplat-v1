-- Backfill: populate whatsapp_number from phone where empty
-- Run once in Supabase SQL Editor

UPDATE profiles
SET whatsapp_number = phone
WHERE (whatsapp_number IS NULL OR whatsapp_number = '')
  AND phone IS NOT NULL
  AND phone != '';
