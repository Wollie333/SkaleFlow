-- Migration 043: Best Time to Post Tables
-- AI-powered recommendations for optimal posting times

-- ============================================
-- Table: posting_schedule_analysis
-- Optimal posting times per platform
-- ============================================
CREATE TABLE IF NOT EXISTS public.posting_schedule_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube')),

    -- Analysis results
    best_times JSONB NOT NULL DEFAULT '{}'::jsonb, -- { "monday": ["09:00", "15:00"], "tuesday": [...], ... }
    confidence_score DECIMAL(3,2), -- 0-1
    sample_size INT NOT NULL, -- number of posts analyzed

    -- Metrics used for analysis
    avg_engagement_by_hour JSONB DEFAULT '{}'::jsonb, -- { "00": 2.5, "01": 1.2, ... }
    avg_reach_by_hour JSONB DEFAULT '{}'::jsonb,
    avg_impressions_by_hour JSONB DEFAULT '{}'::jsonb,

    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_org_platform_analysis UNIQUE(organization_id, platform)
);

-- Indexes
CREATE INDEX idx_posting_analysis_org ON public.posting_schedule_analysis(organization_id);
CREATE INDEX idx_posting_analysis_platform ON public.posting_schedule_analysis(platform);
CREATE INDEX idx_posting_analysis_analyzed ON public.posting_schedule_analysis(analyzed_at DESC);

-- ============================================
-- Table: auto_schedule_preferences
-- User preferences for auto-scheduling
-- ============================================
CREATE TABLE IF NOT EXISTS public.auto_schedule_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Auto-schedule settings
    enabled BOOLEAN DEFAULT false,
    use_ai_suggestions BOOLEAN DEFAULT true,
    custom_times JSONB DEFAULT '{}'::jsonb, -- override AI suggestions with manual times

    -- Timezone and scheduling rules
    timezone TEXT DEFAULT 'Africa/Johannesburg',
    min_posts_per_day INT DEFAULT 1,
    max_posts_per_day INT DEFAULT 5,
    preferred_days INT[] DEFAULT '{1,2,3,4,5}', -- 1=Monday, 7=Sunday
    exclude_hours INT[] DEFAULT '{0,1,2,3,4,5}', -- hours to avoid posting

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_org_preferences UNIQUE(organization_id)
);

-- Indexes
CREATE INDEX idx_auto_schedule_prefs_org ON public.auto_schedule_preferences(organization_id);
CREATE INDEX idx_auto_schedule_prefs_enabled ON public.auto_schedule_preferences(enabled) WHERE enabled = true;

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE public.posting_schedule_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_schedule_preferences ENABLE ROW LEVEL SECURITY;

-- Posting Schedule Analysis
CREATE POLICY "Users can view posting analysis in their organization"
    ON public.posting_schedule_analysis
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "System can manage posting analysis"
    ON public.posting_schedule_analysis
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Auto Schedule Preferences
CREATE POLICY "Users can view auto-schedule preferences in their organization"
    ON public.auto_schedule_preferences
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage auto-schedule preferences in their organization"
    ON public.auto_schedule_preferences
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

-- ============================================
-- Update trigger
-- ============================================
CREATE TRIGGER auto_schedule_preferences_updated_at
    BEFORE UPDATE ON public.auto_schedule_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Helper function to get optimal time suggestion
-- ============================================
CREATE OR REPLACE FUNCTION get_optimal_posting_time(
    p_organization_id UUID,
    p_platform TEXT,
    p_day_of_week INT -- 1=Monday, 7=Sunday
)
RETURNS TIME AS $$
DECLARE
    v_best_times JSONB;
    v_day_key TEXT;
    v_times TEXT[];
    v_result TIME;
BEGIN
    -- Map day number to day name
    v_day_key := CASE p_day_of_week
        WHEN 1 THEN 'monday'
        WHEN 2 THEN 'tuesday'
        WHEN 3 THEN 'wednesday'
        WHEN 4 THEN 'thursday'
        WHEN 5 THEN 'friday'
        WHEN 6 THEN 'saturday'
        WHEN 7 THEN 'sunday'
    END;

    -- Get best times for this platform and day
    SELECT best_times INTO v_best_times
    FROM public.posting_schedule_analysis
    WHERE organization_id = p_organization_id
      AND platform = p_platform;

    -- Extract times array for this day
    IF v_best_times IS NOT NULL THEN
        v_times := ARRAY(SELECT jsonb_array_elements_text(v_best_times->v_day_key));

        -- Return first recommended time
        IF array_length(v_times, 1) > 0 THEN
            v_result := v_times[1]::TIME;
        END IF;
    END IF;

    -- Default to 10:00 if no analysis available
    RETURN COALESCE(v_result, '10:00'::TIME);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE public.posting_schedule_analysis IS 'AI-analyzed optimal posting times per platform based on historical performance';
COMMENT ON TABLE public.auto_schedule_preferences IS 'Organization preferences for automated post scheduling';
COMMENT ON FUNCTION get_optimal_posting_time IS 'Returns the optimal posting time for a given platform and day of week';
