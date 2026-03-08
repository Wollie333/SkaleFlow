-- =====================================================
-- PRESENCE ENGINE — Conversations & Screenshots
-- =====================================================

-- Chat history per phase (mirrors brand_conversations)
CREATE TABLE presence_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES presence_phases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  messages JSONB NOT NULL DEFAULT '[]',
  ai_model TEXT DEFAULT 'claude-sonnet-4-20250514',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Uploaded profile screenshots for gap audit
CREATE TABLE presence_profile_screenshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  platform_key TEXT NOT NULL
    CHECK (platform_key IN ('linkedin', 'facebook', 'instagram', 'google_my_business', 'tiktok', 'youtube', 'twitter_x', 'pinterest')),
  screenshot_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  audit_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies
ALTER TABLE presence_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence_profile_screenshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own org presence conversations"
  ON presence_conversations FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org presence conversations"
  ON presence_conversations FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can view own org presence screenshots"
  ON presence_profile_screenshots FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org presence screenshots"
  ON presence_profile_screenshots FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_presence_conversations_org ON presence_conversations(organization_id);
CREATE INDEX idx_presence_conversations_phase ON presence_conversations(phase_id);
CREATE INDEX idx_presence_screenshots_org ON presence_profile_screenshots(organization_id);
CREATE INDEX idx_presence_screenshots_platform ON presence_profile_screenshots(platform_key);
