-- Forms attached to pipelines
CREATE TABLE pipeline_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  submit_button_text TEXT NOT NULL DEFAULT 'Submit',
  success_message TEXT NOT NULL DEFAULT 'Thank you! Your submission has been received.',
  is_published BOOLEAN NOT NULL DEFAULT false,
  slug TEXT NOT NULL UNIQUE,
  settings JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Form fields (ordered)
CREATE TABLE pipeline_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES pipeline_forms(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  field_type TEXT NOT NULL,
  placeholder TEXT,
  is_required BOOLEAN NOT NULL DEFAULT false,
  options JSONB,
  mapping TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_pipeline_forms_pipeline ON pipeline_forms (pipeline_id);
CREATE INDEX idx_pipeline_forms_org ON pipeline_forms (organization_id);
CREATE INDEX idx_pipeline_forms_slug ON pipeline_forms (slug);
CREATE INDEX idx_pipeline_form_fields_form ON pipeline_form_fields (form_id);

-- RLS
ALTER TABLE pipeline_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_form_fields ENABLE ROW LEVEL SECURITY;

-- Org members can manage forms for their org
CREATE POLICY "org_members_manage_forms" ON pipeline_forms
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "org_members_manage_form_fields" ON pipeline_form_fields
  FOR ALL USING (
    form_id IN (
      SELECT id FROM pipeline_forms WHERE organization_id IN (
        SELECT organization_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

-- Public read for published forms (needed for /f/[formId] page)
CREATE POLICY "public_read_published_forms" ON pipeline_forms
  FOR SELECT USING (is_published = true);

CREATE POLICY "public_read_published_form_fields" ON pipeline_form_fields
  FOR SELECT USING (
    form_id IN (SELECT id FROM pipeline_forms WHERE is_published = true)
  );
