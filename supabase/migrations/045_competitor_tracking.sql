-- Competitor Tracking
-- Track competitors and compare performance metrics

-- Competitors table
CREATE TABLE IF NOT EXISTS competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Competitor info
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,

  -- Social media handles
  linkedin_handle TEXT,
  facebook_handle TEXT,
  instagram_handle TEXT,
  twitter_handle TEXT,
  tiktok_handle TEXT,
  youtube_handle TEXT,

  -- Tracking settings
  is_active BOOLEAN DEFAULT true,
  track_mentions BOOLEAN DEFAULT true,
  track_performance BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_competitor_per_org UNIQUE(organization_id, name)
);

-- Competitor performance metrics (snapshots over time)
CREATE TABLE IF NOT EXISTS competitor_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,

  -- Follower/subscriber metrics
  follower_count INT DEFAULT 0,
  follower_growth_rate DECIMAL(5,2) DEFAULT 0, -- percentage

  -- Engagement metrics
  avg_likes INT DEFAULT 0,
  avg_comments INT DEFAULT 0,
  avg_shares INT DEFAULT 0,
  avg_engagement_rate DECIMAL(5,2) DEFAULT 0, -- percentage

  -- Posting metrics
  posts_per_week DECIMAL(5,2) DEFAULT 0,
  posting_frequency TEXT, -- daily, weekly, etc.

  -- Content analysis
  top_content_types TEXT[], -- video, static, carousel, etc.
  top_hashtags TEXT[],

  -- Snapshot timestamp
  metric_date DATE NOT NULL DEFAULT CURRENT_DATE,
  collected_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_competitor_metric UNIQUE(competitor_id, platform, metric_date)
);

-- Competitor content (sample posts for analysis)
CREATE TABLE IF NOT EXISTS competitor_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,

  -- Post details
  platform_post_id TEXT NOT NULL,
  post_url TEXT,
  post_type TEXT, -- video, image, carousel, article, etc.
  caption TEXT,
  hashtags TEXT[],

  -- Engagement
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  engagement_rate DECIMAL(5,2) DEFAULT 0,

  -- Media
  media_urls TEXT[],
  thumbnail_url TEXT,

  -- Analysis
  sentiment TEXT, -- positive, neutral, negative
  topics TEXT[], -- extracted topics/themes

  -- Timestamps
  published_at TIMESTAMPTZ NOT NULL,
  discovered_at TIMESTAMPTZ DEFAULT now(),

  CONSTRAINT unique_competitor_post UNIQUE(competitor_id, platform, platform_post_id)
);

-- Competitor comparison reports
CREATE TABLE IF NOT EXISTS competitor_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Report details
  report_name TEXT NOT NULL,
  description TEXT,

  -- Competitors included
  competitor_ids UUID[] NOT NULL,

  -- Metrics to compare
  metrics JSONB NOT NULL, -- { follower_growth: true, engagement_rate: true, ... }

  -- Date range
  date_from DATE NOT NULL,
  date_to DATE NOT NULL,

  -- Schedule
  is_scheduled BOOLEAN DEFAULT false,
  frequency TEXT, -- weekly, monthly
  send_on_day INT, -- day of week/month
  recipients TEXT[],

  -- Report data (cached)
  report_data JSONB,

  last_generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Competitor alerts
CREATE TABLE IF NOT EXISTS competitor_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  competitor_id UUID NOT NULL REFERENCES competitors(id) ON DELETE CASCADE,

  -- Alert configuration
  alert_name TEXT NOT NULL,
  alert_type TEXT NOT NULL, -- follower_spike, engagement_spike, viral_post, new_post

  -- Trigger conditions
  threshold_value DECIMAL(10,2),
  threshold_type TEXT, -- percentage, absolute

  -- Notification
  notify_users UUID[],
  notify_email TEXT[],
  is_active BOOLEAN DEFAULT true,

  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Link competitor mentions to social_listening_mentions
-- This allows us to track when competitors are mentioned
ALTER TABLE social_listening_mentions
ADD COLUMN IF NOT EXISTS competitor_id UUID REFERENCES competitors(id) ON DELETE SET NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_competitors_org ON competitors(organization_id);
CREATE INDEX IF NOT EXISTS idx_competitors_active ON competitors(organization_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_competitor_metrics_competitor ON competitor_metrics(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_metrics_date ON competitor_metrics(metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_metrics_platform ON competitor_metrics(competitor_id, platform);

CREATE INDEX IF NOT EXISTS idx_competitor_posts_competitor ON competitor_posts(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_posts_published ON competitor_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_posts_engagement ON competitor_posts(engagement_rate DESC);

CREATE INDEX IF NOT EXISTS idx_competitor_reports_org ON competitor_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_competitor_alerts_org ON competitor_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_competitor_alerts_active ON competitor_alerts(organization_id, is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_listening_mentions_competitor ON social_listening_mentions(competitor_id) WHERE competitor_id IS NOT NULL;

-- Enable Row Level Security
ALTER TABLE competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for competitors
CREATE POLICY "Users can view competitors in their organization"
  ON competitors FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert competitors in their organization"
  ON competitors FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update competitors in their organization"
  ON competitors FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete competitors in their organization"
  ON competitors FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for competitor_metrics
CREATE POLICY "Users can view competitor metrics in their organization"
  ON competitor_metrics FOR SELECT
  USING (
    competitor_id IN (
      SELECT id FROM competitors WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert competitor metrics in their organization"
  ON competitor_metrics FOR INSERT
  WITH CHECK (
    competitor_id IN (
      SELECT id FROM competitors WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for competitor_posts
CREATE POLICY "Users can view competitor posts in their organization"
  ON competitor_posts FOR SELECT
  USING (
    competitor_id IN (
      SELECT id FROM competitors WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert competitor posts in their organization"
  ON competitor_posts FOR INSERT
  WITH CHECK (
    competitor_id IN (
      SELECT id FROM competitors WHERE organization_id IN (
        SELECT organization_id FROM users WHERE id = auth.uid()
      )
    )
  );

-- RLS Policies for competitor_reports
CREATE POLICY "Users can view competitor reports in their organization"
  ON competitor_reports FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage competitor reports in their organization"
  ON competitor_reports FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- RLS Policies for competitor_alerts
CREATE POLICY "Users can view competitor alerts in their organization"
  ON competitor_alerts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can manage competitor alerts in their organization"
  ON competitor_alerts FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM users WHERE id = auth.uid()
    )
  );

-- Helper function: Get competitor growth rate
CREATE OR REPLACE FUNCTION get_competitor_growth_rate(
  p_competitor_id UUID,
  p_platform TEXT,
  p_metric TEXT,
  p_days INT DEFAULT 30
)
RETURNS DECIMAL(5,2) AS $$
DECLARE
  v_current_value DECIMAL;
  v_previous_value DECIMAL;
  v_growth_rate DECIMAL(5,2);
BEGIN
  -- Get current metric value
  EXECUTE format('
    SELECT %I FROM competitor_metrics
    WHERE competitor_id = $1 AND platform = $2
    ORDER BY metric_date DESC LIMIT 1
  ', p_metric)
  INTO v_current_value
  USING p_competitor_id, p_platform;

  -- Get previous metric value (p_days ago)
  EXECUTE format('
    SELECT %I FROM competitor_metrics
    WHERE competitor_id = $1 AND platform = $2
      AND metric_date <= CURRENT_DATE - INTERVAL ''%s days''
    ORDER BY metric_date DESC LIMIT 1
  ', p_metric, p_days)
  INTO v_previous_value
  USING p_competitor_id, p_platform;

  -- Calculate growth rate
  IF v_previous_value IS NULL OR v_previous_value = 0 THEN
    RETURN 0;
  END IF;

  v_growth_rate := ((v_current_value - v_previous_value) / v_previous_value) * 100;

  RETURN v_growth_rate;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE competitors IS 'Track competitor brands for comparison and monitoring';
COMMENT ON TABLE competitor_metrics IS 'Historical performance metrics for competitors';
COMMENT ON TABLE competitor_posts IS 'Sample competitor posts for content analysis';
COMMENT ON TABLE competitor_reports IS 'Scheduled competitor comparison reports';
COMMENT ON TABLE competitor_alerts IS 'Alerts for competitor activity changes';
