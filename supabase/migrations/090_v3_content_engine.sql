-- =====================================================
-- V3 CONTENT ENGINE — Core Tables
-- Campaign → Ad Set → Post hierarchy (Meta Ads Manager model)
-- Fully idempotent — safe to re-run
-- =====================================================

-- ============================================================
-- 1. CAMPAIGNS
-- ============================================================
CREATE TABLE IF NOT EXISTS campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  objective       TEXT NOT NULL,
  objective_category TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','active','paused','completed','cancelled','archived')),
  start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date        DATE DEFAULT (CURRENT_DATE + INTERVAL '30 days'),
  total_posts_target INTEGER NOT NULL DEFAULT 0,
  sequence_position  INTEGER,
  sequence_id        UUID,
  ai_sequence_recommendation JSONB,
  created_by      UUID REFERENCES users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_org       ON campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status    ON campaigns(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_campaigns_sequence  ON campaigns(sequence_id) WHERE sequence_id IS NOT NULL;

ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaigns' AND policyname = 'campaigns_select_org') THEN
    CREATE POLICY campaigns_select_org ON campaigns FOR SELECT USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaigns' AND policyname = 'campaigns_insert_org') THEN
    CREATE POLICY campaigns_insert_org ON campaigns FOR INSERT WITH CHECK (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaigns' AND policyname = 'campaigns_update_org') THEN
    CREATE POLICY campaigns_update_org ON campaigns FOR UPDATE USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaigns' AND policyname = 'campaigns_delete_org') THEN
    CREATE POLICY campaigns_delete_org ON campaigns FOR DELETE USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ============================================================
-- 2. CAMPAIGN AD SETS
-- ============================================================
CREATE TABLE IF NOT EXISTS campaign_adsets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  channel         TEXT NOT NULL
                    CHECK (channel IN ('linkedin','facebook','instagram','tiktok','youtube','x')),
  aggressiveness  TEXT NOT NULL DEFAULT 'focused'
                    CHECK (aggressiveness IN ('focused','committed','aggressive')),
  posts_per_week  INTEGER NOT NULL DEFAULT 3,
  total_posts     INTEGER NOT NULL DEFAULT 0,
  content_type_ratio JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_type_counts JSONB NOT NULL DEFAULT '{}'::jsonb,
  format_ratio    JSONB NOT NULL DEFAULT '{}'::jsonb,
  posting_schedule JSONB NOT NULL DEFAULT '{}'::jsonb,
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','paused')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adsets_campaign ON campaign_adsets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_adsets_org      ON campaign_adsets(organization_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_adsets_campaign_channel ON campaign_adsets(campaign_id, channel);

ALTER TABLE campaign_adsets ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_adsets' AND policyname = 'adsets_select_org') THEN
    CREATE POLICY adsets_select_org ON campaign_adsets FOR SELECT USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_adsets' AND policyname = 'adsets_insert_org') THEN
    CREATE POLICY adsets_insert_org ON campaign_adsets FOR INSERT WITH CHECK (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_adsets' AND policyname = 'adsets_update_org') THEN
    CREATE POLICY adsets_update_org ON campaign_adsets FOR UPDATE USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_adsets' AND policyname = 'adsets_delete_org') THEN
    CREATE POLICY adsets_delete_org ON campaign_adsets FOR DELETE USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ============================================================
-- 3. CONTENT POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS content_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  adset_id        UUID NOT NULL REFERENCES campaign_adsets(id) ON DELETE CASCADE,
  campaign_id     UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  content_type       SMALLINT NOT NULL CHECK (content_type BETWEEN 1 AND 7),
  content_type_name  TEXT NOT NULL,
  objective          TEXT NOT NULL,
  platform           TEXT NOT NULL,
  format             TEXT NOT NULL,
  placement_type     TEXT,
  topic              TEXT,
  hook               TEXT,
  hook_variations    TEXT[],
  body               TEXT,
  cta                TEXT,
  caption            TEXT,
  hashtags           TEXT[],
  visual_brief       TEXT,
  shot_suggestions   TEXT,
  slide_content      JSONB,
  on_screen_text     JSONB,
  platform_variations JSONB,
  scheduled_date     DATE,
  scheduled_time     TIME,
  generation_week    INTEGER,
  ai_generated       BOOLEAN NOT NULL DEFAULT false,
  ai_model           TEXT,
  ai_prompt_used     TEXT,
  brand_voice_score  DECIMAL,
  brand_variables_used TEXT[],
  status             TEXT NOT NULL DEFAULT 'idea'
                       CHECK (status IN (
                         'idea','scripted','pending_review','revision_requested',
                         'approved','rejected',
                         'filming','filmed','designing','designed','editing','edited',
                         'scheduled','published','failed','archived'
                       )),
  assigned_to        UUID REFERENCES users(id),
  approved_at        TIMESTAMPTZ,
  approved_by        UUID REFERENCES users(id),
  review_comment     TEXT,
  rejection_reason   TEXT,
  target_url         TEXT,
  utm_parameters     JSONB,
  variation_group_id UUID,
  is_primary_variation BOOLEAN DEFAULT true,
  performance        JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_winner          BOOLEAN NOT NULL DEFAULT false,
  winner_category    TEXT CHECK (winner_category IN ('awareness','engagement','traffic','conversion','viral')),
  recycled_from      UUID REFERENCES content_posts(id),
  published_at       TIMESTAMPTZ,
  platform_post_id   TEXT,
  post_url           TEXT,
  media_urls         TEXT[],
  thumbnail_url      TEXT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_posts_campaign    ON content_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_posts_adset       ON content_posts(adset_id);
CREATE INDEX IF NOT EXISTS idx_posts_org         ON content_posts(organization_id);
CREATE INDEX IF NOT EXISTS idx_posts_status      ON content_posts(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_posts_winner      ON content_posts(organization_id) WHERE is_winner = true;
CREATE INDEX IF NOT EXISTS idx_posts_type        ON content_posts(content_type);
CREATE INDEX IF NOT EXISTS idx_posts_schedule    ON content_posts(organization_id, platform, scheduled_date, scheduled_time)
  WHERE status NOT IN ('idea', 'rejected', 'archived');

ALTER TABLE content_posts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_posts' AND policyname = 'posts_select_org') THEN
    CREATE POLICY posts_select_org ON content_posts FOR SELECT USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_posts' AND policyname = 'posts_insert_org') THEN
    CREATE POLICY posts_insert_org ON content_posts FOR INSERT WITH CHECK (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_posts' AND policyname = 'posts_update_org') THEN
    CREATE POLICY posts_update_org ON content_posts FOR UPDATE USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'content_posts' AND policyname = 'posts_delete_org') THEN
    CREATE POLICY posts_delete_org ON content_posts FOR DELETE USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ============================================================
-- 4. CAMPAIGN ADJUSTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS campaign_adjustments (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id         UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  adset_id            UUID REFERENCES campaign_adsets(id) ON DELETE CASCADE,
  organization_id     UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  trigger_condition   TEXT NOT NULL
                        CHECK (trigger_condition IN (
                          'underperformance','content_fatigue','format_underperformance',
                          'scheduling_gap','objective_mismatch'
                        )),
  recommendation_text TEXT NOT NULL,
  current_ratio       JSONB,
  proposed_ratio      JSONB,
  affected_post_ids   UUID[],
  status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','approved','dismissed')),
  approved_at         TIMESTAMPTZ,
  dismissed_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_adjustments_campaign ON campaign_adjustments(campaign_id);
CREATE INDEX IF NOT EXISTS idx_adjustments_pending  ON campaign_adjustments(campaign_id) WHERE status = 'pending';

ALTER TABLE campaign_adjustments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_adjustments' AND policyname = 'adjustments_select_org') THEN
    CREATE POLICY adjustments_select_org ON campaign_adjustments FOR SELECT USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'campaign_adjustments' AND policyname = 'adjustments_update_org') THEN
    CREATE POLICY adjustments_update_org ON campaign_adjustments FOR UPDATE USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ============================================================
-- 5. WINNER POOL
-- ============================================================
CREATE TABLE IF NOT EXISTS winner_pool (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id              UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  campaign_id          UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  organization_id      UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  winner_category      TEXT NOT NULL
                         CHECK (winner_category IN ('awareness','engagement','traffic','conversion','viral')),
  performance_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  hook_pattern         TEXT,
  content_type         SMALLINT NOT NULL CHECK (content_type BETWEEN 1 AND 7),
  format               TEXT NOT NULL,
  posting_time         TIME,
  posting_day          TEXT,
  flagged_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  amplified_to_paid    BOOLEAN NOT NULL DEFAULT false,
  paid_campaign_id     UUID
);

CREATE INDEX IF NOT EXISTS idx_winners_org      ON winner_pool(organization_id);
CREATE INDEX IF NOT EXISTS idx_winners_category ON winner_pool(organization_id, winner_category);
CREATE INDEX IF NOT EXISTS idx_winners_campaign ON winner_pool(campaign_id);

ALTER TABLE winner_pool ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'winner_pool' AND policyname = 'winners_select_org') THEN
    CREATE POLICY winners_select_org ON winner_pool FOR SELECT USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'winner_pool' AND policyname = 'winners_insert_org') THEN
    CREATE POLICY winners_insert_org ON winner_pool FOR INSERT WITH CHECK (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ============================================================
-- 6. BRAND INTELLIGENCE REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS brand_intelligence_reports (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id                 UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  organization_id             UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  top_pain_points             TEXT[],
  top_messaging_angles        TEXT[],
  brand_voice_recommendations TEXT,
  icp_refinement_suggestions  TEXT,
  content_type_performance    JSONB,
  format_performance          JSONB,
  next_campaign_recommendation JSONB,
  generated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_intelligence_org      ON brand_intelligence_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_intelligence_campaign ON brand_intelligence_reports(campaign_id);

ALTER TABLE brand_intelligence_reports ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'brand_intelligence_reports' AND policyname = 'reports_select_org') THEN
    CREATE POLICY reports_select_org ON brand_intelligence_reports FOR SELECT USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ============================================================
-- 7. POST ANALYTICS
-- ============================================================
CREATE TABLE IF NOT EXISTS v3_post_analytics (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id          UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  platform         TEXT NOT NULL,
  impressions      INTEGER NOT NULL DEFAULT 0,
  reach            INTEGER NOT NULL DEFAULT 0,
  likes            INTEGER NOT NULL DEFAULT 0,
  comments         INTEGER NOT NULL DEFAULT 0,
  shares           INTEGER NOT NULL DEFAULT 0,
  saves            INTEGER NOT NULL DEFAULT 0,
  clicks           INTEGER NOT NULL DEFAULT 0,
  video_views      INTEGER NOT NULL DEFAULT 0,
  engagement_rate  DECIMAL NOT NULL DEFAULT 0,
  follower_change  INTEGER NOT NULL DEFAULT 0,
  synced_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_v3_analytics_post ON v3_post_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_v3_analytics_org  ON v3_post_analytics(organization_id);

ALTER TABLE v3_post_analytics ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v3_post_analytics' AND policyname = 'v3_analytics_select_org') THEN
    CREATE POLICY v3_analytics_select_org ON v3_post_analytics FOR SELECT USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ============================================================
-- 8. V3 GENERATION BATCHES
-- ============================================================
CREATE TABLE IF NOT EXISTS v3_generation_batches (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  campaign_id            UUID REFERENCES campaigns(id) ON DELETE SET NULL,
  adset_id               UUID REFERENCES campaign_adsets(id) ON DELETE SET NULL,
  user_id                UUID NOT NULL REFERENCES users(id),
  model_id               TEXT NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending','processing','completed','failed','cancelled')),
  total_items            INTEGER NOT NULL DEFAULT 0,
  completed_items        INTEGER NOT NULL DEFAULT 0,
  failed_items           INTEGER NOT NULL DEFAULT 0,
  uniqueness_log         JSONB NOT NULL DEFAULT '[]'::jsonb,
  selected_brand_variables JSONB,
  creative_direction     TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at           TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_v3_batches_org    ON v3_generation_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_v3_batches_status ON v3_generation_batches(status) WHERE status IN ('pending','processing');

ALTER TABLE v3_generation_batches ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v3_generation_batches' AND policyname = 'v3_batches_select_org') THEN
    CREATE POLICY v3_batches_select_org ON v3_generation_batches FOR SELECT USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v3_generation_batches' AND policyname = 'v3_batches_insert_org') THEN
    CREATE POLICY v3_batches_insert_org ON v3_generation_batches FOR INSERT WITH CHECK (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v3_generation_batches' AND policyname = 'v3_batches_update_org') THEN
    CREATE POLICY v3_batches_update_org ON v3_generation_batches FOR UPDATE USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ============================================================
-- 9. V3 GENERATION QUEUE
-- ============================================================
CREATE TABLE IF NOT EXISTS v3_generation_queue (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id        UUID NOT NULL REFERENCES v3_generation_batches(id) ON DELETE CASCADE,
  post_id         UUID NOT NULL REFERENCES content_posts(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','processing','completed','failed')),
  priority        INTEGER NOT NULL DEFAULT 0,
  attempt_count   INTEGER NOT NULL DEFAULT 0,
  max_attempts    INTEGER NOT NULL DEFAULT 3,
  locked_at       TIMESTAMPTZ,
  error_message   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at    TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_v3_queue_batch   ON v3_generation_queue(batch_id);
CREATE INDEX IF NOT EXISTS idx_v3_queue_pending ON v3_generation_queue(batch_id, status) WHERE status = 'pending';

ALTER TABLE v3_generation_queue ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v3_generation_queue' AND policyname = 'v3_queue_select_org') THEN
    CREATE POLICY v3_queue_select_org ON v3_generation_queue FOR SELECT USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'v3_generation_queue' AND policyname = 'v3_queue_update_org') THEN
    CREATE POLICY v3_queue_update_org ON v3_generation_queue FOR UPDATE USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;

-- ============================================================
-- 10. ORG-LEVEL CONTENT ENGINE FIELDS
-- ============================================================
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS content_engine_status TEXT DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS brand_voice_learned JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS active_campaign_count INTEGER DEFAULT 0;

-- Add CHECK constraint only if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'organizations_content_engine_status_check'
  ) THEN
    ALTER TABLE organizations ADD CONSTRAINT organizations_content_engine_status_check
      CHECK (content_engine_status IN ('not_started','in_progress','active'));
  END IF;
END $$;
