-- Migration 018: Notifications table + revision_requested content status
-- Adds the notifications system and revision_requested workflow state

-- 1. Add revision_requested to content_items status constraint
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_status_check;
ALTER TABLE content_items ADD CONSTRAINT content_items_status_check
  CHECK (status IN ('idea','scripted','pending_review','revision_requested',
    'approved','rejected','filming','filmed','designing','designed',
    'editing','edited','scheduled','published','failed'));

-- 2. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Indexes
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_org ON notifications(organization_id, created_at DESC);

-- 4. RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE USING (user_id = auth.uid());

-- Service role inserts notifications (no INSERT policy for regular users)
