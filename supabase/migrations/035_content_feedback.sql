-- Migration 035: Content Feedback table for rejection/acceptance tracking
-- Used by the Content Engine refinement loop to learn from user preferences

CREATE TABLE content_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_item_id UUID NOT NULL REFERENCES content_items(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('rejected', 'accepted', 'regenerated')),
  reason TEXT,
  tags TEXT[] DEFAULT '{}',
  generation_config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_content_feedback_org_created ON content_feedback(organization_id, created_at DESC);
CREATE INDEX idx_content_feedback_item ON content_feedback(content_item_id);

-- RLS
ALTER TABLE content_feedback ENABLE ROW LEVEL SECURITY;

-- Org members can read their org's feedback
CREATE POLICY "Org members can read feedback"
  ON content_feedback FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback"
  ON content_feedback FOR INSERT
  WITH CHECK (user_id = auth.uid());
