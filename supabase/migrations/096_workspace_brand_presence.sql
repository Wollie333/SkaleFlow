-- Migration 096: Workspace Support for Brand & Presence Engines
-- Adds workspace_id to Brand and Presence engine tables and migrates existing data

-- =====================================================
-- BRAND ENGINE TABLES
-- =====================================================

-- Add workspace_id to brand_phases
ALTER TABLE brand_phases ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_brand_phases_workspace ON brand_phases(workspace_id);

-- Add workspace_id to brand_outputs
ALTER TABLE brand_outputs ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_brand_outputs_workspace ON brand_outputs(workspace_id);

-- Add workspace_id to brand_conversations
ALTER TABLE brand_conversations ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_brand_conversations_workspace ON brand_conversations(workspace_id);

-- Add workspace_id to brand_playbooks
ALTER TABLE brand_playbooks ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_brand_playbooks_workspace ON brand_playbooks(workspace_id);

-- =====================================================
-- PRESENCE ENGINE TABLES
-- =====================================================

-- Add workspace_id to presence_platforms
ALTER TABLE presence_platforms ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_presence_platforms_workspace ON presence_platforms(workspace_id);

-- Add workspace_id to presence_phases
ALTER TABLE presence_phases ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_presence_phases_workspace ON presence_phases(workspace_id);

-- Add workspace_id to presence_outputs
ALTER TABLE presence_outputs ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_presence_outputs_workspace ON presence_outputs(workspace_id);

-- Add workspace_id to presence_conversations
ALTER TABLE presence_conversations ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_presence_conversations_workspace ON presence_conversations(workspace_id);

-- Add workspace_id to presence_playbooks (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'presence_playbooks') THEN
    ALTER TABLE presence_playbooks ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    CREATE INDEX idx_presence_playbooks_workspace ON presence_playbooks(workspace_id);
  END IF;
END $$;

-- Add workspace_id to presence_profile_screenshots (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'presence_profile_screenshots') THEN
    ALTER TABLE presence_profile_screenshots ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    CREATE INDEX idx_presence_profile_screenshots_workspace ON presence_profile_screenshots(workspace_id);
  END IF;
END $$;

-- =====================================================
-- DATA MIGRATION TO DEFAULT WORKSPACES
-- =====================================================

-- Migrate brand_phases data
UPDATE brand_phases bp
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = bp.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Migrate brand_outputs data
UPDATE brand_outputs bo
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = bo.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Migrate brand_conversations data
UPDATE brand_conversations bc
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = bc.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Migrate brand_playbooks data
UPDATE brand_playbooks bp
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = bp.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Migrate presence_platforms data
UPDATE presence_platforms pp
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = pp.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Migrate presence_phases data
UPDATE presence_phases pp
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = pp.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Migrate presence_outputs data
UPDATE presence_outputs po
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = po.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Migrate presence_conversations data
UPDATE presence_conversations pc
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = pc.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Migrate presence_playbooks data (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'presence_playbooks') THEN
    UPDATE presence_playbooks pp
    SET workspace_id = (
      SELECT id FROM workspaces w
      WHERE w.organization_id = pp.organization_id
      AND w.is_default = TRUE
      LIMIT 1
    )
    WHERE workspace_id IS NULL;
  END IF;
END $$;

-- Migrate presence_profile_screenshots data (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'presence_profile_screenshots') THEN
    UPDATE presence_profile_screenshots pps
    SET workspace_id = (
      SELECT id FROM workspaces w
      WHERE w.organization_id = pps.organization_id
      AND w.is_default = TRUE
      LIMIT 1
    )
    WHERE workspace_id IS NULL;
  END IF;
END $$;

-- =====================================================
-- UPDATE RLS POLICIES
-- =====================================================

-- Brand Phases RLS
DROP POLICY IF EXISTS brand_phases_org_select ON brand_phases;
DROP POLICY IF EXISTS brand_phases_org_insert ON brand_phases;
DROP POLICY IF EXISTS brand_phases_org_update ON brand_phases;
DROP POLICY IF EXISTS brand_phases_org_delete ON brand_phases;

CREATE POLICY "brand_phases_workspace_access" ON brand_phases
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Brand Outputs RLS
DROP POLICY IF EXISTS brand_outputs_org_select ON brand_outputs;
DROP POLICY IF EXISTS brand_outputs_org_insert ON brand_outputs;
DROP POLICY IF EXISTS brand_outputs_org_update ON brand_outputs;
DROP POLICY IF EXISTS brand_outputs_org_delete ON brand_outputs;

CREATE POLICY "brand_outputs_workspace_access" ON brand_outputs
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Brand Conversations RLS
DROP POLICY IF EXISTS brand_conversations_org_select ON brand_conversations;
DROP POLICY IF EXISTS brand_conversations_org_insert ON brand_conversations;
DROP POLICY IF EXISTS brand_conversations_org_update ON brand_conversations;
DROP POLICY IF EXISTS brand_conversations_org_delete ON brand_conversations;

CREATE POLICY "brand_conversations_workspace_access" ON brand_conversations
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Brand Playbooks RLS
DROP POLICY IF EXISTS brand_playbooks_org_select ON brand_playbooks;
DROP POLICY IF EXISTS brand_playbooks_org_insert ON brand_playbooks;
DROP POLICY IF EXISTS brand_playbooks_org_update ON brand_playbooks;
DROP POLICY IF EXISTS brand_playbooks_org_delete ON brand_playbooks;
DROP POLICY IF EXISTS brand_playbooks_public_select ON brand_playbooks;

CREATE POLICY "brand_playbooks_workspace_access" ON brand_playbooks
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Keep public access for published playbooks (if is_public column exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'brand_playbooks' AND column_name = 'is_public'
  ) THEN
    EXECUTE 'CREATE POLICY brand_playbooks_public_access ON brand_playbooks
      FOR SELECT USING (is_public = TRUE)';
  END IF;
END $$;

-- Presence Platforms RLS
DROP POLICY IF EXISTS presence_platforms_org_select ON presence_platforms;
DROP POLICY IF EXISTS presence_platforms_org_insert ON presence_platforms;
DROP POLICY IF EXISTS presence_platforms_org_update ON presence_platforms;
DROP POLICY IF EXISTS presence_platforms_org_delete ON presence_platforms;

CREATE POLICY "presence_platforms_workspace_access" ON presence_platforms
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Presence Phases RLS
DROP POLICY IF EXISTS presence_phases_org_select ON presence_phases;
DROP POLICY IF EXISTS presence_phases_org_insert ON presence_phases;
DROP POLICY IF EXISTS presence_phases_org_update ON presence_phases;
DROP POLICY IF EXISTS presence_phases_org_delete ON presence_phases;

CREATE POLICY "presence_phases_workspace_access" ON presence_phases
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Presence Outputs RLS
DROP POLICY IF EXISTS presence_outputs_org_select ON presence_outputs;
DROP POLICY IF EXISTS presence_outputs_org_insert ON presence_outputs;
DROP POLICY IF EXISTS presence_outputs_org_update ON presence_outputs;
DROP POLICY IF EXISTS presence_outputs_org_delete ON presence_outputs;

CREATE POLICY "presence_outputs_workspace_access" ON presence_outputs
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Presence Conversations RLS
DROP POLICY IF EXISTS presence_conversations_org_select ON presence_conversations;
DROP POLICY IF EXISTS presence_conversations_org_insert ON presence_conversations;
DROP POLICY IF EXISTS presence_conversations_org_update ON presence_conversations;
DROP POLICY IF EXISTS presence_conversations_org_delete ON presence_conversations;

CREATE POLICY "presence_conversations_workspace_access" ON presence_conversations
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Presence Playbooks RLS (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'presence_playbooks') THEN
    EXECUTE 'DROP POLICY IF EXISTS presence_playbooks_org_select ON presence_playbooks';
    EXECUTE 'DROP POLICY IF EXISTS presence_playbooks_org_insert ON presence_playbooks';
    EXECUTE 'DROP POLICY IF EXISTS presence_playbooks_org_update ON presence_playbooks';
    EXECUTE 'DROP POLICY IF EXISTS presence_playbooks_org_delete ON presence_playbooks';

    EXECUTE 'CREATE POLICY presence_playbooks_workspace_access ON presence_playbooks
      FOR ALL USING (
        workspace_id IN (
          SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
      )';
  END IF;
END $$;

-- Presence Profile Screenshots RLS (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'presence_profile_screenshots') THEN
    EXECUTE 'DROP POLICY IF EXISTS presence_profile_screenshots_org_select ON presence_profile_screenshots';
    EXECUTE 'DROP POLICY IF EXISTS presence_profile_screenshots_org_insert ON presence_profile_screenshots';
    EXECUTE 'DROP POLICY IF EXISTS presence_profile_screenshots_org_update ON presence_profile_screenshots';
    EXECUTE 'DROP POLICY IF EXISTS presence_profile_screenshots_org_delete ON presence_profile_screenshots';

    EXECUTE 'CREATE POLICY presence_profile_screenshots_workspace_access ON presence_profile_screenshots
      FOR ALL USING (
        workspace_id IN (
          SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
      )';
  END IF;
END $$;

-- =====================================================
-- VALIDATION
-- =====================================================

DO $$
DECLARE
  null_count INTEGER;
BEGIN
  -- Check brand_phases
  SELECT COUNT(*) INTO null_count FROM brand_phases WHERE workspace_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: % brand_phases records without workspace_id', null_count;
  END IF;

  -- Check brand_outputs
  SELECT COUNT(*) INTO null_count FROM brand_outputs WHERE workspace_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: % brand_outputs records without workspace_id', null_count;
  END IF;

  -- Check presence_platforms
  SELECT COUNT(*) INTO null_count FROM presence_platforms WHERE workspace_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: % presence_platforms records without workspace_id', null_count;
  END IF;

  -- Check presence_phases
  SELECT COUNT(*) INTO null_count FROM presence_phases WHERE workspace_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: % presence_phases records without workspace_id', null_count;
  END IF;

  RAISE NOTICE 'Migration 096 validation passed: All Brand and Presence Engine records have workspace_id';
END $$;
