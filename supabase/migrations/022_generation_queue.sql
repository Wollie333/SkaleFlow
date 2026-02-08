-- Migration: 022_generation_queue.sql
-- Queue-Based Content Generation System
-- Tables: generation_batches, generation_queue

-- ============================================================================
-- Generation Batches — tracks a user-triggered generation request
-- ============================================================================

CREATE TABLE IF NOT EXISTS generation_batches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  calendar_id uuid REFERENCES content_calendars(id) ON DELETE SET NULL,
  user_id uuid NOT NULL REFERENCES users(id),
  model_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  total_items integer NOT NULL DEFAULT 0,
  completed_items integer NOT NULL DEFAULT 0,
  failed_items integer NOT NULL DEFAULT 0,
  uniqueness_log jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- ============================================================================
-- Generation Queue — one row per content item to generate
-- ============================================================================

CREATE TABLE IF NOT EXISTS generation_queue (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_id uuid NOT NULL REFERENCES generation_batches(id) ON DELETE CASCADE,
  content_item_id uuid NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  priority integer NOT NULL DEFAULT 0,
  attempt_count integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  locked_at timestamptz,
  error_message text,
  created_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- ============================================================================
-- Indexes
-- ============================================================================

-- For finding pending items efficiently (cron worker)
CREATE INDEX IF NOT EXISTS idx_generation_queue_pending
  ON generation_queue (status, priority, created_at)
  WHERE status = 'pending';

-- For batch progress queries
CREATE INDEX IF NOT EXISTS idx_generation_queue_batch_status
  ON generation_queue (batch_id, status);

-- For finding active batches
CREATE INDEX IF NOT EXISTS idx_generation_batches_status
  ON generation_batches (status)
  WHERE status IN ('pending', 'processing');

-- For org lookups
CREATE INDEX IF NOT EXISTS idx_generation_batches_org
  ON generation_batches (organization_id, created_at DESC);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE generation_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_queue ENABLE ROW LEVEL SECURITY;

-- Org members can view batches for their org
CREATE POLICY "Org members can view generation_batches"
  ON generation_batches FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Org members can view queue items for their org
CREATE POLICY "Org members can view generation_queue"
  ON generation_queue FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Service role handles all inserts/updates (no user INSERT/UPDATE policies needed)
