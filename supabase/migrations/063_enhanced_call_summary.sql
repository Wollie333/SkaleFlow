-- Migration 063: Enhanced call summary — link ai_usage to calls for cost tracking
-- Add call_id to ai_usage so we can track AI costs per call

ALTER TABLE ai_usage ADD COLUMN call_id UUID REFERENCES calls(id) ON DELETE SET NULL;

CREATE INDEX idx_ai_usage_call_id ON ai_usage(call_id) WHERE call_id IS NOT NULL;
