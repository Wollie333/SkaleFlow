-- Migration 107: Team Collaboration Foundation
-- Adds comprehensive team collaboration features:
-- - Enhanced activity log with workspace context
-- - User session tracking for time analytics
-- - Post time entries for productivity metrics
-- - Comments system with @mentions
-- - Full revision history with revert capability
-- - Media revision tracking

-- =====================================================
-- EXTEND ACTIVITY LOG FOR TEAM COLLABORATION
-- =====================================================

-- Add workspace context and enhanced tracking to existing team_activity_log
ALTER TABLE team_activity_log ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE team_activity_log ADD COLUMN IF NOT EXISTS entity_type TEXT; -- 'post', 'campaign', 'media', etc.
ALTER TABLE team_activity_log ADD COLUMN IF NOT EXISTS entity_id UUID;
ALTER TABLE team_activity_log ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
ALTER TABLE team_activity_log ADD COLUMN IF NOT EXISTS old_value JSONB;
ALTER TABLE team_activity_log ADD COLUMN IF NOT EXISTS new_value JSONB;
ALTER TABLE team_activity_log ADD COLUMN IF NOT EXISTS ip_address INET;
ALTER TABLE team_activity_log ADD COLUMN IF NOT EXISTS user_agent TEXT;

CREATE INDEX IF NOT EXISTS idx_team_activity_workspace ON team_activity_log(workspace_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_activity_entity ON team_activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_target ON team_activity_log(target_user_id) WHERE target_user_id IS NOT NULL;

-- Update RLS to include workspace scope
DROP POLICY IF EXISTS team_activity_log_select ON team_activity_log;
CREATE POLICY "team_activity_log_workspace_select" ON team_activity_log
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

COMMENT ON COLUMN team_activity_log.action IS 'Action types: post_created, post_edited, post_status_changed, post_deleted, media_uploaded, media_removed, schedule_changed, approval_requested, approval_granted, approval_denied, revision_requested, comment_added, mention_created, etc.';
COMMENT ON COLUMN team_activity_log.entity_type IS 'Entity type: post, campaign, media, comment, etc.';
COMMENT ON COLUMN team_activity_log.entity_id IS 'UUID of the entity being acted upon';
COMMENT ON COLUMN team_activity_log.duration_seconds IS 'Time spent on this activity (for time tracking)';
COMMENT ON COLUMN team_activity_log.old_value IS 'Previous state (for audit trail)';
COMMENT ON COLUMN team_activity_log.new_value IS 'New state (for audit trail)';

-- =====================================================
-- USER SESSIONS (TIME TRACKING)
-- =====================================================

CREATE TABLE user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  session_token TEXT NOT NULL UNIQUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  -- Context
  entry_page TEXT,
  exit_page TEXT,
  page_views INTEGER DEFAULT 0,

  -- Device info
  ip_address INET,
  user_agent TEXT,
  device_type TEXT, -- 'desktop', 'tablet', 'mobile'

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id, started_at DESC);
CREATE INDEX idx_user_sessions_workspace ON user_sessions(workspace_id, started_at DESC);
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id) WHERE ended_at IS NULL;

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Users can see their own sessions
CREATE POLICY "user_sessions_own" ON user_sessions
  FOR ALL USING (user_id = auth.uid());

-- Workspace admins and org admins can see all sessions
CREATE POLICY "user_sessions_admin_select" ON user_sessions
  FOR SELECT USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'admin'
    )
    OR organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

COMMENT ON TABLE user_sessions IS 'Track user login sessions and active time for productivity analytics';
COMMENT ON COLUMN user_sessions.session_token IS 'Unique token for this session (stored in cookie)';
COMMENT ON COLUMN user_sessions.duration_seconds IS 'Total duration of session in seconds';

-- =====================================================
-- POST TIME TRACKING
-- =====================================================

CREATE TABLE post_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  session_id UUID REFERENCES user_sessions(id) ON DELETE SET NULL,

  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,

  activity_type TEXT NOT NULL, -- 'editing', 'reviewing', 'uploading_media', 'scheduling'

  metadata JSONB DEFAULT '{}'::jsonb, -- {fields_edited: [], media_count: 3, etc.}

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_post_time_post ON post_time_entries(post_id);
CREATE INDEX idx_post_time_user ON post_time_entries(user_id, started_at DESC);
CREATE INDEX idx_post_time_workspace ON post_time_entries(workspace_id);

ALTER TABLE post_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_time_entries_workspace" ON post_time_entries
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE post_time_entries IS 'Track time spent working on specific posts for productivity analytics';
COMMENT ON COLUMN post_time_entries.activity_type IS 'Type of work: editing, reviewing, uploading_media, scheduling, ideating';

-- =====================================================
-- POST COMMENTS & MENTIONS
-- =====================================================

CREATE TABLE post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  parent_comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE, -- For threaded replies

  body TEXT NOT NULL,
  mentioned_user_ids UUID[], -- Array of @mentioned user IDs

  is_internal BOOLEAN DEFAULT true, -- Internal team comment vs external (if needed later)
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_comments_post ON post_comments(post_id, created_at);
CREATE INDEX idx_post_comments_user ON post_comments(user_id);
CREATE INDEX idx_post_comments_workspace ON post_comments(workspace_id);
CREATE INDEX idx_post_comments_mentioned ON post_comments USING GIN(mentioned_user_ids);
CREATE INDEX idx_post_comments_parent ON post_comments(parent_comment_id) WHERE parent_comment_id IS NOT NULL;

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_comments_workspace" ON post_comments
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE post_comments IS 'Comments on content posts with @mention support and threading';
COMMENT ON COLUMN post_comments.mentioned_user_ids IS 'User IDs mentioned with @ in this comment';
COMMENT ON COLUMN post_comments.parent_comment_id IS 'Parent comment ID for threaded replies';

-- =====================================================
-- POST REVISION HISTORY
-- =====================================================

CREATE TABLE post_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  revision_number INTEGER NOT NULL,

  -- Snapshot strategy: Full snapshot for now (can optimize to delta later)
  snapshot JSONB NOT NULL, -- Full post state at this revision

  -- What changed
  changed_fields TEXT[], -- ['hook', 'body', 'scheduled_date']
  change_summary TEXT, -- Human-readable summary

  -- Context
  action_type TEXT NOT NULL, -- 'created', 'edited', 'status_changed', 'media_changed', 'schedule_changed'
  triggered_by TEXT, -- 'user', 'ai_regeneration', 'bulk_edit', 'approval_workflow'

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_post_revisions_post ON post_revisions(post_id, revision_number DESC);
CREATE INDEX idx_post_revisions_user ON post_revisions(user_id);
CREATE INDEX idx_post_revisions_workspace ON post_revisions(workspace_id);

ALTER TABLE post_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "post_revisions_workspace" ON post_revisions
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE post_revisions IS 'Complete revision history for content posts with revert capability';
COMMENT ON COLUMN post_revisions.snapshot IS 'Full JSONB snapshot of post state at this revision';
COMMENT ON COLUMN post_revisions.changed_fields IS 'Array of field names that changed in this revision';
COMMENT ON COLUMN post_revisions.triggered_by IS 'How revision was created: user edit, AI regeneration, bulk edit, approval workflow';

-- =====================================================
-- MEDIA REVISION HISTORY
-- =====================================================

CREATE TABLE media_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  media_id UUID REFERENCES post_media(id) ON DELETE SET NULL, -- NULL if media deleted
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  action TEXT NOT NULL, -- 'uploaded', 'replaced', 'removed', 'reordered'

  -- Snapshot of media state
  media_snapshot JSONB, -- {type, file_path, file_name, carousel_order, etc.}

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_revisions_post ON media_revisions(post_id, created_at DESC);
CREATE INDEX idx_media_revisions_media ON media_revisions(media_id) WHERE media_id IS NOT NULL;

ALTER TABLE media_revisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_revisions_workspace" ON media_revisions
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

COMMENT ON TABLE media_revisions IS 'Track all media uploads, replacements, and removals for audit trail';
COMMENT ON COLUMN media_revisions.action IS 'Action performed: uploaded, replaced, removed, reordered';

-- =====================================================
-- ENHANCE NOTIFICATIONS
-- =====================================================

-- Add workspace context to notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS comment_id UUID REFERENCES post_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_notifications_workspace ON notifications(workspace_id, created_at DESC);

-- Update notifications RLS
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "notifications_own_or_workspace" ON notifications
  FOR SELECT USING (
    user_id = auth.uid()
    OR workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

COMMENT ON COLUMN notifications.workspace_id IS 'Workspace context for this notification';
COMMENT ON COLUMN notifications.comment_id IS 'Reference to comment if notification is comment-related';
