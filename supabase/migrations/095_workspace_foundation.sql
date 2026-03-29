-- Migration 095: Workspace Foundation
-- Creates core workspace tables and RLS policies for multi-workspace support
-- This migration creates default workspaces for all existing orgs (backward compatible)

-- =====================================================
-- CORE WORKSPACE TABLES
-- =====================================================

-- 1. WORKSPACES TABLE
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  color TEXT DEFAULT '#0891b2',
  is_default BOOLEAN DEFAULT FALSE,

  -- Settings (mirrors org-level settings for workspace-specific config)
  settings JSONB DEFAULT '{}',

  -- Engine status tracking
  brand_engine_status TEXT DEFAULT 'not_started'
    CHECK (brand_engine_status IN ('not_started', 'in_progress', 'completed')),
  content_engine_enabled BOOLEAN DEFAULT FALSE,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, slug)
);

CREATE INDEX idx_workspaces_org ON workspaces(organization_id);
CREATE INDEX idx_workspaces_slug ON workspaces(organization_id, slug);
CREATE INDEX idx_workspaces_created_by ON workspaces(created_by);

COMMENT ON TABLE workspaces IS 'Multi-workspace support: Each workspace represents a separate brand/business with isolated engines';
COMMENT ON COLUMN workspaces.is_default IS 'First workspace created per org (cannot be deleted)';
COMMENT ON COLUMN workspaces.color IS 'Hex color for visual distinction in UI';


-- 2. WORKSPACE MEMBERS TABLE
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Workspace-specific role (can differ from org role)
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('admin', 'member', 'viewer')),

  added_by UUID REFERENCES users(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_user ON workspace_members(user_id);
CREATE INDEX idx_workspace_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_workspace_members_org ON workspace_members(organization_id);
CREATE INDEX idx_workspace_members_role ON workspace_members(workspace_id, role);

COMMENT ON TABLE workspace_members IS 'Team assignments to workspaces with workspace-specific roles';
COMMENT ON COLUMN workspace_members.role IS 'Workspace role: admin (full control), member (edit content), viewer (read-only)';


-- 3. WORKSPACE LIMITS TABLE
CREATE TABLE workspace_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,

  max_workspaces INTEGER NOT NULL DEFAULT 3,

  set_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, user_id)
);

CREATE INDEX idx_workspace_limits_org ON workspace_limits(organization_id);
CREATE INDEX idx_workspace_limits_user ON workspace_limits(user_id) WHERE user_id IS NOT NULL;

COMMENT ON TABLE workspace_limits IS 'Admin-configurable workspace limits per org or per user';
COMMENT ON COLUMN workspace_limits.user_id IS 'NULL = org-level default, non-NULL = user-specific override';


-- 4. USER WORKSPACE CONTEXT TABLE
CREATE TABLE user_workspace_context (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  current_workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,

  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, organization_id)
);

CREATE INDEX idx_user_workspace_context_user ON user_workspace_context(user_id);
CREATE INDEX idx_user_workspace_context_org ON user_workspace_context(organization_id);

COMMENT ON TABLE user_workspace_context IS 'Tracks the last active workspace per user for quick context switching';


-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- WORKSPACES RLS
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspaces_select_member" ON workspaces
  FOR SELECT USING (
    -- User is member of the organization
    organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
    AND (
      -- And has access to this workspace
      id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
      )
      -- Or is org owner/admin (can see all workspaces)
      OR organization_id IN (
        SELECT organization_id FROM org_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
      )
    )
  );

CREATE POLICY "workspaces_insert_org_admin" ON workspaces
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "workspaces_update_org_admin" ON workspaces
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "workspaces_delete_org_admin" ON workspaces
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    AND is_default = FALSE -- Cannot delete default workspace
  );


-- WORKSPACE MEMBERS RLS
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_members_select" ON workspace_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "workspace_members_insert" ON workspace_members
  FOR INSERT WITH CHECK (
    -- Workspace admins can add members
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'admin'
    )
    -- Or org owner/admin
    OR organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "workspace_members_update" ON workspace_members
  FOR UPDATE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "workspace_members_delete" ON workspace_members
  FOR DELETE USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );


-- WORKSPACE LIMITS RLS
ALTER TABLE workspace_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_limits_select" ON workspace_limits
  FOR SELECT USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "workspace_limits_manage_admin" ON workspace_limits
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );


-- USER WORKSPACE CONTEXT RLS
ALTER TABLE user_workspace_context ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_workspace_context_own" ON user_workspace_context
  FOR ALL USING (user_id = auth.uid());


-- =====================================================
-- DATA MIGRATION: CREATE DEFAULT WORKSPACES
-- =====================================================

-- Function to create default workspace for an organization
CREATE OR REPLACE FUNCTION create_default_workspace_for_org(org_id UUID)
RETURNS UUID AS $$
DECLARE
  workspace_id UUID;
  org_name TEXT;
  org_brand_status TEXT;
  org_content_enabled BOOLEAN;
BEGIN
  -- Get org details
  SELECT name, brand_engine_status, content_engine_enabled
  INTO org_name, org_brand_status, org_content_enabled
  FROM organizations
  WHERE id = org_id;

  -- Create default workspace
  INSERT INTO workspaces (
    organization_id,
    name,
    slug,
    is_default,
    brand_engine_status,
    content_engine_enabled,
    created_at
  )
  VALUES (
    org_id,
    COALESCE(org_name, 'Default Workspace'),
    'default',
    TRUE,
    COALESCE(org_brand_status, 'not_started'),
    COALESCE(org_content_enabled, FALSE),
    NOW()
  )
  RETURNING id INTO workspace_id;

  -- Add all org members to workspace with mapped roles
  INSERT INTO workspace_members (workspace_id, user_id, organization_id, role, added_at)
  SELECT
    workspace_id,
    om.user_id,
    org_id,
    CASE
      WHEN om.role IN ('owner', 'admin') THEN 'admin'
      WHEN om.role = 'member' THEN 'member'
      ELSE 'viewer'
    END,
    NOW()
  FROM org_members om
  WHERE om.organization_id = org_id;

  RETURN workspace_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION create_default_workspace_for_org IS 'Creates default workspace for an org and adds all members';


-- Create default workspaces for all existing organizations
DO $$
DECLARE
  org RECORD;
  workspace_id UUID;
BEGIN
  FOR org IN SELECT id FROM organizations LOOP
    workspace_id := create_default_workspace_for_org(org.id);
    RAISE NOTICE 'Created default workspace % for org %', workspace_id, org.id;
  END LOOP;
END $$;


-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get user's workspaces in an organization
CREATE OR REPLACE FUNCTION get_user_workspaces(p_user_id UUID, p_org_id UUID)
RETURNS TABLE(
  workspace_id UUID,
  workspace_name TEXT,
  workspace_slug TEXT,
  workspace_color TEXT,
  workspace_role TEXT
) AS $$
BEGIN
  -- Check if user is org owner/admin (sees all workspaces)
  IF EXISTS (
    SELECT 1 FROM org_members
    WHERE user_id = p_user_id
    AND organization_id = p_org_id
    AND role IN ('owner', 'admin')
  ) THEN
    RETURN QUERY
    SELECT
      w.id,
      w.name,
      w.slug,
      w.color,
      'admin'::TEXT
    FROM workspaces w
    WHERE w.organization_id = p_org_id
    ORDER BY w.is_default DESC, w.name;
  ELSE
    -- Regular users see only assigned workspaces
    RETURN QUERY
    SELECT
      w.id,
      w.name,
      w.slug,
      w.color,
      wm.role
    FROM workspace_members wm
    JOIN workspaces w ON w.id = wm.workspace_id
    WHERE wm.user_id = p_user_id
    AND wm.organization_id = p_org_id
    ORDER BY w.is_default DESC, w.name;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_user_workspaces IS 'Returns all workspaces accessible to a user in an organization';


-- Function to get workspace limit for a user
CREATE OR REPLACE FUNCTION get_user_workspace_limit(p_user_id UUID, p_org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  user_limit INTEGER;
  org_limit INTEGER;
BEGIN
  -- Check user-specific limit
  SELECT max_workspaces INTO user_limit
  FROM workspace_limits
  WHERE organization_id = p_org_id
  AND user_id = p_user_id;

  IF user_limit IS NOT NULL THEN
    RETURN user_limit;
  END IF;

  -- Fall back to org default
  SELECT max_workspaces INTO org_limit
  FROM workspace_limits
  WHERE organization_id = p_org_id
  AND user_id IS NULL;

  RETURN COALESCE(org_limit, 3); -- Default to 3 if no limit set
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION get_user_workspace_limit IS 'Returns workspace limit for a user (checks user-specific, then org default, then 3)';


-- =====================================================
-- TRIGGERS
-- =====================================================

-- Auto-update updated_at on workspaces
CREATE OR REPLACE FUNCTION update_workspace_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER workspace_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_updated_at();


-- Auto-update updated_at on user_workspace_context
CREATE TRIGGER user_workspace_context_updated_at
  BEFORE UPDATE ON user_workspace_context
  FOR EACH ROW
  EXECUTE FUNCTION update_workspace_updated_at();


-- =====================================================
-- VALIDATION
-- =====================================================

-- Verify all orgs have default workspace
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM organizations o
  WHERE NOT EXISTS (
    SELECT 1 FROM workspaces w
    WHERE w.organization_id = o.id
    AND w.is_default = TRUE
  );

  IF missing_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: % organizations missing default workspace', missing_count;
  END IF;

  RAISE NOTICE 'Migration validation passed: All organizations have default workspace';
END $$;
