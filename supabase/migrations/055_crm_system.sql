-- Migration 055: CRM System
-- Adds companies, contacts, tags, products, deals, invoices, and activity log

-- ============================================================
-- 1. crm_companies
-- ============================================================
CREATE TABLE crm_companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT,
  website TEXT,
  size TEXT, -- e.g. '1-10', '11-50', '51-200', '201-500', '500+'
  annual_revenue_cents BIGINT,
  billing_address JSONB DEFAULT '{}',
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  custom_fields JSONB DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_companies_org ON crm_companies(organization_id);

-- ============================================================
-- 2. crm_contacts
-- ============================================================
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT,
  email_normalised TEXT,
  phone TEXT,
  job_title TEXT,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  lifecycle_stage TEXT NOT NULL DEFAULT 'lead'
    CHECK (lifecycle_stage IN ('lead', 'prospect', 'opportunity', 'customer', 'churned')),
  source TEXT DEFAULT 'manual'
    CHECK (source IN ('manual', 'website', 'referral', 'social_media', 'pipeline', 'import', 'other')),
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  custom_fields JSONB DEFAULT '{}',
  last_contacted_at TIMESTAMPTZ,
  lifetime_value_cents BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_contacts_org ON crm_contacts(organization_id);
CREATE INDEX idx_crm_contacts_lifecycle ON crm_contacts(organization_id, lifecycle_stage);
CREATE INDEX idx_crm_contacts_email ON crm_contacts(email_normalised);
CREATE INDEX idx_crm_contacts_assigned ON crm_contacts(assigned_to);
CREATE INDEX idx_crm_contacts_company ON crm_contacts(company_id);

-- ============================================================
-- 3. crm_tags
-- ============================================================
CREATE TABLE crm_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, name)
);

CREATE INDEX idx_crm_tags_org ON crm_tags(organization_id);

-- ============================================================
-- 4. crm_contact_tags
-- ============================================================
CREATE TABLE crm_contact_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES crm_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(contact_id, tag_id)
);

-- ============================================================
-- 5. crm_products
-- ============================================================
CREATE TABLE crm_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  sku TEXT,
  price_cents BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  recurring BOOLEAN NOT NULL DEFAULT false,
  billing_interval TEXT NOT NULL DEFAULT 'once'
    CHECK (billing_interval IN ('once', 'monthly', 'quarterly', 'annual')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_products_org ON crm_products(organization_id);

-- ============================================================
-- 6. crm_deals
-- ============================================================
CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  pipeline_id UUID REFERENCES pipelines(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES pipeline_stages(id) ON DELETE SET NULL,
  value_cents BIGINT NOT NULL DEFAULT 0,
  probability INTEGER NOT NULL DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
  expected_close_date DATE,
  status TEXT NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'won', 'lost')),
  lost_reason TEXT,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  products JSONB DEFAULT '[]', -- line items array
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_deals_org ON crm_deals(organization_id);
CREATE INDEX idx_crm_deals_status ON crm_deals(organization_id, status);
CREATE INDEX idx_crm_deals_close ON crm_deals(expected_close_date);
CREATE INDEX idx_crm_deals_contact ON crm_deals(contact_id);
CREATE INDEX idx_crm_deals_pipeline ON crm_deals(pipeline_id);

-- ============================================================
-- 7. crm_invoices
-- ============================================================
CREATE TABLE crm_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  company_id UUID REFERENCES crm_companies(id) ON DELETE SET NULL,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
  subtotal_cents BIGINT NOT NULL DEFAULT 0,
  tax_rate NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  tax_cents BIGINT NOT NULL DEFAULT 0,
  total_cents BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'ZAR',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  billing_from JSONB DEFAULT '{}',
  billing_to JSONB DEFAULT '{}',
  share_token TEXT UNIQUE,
  notes TEXT,
  footer_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_invoices_org ON crm_invoices(organization_id);
CREATE INDEX idx_crm_invoices_status ON crm_invoices(organization_id, status);
CREATE INDEX idx_crm_invoices_number ON crm_invoices(invoice_number);
CREATE INDEX idx_crm_invoices_share ON crm_invoices(share_token);
CREATE INDEX idx_crm_invoices_contact ON crm_invoices(contact_id);

-- ============================================================
-- 8. crm_invoice_items
-- ============================================================
CREATE TABLE crm_invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES crm_invoices(id) ON DELETE CASCADE,
  product_id UUID REFERENCES crm_products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
  unit_price_cents BIGINT NOT NULL DEFAULT 0,
  total_cents BIGINT NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_invoice_items_invoice ON crm_invoice_items(invoice_id);

-- ============================================================
-- 9. crm_activity
-- ============================================================
CREATE TABLE crm_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  company_id UUID REFERENCES crm_companies(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES crm_invoices(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL
    CHECK (activity_type IN (
      'email', 'call', 'meeting', 'note',
      'deal_created', 'deal_won', 'deal_lost',
      'invoice_sent', 'invoice_paid',
      'stage_changed', 'contact_created', 'contact_updated',
      'tag_added', 'tag_removed'
    )),
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_activity_org ON crm_activity(organization_id);
CREATE INDEX idx_crm_activity_contact ON crm_activity(contact_id, created_at DESC);
CREATE INDEX idx_crm_activity_company ON crm_activity(company_id, created_at DESC);
CREATE INDEX idx_crm_activity_deal ON crm_activity(deal_id, created_at DESC);

-- ============================================================
-- Alter pipeline_contacts — add optional CRM link
-- ============================================================
ALTER TABLE pipeline_contacts ADD COLUMN IF NOT EXISTS crm_contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL;

-- ============================================================
-- Triggers: updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_crm_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_crm_companies_updated_at
  BEFORE UPDATE ON crm_companies
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

CREATE TRIGGER trg_crm_contacts_updated_at
  BEFORE UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

CREATE TRIGGER trg_crm_products_updated_at
  BEFORE UPDATE ON crm_products
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

CREATE TRIGGER trg_crm_deals_updated_at
  BEFORE UPDATE ON crm_deals
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

CREATE TRIGGER trg_crm_invoices_updated_at
  BEFORE UPDATE ON crm_invoices
  FOR EACH ROW EXECUTE FUNCTION update_crm_updated_at();

-- ============================================================
-- Trigger: email normalisation on crm_contacts
-- ============================================================
CREATE OR REPLACE FUNCTION normalise_crm_contact_email()
RETURNS TRIGGER AS $$
BEGIN
  NEW.email_normalised = LOWER(TRIM(COALESCE(NEW.email, '')));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_normalise_crm_contact_email
  BEFORE INSERT OR UPDATE ON crm_contacts
  FOR EACH ROW EXECUTE FUNCTION normalise_crm_contact_email();

-- ============================================================
-- RLS Policies
-- ============================================================

-- crm_companies
ALTER TABLE crm_companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view companies in their org"
  ON crm_companies FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert companies in their org"
  ON crm_companies FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update companies in their org"
  ON crm_companies FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete companies"
  ON crm_companies FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- crm_contacts
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contacts in their org"
  ON crm_contacts FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert contacts in their org"
  ON crm_contacts FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update contacts in their org"
  ON crm_contacts FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete contacts"
  ON crm_contacts FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- crm_tags
ALTER TABLE crm_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view tags in their org"
  ON crm_tags FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert tags in their org"
  ON crm_tags FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update tags in their org"
  ON crm_tags FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete tags"
  ON crm_tags FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- crm_contact_tags
ALTER TABLE crm_contact_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view contact tags in their org"
  ON crm_contact_tags FOR SELECT
  USING (contact_id IN (
    SELECT id FROM crm_contacts WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  ));

CREATE POLICY "Users can insert contact tags"
  ON crm_contact_tags FOR INSERT
  WITH CHECK (contact_id IN (
    SELECT id FROM crm_contacts WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  ));

CREATE POLICY "Users can delete contact tags"
  ON crm_contact_tags FOR DELETE
  USING (contact_id IN (
    SELECT id FROM crm_contacts WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  ));

-- crm_products
ALTER TABLE crm_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view products in their org"
  ON crm_products FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert products in their org"
  ON crm_products FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update products in their org"
  ON crm_products FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete products"
  ON crm_products FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- crm_deals
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view deals in their org"
  ON crm_deals FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert deals in their org"
  ON crm_deals FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update deals in their org"
  ON crm_deals FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete deals"
  ON crm_deals FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- crm_invoices
ALTER TABLE crm_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoices in their org"
  ON crm_invoices FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Public can view shared invoices"
  ON crm_invoices FOR SELECT
  USING (share_token IS NOT NULL);

CREATE POLICY "Users can insert invoices in their org"
  ON crm_invoices FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can update invoices in their org"
  ON crm_invoices FOR UPDATE
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Admins can delete invoices"
  ON crm_invoices FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM org_members WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  ));

-- crm_invoice_items
ALTER TABLE crm_invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invoice items"
  ON crm_invoice_items FOR SELECT
  USING (invoice_id IN (
    SELECT id FROM crm_invoices WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
    OR share_token IS NOT NULL
  ));

CREATE POLICY "Users can insert invoice items"
  ON crm_invoice_items FOR INSERT
  WITH CHECK (invoice_id IN (
    SELECT id FROM crm_invoices WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  ));

CREATE POLICY "Users can update invoice items"
  ON crm_invoice_items FOR UPDATE
  USING (invoice_id IN (
    SELECT id FROM crm_invoices WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  ));

CREATE POLICY "Users can delete invoice items"
  ON crm_invoice_items FOR DELETE
  USING (invoice_id IN (
    SELECT id FROM crm_invoices WHERE organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid())
  ));

-- crm_activity
ALTER TABLE crm_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activity in their org"
  ON crm_activity FOR SELECT
  USING (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));

CREATE POLICY "Users can insert activity in their org"
  ON crm_activity FOR INSERT
  WITH CHECK (organization_id IN (SELECT organization_id FROM users WHERE id = auth.uid()));
