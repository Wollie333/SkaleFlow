-- 067: Enterprise Team Management
-- Adds: team_activity_log, permission_templates, review_comments
-- Alters: change_requests (assigned_to, priority, deadline)

-- ============================================================
-- 1. team_activity_log — audit trail for team actions
-- ============================================================
CREATE TABLE IF NOT EXISTS team_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_email TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_team_activity_log_org ON team_activity_log(organization_id, created_at DESC);
CREATE INDEX idx_team_activity_log_actor ON team_activity_log(actor_id);

-- RLS: owner/admin SELECT only, service-role INSERT
ALTER TABLE team_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "team_activity_log_select" ON team_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.organization_id = team_activity_log.organization_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

-- No INSERT policy for users — inserts via service role only

-- ============================================================
-- 2. permission_templates — reusable permission presets
-- ============================================================
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

CREATE INDEX idx_permission_templates_org ON permission_templates(organization_id);

ALTER TABLE permission_templates ENABLE ROW LEVEL SECURITY;

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

-- Seed 4 system templates
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

-- ============================================================
-- 3. review_comments — threaded discussions on change_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS review_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_request_id UUID NOT NULL REFERENCES change_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_comments_cr ON review_comments(change_request_id, created_at);

ALTER TABLE review_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "review_comments_select" ON review_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM change_requests cr
      JOIN org_members om ON om.organization_id = cr.organization_id
      WHERE cr.id = review_comments.change_request_id
        AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "review_comments_insert" ON review_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM change_requests cr
      JOIN org_members om ON om.organization_id = cr.organization_id
      WHERE cr.id = review_comments.change_request_id
        AND om.user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. Alter change_requests — add assignment and priority
-- ============================================================
ALTER TABLE change_requests
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS priority TEXT NOT NULL DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS deadline TIMESTAMPTZ;

CREATE INDEX idx_change_requests_assigned ON change_requests(assigned_to) WHERE assigned_to IS NOT NULL;
