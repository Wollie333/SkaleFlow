-- =====================================================
-- PRESENCE ENGINE — Storage Bucket
-- =====================================================

-- Create presence-screenshots storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'presence-screenshots',
  'presence-screenshots',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
CREATE POLICY "Authenticated users can upload presence screenshots"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'presence-screenshots');

CREATE POLICY "Anyone can view presence screenshots"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'presence-screenshots');

CREATE POLICY "Users can update own presence screenshots"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'presence-screenshots');

CREATE POLICY "Users can delete own presence screenshots"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'presence-screenshots');
