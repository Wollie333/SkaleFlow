-- Migration 009: Remove 'review' pipeline stage
-- Any existing applications in 'review' stage are moved to 'application'

UPDATE applications SET pipeline_stage = 'application' WHERE pipeline_stage = 'review';

ALTER TABLE applications DROP CONSTRAINT applications_pipeline_stage_check;

ALTER TABLE applications
  ADD CONSTRAINT applications_pipeline_stage_check
  CHECK (pipeline_stage IN ('application', 'declined', 'approved', 'booking_made', 'lost', 'won'));
