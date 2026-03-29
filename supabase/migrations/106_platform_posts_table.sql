-- =====================================================
-- Platform Posts Table
-- Stores ALL posts from connected social media platforms
-- whether created through SkaleFlow or externally
-- =====================================================

CREATE TABLE IF NOT EXISTS platform_posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  connection_id       UUID NOT NULL REFERENCES social_media_connections(id) ON DELETE CASCADE,
  platform            TEXT NOT NULL,
  platform_post_id    TEXT NOT NULL,
  platform_post_url   TEXT,

  -- Content
  message             TEXT,
  caption             TEXT,
  media_url           TEXT,
  media_type          TEXT,

  -- Metadata
  created_at_platform TIMESTAMPTZ NOT NULL,
  author_name         TEXT,
  is_skaleflow_post   BOOLEAN DEFAULT FALSE,
  content_item_id     UUID REFERENCES content_items(id) ON DELETE SET NULL,

  -- Analytics (latest snapshot)
  likes               INTEGER DEFAULT 0,
  comments            INTEGER DEFAULT 0,
  shares              INTEGER DEFAULT 0,
  saves               INTEGER DEFAULT 0,
  impressions         INTEGER DEFAULT 0,
  reach               INTEGER DEFAULT 0,
  clicks              INTEGER DEFAULT 0,
  video_views         INTEGER DEFAULT 0,
  engagement_rate     NUMERIC(5,2) DEFAULT 0,

  -- Timestamps
  last_synced_at      TIMESTAMPTZ DEFAULT now(),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(platform, platform_post_id, organization_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_platform_posts_org ON platform_posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_platform_posts_connection ON platform_posts(connection_id);
CREATE INDEX IF NOT EXISTS idx_platform_posts_platform ON platform_posts(platform);
CREATE INDEX IF NOT EXISTS idx_platform_posts_created_at ON platform_posts(created_at_platform DESC);
CREATE INDEX IF NOT EXISTS idx_platform_posts_content_item ON platform_posts(content_item_id) WHERE content_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_platform_posts_skaleflow ON platform_posts(is_skaleflow_post, organization_id);

-- Enable RLS
ALTER TABLE platform_posts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS platform_posts_select_org ON platform_posts;
DROP POLICY IF EXISTS platform_posts_insert_org ON platform_posts;
DROP POLICY IF EXISTS platform_posts_update_org ON platform_posts;
DROP POLICY IF EXISTS platform_posts_delete_org ON platform_posts;

CREATE POLICY platform_posts_select_org ON platform_posts
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY platform_posts_insert_org ON platform_posts
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY platform_posts_update_org ON platform_posts
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY platform_posts_delete_org ON platform_posts
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON platform_posts TO authenticated;

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_platform_posts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_platform_posts_updated_at ON platform_posts;
CREATE TRIGGER trigger_platform_posts_updated_at
  BEFORE UPDATE ON platform_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_posts_updated_at();
