-- Create canva_connections table for Canva integration
-- Stores OAuth tokens (with PKCE) and connection info, one per org

CREATE TABLE IF NOT EXISTS canva_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  canva_user_id TEXT,
  scopes TEXT[],
  is_active BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index on organization_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_canva_connections_org_id
  ON canva_connections(organization_id);

-- Index on active connections
CREATE INDEX IF NOT EXISTS idx_canva_connections_active
  ON canva_connections(organization_id, is_active);

-- Enable RLS
ALTER TABLE canva_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Org members can view connections
CREATE POLICY canva_connections_select ON canva_connections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = canva_connections.organization_id
      AND user_id = auth.uid()
    )
  );

-- Policy: Org owners/admins can insert
CREATE POLICY canva_connections_insert ON canva_connections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = canva_connections.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Policy: Org owners/admins can update
CREATE POLICY canva_connections_update ON canva_connections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = canva_connections.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Policy: Org owners/admins can delete
CREATE POLICY canva_connections_delete ON canva_connections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = canva_connections.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
