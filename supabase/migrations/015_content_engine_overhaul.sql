-- Migration 015: Content Engine Overhaul
-- Adds new statuses, script framework columns, nullable calendar_id, generation progress

-- 1. Update content_items status constraint to add pending_review and rejected
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_status_check;
ALTER TABLE content_items ADD CONSTRAINT content_items_status_check
  CHECK (status IN ('idea','scripted','pending_review','approved','rejected',
    'filming','filmed','designing','designed','editing','edited','scheduled','published','failed'));

-- 2. Add new columns to content_items for script frameworks and approval workflow
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS review_comment TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS generation_week INTEGER;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS script_template TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS hook_template TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS cta_template TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS filming_notes TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS context_section TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS teaching_points TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS reframe TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS problem_expansion TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS case_study TEXT;
ALTER TABLE content_items ADD COLUMN IF NOT EXISTS framework_teaching TEXT;

-- 3. Make calendar_id nullable for standalone posts
ALTER TABLE content_items ALTER COLUMN calendar_id DROP NOT NULL;

-- 4. Add generation progress to content_calendars
ALTER TABLE content_calendars ADD COLUMN IF NOT EXISTS generation_progress JSONB
  DEFAULT '{"weeks_generated":0,"total_weeks":0}'::jsonb;

-- 5. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_items_gen_week ON content_items(calendar_id, generation_week);
CREATE INDEX IF NOT EXISTS idx_content_items_pending ON content_items(organization_id, status) WHERE status='pending_review';
