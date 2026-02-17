-- Migration 057: Add source column to offers table for Brand Engine sync tracking
ALTER TABLE offers ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'manual';

-- Max 1 brand-engine-synced offer per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_offers_brand_engine_unique
  ON offers (organization_id) WHERE source = 'brand_engine';
