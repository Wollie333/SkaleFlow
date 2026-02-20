# SkaleFlow Brand Audit — Database Schema

> **Feature:** Brand Audit
> **Version:** 1.0
> **Date:** 2026-02-20
> **Database:** Supabase (PostgreSQL)
> **Integrates with:** Existing SkaleFlow tables — organizations, users, contacts, calls, call_templates, call_transcripts, brand_phases, brand_outputs

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Entity Relationship Map](#entity-relationship-map)
3. [New Tables](#new-tables)
4. [Modifications to Existing Tables](#modifications-to-existing-tables)
5. [Indexes](#indexes)
6. [Row Level Security (RLS) Policies](#row-level-security-rls-policies)
7. [Database Views](#database-views)
8. [Seed Data](#seed-data)
9. [Migration Execution Order](#migration-execution-order)

---

## Schema Overview

The Brand Audit feature adds 6 new tables and modifies 1 existing table:

| Table | Purpose |
|-------|---------|
| `brand_audits` | Core audit records — one per audit per contact |
| `brand_audit_sections` | Individual section data within an audit (8 sections) |
| `brand_audit_scores` | AI-generated scores per audit category (6 categories) |
| `brand_audit_reports` | Generated PDF report records and metadata |
| `brand_audit_offer_matches` | Maps audit gaps to user's Brand Engine offers |
| `brand_audit_templates` | Call template definitions for Brand Audit calls |
| `brand_offers` *(modified)* | Add service_tags column for audit-to-offer matching |

---

## Entity Relationship Map

```
organizations (existing)
  │
  ├── users (existing)
  │     │
  │     └── brand_audits.created_by
  │
  ├── contacts (existing)
  │     │
  │     └── brand_audits.contact_id ──────────────────────┐
  │                                                        │
  ├── brand_offers (existing, modified)                    │
  │     │                                                  │
  │     └── brand_audit_offer_matches.offer_id             │
  │                                                        │
  ├── calls (existing)                                     │
  │     │                                                  │
  │     └── brand_audits.call_id (nullable)                │
  │                                                        │
  └── brand_audits ◄──────────────────────────────────────┘
        │
        ├── brand_audit_sections (1:many — 8 sections per audit)
        │
        ├── brand_audit_scores (1:many — 6 scores per audit)
        │
        ├── brand_audit_reports (1:many — multiple versions possible)
        │
        └── brand_audit_offer_matches (1:many — gap-to-offer mappings)


brand_audit_templates (standalone — system + custom templates)
```

---

## New Tables

### brand_audits

Core table. One record per brand audit. Links to a CRM contact and optionally to a call.

```sql
CREATE TABLE brand_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),

  -- Source tracking
  source TEXT NOT NULL DEFAULT 'manual'
    CHECK (source IN ('manual', 'call', 'hybrid')),
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  -- If source is 'call' or 'hybrid', this links to the call record

  -- Status lifecycle
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN (
      'draft',               -- Created, not started or partially filled
      'in_progress',         -- Manual wizard in progress
      'call_in_progress',    -- Live call happening
      'call_complete',       -- Call ended, data extracted, awaiting review
      'hybrid_in_progress',  -- Filling gaps manually after call
      'ready',               -- All data present, ready for scoring
      'processing',          -- AI scoring & analysis running
      'complete',            -- Scored and analysed
      'report_generated',    -- PDF created
      'delivered',           -- Report sent to prospect
      'archived',            -- Manually archived
      'abandoned'            -- Auto-archived after inactivity
    )),

  -- Scoring (populated after AI processing)
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  overall_rating TEXT CHECK (overall_rating IN ('red', 'amber', 'green')),

  -- AI-generated content (populated after processing)
  executive_summary TEXT,
  -- 3-5 key findings in paragraph form

  priority_roadmap JSONB DEFAULT '[]',
  -- Structure:
  -- [
  --   {
  --     "priority": 1,
  --     "level": "critical",        // critical, improvement, optimisation
  --     "category": "messaging",
  --     "gap_description": "Messaging is inconsistent across channels...",
  --     "matched_offer_id": "uuid-of-offer",  // null if no match
  --     "matched_offer_name": "Brand Strategy Package",
  --     "offer_relevance": "This package directly addresses...",
  --     "unmatched_note": null  // or "May require specialist support" if no offer matches
  --   }
  -- ]

  -- Comparison tracking (for re-audits)
  previous_audit_id UUID REFERENCES brand_audits(id) ON DELETE SET NULL,
  is_reaudit BOOLEAN DEFAULT false,
  comparison_data JSONB,
  -- Structure (populated if is_reaudit = true):
  -- {
  --   "previous_overall_score": 35,
  --   "score_change": +15,
  --   "category_changes": [
  --     {"category": "brand_foundation", "previous": "red", "current": "amber", "direction": "improved"},
  --     ...
  --   ],
  --   "ai_progress_summary": "Since the last audit..."
  -- }

  -- Report settings (user preferences for this audit's report)
  report_settings JSONB DEFAULT '{}',
  -- Structure:
  -- {
  --   "show_pricing": false,
  --   "show_competitive_snapshot": true,
  --   "custom_about_text": null,     // null = use default from user profile
  --   "custom_cta_text": null,
  --   "custom_cta_url": null
  -- }

  -- Metadata
  sections_completed INTEGER DEFAULT 0,
  sections_total INTEGER DEFAULT 8,
  credits_used INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_brand_audits_org ON brand_audits(organization_id);
CREATE INDEX idx_brand_audits_contact ON brand_audits(contact_id);
CREATE INDEX idx_brand_audits_status ON brand_audits(status);
CREATE INDEX idx_brand_audits_created_by ON brand_audits(created_by);
CREATE INDEX idx_brand_audits_call ON brand_audits(call_id) WHERE call_id IS NOT NULL;

-- Updated_at trigger
CREATE TRIGGER set_brand_audits_updated_at
  BEFORE UPDATE ON brand_audits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### brand_audit_sections

Stores the input data for each section of the audit. 8 sections per audit, mapped to the wizard steps and call template sections.

```sql
CREATE TABLE brand_audit_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES brand_audits(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Section identification
  section_key TEXT NOT NULL
    CHECK (section_key IN (
      'client_overview',
      'target_market',
      'current_messaging',
      'visual_identity',
      'digital_presence',
      'customer_perception',
      'competitive_landscape',
      'goals_pain_points'
    )),
  section_order INTEGER NOT NULL,
  -- 1=client_overview, 2=target_market, ..., 8=goals_pain_points

  -- Section data (flexible JSONB per section type)
  data JSONB NOT NULL DEFAULT '{}',
  -- See Section Data Structures below for schema per section_key

  -- Data source tracking
  data_source TEXT NOT NULL DEFAULT 'manual'
    CHECK (data_source IN ('manual', 'call_extracted', 'hybrid', 'ai_enriched')),
  extraction_confidence NUMERIC(3,2) CHECK (extraction_confidence >= 0 AND extraction_confidence <= 1),
  -- 0.0 to 1.0 — how confident the AI is in extracted data (null for manual)

  -- Status
  status TEXT NOT NULL DEFAULT 'empty'
    CHECK (status IN ('empty', 'in_progress', 'complete', 'needs_review')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE (audit_id, section_key)
);

-- Indexes
CREATE INDEX idx_brand_audit_sections_audit ON brand_audit_sections(audit_id);
CREATE INDEX idx_brand_audit_sections_org ON brand_audit_sections(organization_id);

-- Updated_at trigger
CREATE TRIGGER set_brand_audit_sections_updated_at
  BEFORE UPDATE ON brand_audit_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### Section Data Structures (JSONB schemas per section_key)

**client_overview:**
```json
{
  "business_name": "string",
  "industry": "string",
  "years_in_operation": "number",
  "team_size": "string (1-5, 6-20, 21-50, 51-100, 100+)",
  "website_url": "string",
  "social_links": {
    "linkedin": "string",
    "facebook": "string",
    "instagram": "string",
    "tiktok": "string",
    "twitter": "string",
    "youtube": "string"
  },
  "annual_revenue_range": "string (under_500k, 500k_1m, 1m_5m, 5m_10m, 10m_plus)",
  "marketing_budget_range": "string (under_5k, 5k_20k, 20k_50k, 50k_100k, 100k_plus)",
  "primary_service_description": "string",
  "ai_website_analysis": "string (auto-populated if URL provided)"
}
```

**target_market:**
```json
{
  "ideal_customer_description": "string",
  "core_problem_solved": "string",
  "customer_acquisition_channels": ["string"],
  "buying_journey_description": "string",
  "average_deal_value": "string",
  "ai_refined_icp": "string (AI-refined version of user input)"
}
```

**current_messaging:**
```json
{
  "current_tagline": "string",
  "one_sentence_description": "string",
  "messaging_consistency_rating": "number (1-5)",
  "messaging_focus": "string (customer_focused, self_focused, mixed)",
  "has_clear_cta": "string (yes, no, inconsistent)",
  "sample_messaging": "string (pasted examples)",
  "ai_website_copy_analysis": "string (auto-populated if URL provided)"
}
```

**visual_identity:**
```json
{
  "logo_consistency": "string (yes, no, partially)",
  "colour_palette_defined": "string (yes, no, partially)",
  "visual_matches_price_point": "string (yes, no, unclear)",
  "visual_cohesion_rating": "number (1-5)",
  "visual_issues_notes": "string",
  "uploaded_screenshots": ["string (storage URLs)"]
}
```

**digital_presence:**
```json
{
  "website_quality_rating": "number (1-5)",
  "five_second_test_pass": "string (yes, no, unclear)",
  "social_media_activity": "string (very_active, occasional, inactive, no_presence)",
  "google_search_results": "string",
  "has_google_business": "string (yes, no, unclaimed)",
  "digital_presence_rating": "number (1-5)",
  "ai_website_speed_check": "string (auto-populated)"
}
```

**customer_perception:**
```json
{
  "desired_perception": "string",
  "actual_review_feedback": "string",
  "perception_gap_exists": "string (yes, no, unsure)",
  "average_review_rating": "number",
  "common_complaint_or_praise": "string"
}
```

**competitive_landscape:**
```json
{
  "competitors": [
    {
      "name": "string",
      "website": "string",
      "what_they_do_better": "string"
    }
  ],
  "client_differentiator": "string",
  "logo_swap_test": "string (yes, no, partially)",
  "primary_competition_method": "string (price, quality, service, speed, specialisation, not_differentiated)"
}
```

**goals_pain_points:**
```json
{
  "biggest_frustration": "string",
  "success_in_90_days": "string",
  "one_thing_to_fix": "string",
  "failed_attempts": "string",
  "appetite_for_change": "string (ready_to_overhaul, open_to_changes, cautious, resistant)"
}
```

---

### brand_audit_scores

AI-generated scores per audit category. 6 records per audit (one per category).

```sql
CREATE TABLE brand_audit_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES brand_audits(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Category identification
  category TEXT NOT NULL
    CHECK (category IN (
      'brand_foundation',
      'message_consistency',
      'visual_identity',
      'digital_presence',
      'customer_perception',
      'competitive_differentiation'
    )),

  -- Scoring
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  rating TEXT NOT NULL CHECK (rating IN ('red', 'amber', 'green')),
  -- Rating thresholds: red = 0-39, amber = 40-69, green = 70-100

  -- AI-generated analysis
  analysis_summary TEXT NOT NULL,
  -- 2-3 paragraphs: what was found, why it matters

  key_finding TEXT NOT NULL,
  -- Single most important insight for this category

  actionable_insight TEXT NOT NULL,
  -- Specific action the client should take

  -- Source sections (which audit sections informed this score)
  source_sections TEXT[] NOT NULL,
  -- e.g., ['client_overview', 'target_market'] for brand_foundation

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE (audit_id, category)
);

-- Indexes
CREATE INDEX idx_brand_audit_scores_audit ON brand_audit_scores(audit_id);
CREATE INDEX idx_brand_audit_scores_org ON brand_audit_scores(organization_id);
CREATE INDEX idx_brand_audit_scores_rating ON brand_audit_scores(rating);
```

#### Category-to-Section Mapping

This defines which audit sections inform which scoring categories:

| Scoring Category | Source Sections | Weight |
|-----------------|----------------|--------|
| brand_foundation | client_overview, target_market, goals_pain_points | 20% |
| message_consistency | current_messaging | 20% |
| visual_identity | visual_identity | 15% |
| digital_presence | digital_presence | 15% |
| customer_perception | customer_perception | 15% |
| competitive_differentiation | competitive_landscape | 15% |

---

### brand_audit_reports

Records of generated PDF reports. Supports multiple versions per audit.

```sql
CREATE TABLE brand_audit_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES brand_audits(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  generated_by UUID NOT NULL REFERENCES users(id),

  -- File storage
  file_url TEXT NOT NULL,
  -- Supabase Storage URL to the PDF
  file_size INTEGER,
  -- File size in bytes
  page_count INTEGER,

  -- Version tracking
  version INTEGER NOT NULL DEFAULT 1,

  -- Brand theming snapshot (captured at generation time)
  brand_snapshot JSONB NOT NULL,
  -- Structure:
  -- {
  --   "primary_color": "#2E75B6",
  --   "secondary_color": "#1A4D7C",
  --   "logo_url": "https://...",
  --   "font_heading": "Inter",
  --   "font_body": "Inter",
  --   "agency_name": "Mana Marketing",
  --   "agency_email": "hello@manamarketing.co.za",
  --   "agency_phone": "+27 ...",
  --   "agency_website": "https://manamarketing.co.za",
  --   "about_text": "...",
  --   "cta_text": "Book a Strategy Call",
  --   "cta_url": "https://..."
  -- }

  -- Report content snapshot (in case audit data changes later)
  report_content JSONB NOT NULL,
  -- Full rendered content of the report at generation time
  -- Ensures the PDF can be re-generated identically if needed

  -- Delivery tracking
  delivery_method TEXT CHECK (delivery_method IN ('download', 'email', 'link', 'multiple')),
  delivered_at TIMESTAMPTZ,
  delivered_to TEXT,
  -- Email address or "downloaded" or shareable link URL

  -- Link sharing
  share_link TEXT UNIQUE,
  -- Unique shareable URL (e.g., https://reports.skaleflow.app/r/abc123)
  share_link_expires_at TIMESTAMPTZ,
  share_link_views INTEGER DEFAULT 0,

  -- Credits
  credits_used INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_brand_audit_reports_audit ON brand_audit_reports(audit_id);
CREATE INDEX idx_brand_audit_reports_org ON brand_audit_reports(organization_id);
CREATE INDEX idx_brand_audit_reports_share ON brand_audit_reports(share_link) WHERE share_link IS NOT NULL;
```

---

### brand_audit_offer_matches

Maps audit gaps to the user's Brand Engine offers. Used to generate the Priority Roadmap page of the report.

```sql
CREATE TABLE brand_audit_offer_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES brand_audits(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- The gap
  audit_category TEXT NOT NULL
    CHECK (audit_category IN (
      'brand_foundation',
      'message_consistency',
      'visual_identity',
      'digital_presence',
      'customer_perception',
      'competitive_differentiation'
    )),
  gap_description TEXT NOT NULL,
  -- AI-generated description of the specific gap

  priority_level TEXT NOT NULL
    CHECK (priority_level IN ('critical', 'improvement', 'optimisation')),
  priority_order INTEGER NOT NULL,
  -- 1 = highest priority

  -- The matched offer (nullable — not all gaps have matching offers)
  offer_id UUID REFERENCES brand_offers(id) ON DELETE SET NULL,
  offer_relevance_description TEXT,
  -- AI-generated explanation of how the offer addresses this gap

  -- For unmatched gaps
  is_unmatched BOOLEAN DEFAULT false,
  unmatched_note TEXT,
  -- e.g., "May require specialist support" or "Discuss with your strategist"

  -- User override (user can manually change the matched offer)
  user_overridden BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  UNIQUE (audit_id, audit_category)
);

-- Indexes
CREATE INDEX idx_audit_offer_matches_audit ON brand_audit_offer_matches(audit_id);
CREATE INDEX idx_audit_offer_matches_org ON brand_audit_offer_matches(organization_id);
CREATE INDEX idx_audit_offer_matches_offer ON brand_audit_offer_matches(offer_id) WHERE offer_id IS NOT NULL;
```

---

### brand_audit_templates

Call templates specifically for Brand Audit calls. These define the guided conversation structure and AI extraction rules.

```sql
CREATE TABLE brand_audit_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  -- NULL organization_id = system template (available to all)

  name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,
  -- System templates are read-only and available to all orgs
  is_default BOOLEAN DEFAULT false,
  -- Default template for Brand Audit calls in this org

  -- Template sections (the conversation guide)
  sections JSONB NOT NULL,
  -- Structure:
  -- [
  --   {
  --     "order": 1,
  --     "key": "opening_context",
  --     "title": "Opening & Context",
  --     "duration_minutes": 3,
  --     "suggested_questions": [
  --       "Tell me about your business — what do you do and who do you serve?",
  --       "How long have you been operating?",
  --       "What made you reach out / agree to this conversation?"
  --     ],
  --     "maps_to_audit_section": "client_overview",
  --     "extraction_rules": {
  --       "listen_for": ["business name", "industry", "years operating", "team size", "service description"],
  --       "trigger_phrases": ["we've been in business for", "we do", "we serve", "our team is"],
  --       "required_fields": ["business_name", "industry"],
  --       "optional_fields": ["years_in_operation", "team_size"]
  --     },
  --     "transition_prompt": "Great, now let me understand who your ideal customer is..."
  --   },
  --   {
  --     "order": 2,
  --     "key": "target_market",
  --     "title": "Target Market",
  --     "duration_minutes": 5,
  --     "suggested_questions": [...],
  --     "maps_to_audit_section": "target_market",
  --     "extraction_rules": {...},
  --     "transition_prompt": "..."
  --   },
  --   ... (7 sections total for Brand Audit template)
  -- ]

  -- Scoring configuration
  scoring_config JSONB DEFAULT '{}',
  -- Structure:
  -- {
  --   "rating_thresholds": {
  --     "red": {"min": 0, "max": 39},
  --     "amber": {"min": 40, "max": 69},
  --     "green": {"min": 70, "max": 100}
  --   },
  --   "category_weights": {
  --     "brand_foundation": 0.20,
  --     "message_consistency": 0.20,
  --     "visual_identity": 0.15,
  --     "digital_presence": 0.15,
  --     "customer_perception": 0.15,
  --     "competitive_differentiation": 0.15
  --   }
  -- }

  -- Metadata
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_brand_audit_templates_org ON brand_audit_templates(organization_id);
CREATE INDEX idx_brand_audit_templates_system ON brand_audit_templates(is_system) WHERE is_system = true;

-- Updated_at trigger
CREATE TRIGGER set_brand_audit_templates_updated_at
  BEFORE UPDATE ON brand_audit_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## Modifications to Existing Tables

### brand_offers (ADD service_tags column)

The existing `brand_offers` table needs a `service_tags` column to enable the audit-to-offer matching engine.

```sql
-- Add service_tags column to existing brand_offers table
ALTER TABLE brand_offers
ADD COLUMN service_tags TEXT[] DEFAULT '{}';

-- Populate with suggested tags (user can modify)
-- Available tags: branding, messaging, content, digital, design, strategy, website, social, seo, advertising, consulting
COMMENT ON COLUMN brand_offers.service_tags IS 'Tags used to match offers to brand audit gap categories. Available: branding, messaging, content, digital, design, strategy, website, social, seo, advertising, consulting';

-- Index for tag-based queries
CREATE INDEX idx_brand_offers_service_tags ON brand_offers USING GIN (service_tags);
```

#### Service Tag to Audit Category Mapping

The matching engine uses these tag-to-category mappings:

| Audit Category | Matching Tags |
|---------------|---------------|
| brand_foundation | branding, strategy, consulting |
| message_consistency | messaging, branding, content |
| visual_identity | design, branding |
| digital_presence | website, digital, seo, social |
| customer_perception | content, social, consulting |
| competitive_differentiation | strategy, branding, messaging |

An offer matches a gap if any of the offer's `service_tags` overlap with the category's matching tags. If multiple offers match, the system selects the one with the most overlapping tags (highest relevance).

---

## Row Level Security (RLS) Policies

All tables follow the existing SkaleFlow pattern: data is scoped to `organization_id`.

```sql
-- brand_audits
ALTER TABLE brand_audits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audits in their org"
  ON brand_audits FOR SELECT
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create audits in their org"
  ON brand_audits FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update audits in their org"
  ON brand_audits FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete audits in their org"
  ON brand_audits FOR DELETE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));


-- brand_audit_sections
ALTER TABLE brand_audit_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit sections in their org"
  ON brand_audit_sections FOR SELECT
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create audit sections in their org"
  ON brand_audit_sections FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update audit sections in their org"
  ON brand_audit_sections FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete audit sections in their org"
  ON brand_audit_sections FOR DELETE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));


-- brand_audit_scores
ALTER TABLE brand_audit_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit scores in their org"
  ON brand_audit_scores FOR SELECT
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create audit scores in their org"
  ON brand_audit_scores FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete audit scores in their org"
  ON brand_audit_scores FOR DELETE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));


-- brand_audit_reports
ALTER TABLE brand_audit_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view audit reports in their org"
  ON brand_audit_reports FOR SELECT
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create audit reports in their org"
  ON brand_audit_reports FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

-- Public access for shared report links
CREATE POLICY "Anyone can view shared reports via link"
  ON brand_audit_reports FOR SELECT
  USING (
    share_link IS NOT NULL
    AND (share_link_expires_at IS NULL OR share_link_expires_at > NOW())
  );


-- brand_audit_offer_matches
ALTER TABLE brand_audit_offer_matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view offer matches in their org"
  ON brand_audit_offer_matches FOR SELECT
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can create offer matches in their org"
  ON brand_audit_offer_matches FOR INSERT
  WITH CHECK (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update offer matches in their org"
  ON brand_audit_offer_matches FOR UPDATE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can delete offer matches in their org"
  ON brand_audit_offer_matches FOR DELETE
  USING (organization_id = (SELECT organization_id FROM users WHERE id = auth.uid()));


-- brand_audit_templates
ALTER TABLE brand_audit_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view system templates and their org templates"
  ON brand_audit_templates FOR SELECT
  USING (
    is_system = true
    OR organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
  );

CREATE POLICY "Users can create templates in their org"
  ON brand_audit_templates FOR INSERT
  WITH CHECK (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND is_system = false
  );

CREATE POLICY "Users can update their org templates"
  ON brand_audit_templates FOR UPDATE
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND is_system = false
  );

CREATE POLICY "Users can delete their org templates"
  ON brand_audit_templates FOR DELETE
  USING (
    organization_id = (SELECT organization_id FROM users WHERE id = auth.uid())
    AND is_system = false
  );
```

---

## Database Views

### view_contact_audit_summary

Quick-access view showing the latest audit status for each contact. Powers the CRM contact card widget.

```sql
CREATE OR REPLACE VIEW view_contact_audit_summary AS
SELECT DISTINCT ON (ba.contact_id)
  ba.contact_id,
  ba.organization_id,
  ba.id AS latest_audit_id,
  ba.overall_score,
  ba.overall_rating,
  ba.status AS audit_status,
  ba.source,
  ba.created_at AS audit_date,
  ba.completed_at,
  (
    SELECT COUNT(*)
    FROM brand_audits ba2
    WHERE ba2.contact_id = ba.contact_id
    AND ba2.status NOT IN ('draft', 'abandoned')
  ) AS total_audits,
  (
    SELECT json_agg(json_build_object(
      'category', s.category,
      'rating', s.rating,
      'score', s.score
    ))
    FROM brand_audit_scores s
    WHERE s.audit_id = ba.id
  ) AS category_scores
FROM brand_audits ba
WHERE ba.status NOT IN ('draft', 'abandoned')
ORDER BY ba.contact_id, ba.created_at DESC;
```

### view_audit_pipeline

Overview of all audits with status distribution. Powers the Brand Audit list/dashboard view.

```sql
CREATE OR REPLACE VIEW view_audit_pipeline AS
SELECT
  ba.id,
  ba.organization_id,
  ba.contact_id,
  c.first_name || ' ' || COALESCE(c.last_name, '') AS contact_name,
  c.company AS contact_company,
  ba.status,
  ba.source,
  ba.overall_score,
  ba.overall_rating,
  ba.sections_completed,
  ba.sections_total,
  ba.created_by,
  u.full_name AS created_by_name,
  ba.created_at,
  ba.updated_at,
  ba.completed_at,
  (
    SELECT COUNT(*)
    FROM brand_audit_reports r
    WHERE r.audit_id = ba.id
  ) AS report_count
FROM brand_audits ba
JOIN contacts c ON c.id = ba.contact_id
JOIN users u ON u.id = ba.created_by
ORDER BY ba.updated_at DESC;
```

### view_audit_category_averages

Aggregate view showing average scores per category across all audits for an organization. Useful for identifying common client weaknesses.

```sql
CREATE OR REPLACE VIEW view_audit_category_averages AS
SELECT
  bas.organization_id,
  bas.category,
  COUNT(*) AS total_audits,
  ROUND(AVG(bas.score)) AS avg_score,
  ROUND(AVG(bas.score) FILTER (WHERE bas.rating = 'red')) AS avg_red_score,
  COUNT(*) FILTER (WHERE bas.rating = 'red') AS red_count,
  COUNT(*) FILTER (WHERE bas.rating = 'amber') AS amber_count,
  COUNT(*) FILTER (WHERE bas.rating = 'green') AS green_count
FROM brand_audit_scores bas
JOIN brand_audits ba ON ba.id = bas.audit_id
WHERE ba.status IN ('complete', 'report_generated', 'delivered')
GROUP BY bas.organization_id, bas.category;
```

---

## Seed Data

### System Brand Audit Call Template

```sql
INSERT INTO brand_audit_templates (
  id,
  organization_id,
  name,
  description,
  is_system,
  is_default,
  sections,
  scoring_config,
  created_at
) VALUES (
  gen_random_uuid(),
  NULL, -- System template, available to all
  'Brand Audit Discovery',
  'A structured conversation guide for running a comprehensive brand audit during a discovery call. AI extracts data automatically and maps it to the audit framework.',
  true,
  true,
  '[
    {
      "order": 1,
      "key": "opening_context",
      "title": "Opening & Context",
      "duration_minutes": 3,
      "suggested_questions": [
        "Tell me about your business — what do you do and who do you serve?",
        "How long have you been operating?",
        "How big is your team?",
        "What made you reach out / agree to this conversation?"
      ],
      "maps_to_audit_section": "client_overview",
      "extraction_rules": {
        "listen_for": ["business name", "industry", "years operating", "team size", "core service"],
        "trigger_phrases": ["we have been in business for", "we do", "we serve", "our team is", "we started"],
        "required_fields": ["business_name", "primary_service_description"],
        "optional_fields": ["industry", "years_in_operation", "team_size"]
      },
      "transition_prompt": "Great, that gives me a solid picture. Now let me understand your customers better..."
    },
    {
      "order": 2,
      "key": "target_market",
      "title": "Target Market & Customers",
      "duration_minutes": 5,
      "suggested_questions": [
        "Who is your ideal customer? Describe them for me.",
        "What is the main problem you solve for them?",
        "How do most of your customers find you right now?",
        "What does a typical deal or transaction look like — size, timeline?"
      ],
      "maps_to_audit_section": "target_market",
      "extraction_rules": {
        "listen_for": ["customer description", "problem solved", "acquisition channels", "deal value"],
        "trigger_phrases": ["our ideal customer", "we solve", "they find us through", "typical deal"],
        "required_fields": ["ideal_customer_description", "core_problem_solved"],
        "optional_fields": ["customer_acquisition_channels", "average_deal_value"]
      },
      "transition_prompt": "Now I want to understand how you talk about your brand..."
    },
    {
      "order": 3,
      "key": "brand_messaging",
      "title": "Brand & Messaging",
      "duration_minutes": 7,
      "suggested_questions": [
        "If I asked your best customer to describe what you do, what would they say?",
        "Now how do YOU describe what you do?",
        "Is that message the same everywhere — website, social, when you pitch?",
        "What is the one thing you want people to remember about your brand?"
      ],
      "maps_to_audit_section": "current_messaging",
      "extraction_rules": {
        "listen_for": ["customer perception", "self-description", "consistency", "tagline", "value proposition"],
        "trigger_phrases": ["customers would say", "we describe ourselves", "our message is", "we want to be known for"],
        "required_fields": ["one_sentence_description"],
        "optional_fields": ["current_tagline", "messaging_consistency_rating", "messaging_focus"]
      },
      "transition_prompt": "Let us talk about your visual brand and online presence..."
    },
    {
      "order": 4,
      "key": "visual_digital",
      "title": "Visual Identity & Digital Presence",
      "duration_minutes": 5,
      "suggested_questions": [
        "How do you feel about your current website?",
        "Are you active on social media? What is working, what is not?",
        "When someone Googles your business, are you happy with what they find?",
        "Does your visual brand — logo, colours, overall look — represent who you actually are?"
      ],
      "maps_to_audit_section": "visual_identity,digital_presence",
      "extraction_rules": {
        "listen_for": ["website satisfaction", "social activity", "Google presence", "visual identity satisfaction", "logo", "design quality"],
        "trigger_phrases": ["our website", "social media", "when you google us", "our logo", "our brand looks"],
        "required_fields": [],
        "optional_fields": ["website_quality_rating", "social_media_activity", "logo_consistency", "visual_cohesion_rating"]
      },
      "transition_prompt": "Now let me ask about your reputation and competition..."
    },
    {
      "order": 5,
      "key": "reputation_competition",
      "title": "Reputation & Competition",
      "duration_minutes": 5,
      "suggested_questions": [
        "What do your reviews and testimonials say about you?",
        "Who do you lose deals to? What do they do differently?",
        "What makes you different from those competitors — honestly?",
        "If I put your website next to theirs and removed the logos, could I tell them apart?"
      ],
      "maps_to_audit_section": "customer_perception,competitive_landscape",
      "extraction_rules": {
        "listen_for": ["reviews", "testimonials", "competitors", "differentiation", "why clients leave"],
        "trigger_phrases": ["our reviews say", "we compete with", "what makes us different", "we lose to"],
        "required_fields": [],
        "optional_fields": ["desired_perception", "actual_review_feedback", "competitors", "client_differentiator"]
      },
      "transition_prompt": "Finally, I want to understand what you want to change..."
    },
    {
      "order": 6,
      "key": "pain_goals",
      "title": "Pain Points & Goals",
      "duration_minutes": 5,
      "suggested_questions": [
        "What is your biggest frustration with your marketing right now?",
        "What have you tried before that did not work?",
        "If we could fix one thing in the next 90 days, what would move the needle most?",
        "What does success look like for you?"
      ],
      "maps_to_audit_section": "goals_pain_points",
      "extraction_rules": {
        "listen_for": ["frustrations", "failed attempts", "goals", "success metrics", "priority"],
        "trigger_phrases": ["biggest frustration", "we tried", "success would be", "if I could fix one thing"],
        "required_fields": ["biggest_frustration"],
        "optional_fields": ["success_in_90_days", "one_thing_to_fix", "failed_attempts", "appetite_for_change"]
      },
      "transition_prompt": null
    },
    {
      "order": 7,
      "key": "close",
      "title": "Close & Next Steps",
      "duration_minutes": 3,
      "suggested_questions": [
        "Based on everything you have shared, I am going to put together a brand audit report for you.",
        "You will have it within 24-48 hours — it will show exactly where things stand and what to prioritise.",
        "Any questions before we wrap up?"
      ],
      "maps_to_audit_section": null,
      "extraction_rules": null,
      "transition_prompt": null
    }
  ]'::jsonb,
  '{
    "rating_thresholds": {
      "red": {"min": 0, "max": 39},
      "amber": {"min": 40, "max": 69},
      "green": {"min": 70, "max": 100}
    },
    "category_weights": {
      "brand_foundation": 0.20,
      "message_consistency": 0.20,
      "visual_identity": 0.15,
      "digital_presence": 0.15,
      "customer_perception": 0.15,
      "competitive_differentiation": 0.15
    }
  }'::jsonb,
  NOW()
);
```

---

## Migration Execution Order

Run these migrations in sequence:

```
1. 001_create_brand_audit_templates.sql
   → Creates brand_audit_templates table
   → Inserts system template seed data

2. 002_alter_brand_offers_add_service_tags.sql
   → Adds service_tags column to existing brand_offers table
   → Creates GIN index

3. 003_create_brand_audits.sql
   → Creates brand_audits table with all indexes and trigger

4. 004_create_brand_audit_sections.sql
   → Creates brand_audit_sections table with unique constraint

5. 005_create_brand_audit_scores.sql
   → Creates brand_audit_scores table with unique constraint

6. 006_create_brand_audit_reports.sql
   → Creates brand_audit_reports table

7. 007_create_brand_audit_offer_matches.sql
   → Creates brand_audit_offer_matches table

8. 008_create_brand_audit_views.sql
   → Creates view_contact_audit_summary
   → Creates view_audit_pipeline
   → Creates view_audit_category_averages

9. 009_create_brand_audit_rls_policies.sql
   → Enables RLS on all new tables
   → Creates all SELECT/INSERT/UPDATE/DELETE policies
   → Creates public share link access policy
```

**Note:** These migrations assume the following existing infrastructure:
- `update_updated_at_column()` function exists (used by triggers)
- `organizations`, `users`, `contacts`, `calls`, `brand_offers` tables exist
- Supabase auth.uid() function available for RLS policies
