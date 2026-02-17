-- Add Google Calendar fields to calls table
ALTER TABLE calls ADD COLUMN IF NOT EXISTS google_event_id text;
ALTER TABLE calls ADD COLUMN IF NOT EXISTS meet_link text;
