-- Migration 026: Marketing Ads System
-- Tables: ad_accounts, ad_campaigns, ad_sets, ad_creatives, ad_audiences, ad_metrics, ad_generation_batches

-- ============================================================
-- 1. ad_accounts — Connected Meta/TikTok ad accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'tiktok')),
  account_name TEXT NOT NULL,
  platform_account_id TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  scopes TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  connected_by UUID NOT NULL REFERENCES users(id),
  connected_at TIMESTAMPTZ DEFAULT now(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, platform)
);

-- ============================================================
-- 2. ad_campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  ad_account_id UUID NOT NULL REFERENCES ad_accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'tiktok')),
  objective TEXT NOT NULL CHECK (objective IN ('awareness', 'traffic', 'engagement', 'leads', 'conversions', 'app_installs')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending_review', 'active', 'paused', 'completed', 'rejected')),
  budget_type TEXT NOT NULL CHECK (budget_type IN ('daily', 'lifetime')),
  budget_cents BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  special_ad_category TEXT CHECK (special_ad_category IN ('housing', 'employment', 'credit', 'social_issues') OR special_ad_category IS NULL),
  platform_campaign_id TEXT,
  compliance_notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 3. ad_sets
-- ============================================================
CREATE TABLE IF NOT EXISTS ad_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  targeting_config JSONB DEFAULT '{}',
  placements TEXT[] DEFAULT '{}',
  bidding_strategy TEXT NOT NULL DEFAULT 'lowest_cost' CHECK (bidding_strategy IN ('lowest_cost', 'cost_cap', 'bid_cap', 'target_cost')),
  bid_amount_cents BIGINT,
  budget_type TEXT CHECK (budget_type IN ('daily', 'lifetime') OR budget_type IS NULL),
  budget_cents BIGINT,
  platform_ad_set_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4. ad_creatives
-- ============================================================
CREATE TABLE IF NOT EXISTS ad_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_set_id UUID REFERENCES ad_sets(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('single_image', 'single_video', 'carousel', 'collection', 'in_feed', 'topview', 'spark_ad')),
  media_urls TEXT[] DEFAULT '{}',
  thumbnail_url TEXT,

  -- Ad copy
  primary_text TEXT NOT NULL,
  headline TEXT,
  description TEXT,
  cta_type TEXT CHECK (cta_type IN ('learn_more', 'shop_now', 'sign_up', 'download', 'get_quote', 'apply_now', 'book_now', 'contact_us') OR cta_type IS NULL),

  -- Landing page
  target_url TEXT NOT NULL,
  utm_parameters JSONB DEFAULT '{}',
  display_link TEXT,

  -- AI generation metadata
  ai_generated BOOLEAN DEFAULT false,
  ai_model TEXT,
  funnel_stage TEXT,
  storybrand_stage TEXT,
  selected_brand_variables JSONB,

  -- Compliance
  compliance_status TEXT NOT NULL DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'passed', 'flagged', 'rejected')),
  compliance_issues JSONB DEFAULT '[]',
  special_ad_category TEXT,

  -- Platform sync
  platform_creative_id TEXT,
  platform_ad_id TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'rejected')),
  rejection_reason TEXT,

  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 5. ad_audiences
-- ============================================================
CREATE TABLE IF NOT EXISTS ad_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'tiktok')),
  audience_type TEXT NOT NULL CHECK (audience_type IN ('saved', 'custom', 'lookalike')),
  targeting_spec JSONB DEFAULT '{}',

  -- Pipeline source (for custom audiences from Pipeline contacts)
  source_pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL,
  source_stage_ids UUID[] DEFAULT '{}',
  source_tag_ids UUID[] DEFAULT '{}',
  last_synced_at TIMESTAMPTZ,

  platform_audience_id TEXT,
  approximate_size INT,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, platform, name)
);

-- ============================================================
-- 6. ad_metrics — Daily performance snapshots
-- ============================================================
CREATE TABLE IF NOT EXISTS ad_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creative_id UUID NOT NULL REFERENCES ad_creatives(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES ad_campaigns(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  impressions BIGINT DEFAULT 0,
  reach BIGINT DEFAULT 0,
  frequency NUMERIC DEFAULT 0,
  clicks BIGINT DEFAULT 0,
  likes BIGINT DEFAULT 0,
  comments BIGINT DEFAULT 0,
  shares BIGINT DEFAULT 0,
  saves BIGINT DEFAULT 0,
  video_views BIGINT DEFAULT 0,
  video_3s_views BIGINT DEFAULT 0,
  ctr NUMERIC DEFAULT 0,
  engagement_rate NUMERIC DEFAULT 0,
  conversions BIGINT DEFAULT 0,
  conversion_value_cents BIGINT DEFAULT 0,
  spend_cents BIGINT DEFAULT 0,
  currency TEXT DEFAULT 'ZAR',
  cpc_cents BIGINT DEFAULT 0,
  cpm_cents BIGINT DEFAULT 0,
  cpa_cents BIGINT,
  roas NUMERIC,
  metadata JSONB DEFAULT '{}',
  synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(creative_id, date)
);

-- ============================================================
-- 7. ad_generation_batches — Track AI ad creative generation
-- ============================================================
CREATE TABLE IF NOT EXISTS ad_generation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES ad_campaigns(id) ON DELETE SET NULL,
  ad_set_id UUID REFERENCES ad_sets(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES users(id),
  model_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('meta', 'tiktok')),
  format TEXT NOT NULL,
  objective TEXT,
  funnel_stage TEXT,
  selected_brand_variables JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  total_variations INT NOT NULL DEFAULT 1,
  completed_variations INT NOT NULL DEFAULT 0,
  failed_variations INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX idx_ad_accounts_org ON ad_accounts(organization_id);
CREATE INDEX idx_ad_campaigns_org ON ad_campaigns(organization_id);
CREATE INDEX idx_ad_campaigns_account ON ad_campaigns(ad_account_id);
CREATE INDEX idx_ad_campaigns_status ON ad_campaigns(status);
CREATE INDEX idx_ad_sets_campaign ON ad_sets(campaign_id);
CREATE INDEX idx_ad_creatives_campaign ON ad_creatives(campaign_id);
CREATE INDEX idx_ad_creatives_ad_set ON ad_creatives(ad_set_id);
CREATE INDEX idx_ad_creatives_compliance ON ad_creatives(compliance_status);
CREATE INDEX idx_ad_audiences_org ON ad_audiences(organization_id);
CREATE INDEX idx_ad_metrics_creative_date ON ad_metrics(creative_id, date);
CREATE INDEX idx_ad_metrics_campaign ON ad_metrics(campaign_id);
CREATE INDEX idx_ad_generation_batches_org ON ad_generation_batches(organization_id);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_audiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_generation_batches ENABLE ROW LEVEL SECURITY;

-- ad_accounts: org members can read, owners/admins can manage
CREATE POLICY "ad_accounts_select" ON ad_accounts FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "ad_accounts_insert" ON ad_accounts FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);
CREATE POLICY "ad_accounts_update" ON ad_accounts FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);
CREATE POLICY "ad_accounts_delete" ON ad_accounts FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- ad_campaigns: org members can read, owners/admins can manage
CREATE POLICY "ad_campaigns_select" ON ad_campaigns FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "ad_campaigns_insert" ON ad_campaigns FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);
CREATE POLICY "ad_campaigns_update" ON ad_campaigns FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);
CREATE POLICY "ad_campaigns_delete" ON ad_campaigns FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- ad_sets: inherit campaign-level access
CREATE POLICY "ad_sets_select" ON ad_sets FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "ad_sets_insert" ON ad_sets FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);
CREATE POLICY "ad_sets_update" ON ad_sets FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);
CREATE POLICY "ad_sets_delete" ON ad_sets FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- ad_creatives: org members can read, owners/admins can manage
CREATE POLICY "ad_creatives_select" ON ad_creatives FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "ad_creatives_insert" ON ad_creatives FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);
CREATE POLICY "ad_creatives_update" ON ad_creatives FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);
CREATE POLICY "ad_creatives_delete" ON ad_creatives FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- ad_audiences: org members can read, owners/admins can manage
CREATE POLICY "ad_audiences_select" ON ad_audiences FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "ad_audiences_insert" ON ad_audiences FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);
CREATE POLICY "ad_audiences_update" ON ad_audiences FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);
CREATE POLICY "ad_audiences_delete" ON ad_audiences FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- ad_metrics: org members can read (service role inserts via API sync)
CREATE POLICY "ad_metrics_select" ON ad_metrics FOR SELECT USING (
  campaign_id IN (
    SELECT id FROM ad_campaigns WHERE organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  )
);

-- ad_generation_batches: org members can read, owners/admins can manage
CREATE POLICY "ad_gen_batches_select" ON ad_generation_batches FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
);
CREATE POLICY "ad_gen_batches_insert" ON ad_generation_batches FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);
CREATE POLICY "ad_gen_batches_update" ON ad_generation_batches FOR UPDATE USING (
  organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Service role bypass for all tables (used by API routes via createServiceClient)
CREATE POLICY "service_ad_accounts" ON ad_accounts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_ad_campaigns" ON ad_campaigns FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_ad_sets" ON ad_sets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_ad_creatives" ON ad_creatives FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_ad_audiences" ON ad_audiences FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_ad_metrics" ON ad_metrics FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "service_ad_gen_batches" ON ad_generation_batches FOR ALL USING (auth.role() = 'service_role');
