-- Migration: 050_standardised_template_sections.sql
-- Adds standardised atomic sections to content_templates.
-- Every template should have: hook_rules, body_rules, cta_rules, tone_voice, formatting_rules.
-- These replace the monolithic prompt_instructions with consistent, composable pieces.
-- prompt_instructions is auto-assembled from these sections at generation time.

-- ============================================================================
-- 1. Add new columns to content_templates
-- ============================================================================

ALTER TABLE content_templates
  ADD COLUMN IF NOT EXISTS hook_rules TEXT,
  ADD COLUMN IF NOT EXISTS body_rules TEXT,
  ADD COLUMN IF NOT EXISTS cta_rules TEXT,
  ADD COLUMN IF NOT EXISTS tone_voice TEXT,
  ADD COLUMN IF NOT EXISTS formatting_rules TEXT;

-- ============================================================================
-- 2. Add a completeness flag (computed from the atomic sections)
-- ============================================================================

-- is_standardised = true when all 5 atomic sections are populated
ALTER TABLE content_templates
  ADD COLUMN IF NOT EXISTS is_standardised BOOLEAN DEFAULT false;

-- ============================================================================
-- 3. Index for filtering standardised vs legacy templates
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_content_templates_standardised
  ON content_templates(is_standardised);

-- ============================================================================
-- 4. Comment on columns for documentation
-- ============================================================================

COMMENT ON COLUMN content_templates.hook_rules IS 'Rules for the opening hook — how to grab attention in the first 1-2 lines';
COMMENT ON COLUMN content_templates.body_rules IS 'Rules for the main body content — structure, depth, evidence, examples';
COMMENT ON COLUMN content_templates.cta_rules IS 'Rules for the closing call-to-action — what action to drive and how';
COMMENT ON COLUMN content_templates.tone_voice IS 'Writing style, personality, do''s and don''ts for this template';
COMMENT ON COLUMN content_templates.formatting_rules IS 'Word count, line breaks, platform-specific formatting, mobile readability';
COMMENT ON COLUMN content_templates.is_standardised IS 'True when all 5 atomic sections (hook, body, cta, tone, formatting) are populated';
