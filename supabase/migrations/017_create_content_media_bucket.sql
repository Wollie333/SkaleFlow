-- Create content-media storage bucket for creative assets (images, videos, PDFs)
INSERT INTO storage.buckets (id, name, public)
VALUES ('content-media', 'content-media', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload media to their organization's folder
CREATE POLICY "Authenticated users can upload content media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'content-media'
  AND (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text
    FROM public.org_members om
    WHERE om.user_id = auth.uid()
  )
);

-- Allow authenticated users to update their org's media
CREATE POLICY "Authenticated users can update content media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'content-media'
  AND (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text
    FROM public.org_members om
    WHERE om.user_id = auth.uid()
  )
);

-- Allow authenticated users to delete their org's media
CREATE POLICY "Authenticated users can delete content media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'content-media'
  AND (storage.foldername(name))[1] IN (
    SELECT om.organization_id::text
    FROM public.org_members om
    WHERE om.user_id = auth.uid()
  )
);

-- Allow public read access to all content media
CREATE POLICY "Public can read content media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'content-media');
