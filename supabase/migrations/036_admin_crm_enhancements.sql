-- Migration 036: Admin CRM Enhancements
-- Adds team_role to org_members, email tracking to invitations

-- 1. Custom team role label on org_members
ALTER TABLE org_members ADD COLUMN IF NOT EXISTS team_role TEXT DEFAULT NULL;

-- 2. Email tracking on invitations
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS email_status TEXT DEFAULT 'pending';
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS email_sent_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS email_error TEXT DEFAULT NULL;
ALTER TABLE invitations ADD COLUMN IF NOT EXISTS resend_email_id TEXT DEFAULT NULL;

-- 3. Indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_invitations_email_status ON invitations(email_status);
CREATE INDEX IF NOT EXISTS idx_invitations_org_name_status ON invitations(organization_name, status);
