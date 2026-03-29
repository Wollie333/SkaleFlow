-- =====================================================
-- RESTORE ORIGINAL permission_templates TABLE
-- This restores the admin templates feature from migration 067
-- Keeps team_roles separate for team role management
-- =====================================================

-- Step 1: Recreate permission_templates table (original structure from migration 067)
CREATE TABLE IF NOT EXISTS permission_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_system BOOLEAN NOT NULL DEFAULT false,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_permission_templates_org ON permission_templates(organization_id);

-- Enable RLS
ALTER TABLE permission_templates ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "permission_templates_select" ON permission_templates;
DROP POLICY IF EXISTS "permission_templates_insert" ON permission_templates;
DROP POLICY IF EXISTS "permission_templates_update" ON permission_templates;
DROP POLICY IF EXISTS "permission_templates_delete" ON permission_templates;

-- Recreate RLS policies (original from migration 067)
CREATE POLICY "permission_templates_select" ON permission_templates
  FOR SELECT USING (
    is_system = true
    OR (
      organization_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM org_members
        WHERE org_members.organization_id = permission_templates.organization_id
          AND org_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "permission_templates_insert" ON permission_templates
  FOR INSERT WITH CHECK (
    is_system = false
    AND organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.organization_id = permission_templates.organization_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "permission_templates_update" ON permission_templates
  FOR UPDATE USING (
    is_system = false
    AND organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.organization_id = permission_templates.organization_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "permission_templates_delete" ON permission_templates
  FOR DELETE USING (
    is_system = false
    AND organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.organization_id = permission_templates.organization_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

-- Step 2: Delete any existing templates to avoid duplicates
DELETE FROM permission_templates WHERE is_system = true;

-- Step 3: Seed 4 original system templates from migration 067
INSERT INTO permission_templates (name, description, permissions, is_system) VALUES
  ('Content Creator', 'Can create, edit, and schedule content. No brand engine access.', '{
    "brand_engine": {"access": false},
    "content_engine": {"access": true, "create": true, "edit": true, "schedule": true, "publish": false},
    "pipeline": {"access": false},
    "ad_campaigns": {"access": false}
  }'::jsonb, true),
  ('Brand Manager', 'Full brand engine access plus content creation.', '{
    "brand_engine": {"access": true, "chat": true, "edit_variables": true},
    "content_engine": {"access": true, "create": true, "edit": true, "schedule": true, "publish": true},
    "pipeline": {"access": false},
    "ad_campaigns": {"access": false}
  }'::jsonb, true),
  ('Viewer Only', 'Read-only access to all features. Cannot create or edit.', '{
    "brand_engine": {"access": true, "chat": false, "edit_variables": false},
    "content_engine": {"access": true, "create": false, "edit": false, "schedule": false, "publish": false},
    "pipeline": {"access": true},
    "ad_campaigns": {"access": true}
  }'::jsonb, true),
  ('Full Access', 'Complete access to all features and capabilities.', '{
    "brand_engine": {"access": true, "chat": true, "edit_variables": true},
    "content_engine": {"access": true, "create": true, "edit": true, "schedule": true, "publish": true},
    "pipeline": {"access": true},
    "ad_campaigns": {"access": true}
  }'::jsonb, true);

-- Step 4: Create permission_template_assignments tracking table
CREATE TABLE IF NOT EXISTS permission_template_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES permission_templates(id) ON DELETE CASCADE,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  applied_by UUID REFERENCES users(id) ON DELETE SET NULL,
  permissions_snapshot JSONB
);

CREATE INDEX IF NOT EXISTS idx_permission_template_assignments_user ON permission_template_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_permission_template_assignments_workspace ON permission_template_assignments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_permission_template_assignments_template ON permission_template_assignments(template_id);

ALTER TABLE permission_template_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "permission_template_assignments_select" ON permission_template_assignments;

CREATE POLICY "permission_template_assignments_select" ON permission_template_assignments
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Step 5: Verify templates were restored
SELECT
  COUNT(*) as total_templates,
  COUNT(*) FILTER (WHERE is_system = true) as system_templates,
  COUNT(*) FILTER (WHERE is_system = false) as custom_templates,
  string_agg(name, ', ' ORDER BY name) as template_names
FROM permission_templates
WHERE is_system = true;
