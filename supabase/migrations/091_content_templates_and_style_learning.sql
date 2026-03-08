-- ============================================================
-- 091: V3 Content Templates + User Style Learning
-- Adds v3 columns to existing content_templates table
-- Creates user_style_profiles for edit-based learning
-- ============================================================

-- 1. Add v3 columns to existing content_templates table
-- The old table has: template_key, name, category, content_type (TEXT), format_category, etc.
-- We add v3-specific columns alongside (v3 code queries these new columns directly)

ALTER TABLE content_templates
  ADD COLUMN IF NOT EXISTS v3_content_type SMALLINT CHECK (v3_content_type BETWEEN 1 AND 7),
  ADD COLUMN IF NOT EXISTS format TEXT,
  ADD COLUMN IF NOT EXISTS objective_category TEXT CHECK (objective_category IN ('growth', 'revenue', 'launch', 'brand', 'community')),
  ADD COLUMN IF NOT EXISTS hook_pattern TEXT,
  ADD COLUMN IF NOT EXISTS body_structure TEXT,
  ADD COLUMN IF NOT EXISTS cta_pattern TEXT,
  ADD COLUMN IF NOT EXISTS caption_template TEXT,
  ADD COLUMN IF NOT EXISTS hashtag_strategy TEXT,
  ADD COLUMN IF NOT EXISTS visual_brief_template TEXT,
  ADD COLUMN IF NOT EXISTS slide_structure JSONB,
  ADD COLUMN IF NOT EXISTS shot_template TEXT,
  ADD COLUMN IF NOT EXISTS screen_text_template JSONB,
  ADD COLUMN IF NOT EXISTS example_output JSONB,
  ADD COLUMN IF NOT EXISTS usage_count INTEGER NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_templates_v3_lookup ON content_templates(v3_content_type, format, objective_category)
  WHERE v3_content_type IS NOT NULL;

-- 2. User Style Profiles (one per org, learns over time)
CREATE TABLE IF NOT EXISTS user_style_profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Learned preferences
  tone_adjustments   JSONB NOT NULL DEFAULT '{}'::jsonb,
  vocabulary_adds    TEXT[] DEFAULT '{}',
  vocabulary_removes TEXT[] DEFAULT '{}',
  length_preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  structural_patterns JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- AI-generated style summary
  style_summary    TEXT,

  -- Raw edit tracking
  edit_count       INTEGER NOT NULL DEFAULT 0,
  edit_samples     JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_analysis_at TIMESTAMPTZ,

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(organization_id)
);

CREATE INDEX IF NOT EXISTS idx_style_profiles_org ON user_style_profiles(organization_id);

-- 3. Track which template was used for each post + snapshot for diff learning
ALTER TABLE content_posts
  ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES content_templates(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS original_ai_output JSONB;

-- 4. RLS for user_style_profiles
ALTER TABLE user_style_profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_style_profiles' AND policyname = 'style_select_org') THEN
    CREATE POLICY style_select_org ON user_style_profiles FOR SELECT USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_style_profiles' AND policyname = 'style_insert_org') THEN
    CREATE POLICY style_insert_org ON user_style_profiles FOR INSERT WITH CHECK (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_style_profiles' AND policyname = 'style_update_org') THEN
    CREATE POLICY style_update_org ON user_style_profiles FOR UPDATE USING (
      organization_id IN (SELECT organization_id FROM org_members WHERE user_id = auth.uid())
    );
  END IF;
END $$;
