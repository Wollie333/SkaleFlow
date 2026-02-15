-- Migration 051: AI Beta — user-provided API keys
-- Allows beta testers to use their own API keys instead of platform keys

-- 1. Add ai_beta_enabled flag to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_beta_enabled BOOLEAN DEFAULT false;

-- 2. Create user_api_keys table
CREATE TABLE IF NOT EXISTS user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('anthropic', 'google', 'groq', 'openai')),
  encrypted_key TEXT NOT NULL,
  key_iv TEXT NOT NULL,
  key_hint TEXT NOT NULL DEFAULT '',
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, provider)
);

-- Index for fast lookup by user
CREATE INDEX IF NOT EXISTS idx_user_api_keys_user_id ON user_api_keys(user_id);

-- 3. RLS policies
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;

-- Users can read their own keys
CREATE POLICY "Users can view own api keys"
  ON user_api_keys FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own keys
CREATE POLICY "Users can insert own api keys"
  ON user_api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own keys
CREATE POLICY "Users can update own api keys"
  ON user_api_keys FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own keys
CREATE POLICY "Users can delete own api keys"
  ON user_api_keys FOR DELETE
  USING (auth.uid() = user_id);
