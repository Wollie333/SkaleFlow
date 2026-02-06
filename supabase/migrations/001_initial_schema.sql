-- SkaleFlow Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('super_admin', 'client', 'team_member')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ,
  email_verified BOOLEAN DEFAULT FALSE,
  onboarding_completed BOOLEAN DEFAULT FALSE
);

-- Organizations table
CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
  settings JSONB DEFAULT '{}',
  brand_engine_status TEXT DEFAULT 'not_started'
    CHECK (brand_engine_status IN ('not_started', 'in_progress', 'completed')),
  content_engine_enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization members
CREATE TABLE org_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  invited_by UUID REFERENCES users(id),
  joined_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, user_id)
);

-- Subscription tiers
CREATE TABLE subscription_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price_monthly INTEGER NOT NULL,
  price_yearly INTEGER,
  features JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Invitations
CREATE TABLE invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  organization_name TEXT NOT NULL,
  invited_by UUID REFERENCES users(id),
  token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  tier_id UUID REFERENCES subscription_tiers(id),
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- Subscriptions
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  tier_id UUID REFERENCES subscription_tiers(id),
  status TEXT DEFAULT 'active'
    CHECK (status IN ('trial', 'active', 'paused', 'cancelled', 'expired')),
  paystack_customer_id TEXT,
  paystack_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- BRAND ENGINE TABLES
-- =====================================================

-- Brand phases
CREATE TABLE brand_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  phase_number TEXT NOT NULL,
  phase_name TEXT NOT NULL,
  status TEXT DEFAULT 'not_started'
    CHECK (status IN ('not_started', 'in_progress', 'completed', 'locked')),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES users(id),
  sort_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, phase_number)
);

-- Brand outputs
CREATE TABLE brand_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES brand_phases(id) ON DELETE CASCADE,
  output_key TEXT NOT NULL,
  output_value JSONB NOT NULL,
  version INTEGER DEFAULT 1,
  is_locked BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, output_key)
);

-- Brand conversations
CREATE TABLE brand_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES brand_phases(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  messages JSONB NOT NULL DEFAULT '[]',
  ai_model TEXT DEFAULT 'claude-sonnet-4-20250514',
  tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Brand playbooks
CREATE TABLE brand_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  version INTEGER DEFAULT 1,
  generated_by UUID REFERENCES users(id),
  file_url TEXT,
  file_size INTEGER,
  includes_phases TEXT[] NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- CONTENT ENGINE TABLES
-- =====================================================

-- Content calendars
CREATE TABLE content_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'completed', 'archived')),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content angles
CREATE TABLE content_angles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  emotional_target TEXT,
  week_number INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER,

  UNIQUE(organization_id, code)
);

-- Content items
CREATE TABLE content_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  calendar_id UUID REFERENCES content_calendars(id) ON DELETE CASCADE,

  scheduled_date DATE NOT NULL,
  time_slot TEXT NOT NULL CHECK (time_slot IN ('AM', 'PM', 'MID', 'EVE')),
  scheduled_time TIME,

  funnel_stage TEXT NOT NULL
    CHECK (funnel_stage IN ('awareness', 'consideration', 'conversion')),
  storybrand_stage TEXT NOT NULL
    CHECK (storybrand_stage IN (
      'character', 'external_problem', 'internal_problem', 'philosophical_problem',
      'guide', 'plan', 'call_to_action', 'failure', 'success'
    )),
  angle_id UUID REFERENCES content_angles(id),
  format TEXT NOT NULL,

  topic TEXT,
  hook TEXT,
  script_body TEXT,
  cta TEXT,
  caption TEXT,
  hashtags TEXT[],

  platforms TEXT[] NOT NULL DEFAULT '{}',
  platform_specs JSONB DEFAULT '{}',

  status TEXT DEFAULT 'idea'
    CHECK (status IN ('idea', 'scripted', 'approved', 'filming', 'filmed', 'designing', 'designed', 'editing', 'edited', 'scheduled', 'published', 'failed')),
  assigned_to UUID REFERENCES users(id),

  ai_generated BOOLEAN DEFAULT FALSE,
  ai_model TEXT,
  ai_prompt_used TEXT,

  media_urls TEXT[],
  thumbnail_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES users(id),
  published_at TIMESTAMPTZ
);

-- =====================================================
-- UTILITY TABLES
-- =====================================================

-- AI usage tracking
CREATE TABLE ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  feature TEXT NOT NULL,
  model TEXT NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_cents INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_org_members_user ON org_members(user_id);
CREATE INDEX idx_org_members_org ON org_members(organization_id);
CREATE INDEX idx_brand_phases_org ON brand_phases(organization_id);
CREATE INDEX idx_brand_outputs_org ON brand_outputs(organization_id);
CREATE INDEX idx_brand_outputs_phase ON brand_outputs(phase_id);
CREATE INDEX idx_brand_conversations_org ON brand_conversations(organization_id);
CREATE INDEX idx_brand_conversations_phase ON brand_conversations(phase_id);
CREATE INDEX idx_content_calendars_org ON content_calendars(organization_id);
CREATE INDEX idx_content_items_org ON content_items(organization_id);
CREATE INDEX idx_content_items_calendar ON content_items(calendar_id);
CREATE INDEX idx_content_items_date ON content_items(scheduled_date);
CREATE INDEX idx_content_items_status ON content_items(status);
CREATE INDEX idx_subscriptions_org ON subscriptions(organization_id);
CREATE INDEX idx_ai_usage_org_date ON ai_usage(organization_id, created_at);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to create default brand phases for new organization
CREATE OR REPLACE FUNCTION create_default_brand_phases()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO brand_phases (organization_id, phase_number, phase_name, sort_order)
  VALUES
    (NEW.id, '1', 'Brand Substance', 1),
    (NEW.id, '2', 'ICP Definition', 2),
    (NEW.id, '2A', 'Enemy Definition', 3),
    (NEW.id, '3', 'Offer Design', 4),
    (NEW.id, '4', 'Brandable Naming', 5),
    (NEW.id, '5', 'Positioning', 6),
    (NEW.id, '6A', 'Brand Vocabulary', 7),
    (NEW.id, '6B', 'Messaging Framework', 8),
    (NEW.id, '7', 'Brand Governance', 9),
    (NEW.id, '8', 'Website Architecture', 10),
    (NEW.id, '8A', 'Content Themes', 11),
    (NEW.id, '8B', 'Homepage Copy', 12),
    (NEW.id, '8C', 'Sales Page Copy', 13),
    (NEW.id, '8D', 'Supporting Pages', 14),
    (NEW.id, '8E', 'Conversion Pages', 15),
    (NEW.id, '8F', 'Visual Direction', 16),
    (NEW.id, '9', 'Conversion System', 17),
    (NEW.id, '10', 'Authority System', 18),
    (NEW.id, '11', 'Content Calendar', 19),
    (NEW.id, '12', 'Implementation', 20);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to create default content angles for new organization
CREATE OR REPLACE FUNCTION create_default_angles()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO content_angles (organization_id, name, code, description, emotional_target, week_number, sort_order)
  VALUES
    (NEW.id, 'THE GRIND', 'GRIND', 'Hard work isn''t working. Effort without clarity = burnout.', 'Exhaustion, frustration', 1, 1),
    (NEW.id, 'THE LIES', 'LIES', 'Bad advice. Broken tactics. The gurus who sold you broken systems.', 'Anger, betrayal', 2, 2),
    (NEW.id, 'THE BOTTLENECK', 'BOTTLENECK', 'You''re doing everything. Business can''t run without you.', 'Overwhelm, feeling trapped', 3, 3),
    (NEW.id, 'THE PROOF', 'PROOF', 'Real results. What happens when clarity meets a system.', 'Hope, aspiration', 4, 4);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to get brand context for AI
CREATE OR REPLACE FUNCTION get_brand_context(org_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_object_agg(output_key, output_value)
  INTO result
  FROM brand_outputs
  WHERE organization_id = org_id AND is_locked = TRUE;

  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

CREATE TRIGGER trigger_create_default_phases
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION create_default_brand_phases();

CREATE TRIGGER trigger_create_default_angles
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION create_default_angles();

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_outputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_calendars ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_angles ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_select_admin ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY users_insert ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Organizations policies
CREATE POLICY orgs_select_member ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY orgs_select_admin ON organizations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY orgs_update_owner ON organizations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = organizations.id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY orgs_insert_admin ON organizations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

-- Org members policies
CREATE POLICY org_members_select ON org_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.organization_id = org_members.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY org_members_insert ON org_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    ) OR
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = org_members.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- Invitations policies (super admin only)
CREATE POLICY invitations_admin ON invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY invitations_select_by_token ON invitations
  FOR SELECT USING (true);

-- Subscription tiers (public read)
CREATE POLICY tiers_select ON subscription_tiers
  FOR SELECT USING (is_active = true);

-- Subscriptions policies
CREATE POLICY subscriptions_select ON subscriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = subscriptions.organization_id
      AND user_id = auth.uid()
    )
  );

-- Brand phases policies
CREATE POLICY brand_phases_member ON brand_phases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = brand_phases.organization_id
      AND user_id = auth.uid()
    )
  );

-- Brand outputs policies
CREATE POLICY brand_outputs_member ON brand_outputs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = brand_outputs.organization_id
      AND user_id = auth.uid()
    )
  );

-- Brand conversations policies
CREATE POLICY brand_conversations_member ON brand_conversations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = brand_conversations.organization_id
      AND user_id = auth.uid()
    )
  );

-- Brand playbooks policies
CREATE POLICY brand_playbooks_member ON brand_playbooks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = brand_playbooks.organization_id
      AND user_id = auth.uid()
    )
  );

-- Content calendars policies
CREATE POLICY content_calendars_member ON content_calendars
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = content_calendars.organization_id
      AND user_id = auth.uid()
    )
  );

-- Content angles policies
CREATE POLICY content_angles_member ON content_angles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = content_angles.organization_id
      AND user_id = auth.uid()
    )
  );

-- Content items policies
CREATE POLICY content_items_member ON content_items
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = content_items.organization_id
      AND user_id = auth.uid()
    )
  );

-- AI usage policies
CREATE POLICY ai_usage_member ON ai_usage
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = ai_usage.organization_id
      AND user_id = auth.uid()
    )
  );

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert default subscription tiers
INSERT INTO subscription_tiers (name, slug, description, price_monthly, features, sort_order) VALUES
(
  'Starter',
  'starter',
  'Brand Engine only — Build your complete brand strategy',
  299900,
  '{
    "brand_engine": true,
    "content_engine": false,
    "ai_content_generation": false,
    "bulk_publishing": false,
    "team_seats": 1,
    "social_accounts": 0,
    "content_items_per_month": 0
  }',
  1
),
(
  'Growth',
  'growth',
  'Brand Engine + Content Engine — Plan and create content',
  499900,
  '{
    "brand_engine": true,
    "content_engine": true,
    "ai_content_generation": true,
    "bulk_publishing": false,
    "team_seats": 2,
    "social_accounts": 3,
    "content_items_per_month": 100
  }',
  2
),
(
  'Scale',
  'scale',
  'Full platform — Plan, create, and publish at scale',
  799900,
  '{
    "brand_engine": true,
    "content_engine": true,
    "ai_content_generation": true,
    "bulk_publishing": true,
    "team_seats": 5,
    "social_accounts": 10,
    "content_items_per_month": 500
  }',
  3
);
