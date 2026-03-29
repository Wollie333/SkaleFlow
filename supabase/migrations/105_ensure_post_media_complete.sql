-- =====================================================
-- Ensure Post Media Table Exists with Correct RLS
-- This is a comprehensive fix that creates the table if missing
-- and sets up RLS policies
-- =====================================================

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS post_media (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id         UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  media_type      TEXT NOT NULL CHECK (media_type IN ('image','video','carousel_image')),
  file_path       TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_size       BIGINT,
  mime_type       TEXT,
  width           INTEGER,
  height          INTEGER,
  duration        INTEGER,
  carousel_order  INTEGER,
  uploaded_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_post_media_org  ON post_media(organization_id);
CREATE INDEX IF NOT EXISTS idx_post_media_carousel ON post_media(post_id, carousel_order) WHERE media_type = 'carousel_image';

-- Enable RLS
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS post_media_select_org ON post_media;
DROP POLICY IF EXISTS post_media_insert_org ON post_media;
DROP POLICY IF EXISTS post_media_update_org ON post_media;
DROP POLICY IF EXISTS post_media_delete_org ON post_media;

-- Create new policies
CREATE POLICY post_media_select_org ON post_media
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY post_media_insert_org ON post_media
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY post_media_update_org ON post_media
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY post_media_delete_org ON post_media
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM org_members
      WHERE user_id = auth.uid()
    )
  );

-- Grant permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON post_media TO authenticated;
