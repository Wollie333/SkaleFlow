-- Migration 033: Placement Variations
-- Adds placement_type, variation_group_id to content_items
-- Adds generate_scripts, selected_placements to generation_batches

-- Content items: placement fields
ALTER TABLE content_items
  ADD COLUMN IF NOT EXISTS placement_type TEXT NULL,
  ADD COLUMN IF NOT EXISTS variation_group_id UUID NULL,
  ADD COLUMN IF NOT EXISTS is_primary_variation BOOLEAN DEFAULT false;

-- Indexes for placement queries
CREATE INDEX IF NOT EXISTS idx_content_items_variation_group
  ON content_items(variation_group_id)
  WHERE variation_group_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_items_placement
  ON content_items(placement_type)
  WHERE placement_type IS NOT NULL;

-- Generation batches: script generation and placement config
ALTER TABLE generation_batches
  ADD COLUMN IF NOT EXISTS generate_scripts BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS selected_placements JSONB NULL;
