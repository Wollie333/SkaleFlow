-- Migration 044: Enhanced Analytics Tables
-- Sentiment analysis, benchmarks, and custom reports

-- ============================================
-- Table: post_sentiment_analysis
-- Sentiment analysis results for published posts
-- ============================================
CREATE TABLE IF NOT EXISTS public.post_sentiment_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    published_post_id UUID NOT NULL REFERENCES public.published_posts(id) ON DELETE CASCADE,

    -- Sentiment counts
    positive_count INT DEFAULT 0,
    neutral_count INT DEFAULT 0,
    negative_count INT DEFAULT 0,
    question_count INT DEFAULT 0,

    -- Overall sentiment
    overall_sentiment TEXT CHECK (overall_sentiment IN ('positive', 'neutral', 'negative', 'mixed')),
    sentiment_score DECIMAL(3,2), -- -1 to 1 (-1 = very negative, 1 = very positive)

    -- Sample information
    sample_size INT DEFAULT 0, -- number of comments analyzed
    sample_comments JSONB DEFAULT '[]'::jsonb, -- sample comments for review

    analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_post_sentiment UNIQUE(published_post_id)
);

-- Indexes
CREATE INDEX idx_post_sentiment_post ON public.post_sentiment_analysis(published_post_id);
CREATE INDEX idx_post_sentiment_overall ON public.post_sentiment_analysis(overall_sentiment);
CREATE INDEX idx_post_sentiment_score ON public.post_sentiment_analysis(sentiment_score DESC);
CREATE INDEX idx_post_sentiment_analyzed ON public.post_sentiment_analysis(analyzed_at DESC);

-- ============================================
-- Table: industry_benchmarks
-- Industry performance benchmarks for comparison
-- ============================================
CREATE TABLE IF NOT EXISTS public.industry_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    industry TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube')),
    metric_name TEXT NOT NULL, -- 'engagement_rate', 'avg_reach', 'avg_impressions', etc.
    metric_value DECIMAL(10,2) NOT NULL,

    -- Percentile data
    percentile_25 DECIMAL(10,2),
    percentile_50 DECIMAL(10,2), -- median
    percentile_75 DECIMAL(10,2),
    percentile_90 DECIMAL(10,2),

    sample_size INT,
    source TEXT, -- where data came from (e.g., 'internal', 'hubspot_report', 'hootsuite_study')

    -- Validity period
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_until DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_industry_benchmark UNIQUE(industry, platform, metric_name, valid_from)
);

-- Indexes
CREATE INDEX idx_industry_benchmarks_industry ON public.industry_benchmarks(industry);
CREATE INDEX idx_industry_benchmarks_platform ON public.industry_benchmarks(platform);
CREATE INDEX idx_industry_benchmarks_metric ON public.industry_benchmarks(metric_name);
CREATE INDEX idx_industry_benchmarks_valid ON public.industry_benchmarks(valid_from, valid_until);

-- ============================================
-- Table: custom_reports
-- Custom analytics reports with scheduling
-- ============================================
CREATE TABLE IF NOT EXISTS public.custom_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,

    -- Report configuration
    report_type TEXT NOT NULL CHECK (report_type IN ('performance', 'audience', 'content_type', 'sentiment', 'custom')),
    filters JSONB DEFAULT '{}'::jsonb, -- date range, platforms, campaigns, etc.
    metrics TEXT[] NOT NULL, -- which metrics to include
    visualizations JSONB DEFAULT '[]'::jsonb, -- chart configurations

    -- Scheduling
    schedule_enabled BOOLEAN DEFAULT false,
    schedule_frequency TEXT CHECK (schedule_frequency IN ('daily', 'weekly', 'monthly')),
    schedule_day INT, -- day of week (1-7) or day of month (1-31)
    schedule_time TIME,
    email_recipients TEXT[] DEFAULT '{}',

    last_generated_at TIMESTAMPTZ,
    last_sent_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,

    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_custom_reports_org ON public.custom_reports(organization_id);
CREATE INDEX idx_custom_reports_type ON public.custom_reports(report_type);
CREATE INDEX idx_custom_reports_scheduled ON public.custom_reports(schedule_enabled) WHERE schedule_enabled = true;
CREATE INDEX idx_custom_reports_active ON public.custom_reports(is_active) WHERE is_active = true;

-- ============================================
-- Table: report_executions
-- Track report generation history
-- ============================================
CREATE TABLE IF NOT EXISTS public.report_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    custom_report_id UUID NOT NULL REFERENCES public.custom_reports(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

    -- Execution details
    executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    execution_status TEXT NOT NULL CHECK (execution_status IN ('success', 'failed', 'partial')) DEFAULT 'success',
    error_message TEXT,

    -- Results
    data_summary JSONB DEFAULT '{}'::jsonb, -- key metrics from the report
    file_url TEXT, -- URL to generated PDF if applicable

    -- Delivery
    was_emailed BOOLEAN DEFAULT false,
    email_sent_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_report_executions_report ON public.report_executions(custom_report_id);
CREATE INDEX idx_report_executions_org ON public.report_executions(organization_id);
CREATE INDEX idx_report_executions_executed ON public.report_executions(executed_at DESC);
CREATE INDEX idx_report_executions_status ON public.report_executions(execution_status);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE public.post_sentiment_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.industry_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_executions ENABLE ROW LEVEL SECURITY;

-- Post Sentiment Analysis
CREATE POLICY "Users can view sentiment analysis for their organization posts"
    ON public.post_sentiment_analysis
    FOR SELECT
    USING (
        published_post_id IN (
            SELECT id FROM public.published_posts
            WHERE organization_id IN (
                SELECT organization_id FROM public.users WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "System can manage sentiment analysis"
    ON public.post_sentiment_analysis
    FOR ALL
    USING (
        published_post_id IN (
            SELECT id FROM public.published_posts
            WHERE organization_id IN (
                SELECT organization_id FROM public.users WHERE id = auth.uid()
            )
        )
    );

-- Industry Benchmarks (read-only for all authenticated users)
CREATE POLICY "Authenticated users can view industry benchmarks"
    ON public.industry_benchmarks
    FOR SELECT
    TO authenticated
    USING (true);

-- Custom Reports
CREATE POLICY "Users can view reports in their organization"
    ON public.custom_reports
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage reports in their organization"
    ON public.custom_reports
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

-- Report Executions
CREATE POLICY "Users can view report executions in their organization"
    ON public.report_executions
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "System can create report executions"
    ON public.report_executions
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

-- ============================================
-- Update trigger
-- ============================================
CREATE TRIGGER custom_reports_updated_at
    BEFORE UPDATE ON public.custom_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Helper function to calculate sentiment score
-- ============================================
CREATE OR REPLACE FUNCTION calculate_sentiment_score(
    p_positive INT,
    p_neutral INT,
    p_negative INT
)
RETURNS DECIMAL(3,2) AS $$
DECLARE
    v_total INT;
    v_score DECIMAL(3,2);
BEGIN
    v_total := p_positive + p_neutral + p_negative;

    IF v_total = 0 THEN
        RETURN 0;
    END IF;

    -- Calculate weighted score: positive contributes +1, negative -1, neutral 0
    v_score := ((p_positive::DECIMAL - p_negative::DECIMAL) / v_total);

    RETURN v_score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE public.post_sentiment_analysis IS 'Sentiment analysis results for published posts based on comments and engagement';
COMMENT ON TABLE public.industry_benchmarks IS 'Industry performance benchmarks for comparison';
COMMENT ON TABLE public.custom_reports IS 'Custom analytics reports with scheduling capabilities';
COMMENT ON TABLE public.report_executions IS 'History of report generation executions';
COMMENT ON FUNCTION calculate_sentiment_score IS 'Calculates a sentiment score from -1 to 1 based on positive/neutral/negative counts';
