-- Migration 032: Multi-account social media connections
-- Allow multiple connections per platform per org (pages + profiles)

-- 1. Add account_type column
ALTER TABLE social_media_connections
ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'profile';

-- 2. Backfill existing rows
UPDATE social_media_connections
SET account_type = CASE
  WHEN platform_page_id IS NOT NULL THEN 'page'
  ELSE 'profile'
END;

-- 3. Drop old unique constraint (one connection per platform per org)
ALTER TABLE social_media_connections
DROP CONSTRAINT IF EXISTS social_media_connections_organization_id_platform_key;

-- Also drop if it was named differently
DROP INDEX IF EXISTS social_media_connections_organization_id_platform_key;

-- 4. Add new unique index: prevents duplicate page connections while allowing
--    one profile + N pages per platform per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_social_connections_org_platform_page
ON social_media_connections (organization_id, platform, COALESCE(platform_page_id, '__personal__'));
