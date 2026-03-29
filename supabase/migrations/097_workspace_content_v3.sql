-- Migration 097: Workspace Support for Content V3 Engine
-- Adds workspace_id to Content V3 engine tables and migrates existing data

-- =====================================================
-- CONTENT V3 ENGINE TABLES
-- =====================================================

-- Add workspace_id to campaigns
ALTER TABLE campaigns ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_campaigns_workspace ON campaigns(workspace_id);
CREATE INDEX idx_campaigns_workspace_status ON campaigns(workspace_id, status);

-- Add workspace_id to campaign_adsets
ALTER TABLE campaign_adsets ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_campaign_adsets_workspace ON campaign_adsets(workspace_id);

-- Add workspace_id to content_posts
ALTER TABLE content_posts ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_content_posts_workspace ON content_posts(workspace_id);
CREATE INDEX idx_content_posts_workspace_status ON content_posts(workspace_id, status);

-- Add workspace_id to v3_generation_queue
ALTER TABLE v3_generation_queue ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_v3_generation_queue_workspace ON v3_generation_queue(workspace_id);

-- Add workspace_id to v3_generation_batches (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'v3_generation_batches') THEN
    ALTER TABLE v3_generation_batches ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    CREATE INDEX idx_v3_generation_batches_workspace ON v3_generation_batches(workspace_id);
  END IF;
END $$;

-- Add workspace_id to user_style_profiles
ALTER TABLE user_style_profiles ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_user_style_profiles_workspace ON user_style_profiles(workspace_id);

-- Add workspace_id to content_templates
ALTER TABLE content_templates ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_content_templates_workspace ON content_templates(workspace_id);

-- Add workspace_id to post_media_assets (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_media_assets') THEN
    ALTER TABLE post_media_assets ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    CREATE INDEX idx_post_media_assets_workspace ON post_media_assets(workspace_id);
  END IF;
END $$;

-- Add workspace_id to winner_pool
ALTER TABLE winner_pool ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
CREATE INDEX idx_winner_pool_workspace ON winner_pool(workspace_id);

-- Add workspace_id to brand_intelligence_reports (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_intelligence_reports') THEN
    ALTER TABLE brand_intelligence_reports ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    CREATE INDEX idx_brand_intelligence_reports_workspace ON brand_intelligence_reports(workspace_id);
  END IF;
END $$;

-- Add workspace_id to v3_post_analytics (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'v3_post_analytics') THEN
    ALTER TABLE v3_post_analytics ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    CREATE INDEX idx_v3_post_analytics_workspace ON v3_post_analytics(workspace_id);
  END IF;
END $$;

-- Add workspace_id to campaign_adjustments (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_adjustments') THEN
    ALTER TABLE campaign_adjustments ADD COLUMN workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
    CREATE INDEX idx_campaign_adjustments_workspace ON campaign_adjustments(workspace_id);
  END IF;
END $$;

-- =====================================================
-- DATA MIGRATION TO DEFAULT WORKSPACES
-- =====================================================

-- Migrate campaigns data
UPDATE campaigns c
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = c.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Migrate campaign_adsets data
UPDATE campaign_adsets ca
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = ca.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Migrate content_posts data
UPDATE content_posts cp
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = cp.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Migrate v3_generation_queue data
UPDATE v3_generation_queue vgq
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = vgq.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Migrate v3_generation_batches data (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'v3_generation_batches') THEN
    UPDATE v3_generation_batches vgb
    SET workspace_id = (
      SELECT id FROM workspaces w
      WHERE w.organization_id = vgb.organization_id
      AND w.is_default = TRUE
      LIMIT 1
    )
    WHERE workspace_id IS NULL;
  END IF;
END $$;

-- Migrate user_style_profiles data
UPDATE user_style_profiles usp
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = usp.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Migrate content_templates data (conditionally based on table structure)
DO $$
BEGIN
  -- Check if content_templates has organization_id column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'content_templates' AND column_name = 'organization_id'
  ) THEN
    -- Direct migration if organization_id exists
    UPDATE content_templates ct
    SET workspace_id = (
      SELECT id FROM workspaces w
      WHERE w.organization_id = ct.organization_id
      AND w.is_default = TRUE
      LIMIT 1
    )
    WHERE workspace_id IS NULL;
  ELSE
    -- If no organization_id, templates might be global/system templates
    -- Leave workspace_id as NULL for system templates
    RAISE NOTICE 'content_templates has no organization_id column - skipping migration';
  END IF;
END $$;

-- Migrate post_media_assets data (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'post_media_assets') THEN
    UPDATE post_media_assets pma
    SET workspace_id = (
      SELECT id FROM workspaces w
      WHERE w.organization_id = pma.organization_id
      AND w.is_default = TRUE
      LIMIT 1
    )
    WHERE workspace_id IS NULL;
  END IF;
END $$;

-- Migrate winner_pool data
UPDATE winner_pool wp
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = wp.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Migrate brand_intelligence_reports data (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_intelligence_reports') THEN
    UPDATE brand_intelligence_reports bir
    SET workspace_id = (
      SELECT id FROM workspaces w
      WHERE w.organization_id = bir.organization_id
      AND w.is_default = TRUE
      LIMIT 1
    )
    WHERE workspace_id IS NULL;
  END IF;
END $$;

-- Migrate v3_post_analytics data (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'v3_post_analytics') THEN
    UPDATE v3_post_analytics vpa
    SET workspace_id = (
      SELECT id FROM workspaces w
      WHERE w.organization_id = vpa.organization_id
      AND w.is_default = TRUE
      LIMIT 1
    )
    WHERE workspace_id IS NULL;
  END IF;
END $$;

-- Migrate campaign_adjustments data (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'campaign_adjustments') THEN
    UPDATE campaign_adjustments caj
    SET workspace_id = (
      SELECT id FROM workspaces w
      WHERE w.organization_id = caj.organization_id
      AND w.is_default = TRUE
      LIMIT 1
    )
    WHERE workspace_id IS NULL;
  END IF;
END $$;

-- =====================================================
-- UPDATE RLS POLICIES
-- =====================================================

-- Campaigns RLS
DROP POLICY IF EXISTS campaigns_org_select ON campaigns;
DROP POLICY IF EXISTS campaigns_org_insert ON campaigns;
DROP POLICY IF EXISTS campaigns_org_update ON campaigns;
DROP POLICY IF EXISTS campaigns_org_delete ON campaigns;

CREATE POLICY "campaigns_workspace_access" ON campaigns
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Campaign Adsets RLS
DROP POLICY IF EXISTS campaign_adsets_org_select ON campaign_adsets;
DROP POLICY IF EXISTS campaign_adsets_org_insert ON campaign_adsets;
DROP POLICY IF EXISTS campaign_adsets_org_update ON campaign_adsets;
DROP POLICY IF EXISTS campaign_adsets_org_delete ON campaign_adsets;

CREATE POLICY "campaign_adsets_workspace_access" ON campaign_adsets
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Content Posts RLS
DROP POLICY IF EXISTS content_posts_org_select ON content_posts;
DROP POLICY IF EXISTS content_posts_org_insert ON content_posts;
DROP POLICY IF EXISTS content_posts_org_update ON content_posts;
DROP POLICY IF EXISTS content_posts_org_delete ON content_posts;

CREATE POLICY "content_posts_workspace_access" ON content_posts
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- V3 Generation Queue RLS
DROP POLICY IF EXISTS v3_generation_queue_org_select ON v3_generation_queue;
DROP POLICY IF EXISTS v3_generation_queue_org_insert ON v3_generation_queue;
DROP POLICY IF EXISTS v3_generation_queue_org_update ON v3_generation_queue;
DROP POLICY IF EXISTS v3_generation_queue_org_delete ON v3_generation_queue;

CREATE POLICY "v3_generation_queue_workspace_access" ON v3_generation_queue
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- User Style Profiles RLS
DROP POLICY IF EXISTS user_style_profiles_org_select ON user_style_profiles;
DROP POLICY IF EXISTS user_style_profiles_org_insert ON user_style_profiles;
DROP POLICY IF EXISTS user_style_profiles_org_update ON user_style_profiles;
DROP POLICY IF EXISTS user_style_profiles_org_delete ON user_style_profiles;

CREATE POLICY "user_style_profiles_workspace_access" ON user_style_profiles
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- Content Templates RLS
DROP POLICY IF EXISTS content_templates_org_select ON content_templates;
DROP POLICY IF EXISTS content_templates_org_insert ON content_templates;
DROP POLICY IF EXISTS content_templates_org_update ON content_templates;
DROP POLICY IF EXISTS content_templates_org_delete ON content_templates;

CREATE POLICY "content_templates_workspace_access" ON content_templates
  FOR ALL USING (
    -- Allow access to workspace-specific templates
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
    -- Also allow access to system templates (workspace_id IS NULL)
    OR workspace_id IS NULL
  );

-- Winner Pool RLS
DROP POLICY IF EXISTS winner_pool_org_select ON winner_pool;
DROP POLICY IF EXISTS winner_pool_org_insert ON winner_pool;
DROP POLICY IF EXISTS winner_pool_org_update ON winner_pool;
DROP POLICY IF EXISTS winner_pool_org_delete ON winner_pool;

CREATE POLICY "winner_pool_workspace_access" ON winner_pool
  FOR ALL USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()
    )
  );

-- =====================================================
-- VALIDATION
-- =====================================================

DO $$
DECLARE
  null_count INTEGER;
BEGIN
  -- Check campaigns
  SELECT COUNT(*) INTO null_count FROM campaigns WHERE workspace_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: % campaigns records without workspace_id', null_count;
  END IF;

  -- Check content_posts
  SELECT COUNT(*) INTO null_count FROM content_posts WHERE workspace_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: % content_posts records without workspace_id', null_count;
  END IF;

  RAISE NOTICE 'Migration 097 validation passed: All Content V3 Engine records have workspace_id';
END $$;
