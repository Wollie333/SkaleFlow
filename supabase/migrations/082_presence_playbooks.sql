-- =====================================================
-- PRESENCE ENGINE — Playbooks & Org Fields
-- =====================================================

-- Export tracking
CREATE TABLE presence_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  generated_by UUID REFERENCES users(id),
  file_url TEXT,
  file_size INTEGER,
  includes_platforms TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add presence engine fields to organizations
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS presence_engine_status TEXT DEFAULT 'not_started'
    CHECK (presence_engine_status IN ('not_started', 'in_progress', 'completed')),
  ADD COLUMN IF NOT EXISTS presence_consistency_score INTEGER,
  ADD COLUMN IF NOT EXISTS presence_playbook_token TEXT;

-- RLS policies
ALTER TABLE presence_playbooks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org presence playbooks"
  ON presence_playbooks FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org presence playbooks"
  ON presence_playbooks FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid()
  ));

-- Index
CREATE INDEX idx_presence_playbooks_org ON presence_playbooks(organization_id);
