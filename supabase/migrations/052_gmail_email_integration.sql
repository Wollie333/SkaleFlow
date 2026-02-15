-- Per-user email connections (provider-agnostic for future Outlook)
CREATE TABLE authority_email_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'gmail',
  email_address TEXT NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  sync_enabled BOOLEAN DEFAULT true,
  last_history_id TEXT,
  last_sync_at TIMESTAMPTZ,
  connected_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Indexes
CREATE INDEX idx_email_connections_user ON authority_email_connections(user_id);
CREATE INDEX idx_email_connections_org ON authority_email_connections(organization_id);
CREATE INDEX idx_email_connections_sync ON authority_email_connections(sync_enabled, last_sync_at)
  WHERE sync_enabled = true AND is_active = true;

-- RLS
ALTER TABLE authority_email_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own email connections" ON authority_email_connections
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can update own email connections" ON authority_email_connections
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "Users can delete own email connections" ON authority_email_connections
  FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Org admins can view org connections" ON authority_email_connections
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner','admin')
  ));

-- Make card_id nullable on correspondence (emails may not be linked to a card)
ALTER TABLE authority_correspondence ALTER COLUMN card_id DROP NOT NULL;

-- Track which user's connection synced this email
ALTER TABLE authority_correspondence
  ADD COLUMN IF NOT EXISTS synced_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL;

-- Index for contact-based queries (contact detail page)
CREATE INDEX IF NOT EXISTS idx_authority_correspondence_contact
  ON authority_correspondence(contact_id) WHERE contact_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_authority_correspondence_message_id
  ON authority_correspondence(email_message_id) WHERE email_message_id IS NOT NULL;
