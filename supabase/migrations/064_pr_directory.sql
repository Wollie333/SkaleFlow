-- Migration 064: PR Directory — shared community contact directory
-- ================================================================

-- PR Directory Contacts — platform-wide shared directory
CREATE TABLE IF NOT EXISTS pr_directory_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  company TEXT,
  job_title TEXT,
  email TEXT,
  phone TEXT,
  photo_url TEXT,
  description TEXT,
  website_url TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  category TEXT NOT NULL CHECK (category IN (
    'news', 'magazine', 'radio', 'podcasts', 'live_events',
    'tv', 'digital_online', 'blogs_influencers', 'speaking_conferences', 'awards'
  )),
  industry_types TEXT[] DEFAULT '{}',
  country TEXT,
  city TEXT,
  province_state TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'under_review', 'removed')),
  flag_count INTEGER NOT NULL DEFAULT 0,
  added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  added_by_org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pr_directory_contacts_category ON pr_directory_contacts(category);
CREATE INDEX idx_pr_directory_contacts_status ON pr_directory_contacts(status);
CREATE INDEX idx_pr_directory_contacts_country ON pr_directory_contacts(country);
CREATE INDEX idx_pr_directory_contacts_added_by ON pr_directory_contacts(added_by);
CREATE INDEX idx_pr_directory_contacts_name_search ON pr_directory_contacts USING gin(to_tsvector('english', full_name));

-- Updated_at trigger
CREATE OR REPLACE TRIGGER set_pr_directory_contacts_updated_at
  BEFORE UPDATE ON pr_directory_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- PR Directory Flags — user flag reports
CREATE TABLE IF NOT EXISTS pr_directory_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES pr_directory_contacts(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN (
    'incorrect_info', 'duplicate', 'spam', 'no_longer_active', 'inappropriate', 'other'
  )),
  details TEXT,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contact_id, flagged_by)
);

-- PR Directory Saves — user bookmarks
CREATE TABLE IF NOT EXISTS pr_directory_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES pr_directory_contacts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contact_id, user_id)
);

CREATE INDEX idx_pr_directory_saves_user ON pr_directory_saves(user_id);

-- ================================================================
-- RLS Policies
-- ================================================================

ALTER TABLE pr_directory_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_directory_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE pr_directory_saves ENABLE ROW LEVEL SECURITY;

-- Contacts: any authenticated user can read active contacts
CREATE POLICY "pr_directory_contacts_select" ON pr_directory_contacts
  FOR SELECT TO authenticated USING (true);

-- Contacts: any authenticated user can insert
CREATE POLICY "pr_directory_contacts_insert" ON pr_directory_contacts
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = added_by);

-- Contacts: creator or super_admin can update
CREATE POLICY "pr_directory_contacts_update" ON pr_directory_contacts
  FOR UPDATE TO authenticated USING (
    added_by = auth.uid()
    OR EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Contacts: super_admin only can delete
CREATE POLICY "pr_directory_contacts_delete" ON pr_directory_contacts
  FOR DELETE TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'super_admin')
  );

-- Flags: user can read own flags
CREATE POLICY "pr_directory_flags_select" ON pr_directory_flags
  FOR SELECT TO authenticated USING (flagged_by = auth.uid());

-- Flags: user can insert own flags
CREATE POLICY "pr_directory_flags_insert" ON pr_directory_flags
  FOR INSERT TO authenticated WITH CHECK (flagged_by = auth.uid());

-- Saves: user can read own saves
CREATE POLICY "pr_directory_saves_select" ON pr_directory_saves
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Saves: user can insert own saves
CREATE POLICY "pr_directory_saves_insert" ON pr_directory_saves
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

-- Saves: user can delete own saves
CREATE POLICY "pr_directory_saves_delete" ON pr_directory_saves
  FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ================================================================
-- Trigger: auto-increment flag_count and set under_review at 3+
-- ================================================================

CREATE OR REPLACE FUNCTION pr_directory_on_flag_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE pr_directory_contacts
  SET flag_count = flag_count + 1,
      status = CASE
        WHEN flag_count + 1 >= 3 AND status = 'active' THEN 'under_review'
        ELSE status
      END
  WHERE id = NEW.contact_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_pr_directory_flag_insert
  AFTER INSERT ON pr_directory_flags
  FOR EACH ROW EXECUTE FUNCTION pr_directory_on_flag_insert();

-- ================================================================
-- Storage bucket for directory contact photos
-- ================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pr-directory-photos',
  'pr-directory-photos',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "pr_directory_photos_select" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'pr-directory-photos');

CREATE POLICY "pr_directory_photos_insert" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'pr-directory-photos');

CREATE POLICY "pr_directory_photos_update" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'pr-directory-photos');
