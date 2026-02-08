-- Migration 026: Add playbook share token to organizations
-- Enables public shareable playbook URLs

ALTER TABLE organizations
ADD COLUMN playbook_share_token UUID UNIQUE DEFAULT gen_random_uuid();

CREATE INDEX idx_organizations_playbook_share_token
ON organizations(playbook_share_token);
