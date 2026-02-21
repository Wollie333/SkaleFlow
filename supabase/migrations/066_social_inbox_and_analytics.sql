-- Migration 066: Social Inbox Sync, Analytics Enhancement & Publishing Robustness

-- Inbox sync support on social_media_connections
ALTER TABLE social_media_connections
  ADD COLUMN IF NOT EXISTS inbox_last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS inbox_sync_cursor JSONB DEFAULT '{}';

-- Link interactions to published posts
ALTER TABLE social_interactions
  ADD COLUMN IF NOT EXISTS published_post_id UUID REFERENCES published_posts(id);

-- Dedup index for inbox sync
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_interactions_dedup
  ON social_interactions (connection_id, platform_interaction_id);

-- Org-level settings for timezone and approval gate
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Africa/Johannesburg',
  ADD COLUMN IF NOT EXISTS require_approval_before_publish BOOLEAN DEFAULT false;

-- Account-level metrics for follower growth tracking
CREATE TABLE IF NOT EXISTS social_account_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  connection_id UUID NOT NULL REFERENCES social_media_connections(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(connection_id, metric_date)
);

ALTER TABLE social_account_metrics ENABLE ROW LEVEL SECURITY;

-- RLS: org members can read their own org's metrics
CREATE POLICY "Org members can view account metrics"
  ON social_account_metrics
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Service role can insert/update (used by cron)
CREATE POLICY "Service role can manage account metrics"
  ON social_account_metrics
  FOR ALL
  USING (auth.role() = 'service_role');
