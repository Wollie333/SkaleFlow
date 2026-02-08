-- Migration 008: Create applications pipeline tables

-- Applications table
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  business_name text NOT NULL,
  website_url text,
  team_size text NOT NULL,
  annual_revenue text NOT NULL,
  biggest_challenge text NOT NULL,
  what_tried text,
  why_applying text NOT NULL,
  pipeline_stage text NOT NULL DEFAULT 'application',
  admin_notes text,
  activated_user_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Validate pipeline_stage values
ALTER TABLE applications
  ADD CONSTRAINT applications_pipeline_stage_check
  CHECK (pipeline_stage IN ('application', 'declined', 'approved', 'booking_made', 'lost', 'won'));

-- Application activity log table
CREATE TABLE IF NOT EXISTS application_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id uuid NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  action text NOT NULL,
  from_stage text,
  to_stage text,
  description text NOT NULL,
  performed_by uuid REFERENCES users(id),
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_applications_pipeline_stage ON applications(pipeline_stage);
CREATE INDEX idx_applications_email ON applications(email);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);
CREATE INDEX idx_application_activity_application_id ON application_activity(application_id);
CREATE INDEX idx_application_activity_created_at ON application_activity(created_at DESC);

-- Updated_at trigger for applications
CREATE OR REPLACE FUNCTION update_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_applications_updated_at
  BEFORE UPDATE ON applications
  FOR EACH ROW
  EXECUTE FUNCTION update_applications_updated_at();
