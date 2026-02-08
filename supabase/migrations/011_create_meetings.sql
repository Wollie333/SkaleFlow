-- Google OAuth token storage for admin users
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

-- Meeting bookings
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

-- Indexes
CREATE INDEX idx_meetings_application_id ON meetings(application_id);
CREATE INDEX idx_meetings_host_user_id ON meetings(host_user_id);
CREATE INDEX idx_meetings_booking_token ON meetings(booking_token);
CREATE INDEX idx_meetings_status ON meetings(status);

-- RLS
ALTER TABLE google_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;

-- google_integrations: only the user themselves or service role
CREATE POLICY "Users can view their own google integration"
  ON google_integrations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own google integration"
  ON google_integrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own google integration"
  ON google_integrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own google integration"
  ON google_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- meetings: admins can view all, public can read via token (handled via service client)
CREATE POLICY "Admins can view all meetings"
  ON meetings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Admins can insert meetings"
  ON meetings FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "Admins can update meetings"
  ON meetings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin'
    )
  );
