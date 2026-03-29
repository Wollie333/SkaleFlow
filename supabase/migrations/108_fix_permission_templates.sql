-- =====================================================
-- FIX PERMISSION TEMPLATES - Safe migration
-- Handles case where table already exists
-- =====================================================

-- Only create table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'permission_templates') THEN
    CREATE TABLE permission_templates (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
      is_system_template BOOLEAN DEFAULT false,
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(),
      CONSTRAINT unique_template_name UNIQUE NULLS NOT DISTINCT (organization_id, name)
    );

    CREATE INDEX idx_permission_templates_org ON permission_templates(organization_id);
    CREATE INDEX idx_permission_templates_system ON permission_templates(is_system_template) WHERE is_system_template = true;

    ALTER TABLE permission_templates ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "permission_templates_select" ON permission_templates
      FOR SELECT USING (
        is_system_template = true
        OR organization_id IN (
          SELECT organization_id FROM org_members WHERE user_id = auth.uid()
        )
      );

    CREATE POLICY "permission_templates_insert" ON permission_templates
      FOR INSERT WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM org_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
        AND is_system_template = false
      );

    CREATE POLICY "permission_templates_update" ON permission_templates
      FOR UPDATE USING (
        organization_id IN (
          SELECT organization_id FROM org_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
        AND is_system_template = false
      );

    CREATE POLICY "permission_templates_delete" ON permission_templates
      FOR DELETE USING (
        organization_id IN (
          SELECT organization_id FROM org_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
        )
        AND is_system_template = false
      );
  END IF;
END
$$;

-- Only create tracking table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'permission_template_assignments') THEN
    CREATE TABLE permission_template_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      template_id UUID NOT NULL REFERENCES permission_templates(id) ON DELETE SET NULL,
      applied_at TIMESTAMPTZ DEFAULT NOW(),
      applied_by UUID REFERENCES users(id) ON DELETE SET NULL,
      permissions_snapshot JSONB
    );

    CREATE INDEX idx_template_assignments_user ON permission_template_assignments(user_id);
    CREATE INDEX idx_template_assignments_workspace ON permission_template_assignments(workspace_id);
    CREATE INDEX idx_template_assignments_template ON permission_template_assignments(template_id);

    ALTER TABLE permission_template_assignments ENABLE ROW LEVEL SECURITY;

    CREATE POLICY "template_assignments_select" ON permission_template_assignments
      FOR SELECT USING (
        workspace_id IN (
          SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
        )
        OR organization_id IN (
          SELECT organization_id FROM org_members WHERE user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- =====================================================
-- SEED SYSTEM TEMPLATES (Skip if already exist)
-- =====================================================

-- Delete existing system templates to avoid duplicates
DELETE FROM permission_templates WHERE is_system_template = true;

-- Insert fresh system templates
INSERT INTO permission_templates (name, description, permissions, is_system_template, sort_order) VALUES

-- 1. Social Media Manager
('Social Media Manager', 'Full access to content creation, scheduling, and publishing. Can upload media and manage social posts.',
'{
  "brand_engine": {
    "access": true,
    "chat": false,
    "edit_variables": false
  },
  "content_engine": {
    "access": true,
    "create": true,
    "edit": true,
    "edit_others": false,
    "delete": false,
    "upload_media": true,
    "request_approval": true,
    "approve": false,
    "reject": false,
    "request_revision": false,
    "schedule": true,
    "change_schedule": true,
    "publish": true,
    "comment": true,
    "mention": true,
    "view_analytics": true,
    "view_revisions": true,
    "revert": false
  },
  "pipeline": {
    "access": false
  }
}'::jsonb, true, 1),

-- 2. Content Creator
('Content Creator', 'Can create and edit content, upload media, and request approvals. Cannot publish or schedule independently.',
'{
  "brand_engine": {
    "access": true,
    "chat": false,
    "edit_variables": false
  },
  "content_engine": {
    "access": true,
    "create": true,
    "edit": true,
    "edit_others": false,
    "delete": false,
    "upload_media": true,
    "request_approval": true,
    "approve": false,
    "reject": false,
    "request_revision": false,
    "schedule": false,
    "change_schedule": false,
    "publish": false,
    "comment": true,
    "mention": true,
    "view_analytics": false,
    "view_revisions": true,
    "revert": false
  },
  "pipeline": {
    "access": false
  }
}'::jsonb, true, 2),

-- 3. Content Strategist
('Content Strategist', 'Can view brand strategy, create content plans, review and approve content. Cannot publish or upload media.',
'{
  "brand_engine": {
    "access": true,
    "chat": true,
    "edit_variables": false
  },
  "content_engine": {
    "access": true,
    "create": true,
    "edit": true,
    "edit_others": true,
    "delete": false,
    "upload_media": false,
    "request_approval": true,
    "approve": true,
    "reject": true,
    "request_revision": true,
    "schedule": false,
    "change_schedule": true,
    "publish": false,
    "comment": true,
    "mention": true,
    "view_analytics": true,
    "view_revisions": true,
    "revert": true
  },
  "pipeline": {
    "access": false
  }
}'::jsonb, true, 3),

-- 4. Brand Manager
('Brand Manager', 'Full access to brand engine and content strategy. Can edit brand variables and approve content.',
'{
  "brand_engine": {
    "access": true,
    "chat": true,
    "edit_variables": true
  },
  "content_engine": {
    "access": true,
    "create": true,
    "edit": true,
    "edit_others": true,
    "delete": true,
    "upload_media": true,
    "request_approval": true,
    "approve": true,
    "reject": true,
    "request_revision": true,
    "schedule": true,
    "change_schedule": true,
    "publish": true,
    "comment": true,
    "mention": true,
    "view_analytics": true,
    "view_revisions": true,
    "revert": true
  },
  "pipeline": {
    "access": false
  }
}'::jsonb, true, 4),

-- 5. Copywriter
('Copywriter', 'Can create and edit copy, request approvals. Limited to text content only.',
'{
  "brand_engine": {
    "access": true,
    "chat": false,
    "edit_variables": false
  },
  "content_engine": {
    "access": true,
    "create": true,
    "edit": true,
    "edit_others": false,
    "delete": false,
    "upload_media": false,
    "request_approval": true,
    "approve": false,
    "reject": false,
    "request_revision": false,
    "schedule": false,
    "change_schedule": false,
    "publish": false,
    "comment": true,
    "mention": true,
    "view_analytics": false,
    "view_revisions": true,
    "revert": false
  },
  "pipeline": {
    "access": false
  }
}'::jsonb, true, 5),

-- 6. Graphic Designer
('Graphic Designer', 'Can upload and manage media assets. Cannot create or edit copy.',
'{
  "brand_engine": {
    "access": true,
    "chat": false,
    "edit_variables": false
  },
  "content_engine": {
    "access": true,
    "create": false,
    "edit": false,
    "edit_others": false,
    "delete": false,
    "upload_media": true,
    "request_approval": false,
    "approve": false,
    "reject": false,
    "request_revision": false,
    "schedule": false,
    "change_schedule": false,
    "publish": false,
    "comment": true,
    "mention": true,
    "view_analytics": false,
    "view_revisions": false,
    "revert": false
  },
  "pipeline": {
    "access": false
  }
}'::jsonb, true, 6),

-- 7. Viewer (Read-Only)
('Viewer', 'Read-only access to view content and brand assets. Cannot create, edit, or publish.',
'{
  "brand_engine": {
    "access": true,
    "chat": false,
    "edit_variables": false
  },
  "content_engine": {
    "access": true,
    "create": false,
    "edit": false,
    "edit_others": false,
    "delete": false,
    "upload_media": false,
    "request_approval": false,
    "approve": false,
    "reject": false,
    "request_revision": false,
    "schedule": false,
    "change_schedule": false,
    "publish": false,
    "comment": true,
    "mention": false,
    "view_analytics": true,
    "view_revisions": true,
    "revert": false
  },
  "pipeline": {
    "access": false
  }
}'::jsonb, true, 7),

-- 8. Community Manager
('Community Manager', 'Full content access plus pipeline for managing community interactions and contacts.',
'{
  "brand_engine": {
    "access": true,
    "chat": false,
    "edit_variables": false
  },
  "content_engine": {
    "access": true,
    "create": true,
    "edit": true,
    "edit_others": false,
    "delete": false,
    "upload_media": true,
    "request_approval": true,
    "approve": false,
    "reject": false,
    "request_revision": false,
    "schedule": true,
    "change_schedule": true,
    "publish": true,
    "comment": true,
    "mention": true,
    "view_analytics": true,
    "view_revisions": true,
    "revert": false
  },
  "pipeline": {
    "access": true,
    "manage_contacts": true,
    "send_emails": false
  }
}'::jsonb, true, 8);

-- Verify templates were inserted
SELECT
  COUNT(*) as total_system_templates,
  string_agg(name, ', ' ORDER BY sort_order) as template_names
FROM permission_templates
WHERE is_system_template = true;
