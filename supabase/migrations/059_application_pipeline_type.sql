-- Migration 059: Add pipeline_type column + meetings pipeline_contact_id FK

-- Add pipeline_type to pipelines (custom vs application)
ALTER TABLE pipelines ADD COLUMN pipeline_type TEXT NOT NULL DEFAULT 'custom';

-- Make meetings.application_id nullable (was NOT NULL)
ALTER TABLE meetings ALTER COLUMN application_id DROP NOT NULL;

-- Add pipeline_contact_id FK to meetings (links meetings to pipeline contacts)
ALTER TABLE meetings ADD COLUMN pipeline_contact_id UUID REFERENCES pipeline_contacts(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_pipelines_type ON pipelines (pipeline_type);
CREATE INDEX idx_meetings_pipeline_contact ON meetings (pipeline_contact_id);
