-- Create org-logos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('org-logos', 'org-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload logos to their organization's folder
CREATE POLICY "Authenticated users can upload org logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'org-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text
    FROM public.org_members om
    WHERE om.user_id = auth.uid()
  )
);

-- Allow authenticated users to update their org's logos
CREATE POLICY "Authenticated users can update org logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'org-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text
    FROM public.org_members om
    WHERE om.user_id = auth.uid()
  )
);

-- Allow authenticated users to delete their org's logos
CREATE POLICY "Authenticated users can delete org logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'org-logos'
  AND (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text
    FROM public.org_members om
    WHERE om.user_id = auth.uid()
  )
);

-- Allow public read access to all logos
CREATE POLICY "Public can read org logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'org-logos');
