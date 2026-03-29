-- =====================================================
-- Fix Post Media RLS Policies
-- Ensures post_media table can be read by organization members
-- =====================================================

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS post_media_select_org ON post_media;
DROP POLICY IF EXISTS post_media_insert_org ON post_media;
DROP POLICY IF EXISTS post_media_update_org ON post_media;
DROP POLICY IF EXISTS post_media_delete_org ON post_media;

-- Recreate policies
CREATE POLICY post_media_select_org ON post_media FOR SELECT USING (
  organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
);

CREATE POLICY post_media_insert_org ON post_media FOR INSERT WITH CHECK (
  organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
);

CREATE POLICY post_media_update_org ON post_media FOR UPDATE USING (
  organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
);

CREATE POLICY post_media_delete_org ON post_media FOR DELETE USING (
  organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
);

-- Verify RLS is enabled
ALTER TABLE post_media ENABLE ROW LEVEL SECURITY;
