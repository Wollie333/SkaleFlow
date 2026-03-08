-- =====================================================
-- PRESENCE ENGINE — Core Tables
-- =====================================================

-- Platform activation & goals per org
CREATE TABLE presence_platforms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  platform_key TEXT NOT NULL
    CHECK (platform_key IN ('linkedin', 'facebook', 'instagram', 'google_my_business', 'tiktok', 'youtube', 'twitter_x', 'pinterest')),
  is_active BOOLEAN DEFAULT FALSE,
  primary_goal TEXT
    CHECK (primary_goal IN ('lead_generation', 'brand_awareness', 'community', 'sales', 'seo', 'thought_leadership')),
  priority_order INTEGER DEFAULT 0,
  existing_profile_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, platform_key)
);

-- 7 phases per org (mirrors brand_phases)
CREATE TABLE presence_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  phase_number TEXT NOT NULL,
  phase_name TEXT NOT NULL,
  platform_key TEXT,
  is_conditional BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed', 'locked', 'skipped')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES users(id),
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, phase_number)
);

-- JSONB variable storage (mirrors brand_outputs)
CREATE TABLE presence_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES presence_phases(id) ON DELETE CASCADE,
  output_key TEXT NOT NULL,
  output_value JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  is_locked BOOLEAN DEFAULT FALSE,
  generated_from_brand BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, output_key)
);

-- RLS policies
ALTER TABLE presence_platforms ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE presence_outputs ENABLE ROW LEVEL SECURITY;

-- presence_platforms RLS
CREATE POLICY "Users can view own org presence platforms"
  ON presence_platforms FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org presence platforms"
  ON presence_platforms FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid()
  ));

-- presence_phases RLS
CREATE POLICY "Users can view own org presence phases"
  ON presence_phases FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org presence phases"
  ON presence_phases FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid()
  ));

-- presence_outputs RLS
CREATE POLICY "Users can view own org presence outputs"
  ON presence_outputs FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid()
  ));

CREATE POLICY "Users can manage own org presence outputs"
  ON presence_outputs FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid()
  ));

-- Indexes
CREATE INDEX idx_presence_platforms_org ON presence_platforms(organization_id);
CREATE INDEX idx_presence_phases_org ON presence_phases(organization_id);
CREATE INDEX idx_presence_outputs_org ON presence_outputs(organization_id);
CREATE INDEX idx_presence_outputs_phase ON presence_outputs(phase_id);
CREATE INDEX idx_presence_outputs_key ON presence_outputs(output_key);
