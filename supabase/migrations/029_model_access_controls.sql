-- Migration 029: Model Access Controls
-- Allows super_admin to control which AI models are available per subscription tier and per user.

CREATE TABLE model_access_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT NOT NULL,           -- e.g. 'claude-sonnet-4-5'
  scope_type TEXT NOT NULL CHECK (scope_type IN ('tier', 'user')),
  scope_id TEXT NOT NULL,           -- tier slug OR user UUID
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(model_id, scope_type, scope_id)
);

-- RLS: only service role can read/write (admin API uses createServiceClient)
ALTER TABLE model_access_rules ENABLE ROW LEVEL SECURITY;
