-- Migration 037: Add template_overrides column to generation_batches
-- Stores user-selected template overrides { script?: string, hook?: string, cta?: string }
-- NULL = smart mode (AI picks best template)

ALTER TABLE generation_batches ADD COLUMN IF NOT EXISTS template_overrides JSONB DEFAULT NULL;
