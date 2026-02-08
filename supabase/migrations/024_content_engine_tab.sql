-- Migration 024: Content Engine Tab
-- Add selected_brand_variables to generation_batches for granular brand variable control

ALTER TABLE generation_batches
  ADD COLUMN IF NOT EXISTS selected_brand_variables JSONB DEFAULT NULL;

-- NULL = all variables (backward-compatible with existing batches)
