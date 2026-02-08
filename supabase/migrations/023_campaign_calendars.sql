-- Migration 023: Campaign Calendars - Schedule Conflict Index
-- Adds index for fast conflict checking when creating overlapping campaigns

-- Index for fast conflict checking: find items on same date+platform+time
CREATE INDEX IF NOT EXISTS idx_content_items_schedule_conflict
  ON content_items (organization_id, scheduled_date, scheduled_time)
  WHERE status NOT IN ('idea', 'rejected', 'archived');
