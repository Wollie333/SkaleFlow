-- Migration 099: Workspace Support for Permissions & Credits
-- Final migration: Adds workspace_id to team_permissions and team_credit_allocations

-- =====================================================
-- TEAM PERMISSIONS & CREDITS
-- =====================================================

-- Add workspace_id to team_permissions
ALTER TABLE team_permissions ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_team_permissions_workspace ON team_permissions(workspace_id);

-- Add workspace_id to team_credit_allocations
ALTER TABLE team_credit_allocations ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_team_credit_allocations_workspace ON team_credit_allocations(workspace_id);

-- =====================================================
-- DATA MIGRATION TO DEFAULT WORKSPACES
-- =====================================================

-- Migrate team_permissions data
UPDATE team_permissions tp
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = tp.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Migrate team_credit_allocations data
UPDATE team_credit_allocations tca
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = tca.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- =====================================================
-- UPDATE UNIQUE CONSTRAINTS
-- =====================================================

-- Update team_permissions unique constraint to include workspace_id
ALTER TABLE team_permissions DROP CONSTRAINT IF EXISTS team_permissions_organization_id_user_id_feature_key;
ALTER TABLE team_permissions ADD CONSTRAINT team_permissions_unique
  UNIQUE(workspace_id, user_id, feature);

-- Update team_credit_allocations unique constraint to include workspace_id
ALTER TABLE team_credit_allocations DROP CONSTRAINT IF EXISTS team_credit_allocations_organization_id_user_id_feature_key;
ALTER TABLE team_credit_allocations ADD CONSTRAINT team_credit_allocations_unique
  UNIQUE(workspace_id, user_id, feature);

-- =====================================================
-- UPDATE RLS POLICIES
-- =====================================================

-- Team Permissions RLS
DROP POLICY IF EXISTS team_permissions_select_own ON team_permissions;
DROP POLICY IF EXISTS team_permissions_manage ON team_permissions;

CREATE POLICY "team_permissions_select_workspace" ON team_permissions
  FOR SELECT USING (
    auth.uid() = user_id
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "team_permissions_manage_workspace" ON team_permissions
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Team Credit Allocations RLS
DROP POLICY IF EXISTS team_credit_allocations_select ON team_credit_allocations;
DROP POLICY IF EXISTS team_credit_allocations_manage ON team_credit_allocations;

CREATE POLICY "team_credit_allocations_select_workspace" ON team_credit_allocations
  FOR SELECT USING (
    auth.uid() = user_id
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "team_credit_allocations_manage_workspace" ON team_credit_allocations
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to copy permissions from default workspace to new workspace
CREATE OR REPLACE FUNCTION copy_permissions_to_workspace(
  p_source_workspace_id UUID,
  p_target_workspace_id UUID
)
RETURNS void AS $$
BEGIN
  -- Copy team permissions
  INSERT INTO team_permissions (organization_id, workspace_id, user_id, feature, permissions, created_at, updated_at)
  SELECT
    organization_id,
    p_target_workspace_id,
    user_id,
    feature,
    permissions,
    NOW(),
    NOW()
  FROM team_permissions
  WHERE workspace_id = p_source_workspace_id;

  -- Copy team credit allocations
  INSERT INTO team_credit_allocations (organization_id, workspace_id, user_id, feature, credits_allocated, credits_remaining, created_at, updated_at)
  SELECT
    organization_id,
    p_target_workspace_id,
    user_id,
    feature,
    credits_allocated,
    credits_allocated, -- Reset remaining credits to full allocation
    NOW(),
    NOW()
  FROM team_credit_allocations
  WHERE workspace_id = p_source_workspace_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION copy_permissions_to_workspace IS 'Copies permissions and credit allocations from one workspace to another';

-- Function to get workspace credit usage
CREATE OR REPLACE FUNCTION get_workspace_credits_used(ws_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN cost_cents IS NOT NULL THEN cost_cents / 10
      ELSE input_tokens + output_tokens
    END
  ), 0)::INTEGER
  FROM ai_usage
  WHERE workspace_id = ws_id;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_workspace_credits_used IS 'Returns total credits used by a workspace';

-- Function to get org-wide credit usage across all workspaces
CREATE OR REPLACE FUNCTION get_org_credits_used(org_id UUID)
RETURNS INTEGER AS $$
  SELECT COALESCE(SUM(
    CASE
      WHEN cost_cents IS NOT NULL THEN cost_cents / 10
      ELSE input_tokens + output_tokens
    END
  ), 0)::INTEGER
  FROM ai_usage
  WHERE organization_id = org_id;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_org_credits_used IS 'Returns total credits used across all workspaces in an organization';

-- =====================================================
-- VALIDATION
-- =====================================================

DO $$
DECLARE
  null_count INTEGER;
BEGIN
  -- Check team_permissions
  SELECT COUNT(*) INTO null_count FROM team_permissions WHERE workspace_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: % team_permissions records without workspace_id', null_count;
  END IF;

  -- Check team_credit_allocations
  SELECT COUNT(*) INTO null_count FROM team_credit_allocations WHERE workspace_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: % team_credit_allocations records without workspace_id', null_count;
  END IF;

  RAISE NOTICE 'Migration 099 validation passed: All permissions and credits have workspace_id';
  RAISE NOTICE '==============================================';
  RAISE NOTICE 'MULTI-WORKSPACE MIGRATION COMPLETE!';
  RAISE NOTICE 'All 5 phases successfully migrated to workspace model';
  RAISE NOTICE '==============================================';
END $$;
