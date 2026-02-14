-- Add creative_direction column to generation_batches
-- Allows users to provide a short prompt that guides AI content generation
ALTER TABLE generation_batches ADD COLUMN IF NOT EXISTS creative_direction TEXT;
