-- Catch-up migration: applies anything from 010 and 011 that hasn't been run yet.
-- Safe to run even if some parts already exist.

-- From 010: add question index to brand_phases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'brand_phases'
      AND column_name = 'current_question_index'
  ) THEN
    ALTER TABLE brand_phases ADD COLUMN current_question_index integer NOT NULL DEFAULT 0;
  END IF;
END $$;

-- From 011: google integrations + meetings
CREATE TABLE IF NOT EXISTS google_integrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  access_token text NOT NULL,
  refresh_token text NOT NULL,
  token_expires_at timestamptz NOT NULL,
  calendar_id text NOT NULL DEFAULT 'primary',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  host_user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  google_event_id text,
  meet_link text,
  scheduled_at timestamptz,
  duration_minutes integer NOT NULL DEFAULT 30,
  attendee_email text NOT NULL,
  attendee_name text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'completed', 'cancelled', 'no_show')),
  booking_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  token_expires_at timestamptz NOT NULL,
  booked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes (IF NOT EXISTS not supported for indexes, so use DO block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_meetings_application_id') THEN
    CREATE INDEX idx_meetings_application_id ON meetings(application_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_meetings_host_user_id') THEN
    CREATE INDEX idx_meetings_host_user_id ON meetings(host_user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_meetings_booking_token') THEN
    CREATE INDEX idx_meetings_booking_token ON meetings(booking_token);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_meetings_status') THEN
    CREATE INDEX idx_meetings_status ON meetings(status);
  END IF;
END $$;

-- RLS
ALTER TABLE google_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- Policies (drop first to avoid duplicates)
DROP POLICY IF EXISTS "Users can view their own google integration" ON google_integrations;
DROP POLICY IF EXISTS "Users can insert their own google integration" ON google_integrations;
DROP POLICY IF EXISTS "Users can update their own google integration" ON google_integrations;
DROP POLICY IF EXISTS "Users can delete their own google integration" ON google_integrations;
DROP POLICY IF EXISTS "Admins can view all meetings" ON meetings;
DROP POLICY IF EXISTS "Admins can insert meetings" ON meetings;
DROP POLICY IF EXISTS "Admins can update meetings" ON meetings;

CREATE POLICY "Users can view their own google integration"
  ON google_integrations FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own google integration"
  ON google_integrations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own google integration"
  ON google_integrations FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own google integration"
  ON google_integrations FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all meetings"
  ON meetings FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Admins can insert meetings"
  ON meetings FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

CREATE POLICY "Admins can update meetings"
  ON meetings FOR UPDATE USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );
