-- Migration 056: Video Call & AI Sales Co-Pilot
-- Tables: offers, call_templates, calls, call_participants, call_transcripts,
--         call_ai_guidance, call_summaries, call_action_items, call_bookings,
--         booking_pages, call_brand_insights
-- Storage: call-recordings bucket

-- ============================================================
-- 1. offers — Structured offer data synced to Brand Engine
-- ============================================================
CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  tier TEXT, -- e.g. 'starter', 'growth', 'premium'
  price_display TEXT, -- e.g. 'R5,000/month'
  price_value INTEGER, -- value in cents
  currency TEXT NOT NULL DEFAULT 'ZAR',
  billing_frequency TEXT, -- 'once' | 'monthly' | 'quarterly' | 'annual'
  deliverables JSONB DEFAULT '[]',
  ideal_client_profile TEXT,
  value_propositions JSONB DEFAULT '[]',
  common_objections JSONB DEFAULT '[]',
  roi_framing TEXT,
  comparison_points JSONB DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_offers_org ON offers(organization_id);
CREATE INDEX idx_offers_active ON offers(organization_id, is_active);

ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY offers_select ON offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = offers.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY offers_insert ON offers
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = offers.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY offers_update ON offers
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = offers.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY offers_delete ON offers
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = offers.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 2. call_templates — Framework templates for call guidance
-- ============================================================
CREATE TABLE IF NOT EXISTS call_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE, -- NULL = system template
  name TEXT NOT NULL,
  description TEXT,
  call_type TEXT NOT NULL DEFAULT 'discovery'
    CHECK (call_type IN ('discovery', 'sales', 'onboarding', 'meeting', 'follow_up', 'custom')),
  is_system BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  phases JSONB NOT NULL DEFAULT '[]', -- ordered array of framework phases
  opening_script TEXT,
  closing_script TEXT,
  objection_bank JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_templates_org ON call_templates(organization_id);
CREATE INDEX idx_call_templates_system ON call_templates(is_system) WHERE is_system = true;

ALTER TABLE call_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can see system templates; org members see their own
CREATE POLICY call_templates_select ON call_templates
  FOR SELECT USING (
    is_system = true
    OR EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = call_templates.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY call_templates_insert ON call_templates
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = call_templates.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY call_templates_update ON call_templates
  FOR UPDATE USING (
    is_system = false
    AND EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = call_templates.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY call_templates_delete ON call_templates
  FOR DELETE USING (
    is_system = false
    AND EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = call_templates.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 3. calls — Core call event table
-- ============================================================
CREATE TABLE IF NOT EXISTS calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  host_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  call_type TEXT NOT NULL DEFAULT 'discovery'
    CHECK (call_type IN ('discovery', 'sales', 'onboarding', 'meeting', 'follow_up', 'custom')),
  call_status TEXT NOT NULL DEFAULT 'scheduled'
    CHECK (call_status IN ('scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show')),
  template_id UUID REFERENCES call_templates(id) ON DELETE SET NULL,
  call_objective TEXT,
  scheduled_start TIMESTAMPTZ,
  scheduled_duration_min INTEGER DEFAULT 30,
  actual_start TIMESTAMPTZ,
  actual_end TIMESTAMPTZ,
  recording_url TEXT,
  recording_consent BOOLEAN NOT NULL DEFAULT false,
  room_code TEXT NOT NULL UNIQUE,
  booking_id UUID, -- FK added after call_bookings created
  crm_contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  crm_deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  call_number INTEGER NOT NULL DEFAULT 1,
  previous_call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_calls_org ON calls(organization_id);
CREATE INDEX idx_calls_host ON calls(host_user_id);
CREATE INDEX idx_calls_status ON calls(organization_id, call_status);
CREATE INDEX idx_calls_room ON calls(room_code);
CREATE INDEX idx_calls_scheduled ON calls(scheduled_start) WHERE call_status = 'scheduled';
CREATE INDEX idx_calls_contact ON calls(crm_contact_id) WHERE crm_contact_id IS NOT NULL;
CREATE INDEX idx_calls_deal ON calls(crm_deal_id) WHERE crm_deal_id IS NOT NULL;

ALTER TABLE calls ENABLE ROW LEVEL SECURITY;

CREATE POLICY calls_select ON calls
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = calls.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY calls_insert ON calls
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = calls.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY calls_update ON calls
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = calls.organization_id
      AND user_id = auth.uid()
    )
  );

-- ============================================================
-- 4. call_participants — Everyone invited to or joining a call
-- ============================================================
CREATE TABLE IF NOT EXISTS call_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- NULL for guests
  guest_name TEXT,
  guest_email TEXT,
  role TEXT NOT NULL DEFAULT 'guest'
    CHECK (role IN ('host', 'team_member', 'guest')),
  status TEXT NOT NULL DEFAULT 'invited'
    CHECK (status IN ('invited', 'waiting', 'admitted', 'in_call', 'left', 'denied')),
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  invite_method TEXT DEFAULT 'link'
    CHECK (invite_method IN ('link', 'email', 'calendar', 'direct')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_participants_call ON call_participants(call_id);
CREATE INDEX idx_call_participants_user ON call_participants(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_call_participants_status ON call_participants(call_id, status);

ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;

-- Org members can see participants of their org's calls
CREATE POLICY call_participants_select ON call_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calls
      JOIN org_members ON org_members.organization_id = calls.organization_id
      WHERE calls.id = call_participants.call_id
      AND org_members.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

CREATE POLICY call_participants_insert ON call_participants
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM calls
      JOIN org_members ON org_members.organization_id = calls.organization_id
      WHERE calls.id = call_participants.call_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY call_participants_update ON call_participants
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM calls
      JOIN org_members ON org_members.organization_id = calls.organization_id
      WHERE calls.id = call_participants.call_id
      AND org_members.user_id = auth.uid()
    )
    OR user_id = auth.uid()
  );

-- ============================================================
-- 5. call_transcripts — Real-time transcript chunks
-- ============================================================
CREATE TABLE IF NOT EXISTS call_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  participant_id UUID NOT NULL REFERENCES call_participants(id) ON DELETE CASCADE,
  speaker_label TEXT NOT NULL,
  content TEXT NOT NULL,
  timestamp_start DOUBLE PRECISION NOT NULL DEFAULT 0,
  timestamp_end DOUBLE PRECISION,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  flag_note TEXT,
  confidence DOUBLE PRECISION DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_transcripts_call ON call_transcripts(call_id);
CREATE INDEX idx_call_transcripts_call_ts ON call_transcripts(call_id, timestamp_start);
CREATE INDEX idx_call_transcripts_flagged ON call_transcripts(call_id) WHERE is_flagged = true;

ALTER TABLE call_transcripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY call_transcripts_select ON call_transcripts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calls
      JOIN org_members ON org_members.organization_id = calls.organization_id
      WHERE calls.id = call_transcripts.call_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY call_transcripts_insert ON call_transcripts
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM calls
      JOIN org_members ON org_members.organization_id = calls.organization_id
      WHERE calls.id = call_transcripts.call_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY call_transcripts_update ON call_transcripts
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM calls
      JOIN org_members ON org_members.organization_id = calls.organization_id
      WHERE calls.id = call_transcripts.call_id
      AND org_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- 6. call_ai_guidance — AI guidance items
-- ============================================================
CREATE TABLE IF NOT EXISTS call_ai_guidance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  guidance_type TEXT NOT NULL DEFAULT 'general'
    CHECK (guidance_type IN ('question', 'objection_response', 'offer_trigger', 'sentiment_alert', 'phase_transition', 'closing', 'opening', 'general')),
  content TEXT NOT NULL,
  framework_phase TEXT,
  framework_step TEXT,
  triggered_by_transcript_id UUID REFERENCES call_transcripts(id) ON DELETE SET NULL,
  was_used BOOLEAN NOT NULL DEFAULT false,
  was_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_ai_guidance_call ON call_ai_guidance(call_id);
CREATE INDEX idx_call_ai_guidance_type ON call_ai_guidance(call_id, guidance_type);

ALTER TABLE call_ai_guidance ENABLE ROW LEVEL SECURITY;

CREATE POLICY call_ai_guidance_select ON call_ai_guidance
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calls
      JOIN org_members ON org_members.organization_id = calls.organization_id
      WHERE calls.id = call_ai_guidance.call_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY call_ai_guidance_insert ON call_ai_guidance
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM calls
      JOIN org_members ON org_members.organization_id = calls.organization_id
      WHERE calls.id = call_ai_guidance.call_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY call_ai_guidance_update ON call_ai_guidance
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM calls
      JOIN org_members ON org_members.organization_id = calls.organization_id
      WHERE calls.id = call_ai_guidance.call_id
      AND org_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- 7. call_summaries — Post-call AI summaries (one per call)
-- ============================================================
CREATE TABLE IF NOT EXISTS call_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL UNIQUE REFERENCES calls(id) ON DELETE CASCADE,
  summary_text TEXT,
  key_points JSONB DEFAULT '[]',
  decisions_made JSONB DEFAULT '[]',
  objections_raised JSONB DEFAULT '[]',
  sentiment_arc JSONB DEFAULT '[]',
  next_steps JSONB DEFAULT '[]',
  deal_stage_recommendation TEXT,
  call_score JSONB DEFAULT '{}',
  brand_engine_insights JSONB DEFAULT '[]',
  follow_up_email_draft TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_summaries_call ON call_summaries(call_id);

ALTER TABLE call_summaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY call_summaries_select ON call_summaries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calls
      JOIN org_members ON org_members.organization_id = calls.organization_id
      WHERE calls.id = call_summaries.call_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY call_summaries_insert ON call_summaries
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM calls
      JOIN org_members ON org_members.organization_id = calls.organization_id
      WHERE calls.id = call_summaries.call_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY call_summaries_update ON call_summaries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM calls
      JOIN org_members ON org_members.organization_id = calls.organization_id
      WHERE calls.id = call_summaries.call_id
      AND org_members.user_id = auth.uid()
    )
  );

-- ============================================================
-- 8. call_action_items — Tasks extracted from calls
-- ============================================================
CREATE TABLE IF NOT EXISTS call_action_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  call_summary_id UUID REFERENCES call_summaries(id) ON DELETE SET NULL,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'completed')),
  crm_task_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_action_items_call ON call_action_items(call_id);
CREATE INDEX idx_call_action_items_assigned ON call_action_items(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_call_action_items_status ON call_action_items(status) WHERE status != 'completed';

ALTER TABLE call_action_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY call_action_items_select ON call_action_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM calls
      JOIN org_members ON org_members.organization_id = calls.organization_id
      WHERE calls.id = call_action_items.call_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY call_action_items_insert ON call_action_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM calls
      JOIN org_members ON org_members.organization_id = calls.organization_id
      WHERE calls.id = call_action_items.call_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY call_action_items_update ON call_action_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM calls
      JOIN org_members ON org_members.organization_id = calls.organization_id
      WHERE calls.id = call_action_items.call_id
      AND org_members.user_id = auth.uid()
    )
    OR assigned_to = auth.uid()
  );

-- ============================================================
-- 9. booking_pages — Public booking page configuration
-- ============================================================
CREATE TABLE IF NOT EXISTS booking_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  available_durations JSONB NOT NULL DEFAULT '[15, 30, 60]',
  available_hours JSONB DEFAULT '{"start": "09:00", "end": "17:00", "timezone": "Africa/Johannesburg", "days": [1,2,3,4,5]}',
  buffer_minutes INTEGER NOT NULL DEFAULT 15,
  max_advance_days INTEGER NOT NULL DEFAULT 30,
  intake_questions JSONB DEFAULT '[]',
  branding JSONB DEFAULT '{}', -- from Brand Engine: logo, colors, fonts
  default_call_type TEXT NOT NULL DEFAULT 'discovery'
    CHECK (default_call_type IN ('discovery', 'sales', 'onboarding', 'meeting', 'follow_up', 'custom')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  calendar_integration JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_booking_pages_org ON booking_pages(organization_id);
CREATE INDEX idx_booking_pages_slug ON booking_pages(slug);
CREATE INDEX idx_booking_pages_active ON booking_pages(organization_id, is_active);

ALTER TABLE booking_pages ENABLE ROW LEVEL SECURITY;

-- Public: anyone can see active booking pages (for the public booking page)
CREATE POLICY booking_pages_public_select ON booking_pages
  FOR SELECT USING (is_active = true);

CREATE POLICY booking_pages_insert ON booking_pages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = booking_pages.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY booking_pages_update ON booking_pages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = booking_pages.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY booking_pages_delete ON booking_pages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = booking_pages.organization_id
      AND user_id = auth.uid()
      AND role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 10. call_bookings — Prospect booking records
-- ============================================================
CREATE TABLE IF NOT EXISTS call_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  booking_page_id UUID NOT NULL REFERENCES booking_pages(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_company TEXT,
  guest_notes TEXT,
  scheduled_time TIMESTAMPTZ NOT NULL,
  duration_min INTEGER NOT NULL DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('confirmed', 'rescheduled', 'cancelled', 'completed')),
  crm_contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  call_id UUID REFERENCES calls(id) ON DELETE SET NULL,
  confirmation_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  intake_responses JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_bookings_org ON call_bookings(organization_id);
CREATE INDEX idx_call_bookings_page ON call_bookings(booking_page_id);
CREATE INDEX idx_call_bookings_scheduled ON call_bookings(scheduled_time);
CREATE INDEX idx_call_bookings_status ON call_bookings(organization_id, status);
CREATE INDEX idx_call_bookings_contact ON call_bookings(crm_contact_id) WHERE crm_contact_id IS NOT NULL;

ALTER TABLE call_bookings ENABLE ROW LEVEL SECURITY;

-- Org members can see their bookings
CREATE POLICY call_bookings_select ON call_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = call_bookings.organization_id
      AND user_id = auth.uid()
    )
  );

-- Public insert: prospects book without auth (uses service role in API)
-- No direct INSERT policy — handled by service client in API route

CREATE POLICY call_bookings_update ON call_bookings
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = call_bookings.organization_id
      AND user_id = auth.uid()
    )
  );

-- ============================================================
-- 11. call_brand_insights — Extracted prospect insights for Brand Engine
-- ============================================================
CREATE TABLE IF NOT EXISTS call_brand_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES calls(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL
    CHECK (insight_type IN ('pain_point', 'language_pattern', 'objection', 'budget_signal', 'need', 'competitor_mention', 'value_perception')),
  content TEXT NOT NULL,
  source_transcript_id UUID REFERENCES call_transcripts(id) ON DELETE SET NULL,
  brand_engine_field TEXT, -- suggested brand_outputs key
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'dismissed')),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_call_brand_insights_call ON call_brand_insights(call_id);
CREATE INDEX idx_call_brand_insights_org ON call_brand_insights(organization_id);
CREATE INDEX idx_call_brand_insights_status ON call_brand_insights(organization_id, status);

ALTER TABLE call_brand_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY call_brand_insights_select ON call_brand_insights
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = call_brand_insights.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY call_brand_insights_insert ON call_brand_insights
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = call_brand_insights.organization_id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY call_brand_insights_update ON call_brand_insights
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id = call_brand_insights.organization_id
      AND user_id = auth.uid()
    )
  );

-- ============================================================
-- Add booking_id FK to calls (now that call_bookings exists)
-- ============================================================
ALTER TABLE calls
  ADD CONSTRAINT calls_booking_id_fkey
  FOREIGN KEY (booking_id) REFERENCES call_bookings(id) ON DELETE SET NULL;

-- ============================================================
-- Storage bucket for call recordings
-- ============================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('call-recordings', 'call-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- RLS for call-recordings bucket: org members can read/write their org's recordings
CREATE POLICY call_recordings_select ON storage.objects
  FOR SELECT USING (
    bucket_id = 'call-recordings'
    AND EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
    )
  );

CREATE POLICY call_recordings_insert ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'call-recordings'
    AND EXISTS (
      SELECT 1 FROM org_members
      WHERE organization_id::text = (storage.foldername(name))[1]
      AND user_id = auth.uid()
    )
  );
