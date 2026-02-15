-- Add last_contacted_at to authority_contacts (used by email sync + send)
ALTER TABLE authority_contacts
  ADD COLUMN IF NOT EXISTS last_contacted_at TIMESTAMPTZ;
