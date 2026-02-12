-- Create google_drive_connections table for Google Drive integration
-- This table stores OAuth tokens and connection info for Google Drive

CREATE TABLE IF NOT EXISTS google_drive_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  drive_email TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on organization_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_google_drive_connections_org_id
  ON google_drive_connections(organization_id);

-- Create index on is_active for faster active connection queries
CREATE INDEX IF NOT EXISTS idx_google_drive_connections_active
  ON google_drive_connections(organization_id, is_active);

-- Enable RLS
ALTER TABLE google_drive_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view connections for their organization
CREATE POLICY google_drive_connections_select ON google_drive_connections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = google_drive_connections.organization_id
      AND user_id = auth.uid()
    )
  );

-- Policy: Org owners/admins can insert connections
CREATE POLICY google_drive_connections_insert ON google_drive_connections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = google_drive_connections.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Policy: Org owners/admins can update connections
CREATE POLICY google_drive_connections_update ON google_drive_connections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = google_drive_connections.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Policy: Org owners/admins can delete connections
CREATE POLICY google_drive_connections_delete ON google_drive_connections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = google_drive_connections.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );
