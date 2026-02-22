-- Migration 068: Saved Replies for Social Inbox
-- Adds missing columns to the existing saved_replies table

-- Add missing columns (idempotent with DO block)
DO $$
BEGIN
  -- Add created_by if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_replies' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE saved_replies ADD COLUMN created_by UUID REFERENCES users(id) ON DELETE CASCADE;
    -- Backfill with a default (first org admin)
    UPDATE saved_replies sr
    SET created_by = (
      SELECT om.user_id FROM org_members om
      WHERE om.organization_id = sr.organization_id AND om.role = 'owner'
      LIMIT 1
    )
    WHERE sr.created_by IS NULL;
    ALTER TABLE saved_replies ALTER COLUMN created_by SET NOT NULL;
  END IF;

  -- Add body column (rename content -> body)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_replies' AND column_name = 'body'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'saved_replies' AND column_name = 'content'
    ) THEN
      ALTER TABLE saved_replies RENAME COLUMN content TO body;
    ELSE
      ALTER TABLE saved_replies ADD COLUMN body TEXT NOT NULL DEFAULT '';
    END IF;
  END IF;

  -- Add shortcut if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_replies' AND column_name = 'shortcut'
  ) THEN
    ALTER TABLE saved_replies ADD COLUMN shortcut TEXT;
  END IF;

  -- Ensure category is NOT NULL with default
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'saved_replies' AND column_name = 'category' AND is_nullable = 'YES'
  ) THEN
    UPDATE saved_replies SET category = 'general' WHERE category IS NULL;
    ALTER TABLE saved_replies ALTER COLUMN category SET NOT NULL;
    ALTER TABLE saved_replies ALTER COLUMN category SET DEFAULT 'general';
  END IF;
END $$;

-- Indexes (idempotent)
CREATE INDEX IF NOT EXISTS idx_saved_replies_org ON saved_replies(organization_id);
CREATE INDEX IF NOT EXISTS idx_saved_replies_category ON saved_replies(organization_id, category);
DROP INDEX IF EXISTS idx_saved_replies_shortcut;
CREATE UNIQUE INDEX idx_saved_replies_shortcut ON saved_replies(organization_id, shortcut) WHERE shortcut IS NOT NULL;

-- RLS
ALTER TABLE saved_replies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first (idempotent)
DROP POLICY IF EXISTS "Org members can view saved replies" ON saved_replies;
DROP POLICY IF EXISTS "Org members can create saved replies" ON saved_replies;
DROP POLICY IF EXISTS "Creator or admin can update saved replies" ON saved_replies;
DROP POLICY IF EXISTS "Creator or admin can delete saved replies" ON saved_replies;
DROP POLICY IF EXISTS "Service role full access to saved replies" ON saved_replies;

-- Org members can view all replies in their org
CREATE POLICY "Org members can view saved replies"
  ON saved_replies FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Org members can create replies
CREATE POLICY "Org members can create saved replies"
  ON saved_replies FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Creator or admin can update
CREATE POLICY "Creator or admin can update saved replies"
  ON saved_replies FOR UPDATE
  USING (
    created_by = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Creator or admin can delete
CREATE POLICY "Creator or admin can delete saved replies"
  ON saved_replies FOR DELETE
  USING (
    created_by = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Service role bypass for use_count updates
CREATE POLICY "Service role full access to saved replies"
  ON saved_replies FOR ALL
  USING (auth.role() = 'service_role');
