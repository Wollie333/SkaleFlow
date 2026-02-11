-- Migration 039: Campaigns and Tags for Content Organization
-- Adds content_campaigns table and extends content_items with campaign_id and tags

-- ============================================
-- Table: content_campaigns
-- Campaign management for content organization
-- ============================================
CREATE TABLE IF NOT EXISTS public.content_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#0891b2', -- teal default
    start_date DATE,
    end_date DATE,
    goal TEXT,
    status TEXT CHECK (status IN ('active', 'completed', 'archived')) DEFAULT 'active',
    created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_campaigns_org ON public.content_campaigns(organization_id);
CREATE INDEX idx_campaigns_status ON public.content_campaigns(status);
CREATE INDEX idx_campaigns_dates ON public.content_campaigns(start_date, end_date);

-- RLS Policies
ALTER TABLE public.content_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view campaigns in their organization"
    ON public.content_campaigns
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage campaigns in their organization"
    ON public.content_campaigns
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM public.users
            WHERE id = auth.uid()
        )
    );

-- ============================================
-- Extend content_items table
-- Add campaign_id and tags columns
-- ============================================

-- Add campaign_id column
ALTER TABLE public.content_items
ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.content_campaigns(id) ON DELETE SET NULL;

-- Add tags column (array of text)
ALTER TABLE public.content_items
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_content_items_campaign ON public.content_items(campaign_id);
CREATE INDEX IF NOT EXISTS idx_content_items_tags ON public.content_items USING GIN(tags);

-- ============================================
-- Update trigger for content_campaigns
-- ============================================
CREATE OR REPLACE FUNCTION update_content_campaigns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_campaigns_updated_at
    BEFORE UPDATE ON public.content_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION update_content_campaigns_updated_at();

-- ============================================
-- Comments
-- ============================================
COMMENT ON TABLE public.content_campaigns IS 'Content campaigns for organizing and tracking content across marketing initiatives';
COMMENT ON COLUMN public.content_items.campaign_id IS 'Optional campaign this content belongs to';
COMMENT ON COLUMN public.content_items.tags IS 'Array of tags for content organization and filtering';
