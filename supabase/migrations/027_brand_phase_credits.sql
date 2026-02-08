-- Migration 027: Add credits_used tracking to brand_conversations
-- Tracks how many credits each phase has consumed across all chat messages

ALTER TABLE brand_conversations
  ADD COLUMN IF NOT EXISTS credits_used INTEGER NOT NULL DEFAULT 0;
