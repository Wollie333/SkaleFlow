-- Migration 038: Allow global model toggles
-- Adds 'global' to the scope_type check constraint so super_admin
-- can disable models platform-wide (scope_id = 'platform').

ALTER TABLE model_access_rules DROP CONSTRAINT IF EXISTS model_access_rules_scope_type_check;
ALTER TABLE model_access_rules ADD CONSTRAINT model_access_rules_scope_type_check
  CHECK (scope_type IN ('tier', 'user', 'global'));
