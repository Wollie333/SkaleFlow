-- Migration 040: Social Inbox Tables
-- Unified inbox for managing social media interactions: comments, DMs, mentions

-- ============================================
-- Table: social_interactions
-- All social media interactions across platforms
-- ============================================
CREATE TABLE IF NOT EXISTS public.social_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    connection_id UUID NOT NULL REFERENCES public.social_media_connections(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'facebook', 'instagram', 'twitter', 'tiktok', 'youtube')),

    -- Interaction type and IDs
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('comment', 'dm', 'mention', 'reply')),
    platform_interaction_id TEXT NOT NULL, -- platform's ID for this interaction
    parent_interaction_id UUID REFERENCES public.social_interactions(id) ON DELETE CASCADE, -- for threaded replies

    -- Content
    message TEXT NOT NULL,
    author_platform_id TEXT NOT NULL,
    author_name TEXT,
    author_username TEXT,
    author_avatar_url TEXT,

    -- Associated content
    published_post_id UUID REFERENCES public.published_posts(id) ON DELETE SET NULL,

    -- Metadata
    sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'question')),
    sentiment_confidence DECIMAL(3,2),
    has_media BOOLEAN DEFAULT false,
    media_urls TEXT[],

    -- Management
    is_read BOOLEAN DEFAULT false,
    is_replied BOOLEAN DEFAULT false,
    assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
    replied_at TIMESTAMPTZ,
    replied_by UUID REFERENCES public.users(id) ON DELETE SET NULL,

    -- Timestamps
    interaction_timestamp TIMESTAMPTZ NOT NULL, -- when it happened on the platform
    synced_at TIMESTAMPTZ DEFAULT now(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_platform_interaction UNIQUE(platform, platform_interaction_id)
);

-- Indexes
CREATE INDEX idx_social_interactions_org ON public.social_interactions(organization_id);
CREATE INDEX idx_social_interactions_connection ON public.social_interactions(connection_id);
CREATE INDEX idx_social_interactions_type ON public.social_interactions(interaction_type);
CREATE INDEX idx_social_interactions_platform ON public.social_interactions(platform);
CREATE INDEX idx_social_interactions_unread ON public.social_interactions(is_read) WHERE is_read = false;
CREATE INDEX idx_social_interactions_assigned ON public.social_interactions(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_social_interactions_timestamp ON public.social_interactions(interaction_timestamp DESC);
CREATE INDEX idx_social_interactions_post ON public.social_interactions(published_post_id) WHERE published_post_id IS NOT NULL;
CREATE INDEX idx_social_interactions_sentiment ON public.social_interactions(sentiment) WHERE sentiment IS NOT NULL;

-- RLS Policies
ALTER TABLE public.social_interactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view interactions in their organization"
    ON public.social_interactions
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage interactions in their organization"
    ON public.social_interactions
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

-- ============================================
-- Table: saved_replies
-- Quick response templates for social interactions
-- ============================================
CREATE TABLE IF NOT EXISTS public.saved_replies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT, -- e.g., 'thank_you', 'customer_support', 'faq'
    platforms TEXT[], -- which platforms this is suitable for
    use_count INT DEFAULT 0,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_saved_replies_org ON public.saved_replies(organization_id);
CREATE INDEX idx_saved_replies_category ON public.saved_replies(category) WHERE category IS NOT NULL;
CREATE INDEX idx_saved_replies_usage ON public.saved_replies(use_count DESC);

-- RLS Policies
ALTER TABLE public.saved_replies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view saved replies in their organization"
    ON public.saved_replies
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage saved replies in their organization"
    ON public.saved_replies
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

-- ============================================
-- Table: inbox_streams
-- Custom filtered views of interactions
-- ============================================
CREATE TABLE IF NOT EXISTS public.inbox_streams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    filters JSONB NOT NULL DEFAULT '{}'::jsonb, -- { platforms: [], types: [], sentiment: [], keywords: [] }
    is_default BOOLEAN DEFAULT false,
    sort_order INT DEFAULT 0,
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_inbox_streams_org ON public.inbox_streams(organization_id);
CREATE INDEX idx_inbox_streams_order ON public.inbox_streams(sort_order);

-- RLS Policies
ALTER TABLE public.inbox_streams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view streams in their organization"
    ON public.inbox_streams
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can manage streams in their organization"
    ON public.inbox_streams
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

-- ============================================
-- Update triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_social_interactions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_interactions_updated_at
    BEFORE UPDATE ON public.social_interactions
    FOR EACH ROW
    EXECUTE FUNCTION update_social_interactions_updated_at();

CREATE TRIGGER saved_replies_updated_at
    BEFORE UPDATE ON public.saved_replies
    FOR EACH ROW
    EXECUTE FUNCTION update_social_interactions_updated_at();

CREATE TRIGGER inbox_streams_updated_at
    BEFORE UPDATE ON public.inbox_streams
    FOR EACH ROW
    EXECUTE FUNCTION update_social_interactions_updated_at();

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE public.social_interactions IS 'Unified inbox for all social media interactions: comments, DMs, mentions';
COMMENT ON TABLE public.saved_replies IS 'Quick response templates for social media engagement';
COMMENT ON TABLE public.inbox_streams IS 'Custom filtered views of social interactions';
