-- =====================================================
-- RENAME permission_templates TO team_roles
-- Avoids conflict with existing template feature
--
-- NOTE: This does NOT affect:
--   - content_templates (for post/content templates)
--   - email_templates (for email templates)
--   - call_templates (for call templates)
--   - template_stage_mappings (for content template stages)
-- =====================================================

-- Step 1: Drop ONLY permission_templates table if it exists
-- (NOT touching content_templates or other template tables)
DROP TABLE IF EXISTS permission_template_assignments CASCADE;
DROP TABLE IF EXISTS permission_templates CASCADE;

-- Step 2: Create team_roles table
CREATE TABLE team_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  description TEXT,

  -- Store the permission structure for each feature
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- System roles are predefined (e.g., "Social Media Manager")
  -- Custom roles are created by org admins
  is_system_role BOOLEAN DEFAULT false,

  -- Display order
  sort_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure unique names per organization (or system-wide for system roles)
  CONSTRAINT unique_role_name UNIQUE NULLS NOT DISTINCT (organization_id, name)
);

CREATE INDEX idx_team_roles_org ON team_roles(organization_id);
CREATE INDEX idx_team_roles_system ON team_roles(is_system_role) WHERE is_system_role = true;

-- Enable RLS
ALTER TABLE team_roles ENABLE ROW LEVEL SECURITY;

-- Users can view system roles and their org's roles
CREATE POLICY "team_roles_select" ON team_roles
  FOR SELECT USING (
    is_system_role = true
    OR organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Only org admins can manage custom roles
CREATE POLICY "team_roles_insert" ON team_roles
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    AND is_system_role = false
  );

CREATE POLICY "team_roles_update" ON team_roles
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    AND is_system_role = false
  );

CREATE POLICY "team_roles_delete" ON team_roles
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    AND is_system_role = false
  );

-- Step 3: Create tracking table for role assignments
CREATE TABLE team_role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES team_roles(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by UUID REFERENCES users(id) ON DELETE SET NULL,
  permissions_snapshot JSONB
);

CREATE INDEX idx_team_role_assignments_user ON team_role_assignments(user_id);
CREATE INDEX idx_team_role_assignments_workspace ON team_role_assignments(workspace_id);
CREATE INDEX idx_team_role_assignments_role ON team_role_assignments(role_id);

ALTER TABLE team_role_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_role_assignments_select" ON team_role_assignments
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Step 4: Insert 8 system roles
INSERT INTO team_roles (name, description, permissions, is_system_role, sort_order) VALUES

-- 1. Social Media Manager
('Social Media Manager', 'Full access to content creation, scheduling, and publishing. Can upload media and manage social posts.',
'{"brand_engine": {"access": true, "chat": false, "edit_variables": false}, "content_engine": {"access": true, "create": true, "edit": true, "edit_others": false, "delete": false, "upload_media": true, "request_approval": true, "approve": false, "reject": false, "request_revision": false, "schedule": true, "change_schedule": true, "publish": true, "comment": true, "mention": true, "view_analytics": true, "view_revisions": true, "revert": false}, "pipeline": {"access": false}}'::jsonb, true, 1),

-- 2. Content Creator
('Content Creator', 'Can create and edit content, upload media, and request approvals. Cannot publish or schedule independently.',
'{"brand_engine": {"access": true, "chat": false, "edit_variables": false}, "content_engine": {"access": true, "create": true, "edit": true, "edit_others": false, "delete": false, "upload_media": true, "request_approval": true, "approve": false, "reject": false, "request_revision": false, "schedule": false, "change_schedule": false, "publish": false, "comment": true, "mention": true, "view_analytics": false, "view_revisions": true, "revert": false}, "pipeline": {"access": false}}'::jsonb, true, 2),

-- 3. Content Strategist
('Content Strategist', 'Can view brand strategy, create content plans, review and approve content. Cannot publish or upload media.',
'{"brand_engine": {"access": true, "chat": true, "edit_variables": false}, "content_engine": {"access": true, "create": true, "edit": true, "edit_others": true, "delete": false, "upload_media": false, "request_approval": true, "approve": true, "reject": true, "request_revision": true, "schedule": false, "change_schedule": true, "publish": false, "comment": true, "mention": true, "view_analytics": true, "view_revisions": true, "revert": true}, "pipeline": {"access": false}}'::jsonb, true, 3),

-- 4. Brand Manager
('Brand Manager', 'Full access to brand engine and content strategy. Can edit brand variables and approve content.',
'{"brand_engine": {"access": true, "chat": true, "edit_variables": true}, "content_engine": {"access": true, "create": true, "edit": true, "edit_others": true, "delete": true, "upload_media": true, "request_approval": true, "approve": true, "reject": true, "request_revision": true, "schedule": true, "change_schedule": true, "publish": true, "comment": true, "mention": true, "view_analytics": true, "view_revisions": true, "revert": true}, "pipeline": {"access": false}}'::jsonb, true, 4),

-- 5. Copywriter
('Copywriter', 'Can create and edit copy, request approvals. Limited to text content only.',
'{"brand_engine": {"access": true, "chat": false, "edit_variables": false}, "content_engine": {"access": true, "create": true, "edit": true, "edit_others": false, "delete": false, "upload_media": false, "request_approval": true, "approve": false, "reject": false, "request_revision": false, "schedule": false, "change_schedule": false, "publish": false, "comment": true, "mention": true, "view_analytics": false, "view_revisions": true, "revert": false}, "pipeline": {"access": false}}'::jsonb, true, 5),

-- 6. Graphic Designer
('Graphic Designer', 'Can upload and manage media assets. Cannot create or edit copy.',
'{"brand_engine": {"access": true, "chat": false, "edit_variables": false}, "content_engine": {"access": true, "create": false, "edit": false, "edit_others": false, "delete": false, "upload_media": true, "request_approval": false, "approve": false, "reject": false, "request_revision": false, "schedule": false, "change_schedule": false, "publish": false, "comment": true, "mention": true, "view_analytics": false, "view_revisions": false, "revert": false}, "pipeline": {"access": false}}'::jsonb, true, 6),

-- 7. Viewer (Read-Only)
('Viewer', 'Read-only access to view content and brand assets. Cannot create, edit, or publish.',
'{"brand_engine": {"access": true, "chat": false, "edit_variables": false}, "content_engine": {"access": true, "create": false, "edit": false, "edit_others": false, "delete": false, "upload_media": false, "request_approval": false, "approve": false, "reject": false, "request_revision": false, "schedule": false, "change_schedule": false, "publish": false, "comment": true, "mention": false, "view_analytics": true, "view_revisions": true, "revert": false}, "pipeline": {"access": false}}'::jsonb, true, 7),

-- 8. Community Manager
('Community Manager', 'Full content access plus pipeline for managing community interactions and contacts.',
'{"brand_engine": {"access": true, "chat": false, "edit_variables": false}, "content_engine": {"access": true, "create": true, "edit": true, "edit_others": false, "delete": false, "upload_media": true, "request_approval": true, "approve": false, "reject": false, "request_revision": false, "schedule": true, "change_schedule": true, "publish": true, "comment": true, "mention": true, "view_analytics": true, "view_revisions": true, "revert": false}, "pipeline": {"access": true, "manage_contacts": true, "send_emails": false}}'::jsonb, true, 8);

-- Step 5: Verify roles were inserted
SELECT
  COUNT(*) as total_roles,
  COUNT(*) FILTER (WHERE is_system_role = true) as system_roles,
  COUNT(*) FILTER (WHERE is_system_role = false) as custom_roles,
  string_agg(name, ', ' ORDER BY sort_order) as role_names
FROM team_roles
WHERE is_system_role = true;
