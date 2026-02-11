-- Migration 041: Social Listening Tables
-- Track brand mentions, sentiment, trends across social media and the web

-- ============================================
-- Table: social_listening_keywords
-- Keywords to track (brand, competitors, industry terms)
-- ============================================
CREATE TABLE IF NOT EXISTS public.social_listening_keywords (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    keyword TEXT NOT NULL,
    keyword_type TEXT CHECK (keyword_type IN ('brand', 'competitor', 'industry', 'hashtag')),
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_listening_keywords_org ON public.social_listening_keywords(organization_id);
CREATE INDEX idx_listening_keywords_active ON public.social_listening_keywords(is_active) WHERE is_active = true;
CREATE INDEX idx_listening_keywords_type ON public.social_listening_keywords(keyword_type);

-- ============================================
-- Table: social_listening_mentions
-- Brand mentions found across platforms
-- ============================================
CREATE TABLE IF NOT EXISTS public.social_listening_mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    keyword_id UUID NOT NULL REFERENCES public.social_listening_keywords(id) ON DELETE CASCADE,

    -- Source
    platform TEXT, -- twitter, linkedin, facebook, reddit, news, blog, etc.
    source_type TEXT, -- post, comment, article, video
    url TEXT,

    -- Content
    content TEXT NOT NULL,
    author_name TEXT,
    author_username TEXT,
    author_avatar_url TEXT,

    -- Media detection
    has_image BOOLEAN DEFAULT false,
    has_video BOOLEAN DEFAULT false,
    media_urls TEXT[],
    brand_detected_in_media BOOLEAN DEFAULT false, -- AI detected brand in image/video

    -- Metrics
    engagement_count INT DEFAULT 0, -- likes, shares, comments
    reach_estimate INT,

    -- Analysis
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative')),
    sentiment_confidence DECIMAL(3,2),
    topics TEXT[], -- extracted topics/themes

    -- Management
    is_read BOOLEAN DEFAULT false,
    is_flagged BOOLEAN DEFAULT false,
    notes TEXT,

    -- Timestamps
    published_at TIMESTAMPTZ NOT NULL,
    discovered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_listening_mentions_org ON public.social_listening_mentions(organization_id);
CREATE INDEX idx_listening_mentions_keyword ON public.social_listening_mentions(keyword_id);
CREATE INDEX idx_listening_mentions_platform ON public.social_listening_mentions(platform);
CREATE INDEX idx_listening_mentions_published ON public.social_listening_mentions(published_at DESC);
CREATE INDEX idx_listening_mentions_sentiment ON public.social_listening_mentions(sentiment);
CREATE INDEX idx_listening_mentions_unread ON public.social_listening_mentions(is_read) WHERE is_read = false;
CREATE INDEX idx_listening_mentions_flagged ON public.social_listening_mentions(is_flagged) WHERE is_flagged = true;
CREATE INDEX idx_listening_mentions_topics ON public.social_listening_mentions USING GIN(topics);

-- ============================================
-- Table: social_listening_trends
-- Trending topics and hashtags
-- ============================================
CREATE TABLE IF NOT EXISTS public.social_listening_trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    trend_type TEXT NOT NULL CHECK (trend_type IN ('hashtag', 'topic', 'keyword')),
    trend_value TEXT NOT NULL,

    -- Metrics
    mention_count INT NOT NULL DEFAULT 0,
    growth_rate DECIMAL(5,2), -- percentage
    peak_timestamp TIMESTAMPTZ,

    -- Related
    related_keywords TEXT[],
    top_influencers JSONB DEFAULT '[]'::jsonb, -- [{ username, followers, posts }]

    -- Platform breakdown
    platform_distribution JSONB DEFAULT '{}'::jsonb, -- { twitter: 45, linkedin: 30, ... }

    time_period TEXT NOT NULL CHECK (time_period IN ('24h', '7d', '30d')),
    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_listening_trends_org ON public.social_listening_trends(organization_id);
CREATE INDEX idx_listening_trends_type ON public.social_listening_trends(trend_type);
CREATE INDEX idx_listening_trends_period ON public.social_listening_trends(time_period);
CREATE INDEX idx_listening_trends_analyzed ON public.social_listening_trends(analyzed_at DESC);
CREATE INDEX idx_listening_trends_growth ON public.social_listening_trends(growth_rate DESC);

-- ============================================
-- Table: social_listening_reports
-- Scheduled listening reports
-- ============================================
CREATE TABLE IF NOT EXISTS public.social_listening_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    report_name TEXT NOT NULL,

    -- Schedule
    frequency TEXT CHECK (frequency IN ('daily', 'weekly', 'monthly')),
    send_on_day INT, -- day of week (1-7) or day of month (1-31)
    send_at_time TIME,
    recipients TEXT[] NOT NULL,

    -- Content configuration
    include_mentions BOOLEAN DEFAULT true,
    include_sentiment BOOLEAN DEFAULT true,
    include_trends BOOLEAN DEFAULT true,
    include_competitors BOOLEAN DEFAULT false,

    is_active BOOLEAN DEFAULT true,
    last_sent_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_listening_reports_org ON public.social_listening_reports(organization_id);
CREATE INDEX idx_listening_reports_active ON public.social_listening_reports(is_active) WHERE is_active = true;
CREATE INDEX idx_listening_reports_frequency ON public.social_listening_reports(frequency);

-- ============================================
-- Table: social_listening_alerts
-- Automated alerts for important mentions/trends
-- ============================================
CREATE TABLE IF NOT EXISTS public.social_listening_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    alert_name TEXT NOT NULL,

    -- Trigger conditions
    trigger_type TEXT NOT NULL CHECK (trigger_type IN ('sentiment_drop', 'mention_spike', 'negative_mention', 'custom')),
    threshold_value DECIMAL(10,2),
    threshold_config JSONB DEFAULT '{}'::jsonb,

    -- Notification
    notify_users UUID[] DEFAULT '{}',
    notify_email TEXT[] DEFAULT '{}',

    is_active BOOLEAN DEFAULT true,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INT DEFAULT 0,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_listening_alerts_org ON public.social_listening_alerts(organization_id);
CREATE INDEX idx_listening_alerts_active ON public.social_listening_alerts(is_active) WHERE is_active = true;
CREATE INDEX idx_listening_alerts_type ON public.social_listening_alerts(trigger_type);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE public.social_listening_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_listening_mentions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_listening_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_listening_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.social_listening_alerts ENABLE ROW LEVEL SECURITY;

-- Keywords
CREATE POLICY "Users can view keywords in their organization"
    ON public.social_listening_keywords FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can manage keywords in their organization"
    ON public.social_listening_keywords FOR ALL
    USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- Mentions
CREATE POLICY "Users can view mentions in their organization"
    ON public.social_listening_mentions FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can manage mentions in their organization"
    ON public.social_listening_mentions FOR ALL
    USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- Trends
CREATE POLICY "Users can view trends in their organization"
    ON public.social_listening_trends FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can manage trends in their organization"
    ON public.social_listening_trends FOR ALL
    USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- Reports
CREATE POLICY "Users can view reports in their organization"
    ON public.social_listening_reports FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can manage reports in their organization"
    ON public.social_listening_reports FOR ALL
    USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- Alerts
CREATE POLICY "Users can view alerts in their organization"
    ON public.social_listening_alerts FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

CREATE POLICY "Users can manage alerts in their organization"
    ON public.social_listening_alerts FOR ALL
    USING (organization_id IN (SELECT organization_id FROM public.users WHERE id = auth.uid()));

-- ============================================
-- Update triggers
-- ============================================
CREATE TRIGGER listening_keywords_updated_at
    BEFORE UPDATE ON public.social_listening_keywords
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER listening_reports_updated_at
    BEFORE UPDATE ON public.social_listening_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER listening_alerts_updated_at
    BEFORE UPDATE ON public.social_listening_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE public.social_listening_keywords IS 'Keywords to track for social listening (brand, competitors, industry)';
COMMENT ON TABLE public.social_listening_mentions IS 'Brand mentions found across social media and the web';
COMMENT ON TABLE public.social_listening_trends IS 'Trending topics and hashtags relevant to the organization';
COMMENT ON TABLE public.social_listening_reports IS 'Scheduled social listening reports';
COMMENT ON TABLE public.social_listening_alerts IS 'Automated alerts for important social listening events';
