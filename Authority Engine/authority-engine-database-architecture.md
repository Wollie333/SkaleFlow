# SkaleFlow Authority Engine — Database Architecture

## Overview

The Authority Engine uses **separate tables** from the existing sales pipeline but **shares infrastructure patterns** (drag-and-drop UI components, notification delivery, file storage, AI generation, template system, RBAC). All tables are within the existing Supabase project and follow established conventions for RLS (Row Level Security), timestamps, and organisation scoping.

All tables include standard fields unless otherwise noted:
- `id` — UUID, primary key, default `gen_random_uuid()`
- `organisation_id` — UUID, foreign key to `organisations.id`, NOT NULL
- `created_at` — TIMESTAMPTZ, default `now()`
- `updated_at` — TIMESTAMPTZ, default `now()`, auto-updated via trigger
- `created_by` — UUID, foreign key to `auth.users.id`

RLS policies should scope all queries to the user's `organisation_id`.

---

## Table: `authority_pipeline_stages`

Defines the pipeline stage configuration. Seeded with defaults on organisation creation.

```sql
CREATE TABLE authority_pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL, -- e.g. 'inbound', 'prospect', 'pitched', etc.
  description TEXT,
  stage_order INTEGER NOT NULL, -- display order in pipeline view
  stage_type TEXT NOT NULL DEFAULT 'active', -- 'active', 'closed_won', 'closed_lost'
  color TEXT, -- hex colour for pipeline column header
  is_default BOOLEAN DEFAULT false, -- default stage for new cards
  is_system BOOLEAN DEFAULT true, -- system stages can't be deleted
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organisation_id, slug)
);
```

### Seed Data (Default Stages)

| slug | name | stage_order | stage_type |
|---|---|---|---|
| `inbound` | Inbound | 1 | active |
| `prospect` | Prospect | 2 | active |
| `pitched` | Pitched | 3 | active |
| `in_discussion` | In Discussion | 4 | active |
| `agreed` | Agreed | 5 | active |
| `content_prep` | Content Prep | 6 | active |
| `submitted` | Submitted | 7 | active |
| `published` | Published | 8 | active |
| `amplified` | Amplified | 9 | closed_won |
| `archived` | Archived | 10 | closed_won |
| `declined` | Declined | 11 | closed_lost |
| `no_response` | No Response | 12 | closed_lost |
| `on_hold` | On Hold | 13 | active |

---

## Table: `authority_pipeline_cards`

Core pipeline card data. Each card represents a single PR opportunity.

```sql
CREATE TABLE authority_pipeline_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  
  -- Core fields
  opportunity_name TEXT NOT NULL,
  stage_id UUID NOT NULL REFERENCES authority_pipeline_stages(id),
  category TEXT NOT NULL, -- enum: 'press_release', 'media_placement', 'magazine_feature', 'podcast_appearance', 'live_event', 'tv_video', 'award_recognition', 'thought_leadership'
  priority TEXT DEFAULT 'medium', -- enum: 'low', 'medium', 'high', 'urgent'
  
  -- Target info
  target_outlet TEXT, -- name of publication/platform/event
  contact_id UUID REFERENCES authority_contacts(id) ON DELETE SET NULL,
  story_angle_id UUID REFERENCES authority_story_angles(id) ON DELETE SET NULL,
  custom_story_angle TEXT, -- if not using a pre-built angle
  
  -- Dates
  target_date DATE, -- desired publication/appearance date
  pitched_at TIMESTAMPTZ, -- when outreach was sent
  agreed_at TIMESTAMPTZ, -- when both parties confirmed
  submitted_at TIMESTAMPTZ, -- when content/assets were submitted
  published_at TIMESTAMPTZ, -- when the piece went live
  amplified_at TIMESTAMPTZ, -- when social campaign launched
  archived_at TIMESTAMPTZ,
  
  -- Publication details (populated at Agreed stage+)
  confirmed_format TEXT, -- e.g. 'feature_article', 'news_piece', 'podcast_episode', 'column', 'interview', 'speaking_slot'
  confirmed_angle TEXT,
  submission_deadline DATE,
  expected_publication_date DATE,
  embargo_date DATE, -- NULL if no embargo
  embargo_active BOOLEAN DEFAULT false,
  
  -- Published details
  live_url TEXT,
  
  -- Reach tier for scoring
  reach_tier TEXT DEFAULT 'local', -- enum: 'local', 'regional', 'national', 'international'
  
  -- Decline/No Response metadata
  decline_reason TEXT, -- enum: 'not_relevant', 'bad_timing', 'wrong_contact', 'full_calendar', 'budget_constraints', 'other'
  decline_reason_other TEXT,
  decline_try_again_date DATE,
  decline_referred_to TEXT, -- name of referred contact
  no_response_follow_up_count INTEGER DEFAULT 0,
  
  -- On Hold metadata
  on_hold_reason TEXT,
  on_hold_resume_date DATE,
  
  -- Content Engine link
  content_campaign_id UUID, -- reference to content engine campaign when Push to Campaign is used
  pre_launch_campaign_id UUID, -- reference to pre-launch teaser campaign
  
  -- Notes
  notes TEXT,
  
  -- Scoring
  authority_points_earned NUMERIC(10,2) DEFAULT 0,
  points_calculated BOOLEAN DEFAULT false,
  
  -- Standard fields
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_authority_cards_org ON authority_pipeline_cards(organisation_id);
CREATE INDEX idx_authority_cards_stage ON authority_pipeline_cards(stage_id);
CREATE INDEX idx_authority_cards_contact ON authority_pipeline_cards(contact_id);
CREATE INDEX idx_authority_cards_category ON authority_pipeline_cards(category);
CREATE INDEX idx_authority_cards_published_at ON authority_pipeline_cards(published_at);
```

---

## Table: `authority_commercial`

Financial/commercial details for pipeline cards. Separate table to keep the cards table clean and allow for payment history tracking.

```sql
CREATE TABLE authority_commercial (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES authority_pipeline_cards(id) ON DELETE CASCADE,
  
  engagement_type TEXT NOT NULL, -- enum: 'earned', 'paid', 'contra', 'sponsored'
  deal_value NUMERIC(12,2) DEFAULT 0, -- currency amount
  currency TEXT DEFAULT 'ZAR', -- ISO currency code
  payment_status TEXT DEFAULT 'not_invoiced', -- enum: 'not_invoiced', 'invoiced', 'paid', 'overdue'
  payment_terms TEXT, -- enum: 'upfront', '50_50', 'on_publication', 'net_30', 'custom'
  payment_terms_custom TEXT, -- free text when payment_terms = 'custom'
  invoice_reference TEXT,
  invoice_date DATE,
  payment_due_date DATE,
  payment_received_date DATE,
  budget_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(card_id) -- one commercial record per card
);

CREATE INDEX idx_authority_commercial_org ON authority_commercial(organisation_id);
CREATE INDEX idx_authority_commercial_card ON authority_commercial(card_id);
CREATE INDEX idx_authority_commercial_status ON authority_commercial(payment_status);
```

---

## Table: `authority_contacts`

PR-specific media contacts.

```sql
CREATE TABLE authority_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  outlet TEXT, -- publication / platform / event org name
  role TEXT, -- enum: 'journalist', 'editor', 'podcast_host', 'event_organiser', 'pr_agent', 'other'
  beat TEXT, -- topic area they cover (e.g. 'Technology', 'Business', 'Lifestyle')
  location TEXT,
  linkedin_url TEXT,
  twitter_url TEXT,
  website_url TEXT,
  
  warmth TEXT DEFAULT 'cold', -- enum: 'cold', 'warm', 'hot', 'active', 'published'
  source TEXT DEFAULT 'manual', -- enum: 'manual', 'press_page_inquiry', 'email_capture', 'csv_import', 'referral'
  
  -- For duplicate detection
  email_normalised TEXT, -- lowercase trimmed email for matching
  
  notes TEXT,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_authority_contacts_org ON authority_contacts(organisation_id);
CREATE INDEX idx_authority_contacts_email ON authority_contacts(email_normalised);
CREATE INDEX idx_authority_contacts_outlet ON authority_contacts(outlet);
CREATE INDEX idx_authority_contacts_warmth ON authority_contacts(warmth);

-- Trigger to normalise email on insert/update
CREATE OR REPLACE FUNCTION normalise_authority_contact_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_normalised = LOWER(TRIM(NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_normalise_contact_email
  BEFORE INSERT OR UPDATE ON authority_contacts
  FOR EACH ROW EXECUTE FUNCTION normalise_authority_contact_email();
```

---

## Table: `authority_correspondence`

Email threads, call notes, meeting notes linked to pipeline cards.

```sql
CREATE TABLE authority_correspondence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES authority_pipeline_cards(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES authority_contacts(id) ON DELETE SET NULL,
  
  type TEXT NOT NULL, -- enum: 'email', 'phone_call', 'meeting', 'note', 'other'
  direction TEXT, -- 'inbound', 'outbound', NULL for notes
  
  -- Email specific
  email_subject TEXT,
  email_from TEXT,
  email_to TEXT,
  email_cc TEXT,
  email_bcc TEXT,
  email_body_text TEXT,
  email_body_html TEXT,
  email_message_id TEXT, -- for threading
  email_in_reply_to TEXT, -- for threading
  email_thread_id TEXT, -- grouped thread identifier
  
  -- General
  summary TEXT, -- for calls/meetings: summary text; for emails: can be NULL
  content TEXT, -- main content body
  occurred_at TIMESTAMPTZ NOT NULL, -- when the interaction happened
  duration_minutes INTEGER, -- for calls/meetings
  
  -- Attachments handled via authority_assets with correspondence_id reference
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_authority_correspondence_card ON authority_correspondence(card_id);
CREATE INDEX idx_authority_correspondence_org ON authority_correspondence(organisation_id);
CREATE INDEX idx_authority_correspondence_thread ON authority_correspondence(email_thread_id);
CREATE INDEX idx_authority_correspondence_occurred ON authority_correspondence(occurred_at);
```

---

## Table: `authority_assets`

Clippings, screenshots, PDFs, publication logos, press kit downloads, and file attachments.

```sql
CREATE TABLE authority_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  
  -- Polymorphic association: an asset can belong to a card, correspondence, press release, or press kit
  card_id UUID REFERENCES authority_pipeline_cards(id) ON DELETE CASCADE,
  correspondence_id UUID REFERENCES authority_correspondence(id) ON DELETE CASCADE,
  press_release_id UUID REFERENCES authority_press_releases(id) ON DELETE CASCADE,
  press_kit_id UUID REFERENCES authority_press_kit(id) ON DELETE CASCADE,
  
  asset_type TEXT NOT NULL, -- enum: 'clipping_screenshot', 'clipping_pdf', 'clipping_url', 'publication_logo', 'headshot', 'product_image', 'brand_logo', 'document', 'attachment', 'other'
  
  file_name TEXT,
  file_url TEXT NOT NULL, -- Supabase Storage URL
  file_size INTEGER, -- bytes
  mime_type TEXT,
  
  -- Metadata
  title TEXT, -- display name
  description TEXT,
  alt_text TEXT, -- for images
  
  -- For publication logos: link to outlet name for auto-association
  outlet_name TEXT, -- when asset_type = 'publication_logo', associates with this outlet
  
  -- Public visibility
  is_public BOOLEAN DEFAULT false, -- show on public newsroom page
  public_display_order INTEGER, -- ordering on public page
  
  -- Key quotes (for clippings)
  key_quotes JSONB, -- array of {quote: string, attribution: string}
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_authority_assets_org ON authority_assets(organisation_id);
CREATE INDEX idx_authority_assets_card ON authority_assets(card_id);
CREATE INDEX idx_authority_assets_type ON authority_assets(asset_type);
CREATE INDEX idx_authority_assets_public ON authority_assets(is_public) WHERE is_public = true;
CREATE INDEX idx_authority_assets_outlet ON authority_assets(outlet_name) WHERE asset_type = 'publication_logo';
```

---

## Table: `authority_press_releases`

Press release content managed within SkaleFlow.

```sql
CREATE TABLE authority_press_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  subtitle TEXT,
  template_type TEXT, -- enum: 'product_launch', 'milestone', 'partnership', 'award', 'event', 'executive_appointment', 'crisis_response'
  
  -- Content
  headline TEXT NOT NULL,
  subheadline TEXT,
  dateline TEXT, -- e.g. "Nelspruit, South Africa — February 14, 2026"
  body_content TEXT NOT NULL, -- rich text / HTML
  quotes JSONB, -- array of {quote: string, attribution: string, title: string}
  boilerplate TEXT, -- auto-populated from press kit, editable
  contact_info TEXT, -- PR contact details for the release
  
  -- Status
  status TEXT NOT NULL DEFAULT 'draft', -- enum: 'draft', 'in_review', 'published', 'archived'
  published_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  
  -- Public newsroom
  is_public BOOLEAN DEFAULT false, -- display on public press page
  public_excerpt TEXT, -- short excerpt for press page card
  slug TEXT, -- URL-friendly slug for direct linking
  
  -- Link to pipeline card (optional — a press release may exist independently)
  card_id UUID REFERENCES authority_pipeline_cards(id) ON DELETE SET NULL,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organisation_id, slug)
);

CREATE INDEX idx_authority_press_releases_org ON authority_press_releases(organisation_id);
CREATE INDEX idx_authority_press_releases_status ON authority_press_releases(status);
CREATE INDEX idx_authority_press_releases_public ON authority_press_releases(is_public) WHERE is_public = true;
```

---

## Table: `authority_story_angles`

Pre-built story angles for the press kit and pipeline use.

```sql
CREATE TABLE authority_story_angles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT NOT NULL, -- 2-3 sentence pitch description
  category TEXT, -- PR activity category this angle targets
  target_audience TEXT, -- who this angle appeals to
  suggested_outlets TEXT, -- comma-separated or free text list of target publications
  
  is_active BOOLEAN DEFAULT true,
  is_ai_generated BOOLEAN DEFAULT false, -- track if AI suggested this
  display_order INTEGER DEFAULT 0,
  
  -- Track usage
  times_used INTEGER DEFAULT 0, -- incremented when selected on a pipeline card
  times_successful INTEGER DEFAULT 0, -- incremented when linked card reaches Published
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_authority_story_angles_org ON authority_story_angles(organisation_id);
CREATE INDEX idx_authority_story_angles_active ON authority_story_angles(is_active) WHERE is_active = true;
```

---

## Table: `authority_press_kit`

Press kit configuration per organisation. One record per org.

```sql
CREATE TABLE authority_press_kit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  
  -- Content sections (all optional, built progressively)
  brand_overview TEXT, -- company overview paragraph
  boilerplate TEXT, -- standard 2-3 sentence description
  founder_bio_short TEXT, -- 150 words
  founder_bio_long TEXT, -- 400 words
  
  -- Fact sheet
  fact_sheet JSONB, -- {founding_date, milestones: [], team_size, markets, awards: [], key_stats: []}
  
  -- Speaking topics
  speaking_topics JSONB, -- array of {title: string, description: string}
  
  -- Social media stats (manually updated or auto-synced)
  social_stats JSONB, -- {linkedin: {url, followers}, twitter: {url, followers}, instagram: {url, followers}, ...}
  
  -- Brand guidelines summary
  brand_colors JSONB, -- array of {name, hex}
  brand_fonts JSONB, -- array of {name, usage}
  logo_usage_notes TEXT,
  
  -- Public page configuration
  public_page_enabled BOOLEAN DEFAULT false,
  public_page_slug TEXT, -- the [org-slug] in skaleflow.app/press/[org-slug]
  hero_tagline TEXT, -- one-liner shown on press page hero
  
  -- Setup completion tracking
  setup_completed BOOLEAN DEFAULT false,
  setup_completed_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organisation_id),
  UNIQUE(public_page_slug)
);
```

---

## Table: `authority_quests`

Quest definitions and user progress.

```sql
CREATE TABLE authority_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  
  quest_name TEXT NOT NULL,
  quest_slug TEXT NOT NULL, -- e.g. 'foundation', 'media_debut', 'growing_voice'
  tier INTEGER NOT NULL, -- 1-5
  description TEXT,
  
  -- Requirements stored as JSONB for flexibility
  -- Each requirement: {type, target, current, completed}
  -- Types: 'press_kit_complete', 'press_release_published', 'contacts_added', 'pitch_sent',
  --        'article_published', 'podcast_appearance', 'amplification_campaign', 'speaking_engagement',
  --        'magazine_feature', 'points_earned', 'published_warmth_contacts'
  requirements JSONB NOT NULL, -- array of requirement objects
  
  -- Progress
  status TEXT DEFAULT 'active', -- enum: 'locked', 'active', 'completed'
  progress_percentage NUMERIC(5,2) DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  -- Target date (optional, set by user)
  target_completion_date DATE,
  
  -- Points threshold for this tier
  points_threshold_min INTEGER NOT NULL,
  points_threshold_max INTEGER,
  
  -- Is this a system quest or custom
  is_system BOOLEAN DEFAULT true,
  is_current BOOLEAN DEFAULT false, -- the currently active quest
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_authority_quests_org ON authority_quests(organisation_id);
CREATE INDEX idx_authority_quests_status ON authority_quests(status);
CREATE INDEX idx_authority_quests_current ON authority_quests(is_current) WHERE is_current = true;
```

### Seed Data (System Quests)

```json
[
  {
    "quest_name": "Foundation",
    "quest_slug": "foundation",
    "tier": 1,
    "description": "Build the foundation of your brand authority",
    "points_threshold_min": 0,
    "points_threshold_max": 50,
    "requirements": [
      {"type": "press_kit_complete", "target": 1, "current": 0, "completed": false, "label": "Complete your press kit"},
      {"type": "press_release_published", "target": 1, "current": 0, "completed": false, "label": "Write your first press release"},
      {"type": "contacts_added", "target": 3, "current": 0, "completed": false, "label": "Add 3 media contacts"},
      {"type": "pitch_sent", "target": 1, "current": 0, "completed": false, "label": "Send your first pitch"}
    ]
  },
  {
    "quest_name": "Media Debut",
    "quest_slug": "media_debut",
    "tier": 2,
    "description": "Get your first media placements and start building visibility",
    "points_threshold_min": 50,
    "points_threshold_max": 150,
    "requirements": [
      {"type": "article_published", "target": 1, "current": 0, "completed": false, "label": "Get 1 article published"},
      {"type": "podcast_appearance", "target": 1, "current": 0, "completed": false, "label": "Complete 1 podcast appearance"},
      {"type": "amplification_campaign", "target": 1, "current": 0, "completed": false, "label": "Run 1 amplification campaign"},
      {"type": "contacts_added", "target": 5, "current": 0, "completed": false, "label": "Reach 5 media contacts"},
      {"type": "points_earned", "target": 50, "current": 0, "completed": false, "label": "Earn 50+ authority points"}
    ]
  },
  {
    "quest_name": "Growing Voice",
    "quest_slug": "growing_voice",
    "tier": 3,
    "description": "Establish a consistent PR presence and grow your media relationships",
    "points_threshold_min": 150,
    "points_threshold_max": 400,
    "requirements": [
      {"type": "article_published", "target": 5, "current": 0, "completed": false, "label": "Get 5+ articles published"},
      {"type": "podcast_appearance", "target": 2, "current": 0, "completed": false, "label": "Complete 2+ podcast appearances"},
      {"type": "speaking_engagement", "target": 1, "current": 0, "completed": false, "label": "Secure 1 speaking engagement"},
      {"type": "points_earned", "target": 150, "current": 0, "completed": false, "label": "Earn 150+ authority points"}
    ]
  },
  {
    "quest_name": "Industry Presence",
    "quest_slug": "industry_presence",
    "tier": 4,
    "description": "Become a recognised name in your industry with major media placements",
    "points_threshold_min": 400,
    "points_threshold_max": 800,
    "requirements": [
      {"type": "magazine_feature", "target": 1, "current": 0, "completed": false, "label": "Land a magazine feature"},
      {"type": "article_published", "target": 10, "current": 0, "completed": false, "label": "Reach 10+ total placements"},
      {"type": "published_warmth_contacts", "target": 3, "current": 0, "completed": false, "label": "Build 3+ 'Published' relationships"},
      {"type": "points_earned", "target": 400, "current": 0, "completed": false, "label": "Earn 400+ authority points"}
    ]
  },
  {
    "quest_name": "Category Authority",
    "quest_slug": "category_authority",
    "tier": 5,
    "description": "You are THE authority in your space — media comes to you",
    "points_threshold_min": 800,
    "points_threshold_max": null,
    "requirements": [
      {"type": "article_published", "target": 20, "current": 0, "completed": false, "label": "Reach 20+ total placements"},
      {"type": "speaking_engagement", "target": 3, "current": 0, "completed": false, "label": "Complete 3+ speaking engagements"},
      {"type": "points_earned", "target": 800, "current": 0, "completed": false, "label": "Earn 800+ authority points"}
    ]
  }
]
```

---

## Table: `authority_scores`

Point transactions for Authority Score tracking.

```sql
CREATE TABLE authority_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES authority_pipeline_cards(id) ON DELETE CASCADE,
  
  -- Scoring breakdown
  base_points NUMERIC(10,2) NOT NULL, -- from activity category
  reach_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0, -- local=1, regional=1.5, national=2.5, international=3.5
  engagement_multiplier NUMERIC(4,2) NOT NULL DEFAULT 1.0, -- earned=1, paid=0.65
  amplification_bonus NUMERIC(10,2) DEFAULT 0, -- +25% if amplified
  round_bonus NUMERIC(10,2) DEFAULT 0, -- +15% if round completed
  consistency_bonus NUMERIC(10,2) DEFAULT 0, -- +10% for monthly consistency
  
  -- Calculated total
  total_points NUMERIC(10,2) NOT NULL, -- final calculated score
  
  -- Context
  activity_category TEXT NOT NULL,
  reach_tier TEXT NOT NULL,
  engagement_type TEXT NOT NULL,
  description TEXT, -- human-readable: "Magazine feature in Business Day (National, Earned)"
  
  scored_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_authority_scores_org ON authority_scores(organisation_id);
CREATE INDEX idx_authority_scores_card ON authority_scores(card_id);
CREATE INDEX idx_authority_scores_scored ON authority_scores(scored_at);
```

---

## Table: `authority_calendar_events`

Deadlines, embargoes, follow-ups, and scheduled events.

```sql
CREATE TABLE authority_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  card_id UUID REFERENCES authority_pipeline_cards(id) ON DELETE CASCADE,
  
  event_type TEXT NOT NULL, -- enum: 'submission_deadline', 'publication_date', 'embargo_lift', 'follow_up', 'speaking_event', 'amplification_post', 'quest_deadline', 'custom'
  title TEXT NOT NULL,
  description TEXT,
  
  event_date DATE NOT NULL,
  event_time TIME, -- optional specific time
  
  -- Reminder configuration
  reminder_sent BOOLEAN DEFAULT false,
  reminder_days_before INTEGER DEFAULT 1, -- send reminder X days before
  
  -- Status
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  -- For recurring events
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT, -- e.g. 'weekly', 'monthly'
  
  -- Visual
  color TEXT, -- hex colour for calendar display, auto-set from pipeline stage
  
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_authority_calendar_org ON authority_calendar_events(organisation_id);
CREATE INDEX idx_authority_calendar_date ON authority_calendar_events(event_date);
CREATE INDEX idx_authority_calendar_card ON authority_calendar_events(card_id);
CREATE INDEX idx_authority_calendar_type ON authority_calendar_events(event_type);
```

---

## Table: `authority_notifications`

Notification queue for the Authority Engine.

```sql
CREATE TABLE authority_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id), -- recipient
  
  notification_type TEXT NOT NULL, -- enum: 'follow_up_due', 'publication_approaching', 'embargo_lifting', 'inbound_inquiry', 'deadline_approaching', 'published_prompt', 'quest_milestone', 'payment_overdue', 'inactivity_warning', 'seasonal_prompt'
  
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Reference
  card_id UUID REFERENCES authority_pipeline_cards(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES authority_contacts(id) ON DELETE SET NULL,
  quest_id UUID REFERENCES authority_quests(id) ON DELETE CASCADE,
  
  -- Delivery
  channel TEXT NOT NULL DEFAULT 'in_app', -- enum: 'in_app', 'email', 'push'
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  is_sent BOOLEAN DEFAULT false,
  sent_at TIMESTAMPTZ,
  
  -- Scheduling
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT now(), -- when to deliver
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_authority_notifications_user ON authority_notifications(user_id);
CREATE INDEX idx_authority_notifications_org ON authority_notifications(organisation_id);
CREATE INDEX idx_authority_notifications_read ON authority_notifications(is_read) WHERE is_read = false;
CREATE INDEX idx_authority_notifications_scheduled ON authority_notifications(scheduled_for);
```

---

## Table: `authority_card_checklist`

Auto-generated and custom checklists for pipeline cards (primarily at Content Prep stage).

```sql
CREATE TABLE authority_card_checklist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES authority_pipeline_cards(id) ON DELETE CASCADE,
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  
  item_text TEXT NOT NULL, -- e.g. "Headshot sent", "Bio sent"
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES auth.users(id),
  
  is_system BOOLEAN DEFAULT true, -- system-generated vs user-added
  display_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_authority_checklist_card ON authority_card_checklist(card_id);
```

### Default Checklists by Category

```json
{
  "media_placement": [
    "Headshot sent to publication",
    "Professional bio sent",
    "Company fact sheet sent",
    "Product/brand images sent",
    "Brand guidelines sent",
    "Interview questions reviewed",
    "Draft reviewed and approved"
  ],
  "podcast_appearance": [
    "Bio sent to host",
    "Headshot sent",
    "Talking points prepared",
    "Tech check completed",
    "Episode details confirmed",
    "Social handles shared for tagging"
  ],
  "press_release": [
    "Press release drafted",
    "Quotes approved by stakeholders",
    "Supporting images prepared",
    "Distribution list confirmed",
    "Boilerplate verified",
    "Contact information confirmed"
  ],
  "magazine_feature": [
    "Headshot sent (high-resolution)",
    "Bio sent (long version)",
    "Fact sheet sent",
    "Product/lifestyle images sent",
    "Brand guidelines sent",
    "Interview completed",
    "Draft reviewed and approved",
    "Image usage rights confirmed"
  ],
  "live_event": [
    "Speaker one-sheet sent",
    "Presentation slides prepared",
    "AV requirements confirmed",
    "Travel/accommodation arranged",
    "Social media event details confirmed",
    "Bio and headshot sent to organisers"
  ],
  "tv_video": [
    "Talking points prepared",
    "Wardrobe/appearance planned",
    "Location/studio confirmed",
    "Brand assets sent to producer",
    "Release/consent forms signed"
  ],
  "award_recognition": [
    "Application/nomination submitted",
    "Supporting materials sent",
    "Case studies prepared",
    "Testimonials gathered",
    "Entry fee paid (if applicable)"
  ],
  "thought_leadership": [
    "Article/op-ed drafted",
    "Research/data verified",
    "Draft reviewed",
    "Author bio confirmed",
    "Headshot sent"
  ]
}
```

---

## Table: `authority_email_config`

Email integration configuration per organisation.

```sql
CREATE TABLE authority_email_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  
  -- BCC method
  bcc_address TEXT NOT NULL, -- pr-[org-id]@inbound.skaleflow.app
  bcc_enabled BOOLEAN DEFAULT true,
  
  -- Gmail OAuth (Phase 2)
  gmail_connected BOOLEAN DEFAULT false,
  gmail_access_token TEXT, -- encrypted
  gmail_refresh_token TEXT, -- encrypted
  gmail_token_expiry TIMESTAMPTZ,
  gmail_email TEXT, -- connected Gmail address
  gmail_sync_enabled BOOLEAN DEFAULT false,
  gmail_last_sync TIMESTAMPTZ,
  
  -- Outlook (Phase 3)
  outlook_connected BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(organisation_id),
  UNIQUE(bcc_address)
);
```

---

## Table: `authority_rounds`

Tracks round (activity bundle) definitions and completion.

```sql
CREATE TABLE authority_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  
  round_name TEXT NOT NULL,
  round_number INTEGER NOT NULL, -- sequential round counter
  
  -- Requirements (which activities must be completed)
  requirements JSONB NOT NULL, -- array of {category, count, completed_count}
  -- Default: [{category: 'press_release', count: 1}, {category: 'podcast_appearance', count: 1}, {category: 'media_placement', count: 1}, {category: 'magazine_feature', count: 1}]
  
  -- Linked pipeline cards that count toward this round
  linked_card_ids JSONB DEFAULT '[]', -- array of card UUIDs
  
  -- Status
  status TEXT DEFAULT 'active', -- enum: 'active', 'completed', 'expired'
  started_at TIMESTAMPTZ DEFAULT now(),
  target_completion_date DATE, -- default: started_at + 60 days
  completed_at TIMESTAMPTZ,
  
  -- Bonus
  bonus_percentage NUMERIC(5,2) DEFAULT 15.0, -- round completion bonus %
  bonus_applied BOOLEAN DEFAULT false,
  
  is_system BOOLEAN DEFAULT true, -- system template vs custom
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_authority_rounds_org ON authority_rounds(organisation_id);
CREATE INDEX idx_authority_rounds_status ON authority_rounds(status);
```

---

## Table: `authority_press_page_inquiries`

Raw inquiry submissions from the public press page (before processing into contacts/cards).

```sql
CREATE TABLE authority_press_page_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID NOT NULL REFERENCES organisations(id) ON DELETE CASCADE,
  
  -- Submitted by journalist
  journalist_name TEXT NOT NULL,
  journalist_outlet TEXT NOT NULL,
  journalist_email TEXT NOT NULL,
  journalist_phone TEXT,
  topic_of_interest TEXT NOT NULL,
  preferred_format TEXT, -- 'article', 'podcast', 'video_interview', 'written_qa', 'other'
  deadline DATE,
  additional_notes TEXT,
  
  -- Selected story angle (if they clicked "Pitch Me About This")
  story_angle_id UUID REFERENCES authority_story_angles(id) ON DELETE SET NULL,
  
  -- Processing status
  is_processed BOOLEAN DEFAULT false, -- has this been converted to a contact + pipeline card?
  processed_at TIMESTAMPTZ,
  contact_id UUID REFERENCES authority_contacts(id), -- created contact
  card_id UUID REFERENCES authority_pipeline_cards(id), -- created pipeline card
  
  -- Spam/abuse protection
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_authority_inquiries_org ON authority_press_page_inquiries(organisation_id);
CREATE INDEX idx_authority_inquiries_processed ON authority_press_page_inquiries(is_processed) WHERE is_processed = false;
```

---

## Views

### `authority_pipeline_summary`

Aggregated pipeline metrics for the dashboard.

```sql
CREATE VIEW authority_pipeline_summary AS
SELECT
  c.organisation_id,
  s.slug AS stage,
  COUNT(c.id) AS card_count,
  COALESCE(SUM(com.deal_value) FILTER (WHERE com.engagement_type IN ('paid', 'sponsored')), 0) AS total_value,
  COALESCE(SUM(com.deal_value) FILTER (WHERE com.payment_status = 'paid'), 0) AS total_paid,
  COALESCE(SUM(com.deal_value) FILTER (WHERE com.payment_status IN ('not_invoiced', 'invoiced')), 0) AS total_pending,
  COALESCE(SUM(com.deal_value) FILTER (WHERE com.payment_status = 'overdue'), 0) AS total_overdue
FROM authority_pipeline_cards c
JOIN authority_pipeline_stages s ON c.stage_id = s.id
LEFT JOIN authority_commercial com ON c.id = com.card_id
GROUP BY c.organisation_id, s.slug;
```

### `authority_score_summary`

Current authority score and tier per organisation.

```sql
CREATE VIEW authority_score_summary AS
SELECT
  organisation_id,
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
GROUP BY organisation_id;
```

### `authority_contact_with_stats`

Contact records enriched with relationship stats.

```sql
CREATE VIEW authority_contact_with_stats AS
SELECT
  c.*,
  COUNT(DISTINCT pc.id) AS total_opportunities,
  COUNT(DISTINCT pc.id) FILTER (WHERE ps.slug = 'published' OR ps.slug = 'amplified' OR ps.slug = 'archived') AS published_count,
  COUNT(DISTINCT cor.id) AS total_interactions,
  MAX(cor.occurred_at) AS last_interaction_at
FROM authority_contacts c
LEFT JOIN authority_pipeline_cards pc ON c.id = pc.contact_id
LEFT JOIN authority_pipeline_stages ps ON pc.stage_id = ps.id
LEFT JOIN authority_correspondence cor ON pc.id = cor.contact_id
GROUP BY c.id;
```

---

## RLS Policies

Apply to all Authority Engine tables. Example pattern:

```sql
-- Enable RLS
ALTER TABLE authority_pipeline_cards ENABLE ROW LEVEL SECURITY;

-- Select policy: users can only see cards in their organisation
CREATE POLICY "Users can view own org authority cards"
ON authority_pipeline_cards FOR SELECT
USING (organisation_id IN (
  SELECT organisation_id FROM organisation_members
  WHERE user_id = auth.uid()
));

-- Insert policy: users can only create cards in their organisation
CREATE POLICY "Users can create authority cards in own org"
ON authority_pipeline_cards FOR INSERT
WITH CHECK (organisation_id IN (
  SELECT organisation_id FROM organisation_members
  WHERE user_id = auth.uid()
));

-- Update policy
CREATE POLICY "Users can update own org authority cards"
ON authority_pipeline_cards FOR UPDATE
USING (organisation_id IN (
  SELECT organisation_id FROM organisation_members
  WHERE user_id = auth.uid()
));

-- Delete policy (restrict to owner/admin roles)
CREATE POLICY "Admins can delete authority cards"
ON authority_pipeline_cards FOR DELETE
USING (organisation_id IN (
  SELECT organisation_id FROM organisation_members
  WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
));
```

Apply the same pattern to all `authority_*` tables, adjusting delete policies based on sensitivity.

### Public Press Page Exception

For the public newsroom, create a public select policy on relevant tables:

```sql
-- Public can view published press releases
CREATE POLICY "Public can view published press releases"
ON authority_press_releases FOR SELECT
USING (is_public = true AND status = 'published');

-- Public can view public assets
CREATE POLICY "Public can view public assets"
ON authority_assets FOR SELECT
USING (is_public = true);

-- Public can view press kit (if page enabled)
CREATE POLICY "Public can view enabled press kits"
ON authority_press_kit FOR SELECT
USING (public_page_enabled = true);

-- Public can view active story angles
CREATE POLICY "Public can view active story angles"
ON authority_story_angles FOR SELECT
USING (is_active = true);

-- Public can insert press page inquiries
CREATE POLICY "Public can submit press inquiries"
ON authority_press_page_inquiries FOR INSERT
WITH CHECK (true); -- rate limiting handled at API layer
```

---

## Entity Relationship Summary

```
authority_press_kit (1) ←→ (1) organisation
authority_press_kit (1) ←→ (many) authority_assets

authority_pipeline_stages (many) ←→ (1) organisation
authority_pipeline_cards (many) → (1) authority_pipeline_stages
authority_pipeline_cards (many) → (1) authority_contacts
authority_pipeline_cards (many) → (1) authority_story_angles
authority_pipeline_cards (1) ←→ (1) authority_commercial
authority_pipeline_cards (1) ←→ (many) authority_correspondence
authority_pipeline_cards (1) ←→ (many) authority_assets
authority_pipeline_cards (1) ←→ (many) authority_card_checklist
authority_pipeline_cards (1) ←→ (many) authority_calendar_events
authority_pipeline_cards (1) ←→ (1) authority_scores
authority_pipeline_cards (1) ←→ (many) authority_notifications

authority_contacts (1) ←→ (many) authority_pipeline_cards
authority_contacts (1) ←→ (many) authority_correspondence

authority_press_releases (many) → (1) authority_pipeline_cards (optional)
authority_press_releases (1) ←→ (many) authority_assets

authority_quests (many) ←→ (1) organisation
authority_rounds (many) ←→ (1) organisation
authority_scores (many) → (1) authority_pipeline_cards

authority_email_config (1) ←→ (1) organisation

authority_press_page_inquiries (many) → (1) authority_contacts (after processing)
authority_press_page_inquiries (many) → (1) authority_pipeline_cards (after processing)
```

---

## Migration Order

Execute migrations in this order to respect foreign key dependencies:

1. `authority_pipeline_stages` (no FK dependencies)
2. `authority_contacts` (no FK dependencies)
3. `authority_story_angles` (no FK dependencies)
4. `authority_press_kit` (no FK dependencies)
5. `authority_pipeline_cards` (depends on stages, contacts, story_angles)
6. `authority_commercial` (depends on pipeline_cards)
7. `authority_correspondence` (depends on pipeline_cards, contacts)
8. `authority_press_releases` (depends on pipeline_cards)
9. `authority_assets` (depends on pipeline_cards, correspondence, press_releases, press_kit)
10. `authority_quests` (no FK dependencies beyond organisation)
11. `authority_scores` (depends on pipeline_cards)
12. `authority_calendar_events` (depends on pipeline_cards)
13. `authority_notifications` (depends on pipeline_cards, contacts, quests)
14. `authority_card_checklist` (depends on pipeline_cards)
15. `authority_email_config` (no FK dependencies beyond organisation)
16. `authority_rounds` (no FK dependencies beyond organisation)
17. `authority_press_page_inquiries` (depends on story_angles, contacts, pipeline_cards)
18. Create views (after all tables)
19. Apply RLS policies (after all tables)
20. Seed `authority_pipeline_stages` with default stages
21. Seed `authority_quests` with system quest definitions
