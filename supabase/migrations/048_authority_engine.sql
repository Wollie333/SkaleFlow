-- Migration: 048_authority_engine.sql
-- Authority Engine — PR command centre for founder-led businesses
-- Tables: authority_pipeline_stages, authority_contacts, authority_story_angles,
--         authority_press_kit, authority_pipeline_cards, authority_commercial,
--         authority_correspondence, authority_press_releases, authority_assets,
--         authority_quests, authority_scores, authority_calendar_events,
--         authority_notifications, authority_card_checklist, authority_email_config,
--         authority_rounds, authority_press_page_inquiries
-- Views:  authority_pipeline_summary, authority_score_summary, authority_contact_with_stats

-- ============================================================================
-- 1. authority_pipeline_stages (no FK deps)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  stage_order INTEGER NOT NULL,
  stage_type TEXT NOT NULL DEFAULT 'active',
  color TEXT,
  is_default BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_authority_stages_org ON authority_pipeline_stages(organization_id);

-- ============================================================================
-- 2. authority_contacts (no FK deps)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  outlet TEXT,
  role TEXT,
  beat TEXT,
  location TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  warmth TEXT DEFAULT 'cold',
  source TEXT DEFAULT 'manual',
  email_normalised TEXT,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authority_contacts_org ON authority_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_authority_contacts_email ON authority_contacts(email_normalised);
CREATE INDEX IF NOT EXISTS idx_authority_contacts_outlet ON authority_contacts(outlet);
CREATE INDEX IF NOT EXISTS idx_authority_contacts_warmth ON authority_contacts(warmth);

-- Email normalisation trigger
CREATE OR REPLACE FUNCTION normalise_authority_contact_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_normalised = LOWER(TRIM(NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_normalise_authority_contact_email
  BEFORE INSERT OR UPDATE ON authority_contacts
  FOR EACH ROW EXECUTE FUNCTION normalise_authority_contact_email();

-- ============================================================================
-- 3. authority_story_angles (no FK deps)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_story_angles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT,
  target_audience TEXT,
  suggested_outlets TEXT,
  is_active BOOLEAN DEFAULT true,
  is_ai_generated BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  times_used INTEGER DEFAULT 0,
  times_successful INTEGER DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authority_story_angles_org ON authority_story_angles(organization_id);
CREATE INDEX IF NOT EXISTS idx_authority_story_angles_active ON authority_story_angles(is_active) WHERE is_active = true;

-- ============================================================================
-- 4. authority_press_kit (no FK deps — one per org)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_press_kit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  brand_overview TEXT,
  boilerplate TEXT,
  founder_bio_short TEXT,
  founder_bio_long TEXT,
  fact_sheet JSONB,
  speaking_topics JSONB,
  social_stats JSONB,
  brand_colors JSONB,
  brand_fonts JSONB,
  logo_usage_notes TEXT,
  public_page_enabled BOOLEAN DEFAULT false,
  public_page_slug TEXT,
  hero_tagline TEXT,
  setup_completed BOOLEAN DEFAULT false,
  setup_completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id),
  UNIQUE(public_page_slug)
);

-- ============================================================================
-- 5. authority_pipeline_cards (depends on stages, contacts, story_angles)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_pipeline_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Core fields
  opportunity_name TEXT NOT NULL,
  stage_id UUID NOT NULL REFERENCES authority_pipeline_stages(id),
  category TEXT NOT NULL,
  priority TEXT DEFAULT 'medium',

  -- Target info
  target_outlet TEXT,
  contact_id UUID REFERENCES authority_contacts(id) ON DELETE SET NULL,
  story_angle_id UUID REFERENCES authority_story_angles(id) ON DELETE SET NULL,
  custom_story_angle TEXT,

  -- Dates
  target_date DATE,
  pitched_at TIMESTAMPTZ,
  agreed_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  amplified_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,

  -- Publication details
  confirmed_format TEXT,
  confirmed_angle TEXT,
  submission_deadline DATE,
  expected_publication_date DATE,
  embargo_date DATE,
  embargo_active BOOLEAN DEFAULT false,

  -- Published details
  live_url TEXT,

  -- Reach tier for scoring
  reach_tier TEXT DEFAULT 'local',

  -- Decline/No Response metadata
  decline_reason TEXT,
  decline_reason_other TEXT,
  decline_try_again_date DATE,
  decline_referred_to TEXT,
  no_response_follow_up_count INTEGER DEFAULT 0,

  -- On Hold metadata
  on_hold_reason TEXT,
  on_hold_resume_date DATE,

  -- Content Engine link
  content_campaign_id UUID,
  pre_launch_campaign_id UUID,

  -- Notes
  notes TEXT,

  -- Scoring
  authority_points_earned NUMERIC(10,2) DEFAULT 0,
  points_calculated BOOLEAN DEFAULT false,

  -- Standard fields
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authority_cards_org ON authority_pipeline_cards(organization_id);
CREATE INDEX IF NOT EXISTS idx_authority_cards_stage ON authority_pipeline_cards(stage_id);
CREATE INDEX IF NOT EXISTS idx_authority_cards_contact ON authority_pipeline_cards(contact_id);
CREATE INDEX IF NOT EXISTS idx_authority_cards_category ON authority_pipeline_cards(category);
CREATE INDEX IF NOT EXISTS idx_authority_cards_published_at ON authority_pipeline_cards(published_at);

-- ============================================================================
-- 6. authority_commercial (depends on pipeline_cards)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_commercial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES authority_pipeline_cards(id) ON DELETE CASCADE,
  engagement_type TEXT NOT NULL,
  deal_value NUMERIC(12,2) DEFAULT 0,
  currency TEXT DEFAULT 'ZAR',
  payment_status TEXT DEFAULT 'not_invoiced',
  payment_terms TEXT,
  payment_terms_custom TEXT,
  invoice_reference TEXT,
  invoice_date DATE,
  payment_due_date DATE,
  payment_received_date DATE,
  budget_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(card_id)
);

CREATE INDEX IF NOT EXISTS idx_authority_commercial_org ON authority_commercial(organization_id);
CREATE INDEX IF NOT EXISTS idx_authority_commercial_card ON authority_commercial(card_id);
CREATE INDEX IF NOT EXISTS idx_authority_commercial_status ON authority_commercial(payment_status);

-- ============================================================================
-- 7. authority_correspondence (depends on pipeline_cards, contacts)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_correspondence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES authority_pipeline_cards(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES authority_contacts(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  direction TEXT,

  -- Email specific
  email_subject TEXT,
  email_from TEXT,
  email_to TEXT,
  email_cc TEXT,
  email_bcc TEXT,
  email_body_text TEXT,
  email_body_html TEXT,
  email_message_id TEXT,
  email_in_reply_to TEXT,
  email_thread_id TEXT,

  -- General
  summary TEXT,
  content TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authority_correspondence_card ON authority_correspondence(card_id);
CREATE INDEX IF NOT EXISTS idx_authority_correspondence_org ON authority_correspondence(organization_id);
CREATE INDEX IF NOT EXISTS idx_authority_correspondence_thread ON authority_correspondence(email_thread_id);
CREATE INDEX IF NOT EXISTS idx_authority_correspondence_occurred ON authority_correspondence(occurred_at);

-- ============================================================================
-- 8. authority_press_releases (depends on pipeline_cards)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_press_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  template_type TEXT,
  headline TEXT NOT NULL,
  subheadline TEXT,
  dateline TEXT,
  body_content TEXT NOT NULL,
  quotes JSONB,
  boilerplate TEXT,
  contact_info TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  is_public BOOLEAN DEFAULT false,
  public_excerpt TEXT,
  slug TEXT,
  card_id UUID REFERENCES authority_pipeline_cards(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_authority_press_releases_org ON authority_press_releases(organization_id);
CREATE INDEX IF NOT EXISTS idx_authority_press_releases_status ON authority_press_releases(status);
CREATE INDEX IF NOT EXISTS idx_authority_press_releases_public ON authority_press_releases(is_public) WHERE is_public = true;

-- ============================================================================
-- 9. authority_assets (depends on pipeline_cards, correspondence, press_releases, press_kit)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  card_id UUID REFERENCES authority_pipeline_cards(id) ON DELETE CASCADE,
  correspondence_id UUID REFERENCES authority_correspondence(id) ON DELETE CASCADE,
  press_release_id UUID REFERENCES authority_press_releases(id) ON DELETE CASCADE,
  press_kit_id UUID REFERENCES authority_press_kit(id) ON DELETE CASCADE,
  asset_type TEXT NOT NULL,
  file_name TEXT,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  title TEXT,
  description TEXT,
  alt_text TEXT,
  outlet_name TEXT,
  is_public BOOLEAN DEFAULT false,
  public_display_order INTEGER,
  key_quotes JSONB,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authority_assets_org ON authority_assets(organization_id);
CREATE INDEX IF NOT EXISTS idx_authority_assets_card ON authority_assets(card_id);
CREATE INDEX IF NOT EXISTS idx_authority_assets_type ON authority_assets(asset_type);
CREATE INDEX IF NOT EXISTS idx_authority_assets_public ON authority_assets(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_authority_assets_outlet ON authority_assets(outlet_name) WHERE asset_type = 'publication_logo';

-- ============================================================================
-- 10. authority_quests (org-scoped only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  quest_name TEXT NOT NULL,
  quest_slug TEXT NOT NULL,
  tier INTEGER NOT NULL,
  description TEXT,
  requirements JSONB NOT NULL,
  status TEXT DEFAULT 'active',
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  target_completion_date DATE,
  points_threshold_min INTEGER NOT NULL,
  points_threshold_max INTEGER,
  is_system BOOLEAN DEFAULT true,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authority_quests_org ON authority_quests(organization_id);
CREATE INDEX IF NOT EXISTS idx_authority_quests_status ON authority_quests(status);
CREATE INDEX IF NOT EXISTS idx_authority_quests_current ON authority_quests(is_current) WHERE is_current = true;

-- ============================================================================
-- 11. authority_scores (depends on pipeline_cards)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES authority_pipeline_cards(id) ON DELETE CASCADE,
  base_points NUMERIC(10,2) NOT NULL,
  reach_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  engagement_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  amplification_bonus NUMERIC(10,2) DEFAULT 0,
  round_bonus NUMERIC(10,2) DEFAULT 0,
  consistency_bonus NUMERIC(10,2) DEFAULT 0,
  total_points NUMERIC(10,2) NOT NULL,
  activity_category TEXT NOT NULL,
  reach_tier TEXT NOT NULL,
  engagement_type TEXT NOT NULL,
  description TEXT,
  scored_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authority_scores_org ON authority_scores(organization_id);
CREATE INDEX IF NOT EXISTS idx_authority_scores_card ON authority_scores(card_id);
CREATE INDEX IF NOT EXISTS idx_authority_scores_scored ON authority_scores(scored_at);

-- ============================================================================
-- 12. authority_calendar_events (depends on pipeline_cards)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  card_id UUID REFERENCES authority_pipeline_cards(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  reminder_sent BOOLEAN DEFAULT false,
  reminder_days_before INTEGER DEFAULT 1,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  color TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authority_calendar_org ON authority_calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_authority_calendar_date ON authority_calendar_events(event_date);
CREATE INDEX IF NOT EXISTS idx_authority_calendar_card ON authority_calendar_events(card_id);
CREATE INDEX IF NOT EXISTS idx_authority_calendar_type ON authority_calendar_events(event_type);

-- ============================================================================
-- 13. authority_notifications (depends on pipeline_cards, contacts, quests)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  card_id UUID REFERENCES authority_pipeline_cards(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES authority_contacts(id) ON DELETE SET NULL,
  quest_id UUID REFERENCES authority_quests(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'in_app',
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authority_notifications_user ON authority_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_authority_notifications_org ON authority_notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_authority_notifications_read ON authority_notifications(is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_authority_notifications_scheduled ON authority_notifications(scheduled_for);

-- ============================================================================
-- 14. authority_card_checklist (depends on pipeline_cards)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_card_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES authority_pipeline_cards(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  item_text TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  is_system BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authority_checklist_card ON authority_card_checklist(card_id);

-- ============================================================================
-- 15. authority_email_config (org-scoped only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_email_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  bcc_address TEXT NOT NULL,
  bcc_enabled BOOLEAN DEFAULT true,
  gmail_connected BOOLEAN DEFAULT false,
  gmail_access_token TEXT,
  gmail_refresh_token TEXT,
  gmail_token_expiry TIMESTAMPTZ,
  gmail_email TEXT,
  gmail_sync_enabled BOOLEAN DEFAULT false,
  gmail_last_sync TIMESTAMPTZ,
  outlook_connected BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id),
  UNIQUE(bcc_address)
);

-- ============================================================================
-- 16. authority_rounds (org-scoped only)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  round_name TEXT NOT NULL,
  round_number INTEGER NOT NULL,
  requirements JSONB NOT NULL,
  linked_card_ids JSONB DEFAULT '[]',
  status TEXT DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT now(),
  target_completion_date DATE,
  completed_at TIMESTAMPTZ,
  bonus_percentage NUMERIC(5,2) DEFAULT 15.0,
  bonus_applied BOOLEAN DEFAULT false,
  is_system BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authority_rounds_org ON authority_rounds(organization_id);
CREATE INDEX IF NOT EXISTS idx_authority_rounds_status ON authority_rounds(status);

-- ============================================================================
-- 17. authority_press_page_inquiries (depends on story_angles, contacts, pipeline_cards)
-- ============================================================================
CREATE TABLE IF NOT EXISTS authority_press_page_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  journalist_name TEXT NOT NULL,
  journalist_outlet TEXT NOT NULL,
  journalist_email TEXT NOT NULL,
  journalist_phone TEXT,
  topic_of_interest TEXT NOT NULL,
  preferred_format TEXT,
  deadline DATE,
  additional_notes TEXT,
  story_angle_id UUID REFERENCES authority_story_angles(id) ON DELETE SET NULL,
  is_processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  contact_id UUID REFERENCES authority_contacts(id),
  card_id UUID REFERENCES authority_pipeline_cards(id),
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_authority_inquiries_org ON authority_press_page_inquiries(organization_id);
CREATE INDEX IF NOT EXISTS idx_authority_inquiries_processed ON authority_press_page_inquiries(is_processed) WHERE is_processed = false;


-- ============================================================================
-- VIEWS
-- ============================================================================

-- Pipeline summary (aggregated metrics per stage)
CREATE OR REPLACE VIEW authority_pipeline_summary AS
SELECT
  c.organization_id,
  s.slug AS stage,
  COUNT(c.id) AS card_count,
  COALESCE(SUM(com.deal_value) FILTER (WHERE com.engagement_type IN ('paid', 'sponsored')), 0) AS total_value,
  COALESCE(SUM(com.deal_value) FILTER (WHERE com.payment_status = 'paid'), 0) AS total_paid,
  COALESCE(SUM(com.deal_value) FILTER (WHERE com.payment_status IN ('not_invoiced', 'invoiced')), 0) AS total_pending,
  COALESCE(SUM(com.deal_value) FILTER (WHERE com.payment_status = 'overdue'), 0) AS total_overdue
FROM authority_pipeline_cards c
JOIN authority_pipeline_stages s ON c.stage_id = s.id
LEFT JOIN authority_commercial com ON c.id = com.card_id
GROUP BY c.organization_id, s.slug;

-- Score summary (current authority score + tier per org)
CREATE OR REPLACE VIEW authority_score_summary AS
SELECT
  organization_id,
  COALESCE(SUM(total_points), 0) AS total_score,
  COUNT(*) AS total_scored_activities,
  CASE
    WHEN COALESCE(SUM(total_points), 0) >= 800 THEN 5
    WHEN COALESCE(SUM(total_points), 0) >= 400 THEN 4
    WHEN COALESCE(SUM(total_points), 0) >= 150 THEN 3
    WHEN COALESCE(SUM(total_points), 0) >= 50 THEN 2
    ELSE 1
  END AS current_tier,
  CASE
    WHEN COALESCE(SUM(total_points), 0) >= 800 THEN 'Authority'
    WHEN COALESCE(SUM(total_points), 0) >= 400 THEN 'Established'
    WHEN COALESCE(SUM(total_points), 0) >= 150 THEN 'Rising'
    WHEN COALESCE(SUM(total_points), 0) >= 50 THEN 'Emerging'
    ELSE 'Foundation'
  END AS tier_name
FROM authority_scores
GROUP BY organization_id;

-- Contact with stats (enriched contact records)
CREATE OR REPLACE VIEW authority_contact_with_stats AS
SELECT
  c.*,
  COUNT(DISTINCT pc.id) AS total_opportunities,
  COUNT(DISTINCT pc.id) FILTER (WHERE ps.slug IN ('published', 'amplified', 'archived')) AS published_count,
  COUNT(DISTINCT cor.id) AS total_interactions,
  MAX(cor.occurred_at) AS last_interaction_at
FROM authority_contacts c
LEFT JOIN authority_pipeline_cards pc ON c.id = pc.contact_id
LEFT JOIN authority_pipeline_stages ps ON pc.stage_id = ps.id
LEFT JOIN authority_correspondence cor ON c.id = cor.contact_id
GROUP BY c.id;


-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- authority_pipeline_stages
ALTER TABLE authority_pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority stages in their org"
  ON authority_pipeline_stages FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert authority stages in their org"
  ON authority_pipeline_stages FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update authority stages in their org"
  ON authority_pipeline_stages FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete authority stages"
  ON authority_pipeline_stages FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- authority_contacts
ALTER TABLE authority_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority contacts in their org"
  ON authority_contacts FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert authority contacts in their org"
  ON authority_contacts FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update authority contacts in their org"
  ON authority_contacts FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete authority contacts"
  ON authority_contacts FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- authority_story_angles
ALTER TABLE authority_story_angles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority story angles in their org"
  ON authority_story_angles FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Public can view active story angles"
  ON authority_story_angles FOR SELECT
  USING (is_active = true);

CREATE POLICY "Users can insert authority story angles in their org"
  ON authority_story_angles FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update authority story angles in their org"
  ON authority_story_angles FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete authority story angles"
  ON authority_story_angles FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- authority_press_kit
ALTER TABLE authority_press_kit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority press kit in their org"
  ON authority_press_kit FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Public can view enabled press kits"
  ON authority_press_kit FOR SELECT
  USING (public_page_enabled = true);

CREATE POLICY "Users can insert authority press kit in their org"
  ON authority_press_kit FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update authority press kit in their org"
  ON authority_press_kit FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete authority press kit"
  ON authority_press_kit FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- authority_pipeline_cards
ALTER TABLE authority_pipeline_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority cards in their org"
  ON authority_pipeline_cards FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert authority cards in their org"
  ON authority_pipeline_cards FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update authority cards in their org"
  ON authority_pipeline_cards FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete authority cards"
  ON authority_pipeline_cards FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- authority_commercial
ALTER TABLE authority_commercial ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority commercial in their org"
  ON authority_commercial FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert authority commercial in their org"
  ON authority_commercial FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update authority commercial in their org"
  ON authority_commercial FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete authority commercial"
  ON authority_commercial FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- authority_correspondence
ALTER TABLE authority_correspondence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority correspondence in their org"
  ON authority_correspondence FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert authority correspondence in their org"
  ON authority_correspondence FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update authority correspondence in their org"
  ON authority_correspondence FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete authority correspondence"
  ON authority_correspondence FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- authority_press_releases
ALTER TABLE authority_press_releases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority press releases in their org"
  ON authority_press_releases FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Public can view published press releases"
  ON authority_press_releases FOR SELECT
  USING (is_public = true AND status = 'published');

CREATE POLICY "Users can insert authority press releases in their org"
  ON authority_press_releases FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update authority press releases in their org"
  ON authority_press_releases FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete authority press releases"
  ON authority_press_releases FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- authority_assets
ALTER TABLE authority_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority assets in their org"
  ON authority_assets FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Public can view public assets"
  ON authority_assets FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can insert authority assets in their org"
  ON authority_assets FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update authority assets in their org"
  ON authority_assets FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete authority assets"
  ON authority_assets FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- authority_quests
ALTER TABLE authority_quests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority quests in their org"
  ON authority_quests FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert authority quests in their org"
  ON authority_quests FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update authority quests in their org"
  ON authority_quests FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete authority quests"
  ON authority_quests FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- authority_scores
ALTER TABLE authority_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority scores in their org"
  ON authority_scores FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert authority scores in their org"
  ON authority_scores FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

-- authority_calendar_events
ALTER TABLE authority_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority calendar events in their org"
  ON authority_calendar_events FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert authority calendar events in their org"
  ON authority_calendar_events FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update authority calendar events in their org"
  ON authority_calendar_events FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete authority calendar events"
  ON authority_calendar_events FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- authority_notifications
ALTER TABLE authority_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own authority notifications"
  ON authority_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own authority notifications"
  ON authority_notifications FOR UPDATE
  USING (user_id = auth.uid());

-- authority_card_checklist
ALTER TABLE authority_card_checklist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority checklists in their org"
  ON authority_card_checklist FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert authority checklists in their org"
  ON authority_card_checklist FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update authority checklists in their org"
  ON authority_card_checklist FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete authority checklists"
  ON authority_card_checklist FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- authority_email_config
ALTER TABLE authority_email_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority email config in their org"
  ON authority_email_config FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can manage authority email config"
  ON authority_email_config FOR ALL
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- authority_rounds
ALTER TABLE authority_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority rounds in their org"
  ON authority_rounds FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert authority rounds in their org"
  ON authority_rounds FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update authority rounds in their org"
  ON authority_rounds FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete authority rounds"
  ON authority_rounds FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- authority_press_page_inquiries
ALTER TABLE authority_press_page_inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view authority inquiries in their org"
  ON authority_press_page_inquiries FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Public can submit press inquiries"
  ON authority_press_page_inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update authority inquiries in their org"
  ON authority_press_page_inquiries FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));


-- ============================================================================
-- SEED FUNCTIONS (lazy initialization per org)
-- ============================================================================

-- Seed default pipeline stages for an organization
CREATE OR REPLACE FUNCTION seed_authority_stages(p_org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Only seed if no stages exist for this org
  IF EXISTS (SELECT 1 FROM authority_pipeline_stages WHERE organization_id = p_org_id) THEN
    RETURN;
  END IF;

  INSERT INTO authority_pipeline_stages (organization_id, name, slug, stage_order, stage_type, color, is_default, is_system)
  VALUES
    (p_org_id, 'Inbound',       'inbound',        1,  'active',      '#6366f1', false, true),
    (p_org_id, 'Prospect',      'prospect',       2,  'active',      '#8b5cf6', true,  true),
    (p_org_id, 'Pitched',       'pitched',        3,  'active',      '#3b82f6', false, true),
    (p_org_id, 'In Discussion', 'in_discussion',  4,  'active',      '#0ea5e9', false, true),
    (p_org_id, 'Agreed',        'agreed',         5,  'active',      '#14b8a6', false, true),
    (p_org_id, 'Content Prep',  'content_prep',   6,  'active',      '#10b981', false, true),
    (p_org_id, 'Submitted',     'submitted',      7,  'active',      '#22c55e', false, true),
    (p_org_id, 'Published',     'published',      8,  'active',      '#84cc16', false, true),
    (p_org_id, 'Amplified',     'amplified',      9,  'closed_won',  '#eab308', false, true),
    (p_org_id, 'Archived',      'archived',       10, 'closed_won',  '#6b7280', false, true),
    (p_org_id, 'Declined',      'declined',       11, 'closed_lost', '#ef4444', false, true),
    (p_org_id, 'No Response',   'no_response',    12, 'closed_lost', '#f97316', false, true),
    (p_org_id, 'On Hold',       'on_hold',        13, 'active',      '#a855f7', false, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Seed default quests for an organization
CREATE OR REPLACE FUNCTION seed_authority_quests(p_org_id UUID)
RETURNS VOID AS $$
BEGIN
  -- Only seed if no quests exist for this org
  IF EXISTS (SELECT 1 FROM authority_quests WHERE organization_id = p_org_id) THEN
    RETURN;
  END IF;

  INSERT INTO authority_quests (organization_id, quest_name, quest_slug, tier, description, requirements, status, points_threshold_min, points_threshold_max, is_system, is_current)
  VALUES
    (p_org_id, 'Foundation', 'foundation', 1,
     'Build the foundation of your brand authority',
     '[{"type":"press_kit_complete","target":1,"current":0,"completed":false,"label":"Complete your press kit"},{"type":"press_release_published","target":1,"current":0,"completed":false,"label":"Write your first press release"},{"type":"contacts_added","target":3,"current":0,"completed":false,"label":"Add 3 media contacts"},{"type":"pitch_sent","target":1,"current":0,"completed":false,"label":"Send your first pitch"}]'::jsonb,
     'active', 0, 50, true, true),

    (p_org_id, 'Media Debut', 'media_debut', 2,
     'Get your first media placements and start building visibility',
     '[{"type":"article_published","target":1,"current":0,"completed":false,"label":"Get 1 article published"},{"type":"podcast_appearance","target":1,"current":0,"completed":false,"label":"Complete 1 podcast appearance"},{"type":"amplification_campaign","target":1,"current":0,"completed":false,"label":"Run 1 amplification campaign"},{"type":"contacts_added","target":5,"current":0,"completed":false,"label":"Reach 5 media contacts"},{"type":"points_earned","target":50,"current":0,"completed":false,"label":"Earn 50+ authority points"}]'::jsonb,
     'locked', 50, 150, true, false),

    (p_org_id, 'Growing Voice', 'growing_voice', 3,
     'Establish a consistent PR presence and grow your media relationships',
     '[{"type":"article_published","target":5,"current":0,"completed":false,"label":"Get 5+ articles published"},{"type":"podcast_appearance","target":2,"current":0,"completed":false,"label":"Complete 2+ podcast appearances"},{"type":"speaking_engagement","target":1,"current":0,"completed":false,"label":"Secure 1 speaking engagement"},{"type":"points_earned","target":150,"current":0,"completed":false,"label":"Earn 150+ authority points"}]'::jsonb,
     'locked', 150, 400, true, false),

    (p_org_id, 'Industry Presence', 'industry_presence', 4,
     'Become a recognised name in your industry with major media placements',
     '[{"type":"magazine_feature","target":1,"current":0,"completed":false,"label":"Land a magazine feature"},{"type":"article_published","target":10,"current":0,"completed":false,"label":"Reach 10+ total placements"},{"type":"published_warmth_contacts","target":3,"current":0,"completed":false,"label":"Build 3+ Published relationships"},{"type":"points_earned","target":400,"current":0,"completed":false,"label":"Earn 400+ authority points"}]'::jsonb,
     'locked', 400, 800, true, false),

    (p_org_id, 'Category Authority', 'category_authority', 5,
     'You are THE authority in your space — media comes to you',
     '[{"type":"article_published","target":20,"current":0,"completed":false,"label":"Reach 20+ total placements"},{"type":"speaking_engagement","target":3,"current":0,"completed":false,"label":"Complete 3+ speaking engagements"},{"type":"points_earned","target":800,"current":0,"completed":false,"label":"Earn 800+ authority points"}]'::jsonb,
     'locked', 800, NULL, true, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- STORAGE BUCKET for authority assets
-- ============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'authority-assets',
  'authority-assets',
  true,
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for authority-assets bucket
CREATE POLICY "Authenticated users can upload authority assets"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'authority-assets');

CREATE POLICY "Anyone can view authority assets"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'authority-assets');

CREATE POLICY "Authenticated users can update authority assets"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'authority-assets');

CREATE POLICY "Authenticated users can delete authority assets"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'authority-assets');
