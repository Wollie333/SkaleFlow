-- Migration 013: Social Media Integration Tables
-- Adds social_media_connections, published_posts, and post_analytics tables

-- ============================================
-- Table: social_media_connections
-- OAuth tokens per platform per organization
-- ============================================
CREATE TABLE IF NOT EXISTS public.social_media_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'facebook', 'instagram', 'twitter', 'tiktok')),
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    platform_user_id TEXT,
    platform_username TEXT,
    platform_page_id TEXT,
    platform_page_name TEXT,
    scopes TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT true,
    connected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (organization_id, platform)
);

-- Indexes
CREATE INDEX idx_social_connections_org ON public.social_media_connections(organization_id);
CREATE INDEX idx_social_connections_user ON public.social_media_connections(user_id);
CREATE INDEX idx_social_connections_platform ON public.social_media_connections(platform);
CREATE INDEX idx_social_connections_active ON public.social_media_connections(is_active) WHERE is_active = true;

-- ============================================
-- Table: published_posts
-- Track each platform publish
-- ============================================
CREATE TABLE IF NOT EXISTS public.published_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_item_id UUID NOT NULL REFERENCES public.content_items(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    connection_id UUID NOT NULL REFERENCES public.social_media_connections(id) ON DELETE CASCADE,
    platform TEXT NOT NULL CHECK (platform IN ('linkedin', 'facebook', 'instagram', 'twitter', 'tiktok')),
    platform_post_id TEXT,
    post_url TEXT,
    published_at TIMESTAMPTZ,
    publish_status TEXT NOT NULL DEFAULT 'queued' CHECK (publish_status IN ('queued', 'publishing', 'published', 'failed')),
    error_message TEXT,
    retry_count INT NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_published_posts_content ON public.published_posts(content_item_id);
CREATE INDEX idx_published_posts_org ON public.published_posts(organization_id);
CREATE INDEX idx_published_posts_connection ON public.published_posts(connection_id);
CREATE INDEX idx_published_posts_status ON public.published_posts(publish_status);
CREATE INDEX idx_published_posts_platform ON public.published_posts(platform);

-- ============================================
-- Table: post_analytics
-- Time-series metrics per published post
-- ============================================
CREATE TABLE IF NOT EXISTS public.post_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    published_post_id UUID NOT NULL REFERENCES public.published_posts(id) ON DELETE CASCADE,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    likes INT NOT NULL DEFAULT 0,
    comments INT NOT NULL DEFAULT 0,
    shares INT NOT NULL DEFAULT 0,
    saves INT NOT NULL DEFAULT 0,
    impressions INT NOT NULL DEFAULT 0,
    reach INT NOT NULL DEFAULT 0,
    clicks INT NOT NULL DEFAULT 0,
    video_views INT NOT NULL DEFAULT 0,
    engagement_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_post_analytics_post ON public.post_analytics(published_post_id);
CREATE INDEX idx_post_analytics_synced ON public.post_analytics(synced_at);

-- ============================================
-- Updated_at triggers
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_social_connections_updated_at
    BEFORE UPDATE ON public.social_media_connections
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_published_posts_updated_at
    BEFORE UPDATE ON public.published_posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE public.social_media_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.published_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_analytics ENABLE ROW LEVEL SECURITY;

-- social_media_connections: org members can view, owners/admins can manage
CREATE POLICY social_connections_select ON public.social_media_connections
    FOR SELECT
    USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY social_connections_insert ON public.social_media_connections
    FOR INSERT
    WITH CHECK (
        public.get_user_org_role(organization_id, auth.uid()) IN ('owner', 'admin')
    );

CREATE POLICY social_connections_update ON public.social_media_connections
    FOR UPDATE
    USING (
        public.get_user_org_role(organization_id, auth.uid()) IN ('owner', 'admin')
    );

CREATE POLICY social_connections_delete ON public.social_media_connections
    FOR DELETE
    USING (
        public.get_user_org_role(organization_id, auth.uid()) IN ('owner', 'admin')
    );

-- published_posts: org members can view and manage
CREATE POLICY published_posts_select ON public.published_posts
    FOR SELECT
    USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY published_posts_insert ON public.published_posts
    FOR INSERT
    WITH CHECK (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY published_posts_update ON public.published_posts
    FOR UPDATE
    USING (public.is_org_member(organization_id, auth.uid()));

-- post_analytics: viewable by org members via join to published_posts
CREATE POLICY post_analytics_select ON public.post_analytics
    FOR SELECT
    USING (
        published_post_id IN (
            SELECT pp.id FROM public.published_posts pp
            WHERE pp.organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
        )
    );

CREATE POLICY post_analytics_insert ON public.post_analytics
    FOR INSERT
    WITH CHECK (
        published_post_id IN (
            SELECT pp.id FROM public.published_posts pp
            WHERE pp.organization_id IN (SELECT public.get_user_org_ids(auth.uid()))
        )
    );
