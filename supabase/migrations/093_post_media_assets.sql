-- =====================================================
-- Post Media Assets
-- Track uploaded media files for content posts
-- =====================================================

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
  duration        INTEGER, -- For videos, in seconds
  carousel_order  INTEGER, -- For carousel images
  uploaded_by     UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_post_media_post ON post_media(post_id);
CREATE INDEX IF NOT EXISTS idx_post_media_org  ON post_media(organization_id);
CREATE INDEX IF NOT EXISTS idx_post_media_carousel ON post_media(post_id, carousel_order) WHERE media_type = 'carousel_image';

ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_media' AND policyname = 'post_media_select_org') THEN
    CREATE POLICY post_media_select_org ON post_media FOR SELECT USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_media' AND policyname = 'post_media_insert_org') THEN
    CREATE POLICY post_media_insert_org ON post_media FOR INSERT WITH CHECK (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_media' AND policyname = 'post_media_update_org') THEN
    CREATE POLICY post_media_update_org ON post_media FOR UPDATE USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'post_media' AND policyname = 'post_media_delete_org') THEN
    CREATE POLICY post_media_delete_org ON post_media FOR DELETE USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;
