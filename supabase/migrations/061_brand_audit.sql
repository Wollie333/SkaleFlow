-- ============================================================
-- Migration 061: Brand Audit System
-- Tables: brand_audits, brand_audit_sections, brand_audit_scores,
--         brand_audit_reports, brand_audit_offer_matches
-- Alters: offers (add service_tags)
-- Storage: brand-audit-reports bucket
-- Views: 3 analytics views
-- Seed: Brand Audit Discovery call template
-- ============================================================

-- ===================
-- 1. ALTER offers: add service_tags
-- ===================
ALTER TABLE offers ADD COLUMN IF NOT EXISTS service_tags TEXT[] DEFAULT '{}';
CREATE INDEX IF NOT EXISTS idx_offers_service_tags ON offers USING GIN (service_tags);

-- ===================
-- 2. brand_audits (core record)
-- ===================
CREATE TABLE IF NOT EXISTS brand_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  created_by UUID NOT NULL REFERENCES auth.users(id),

  -- Status state machine
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft', 'in_progress', 'call_scheduled', 'call_in_progress',
      'call_complete', 'review', 'scoring', 'complete',
      'report_generated', 'delivered', 'abandoned'
    )),
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'call', 'hybrid', 'website')),

  -- Scoring
  overall_score NUMERIC(5,2),
  overall_rating TEXT CHECK (overall_rating IN ('red', 'amber', 'green')),
  executive_summary TEXT,
  priority_roadmap JSONB,

  -- Completion tracking
  sections_completed INT NOT NULL DEFAULT 0,
  total_sections INT NOT NULL DEFAULT 8,

  -- Re-audit
  previous_audit_id UUID REFERENCES brand_audits(id) ON DELETE SET NULL,
  comparison_data JSONB,

  -- Settings
  settings JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brand_audits_org ON brand_audits(organization_id);
CREATE INDEX idx_brand_audits_contact ON brand_audits(contact_id);
CREATE INDEX idx_brand_audits_status ON brand_audits(status);
CREATE INDEX idx_brand_audits_created_by ON brand_audits(created_by);

-- ===================
-- 3. brand_audit_sections (8 per audit)
-- ===================
CREATE TABLE IF NOT EXISTS brand_audit_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES brand_audits(id) ON DELETE CASCADE,
  section_key TEXT NOT NULL
    CHECK (section_key IN (
      'company_overview', 'brand_foundation', 'visual_identity',
      'messaging', 'digital_presence', 'customer_experience',
      'competitive_landscape', 'goals_challenges'
    )),
  data JSONB NOT NULL DEFAULT '{}',
  is_complete BOOLEAN NOT NULL DEFAULT false,
  data_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (data_source IN ('manual', 'call_extracted', 'website_extracted', 'ai_refined')),
  extraction_confidence NUMERIC(3,2),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(audit_id, section_key)
);

CREATE INDEX idx_brand_audit_sections_audit ON brand_audit_sections(audit_id);

-- ===================
-- 4. brand_audit_scores (6 categories per audit)
-- ===================
CREATE TABLE IF NOT EXISTS brand_audit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES brand_audits(id) ON DELETE CASCADE,
  category TEXT NOT NULL
    CHECK (category IN (
      'brand_foundation', 'message_consistency', 'visual_identity',
      'digital_presence', 'customer_perception', 'competitive_differentiation'
    )),
  score NUMERIC(5,2) NOT NULL DEFAULT 0,
  rating TEXT NOT NULL DEFAULT 'red'
    CHECK (rating IN ('red', 'amber', 'green')),
  weight NUMERIC(3,2) NOT NULL DEFAULT 0.167,
  analysis TEXT,
  key_finding TEXT,
  actionable_insight TEXT,
  evidence JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(audit_id, category)
);

CREATE INDEX idx_brand_audit_scores_audit ON brand_audit_scores(audit_id);

-- ===================
-- 5. brand_audit_reports (PDF records)
-- ===================
CREATE TABLE IF NOT EXISTS brand_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES brand_audits(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  version INT NOT NULL DEFAULT 1,
  storage_path TEXT NOT NULL,
  file_size_bytes INT,
  share_token TEXT UNIQUE,
  share_expires_at TIMESTAMPTZ,

  -- Delivery tracking
  delivered_at TIMESTAMPTZ,
  delivered_via TEXT CHECK (delivered_via IN ('email', 'link', 'download')),
  delivered_to TEXT,
  view_count INT NOT NULL DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,

  -- Snapshot of brand settings at generation time
  brand_snapshot JSONB DEFAULT '{}',

  -- Report config
  include_pricing BOOLEAN NOT NULL DEFAULT false,
  include_comparison BOOLEAN NOT NULL DEFAULT false,
  about_text TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_brand_audit_reports_audit ON brand_audit_reports(audit_id);
CREATE INDEX idx_brand_audit_reports_share ON brand_audit_reports(share_token);

-- ===================
-- 6. brand_audit_offer_matches (gap-to-offer mapping)
-- ===================
CREATE TABLE IF NOT EXISTS brand_audit_offer_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES brand_audits(id) ON DELETE CASCADE,
  audit_category TEXT NOT NULL
    CHECK (audit_category IN (
      'brand_foundation', 'message_consistency', 'visual_identity',
      'digital_presence', 'customer_perception', 'competitive_differentiation'
    )),
  offer_id UUID REFERENCES offers(id) ON DELETE SET NULL,
  priority INT NOT NULL DEFAULT 1 CHECK (priority BETWEEN 1 AND 6),
  relevance_description TEXT,
  is_user_override BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(audit_id, audit_category)
);

CREATE INDEX idx_brand_audit_offer_matches_audit ON brand_audit_offer_matches(audit_id);

-- ===================
-- 7. Storage bucket for reports
-- ===================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('brand-audit-reports', 'brand-audit-reports', false, 10485760, ARRAY['application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Org members can read audit reports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'brand-audit-reports'
    AND EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id::text = (storage.foldername(name))[1]
    )
  );

CREATE POLICY "Org owners/admins can upload audit reports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'brand-audit-reports'
    AND EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id::text = (storage.foldername(name))[1]
        AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org owners/admins can delete audit reports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'brand-audit-reports'
    AND EXISTS (
      SELECT 1 FROM org_members om
      WHERE om.user_id = auth.uid()
        AND om.organization_id::text = (storage.foldername(name))[1]
        AND om.role IN ('owner', 'admin')
    )
  );

-- ===================
-- 8. RLS Policies
-- ===================
ALTER TABLE brand_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_audit_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_audit_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_audit_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE brand_audit_offer_matches ENABLE ROW LEVEL SECURITY;

-- brand_audits: org-scoped via org_members
CREATE POLICY "Org members can view audits"
  ON brand_audits FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.organization_id = brand_audits.organization_id
      AND om.user_id = auth.uid()
  ));

CREATE POLICY "Org owners/admins can create audits"
  ON brand_audits FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.organization_id = brand_audits.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  ));

CREATE POLICY "Org owners/admins can update audits"
  ON brand_audits FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.organization_id = brand_audits.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  ));

CREATE POLICY "Org owners/admins can delete audits"
  ON brand_audits FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.organization_id = brand_audits.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  ));

-- brand_audit_sections: via audit's org
CREATE POLICY "Org members can view sections"
  ON brand_audit_sections FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM brand_audits ba
    JOIN org_members om ON om.organization_id = ba.organization_id
    WHERE ba.id = brand_audit_sections.audit_id
      AND om.user_id = auth.uid()
  ));

CREATE POLICY "Org owners/admins can manage sections"
  ON brand_audit_sections FOR ALL
  USING (EXISTS (
    SELECT 1 FROM brand_audits ba
    JOIN org_members om ON om.organization_id = ba.organization_id
    WHERE ba.id = brand_audit_sections.audit_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  ));

-- brand_audit_scores: via audit's org
CREATE POLICY "Org members can view scores"
  ON brand_audit_scores FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM brand_audits ba
    JOIN org_members om ON om.organization_id = ba.organization_id
    WHERE ba.id = brand_audit_scores.audit_id
      AND om.user_id = auth.uid()
  ));

CREATE POLICY "Service role manages scores"
  ON brand_audit_scores FOR ALL
  USING (auth.role() = 'service_role');

-- brand_audit_reports: via org_id
CREATE POLICY "Org members can view reports"
  ON brand_audit_reports FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM org_members om
    WHERE om.organization_id = brand_audit_reports.organization_id
      AND om.user_id = auth.uid()
  ));

CREATE POLICY "Service role manages reports"
  ON brand_audit_reports FOR ALL
  USING (auth.role() = 'service_role');

-- brand_audit_offer_matches: via audit's org
CREATE POLICY "Org members can view offer matches"
  ON brand_audit_offer_matches FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM brand_audits ba
    JOIN org_members om ON om.organization_id = ba.organization_id
    WHERE ba.id = brand_audit_offer_matches.audit_id
      AND om.user_id = auth.uid()
  ));

CREATE POLICY "Org owners/admins can manage offer matches"
  ON brand_audit_offer_matches FOR ALL
  USING (EXISTS (
    SELECT 1 FROM brand_audits ba
    JOIN org_members om ON om.organization_id = ba.organization_id
    WHERE ba.id = brand_audit_offer_matches.audit_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  ));

-- ===================
-- 9. Views
-- ===================
CREATE OR REPLACE VIEW view_contact_audit_summary AS
SELECT
  ba.contact_id,
  ba.organization_id,
  ba.id AS latest_audit_id,
  ba.status,
  ba.overall_score,
  ba.overall_rating,
  ba.source,
  ba.created_at AS audit_date,
  (SELECT COUNT(*) FROM brand_audits ba2
   WHERE ba2.contact_id = ba.contact_id
     AND ba2.organization_id = ba.organization_id) AS total_audits
FROM brand_audits ba
WHERE ba.created_at = (
  SELECT MAX(ba3.created_at)
  FROM brand_audits ba3
  WHERE ba3.contact_id = ba.contact_id
    AND ba3.organization_id = ba.organization_id
    AND ba3.status != 'abandoned'
)
AND ba.contact_id IS NOT NULL;

CREATE OR REPLACE VIEW view_audit_pipeline AS
SELECT
  ba.organization_id,
  ba.status,
  COUNT(*) AS count,
  AVG(ba.overall_score) AS avg_score
FROM brand_audits ba
WHERE ba.status != 'abandoned'
GROUP BY ba.organization_id, ba.status;

CREATE OR REPLACE VIEW view_audit_category_averages AS
SELECT
  ba.organization_id,
  bas.category,
  AVG(bas.score) AS avg_score,
  COUNT(*) AS audit_count
FROM brand_audit_scores bas
JOIN brand_audits ba ON ba.id = bas.audit_id
WHERE ba.status IN ('complete', 'report_generated', 'delivered')
GROUP BY ba.organization_id, bas.category;

-- ===================
-- 10. Seed: Brand Audit Discovery call template
-- ===================
INSERT INTO call_templates (
  organization_id, name, call_type, description,
  phases, opening_script, closing_script, objection_bank,
  is_system, created_at, updated_at
)
SELECT
  NULL,
  'Brand Audit Discovery',
  'discovery',
  'Guided discovery call to assess a prospect''s brand across 8 key areas. Used with the Brand Audit feature for structured evaluation.',
  '[
    {
      "name": "Rapport & Context",
      "duration_minutes": 5,
      "questions": [
        "Tell me about your business — what do you do and who do you serve?",
        "How long have you been operating?",
        "What made you reach out / agree to this call today?"
      ],
      "extraction_target": "company_overview"
    },
    {
      "name": "Brand Foundation",
      "duration_minutes": 8,
      "questions": [
        "Do you have a clear mission statement or brand purpose?",
        "What are your core brand values — the principles that guide your decisions?",
        "How would you describe your brand personality in 3-5 words?",
        "What is your brand promise to your customers?"
      ],
      "extraction_target": "brand_foundation"
    },
    {
      "name": "Visual Identity & Messaging",
      "duration_minutes": 8,
      "questions": [
        "Do you have a professional logo, colour palette, and typography?",
        "Is your visual identity consistent across all touchpoints?",
        "What is your primary brand tagline or slogan?",
        "How do you communicate your key messages to your audience?"
      ],
      "extraction_target": "visual_identity,messaging"
    },
    {
      "name": "Digital Presence",
      "duration_minutes": 7,
      "questions": [
        "Do you have a professional website? When was it last updated?",
        "Which social media platforms are you active on?",
        "How would you rate your current SEO / discoverability?",
        "Are you running any paid advertising?"
      ],
      "extraction_target": "digital_presence"
    },
    {
      "name": "Customer Experience",
      "duration_minutes": 7,
      "questions": [
        "What does your customer journey look like from discovery to purchase?",
        "Do you actively collect customer feedback or reviews?",
        "What is your current Net Promoter Score, if you know it?",
        "How do you handle customer complaints?"
      ],
      "extraction_target": "customer_experience"
    },
    {
      "name": "Competition & Differentiation",
      "duration_minutes": 7,
      "questions": [
        "Who are your top 3 competitors?",
        "What sets you apart from them?",
        "What is your unique value proposition?",
        "Are there industry trends that threaten or favour your positioning?"
      ],
      "extraction_target": "competitive_landscape"
    },
    {
      "name": "Goals & Wrap-up",
      "duration_minutes": 5,
      "questions": [
        "What are your top brand/marketing goals for the next 12 months?",
        "What is your biggest brand challenge right now?",
        "Is there anything else you''d like me to evaluate in the audit?"
      ],
      "extraction_target": "goals_challenges"
    }
  ]'::jsonb,
  'Thank you for taking the time for this brand audit call. I''m going to walk us through a structured conversation that will help me evaluate your brand across several key areas. Everything you share will be used to create a comprehensive brand audit report with actionable recommendations. Let''s get started!',
  'Thank you so much for your openness today. I now have a really good picture of where your brand stands. I''ll put together a detailed audit report with scores across 6 key areas and a prioritised roadmap of recommendations. You can expect that within 24-48 hours. Do you have any final questions before we wrap up?',
  '[]'::jsonb,
  true,
  now(),
  now()
WHERE NOT EXISTS (
  SELECT 1 FROM call_templates WHERE name = 'Brand Audit Discovery' AND is_system = true
);

-- ===================
-- 11. Updated_at triggers
-- ===================
CREATE OR REPLACE FUNCTION update_brand_audit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_brand_audits_updated_at
  BEFORE UPDATE ON brand_audits
  FOR EACH ROW EXECUTE FUNCTION update_brand_audit_updated_at();

CREATE TRIGGER trg_brand_audit_sections_updated_at
  BEFORE UPDATE ON brand_audit_sections
  FOR EACH ROW EXECUTE FUNCTION update_brand_audit_updated_at();

CREATE TRIGGER trg_brand_audit_scores_updated_at
  BEFORE UPDATE ON brand_audit_scores
  FOR EACH ROW EXECUTE FUNCTION update_brand_audit_updated_at();
