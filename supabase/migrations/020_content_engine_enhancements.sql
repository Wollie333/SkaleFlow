-- Migration 020: Content Engine Enhancements
-- Adds target_url and utm_parameters fields to content_items

ALTER TABLE content_items ADD COLUMN IF NOT EXISTS target_url TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS utm_parameters JSONB DEFAULT '{}'::jsonb;
