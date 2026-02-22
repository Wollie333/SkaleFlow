-- Create social-media storage bucket for media library assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('social-media', 'social-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload media to their organization's folder
DROP POLICY IF EXISTS "Authenticated users can upload social media" ON storage.objects;
CREATE POLICY "Authenticated users can upload social media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'social-media'
  AND (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text
    FROM public.org_members om
    WHERE om.user_id = auth.uid()
  )
);

-- Allow authenticated users to update their org's media
DROP POLICY IF EXISTS "Authenticated users can update social media" ON storage.objects;
CREATE POLICY "Authenticated users can update social media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'social-media'
  AND (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text
    FROM public.org_members om
    WHERE om.user_id = auth.uid()
  )
);

-- Allow authenticated users to delete their org's media
DROP POLICY IF EXISTS "Authenticated users can delete social media" ON storage.objects;
CREATE POLICY "Authenticated users can delete social media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'social-media'
  AND (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text
    FROM public.org_members om
    WHERE om.user_id = auth.uid()
  )
);

-- Allow public read access to all social media files
DROP POLICY IF EXISTS "Public can read social media" ON storage.objects;
CREATE POLICY "Public can read social media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'social-media');
