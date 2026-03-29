-- Add current_question_index to presence_phases table
-- This column tracks which question the user is currently on in each phase

ALTER TABLE presence_phases
ADD COLUMN IF NOT EXISTS current_question_index INTEGER NOT NULL DEFAULT 0;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_presence_phases_org_status
ON presence_phases(organization_id, status);
