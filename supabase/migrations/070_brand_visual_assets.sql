-- Brand visual assets table for logo variants, patterns, mood board images
CREATE TABLE IF NOT EXISTS public.brand_visual_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('primary_logo', 'logo_dark', 'logo_light', 'logo_icon', 'pattern', 'mood_board')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brand_visual_assets_org ON public.brand_visual_assets(organization_id);

-- RLS
ALTER TABLE public.brand_visual_assets ENABLE ROW LEVEL SECURITY;

-- Org members can read their org's assets
CREATE POLICY "Org members can read brand visual assets"
ON public.brand_visual_assets FOR SELECT
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM public.org_members om WHERE om.user_id = auth.uid()
  )
);

-- Org members can insert assets for their org
CREATE POLICY "Org members can insert brand visual assets"
ON public.brand_visual_assets FOR INSERT
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT om.organization_id FROM public.org_members om WHERE om.user_id = auth.uid()
  )
);

-- Org members can update their org's assets
CREATE POLICY "Org members can update brand visual assets"
ON public.brand_visual_assets FOR UPDATE
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM public.org_members om WHERE om.user_id = auth.uid()
  )
);

-- Org members can delete their org's assets
CREATE POLICY "Org members can delete brand visual assets"
ON public.brand_visual_assets FOR DELETE
TO authenticated
USING (
  organization_id IN (
    SELECT om.organization_id FROM public.org_members om WHERE om.user_id = auth.uid()
  )
);

-- Public read for brand guide pages (service role or anon)
CREATE POLICY "Public can read brand visual assets"
ON public.brand_visual_assets FOR SELECT
TO anon
USING (true);

-- Create brand-assets storage bucket (public read)
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (same pattern as org-logos)
CREATE POLICY "Authenticated users can upload brand assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text
    FROM public.org_members om
    WHERE om.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can update brand assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text
    FROM public.org_members om
    WHERE om.user_id = auth.uid()
  )
);

CREATE POLICY "Authenticated users can delete brand assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'brand-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text
    FROM public.org_members om
    WHERE om.user_id = auth.uid()
  )
);

CREATE POLICY "Public can read brand assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'brand-assets');
