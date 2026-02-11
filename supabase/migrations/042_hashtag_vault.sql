-- Migration 042: Hashtag Vault Tables
-- Save and organize hashtag sets for quick insertion and performance tracking

-- ============================================
-- Table: hashtag_sets
-- Saved hashtag collections
-- ============================================
CREATE TABLE IF NOT EXISTS public.hashtag_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    hashtags TEXT[] NOT NULL,
    platforms TEXT[], -- which platforms this set is for (linkedin, twitter, etc.)
    category TEXT, -- industry, trending, branded, campaign-specific
    use_count INT DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_hashtag_sets_org ON public.hashtag_sets(organization_id);
CREATE INDEX idx_hashtag_sets_category ON public.hashtag_sets(category) WHERE category IS NOT NULL;
CREATE INDEX idx_hashtag_sets_usage ON public.hashtag_sets(use_count DESC);
CREATE INDEX idx_hashtag_sets_last_used ON public.hashtag_sets(last_used_at DESC);

-- ============================================
-- Table: hashtag_analytics
-- Performance tracking per hashtag per platform
-- ============================================
CREATE TABLE IF NOT EXISTS public.hashtag_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    hashtag TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube')),

    -- Usage metrics
    used_count INT DEFAULT 1,
    last_used_at TIMESTAMPTZ DEFAULT now(),

    -- Performance metrics
    total_impressions INT DEFAULT 0,
    total_engagement INT DEFAULT 0,
    avg_engagement_rate DECIMAL(5,2) DEFAULT 0,
    total_reach INT DEFAULT 0,

    -- Time tracking
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_org_hashtag_platform UNIQUE(organization_id, hashtag, platform)
);

-- Indexes
CREATE INDEX idx_hashtag_analytics_org ON public.hashtag_analytics(organization_id);
CREATE INDEX idx_hashtag_analytics_platform ON public.hashtag_analytics(platform);
CREATE INDEX idx_hashtag_analytics_performance ON public.hashtag_analytics(avg_engagement_rate DESC);
CREATE INDEX idx_hashtag_analytics_hashtag ON public.hashtag_analytics(hashtag);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE public.hashtag_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hashtag_analytics ENABLE ROW LEVEL SECURITY;

-- Hashtag Sets
CREATE POLICY "Users can view hashtag sets in their organization"
    ON public.hashtag_sets
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage hashtag sets in their organization"
    ON public.hashtag_sets
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Hashtag Analytics
CREATE POLICY "Users can view hashtag analytics in their organization"
    ON public.hashtag_analytics
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage hashtag analytics in their organization"
    ON public.hashtag_analytics
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

-- ============================================
-- Update triggers
-- ============================================
CREATE TRIGGER hashtag_sets_updated_at
    BEFORE UPDATE ON public.hashtag_sets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER hashtag_analytics_updated_at
    BEFORE UPDATE ON public.hashtag_analytics
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Helper function to increment hashtag usage
-- ============================================
CREATE OR REPLACE FUNCTION increment_hashtag_usage(
    p_organization_id UUID,
    p_hashtags TEXT[],
    p_platform TEXT
)
RETURNS void AS $$
DECLARE
    h TEXT;
BEGIN
    FOREACH h IN ARRAY p_hashtags
    LOOP
        INSERT INTO public.hashtag_analytics (
            organization_id,
            hashtag,
            platform,
            used_count,
            last_used_at
        )
        VALUES (
            p_organization_id,
            h,
            p_platform,
            1,
            now()
        )
        ON CONFLICT (organization_id, hashtag, platform)
        DO UPDATE SET
            used_count = hashtag_analytics.used_count + 1,
            last_used_at = now();
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE public.hashtag_sets IS 'Saved hashtag collections for quick insertion into posts';
COMMENT ON TABLE public.hashtag_analytics IS 'Performance tracking for individual hashtags per platform';
COMMENT ON FUNCTION increment_hashtag_usage IS 'Increments usage count when hashtags are used in posts';
