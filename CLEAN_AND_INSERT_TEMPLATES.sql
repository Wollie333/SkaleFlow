-- =====================================================
-- CLEAN AND INSERT PERMISSION TEMPLATES
-- Removes ALL existing templates and inserts fresh 8
-- =====================================================

-- Step 1: Delete ALL existing templates (to avoid any duplicates)
TRUNCATE permission_templates CASCADE;

-- Step 2: Insert 8 fresh system templates
INSERT INTO permission_templates (name, description, permissions, is_system_template, is_system, sort_order) VALUES

-- 1. Social Media Manager
('Social Media Manager', 'Full access to content creation, scheduling, and publishing. Can upload media and manage social posts.',
'{"brand_engine": {"access": true, "chat": false, "edit_variables": false}, "content_engine": {"access": true, "create": true, "edit": true, "edit_others": false, "delete": false, "upload_media": true, "request_approval": true, "approve": false, "reject": false, "request_revision": false, "schedule": true, "change_schedule": true, "publish": true, "comment": true, "mention": true, "view_analytics": true, "view_revisions": true, "revert": false}, "pipeline": {"access": false}}'::jsonb, true, true, 1),

-- 2. Content Creator
('Content Creator', 'Can create and edit content, upload media, and request approvals. Cannot publish or schedule independently.',
'{"brand_engine": {"access": true, "chat": false, "edit_variables": false}, "content_engine": {"access": true, "create": true, "edit": true, "edit_others": false, "delete": false, "upload_media": true, "request_approval": true, "approve": false, "reject": false, "request_revision": false, "schedule": false, "change_schedule": false, "publish": false, "comment": true, "mention": true, "view_analytics": false, "view_revisions": true, "revert": false}, "pipeline": {"access": false}}'::jsonb, true, true, 2),

-- 3. Content Strategist
('Content Strategist', 'Can view brand strategy, create content plans, review and approve content. Cannot publish or upload media.',
'{"brand_engine": {"access": true, "chat": true, "edit_variables": false}, "content_engine": {"access": true, "create": true, "edit": true, "edit_others": true, "delete": false, "upload_media": false, "request_approval": true, "approve": true, "reject": true, "request_revision": true, "schedule": false, "change_schedule": true, "publish": false, "comment": true, "mention": true, "view_analytics": true, "view_revisions": true, "revert": true}, "pipeline": {"access": false}}'::jsonb, true, true, 3),

-- 4. Brand Manager
('Brand Manager', 'Full access to brand engine and content strategy. Can edit brand variables and approve content.',
'{"brand_engine": {"access": true, "chat": true, "edit_variables": true}, "content_engine": {"access": true, "create": true, "edit": true, "edit_others": true, "delete": true, "upload_media": true, "request_approval": true, "approve": true, "reject": true, "request_revision": true, "schedule": true, "change_schedule": true, "publish": true, "comment": true, "mention": true, "view_analytics": true, "view_revisions": true, "revert": true}, "pipeline": {"access": false}}'::jsonb, true, true, 4),

-- 5. Copywriter
('Copywriter', 'Can create and edit copy, request approvals. Limited to text content only.',
'{"brand_engine": {"access": true, "chat": false, "edit_variables": false}, "content_engine": {"access": true, "create": true, "edit": true, "edit_others": false, "delete": false, "upload_media": false, "request_approval": true, "approve": false, "reject": false, "request_revision": false, "schedule": false, "change_schedule": false, "publish": false, "comment": true, "mention": true, "view_analytics": false, "view_revisions": true, "revert": false}, "pipeline": {"access": false}}'::jsonb, true, true, 5),

-- 6. Graphic Designer
('Graphic Designer', 'Can upload and manage media assets. Cannot create or edit copy.',
'{"brand_engine": {"access": true, "chat": false, "edit_variables": false}, "content_engine": {"access": true, "create": false, "edit": false, "edit_others": false, "delete": false, "upload_media": true, "request_approval": false, "approve": false, "reject": false, "request_revision": false, "schedule": false, "change_schedule": false, "publish": false, "comment": true, "mention": true, "view_analytics": false, "view_revisions": false, "revert": false}, "pipeline": {"access": false}}'::jsonb, true, true, 6),

-- 7. Viewer (Read-Only)
('Viewer', 'Read-only access to view content and brand assets. Cannot create, edit, or publish.',
'{"brand_engine": {"access": true, "chat": false, "edit_variables": false}, "content_engine": {"access": true, "create": false, "edit": false, "edit_others": false, "delete": false, "upload_media": false, "request_approval": false, "approve": false, "reject": false, "request_revision": false, "schedule": false, "change_schedule": false, "publish": false, "comment": true, "mention": false, "view_analytics": true, "view_revisions": true, "revert": false}, "pipeline": {"access": false}}'::jsonb, true, true, 7),

-- 8. Community Manager
('Community Manager', 'Full content access plus pipeline for managing community interactions and contacts.',
'{"brand_engine": {"access": true, "chat": false, "edit_variables": false}, "content_engine": {"access": true, "create": true, "edit": true, "edit_others": false, "delete": false, "upload_media": true, "request_approval": true, "approve": false, "reject": false, "request_revision": false, "schedule": true, "change_schedule": true, "publish": true, "comment": true, "mention": true, "view_analytics": true, "view_revisions": true, "revert": false}, "pipeline": {"access": true, "manage_contacts": true, "send_emails": false}}'::jsonb, true, true, 8);

-- Step 3: Verify templates were inserted
SELECT
  COUNT(*) as total_templates,
  COUNT(*) FILTER (WHERE is_system_template = true) as system_templates_new_col,
  COUNT(*) FILTER (WHERE is_system = true) as system_templates_old_col,
  string_agg(name, ', ' ORDER BY sort_order) as template_names
FROM permission_templates;
