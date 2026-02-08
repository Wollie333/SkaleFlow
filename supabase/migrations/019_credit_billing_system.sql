-- =====================================================
-- Migration 019: Credit System, Billing & AI Model Preferences
-- =====================================================

-- 1. Add monthly_credits to subscription_tiers
ALTER TABLE subscription_tiers
  ADD COLUMN IF NOT EXISTS monthly_credits INTEGER NOT NULL DEFAULT 0;

-- Update existing tiers with credit allocations
UPDATE subscription_tiers SET monthly_credits = 15000 WHERE slug = 'foundation';
UPDATE subscription_tiers SET monthly_credits = 35000 WHERE slug = 'momentum';
UPDATE subscription_tiers SET monthly_credits = 75000 WHERE slug = 'authority';

-- 2. Add new columns to ai_usage
ALTER TABLE ai_usage
  ADD COLUMN IF NOT EXISTS credits_charged INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS provider TEXT NOT NULL DEFAULT 'anthropic',
  ADD COLUMN IF NOT EXISTS is_free_model BOOLEAN NOT NULL DEFAULT FALSE;

-- 3. Create transaction type enum
DO $$ BEGIN
  CREATE TYPE credit_transaction_type AS ENUM (
    'monthly_allocation',
    'monthly_reset',
    'topup_purchase',
    'ai_usage_deduction',
    'refund',
    'admin_adjustment'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 4. Create invoice type enum
DO $$ BEGIN
  CREATE TYPE invoice_type AS ENUM ('subscription', 'topup', 'refund');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 5. Create invoice status enum
DO $$ BEGIN
  CREATE TYPE invoice_status AS ENUM ('draft', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- CREDIT BALANCES — one row per org
-- =====================================================
CREATE TABLE credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  monthly_credits_remaining INTEGER NOT NULL DEFAULT 0,
  monthly_credits_total INTEGER NOT NULL DEFAULT 0,
  topup_credits_remaining INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ,
  period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id)
);

-- =====================================================
-- CREDIT TRANSACTIONS — full audit log
-- =====================================================
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  transaction_type credit_transaction_type NOT NULL,
  credits_amount INTEGER NOT NULL, -- positive = added, negative = deducted
  credits_before INTEGER NOT NULL,
  credits_after INTEGER NOT NULL,
  source TEXT, -- e.g. 'monthly', 'topup', model name
  description TEXT,
  ai_usage_id UUID REFERENCES ai_usage(id) ON DELETE SET NULL,
  invoice_id UUID, -- FK added after invoices table created
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_credit_transactions_org ON credit_transactions(organization_id);
CREATE INDEX idx_credit_transactions_created ON credit_transactions(created_at DESC);

-- =====================================================
-- CREDIT TOP-UP PACKS
-- =====================================================
CREATE TABLE credit_topup_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  credits INTEGER NOT NULL,
  price_cents INTEGER NOT NULL, -- in ZAR cents
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed the 4 top-up packs
INSERT INTO credit_topup_packs (name, slug, credits, price_cents, description, sort_order) VALUES
  ('Starter Pack', 'starter-pack', 5000, 9900, '5,000 AI credits for light usage', 1),
  ('Growth Pack', 'growth-pack', 15000, 24900, '15,000 AI credits for regular usage', 2),
  ('Power Pack', 'power-pack', 40000, 54900, '40,000 AI credits for heavy usage', 3),
  ('Enterprise Pack', 'enterprise-pack', 100000, 99900, '100,000 AI credits for teams', 4);

-- =====================================================
-- INVOICES
-- =====================================================
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  invoice_type invoice_type NOT NULL,
  status invoice_status NOT NULL DEFAULT 'draft',
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  vat_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,
  line_items JSONB NOT NULL DEFAULT '[]',
  paystack_reference TEXT,
  billing_name TEXT,
  billing_email TEXT,
  billing_address TEXT,
  credits_granted INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_invoices_org ON invoices(organization_id);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

-- Add FK from credit_transactions to invoices
ALTER TABLE credit_transactions
  ADD CONSTRAINT credit_transactions_invoice_id_fkey
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL;

-- =====================================================
-- AI MODEL PREFERENCES — per org per feature
-- =====================================================
CREATE TABLE ai_model_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  feature TEXT NOT NULL, -- 'brand_chat', 'content_generation', etc.
  provider TEXT NOT NULL DEFAULT 'anthropic',
  model TEXT NOT NULL DEFAULT 'claude-sonnet-4-5-20250929',
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(organization_id, feature)
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE credit_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_topup_packs ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_model_preferences ENABLE ROW LEVEL SECURITY;

-- credit_balances: org members can read
CREATE POLICY "credit_balances_select" ON credit_balances
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.organization_id = credit_balances.organization_id
      AND org_members.user_id = auth.uid()
    )
  );

-- credit_transactions: org members can read
CREATE POLICY "credit_transactions_select" ON credit_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.organization_id = credit_transactions.organization_id
      AND org_members.user_id = auth.uid()
    )
  );

-- credit_topup_packs: anyone authenticated can read
CREATE POLICY "credit_topup_packs_select" ON credit_topup_packs
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- invoices: org members can read
CREATE POLICY "invoices_select" ON invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.organization_id = invoices.organization_id
      AND org_members.user_id = auth.uid()
    )
  );

-- ai_model_preferences: org members can read/write
CREATE POLICY "ai_model_preferences_select" ON ai_model_preferences
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.organization_id = ai_model_preferences.organization_id
      AND org_members.user_id = auth.uid()
    )
  );

CREATE POLICY "ai_model_preferences_insert" ON ai_model_preferences
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.organization_id = ai_model_preferences.organization_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "ai_model_preferences_update" ON ai_model_preferences
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.organization_id = ai_model_preferences.organization_id
      AND org_members.user_id = auth.uid()
      AND org_members.role IN ('owner', 'admin')
    )
  );

-- =====================================================
-- FUNCTION: Reset monthly credits
-- =====================================================
CREATE OR REPLACE FUNCTION reset_monthly_credits(p_org_id UUID)
RETURNS VOID AS $$
DECLARE
  v_balance RECORD;
  v_tier_credits INTEGER;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- Get current balance
  SELECT * INTO v_balance FROM credit_balances WHERE organization_id = p_org_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Get tier monthly credits
  SELECT st.monthly_credits INTO v_tier_credits
  FROM subscriptions s
  JOIN subscription_tiers st ON st.id = s.tier_id
  WHERE s.organization_id = p_org_id AND s.status = 'active'
  LIMIT 1;

  IF v_tier_credits IS NULL THEN
    v_tier_credits := 0;
  END IF;

  -- Log expired monthly credits if any remained
  IF v_balance.monthly_credits_remaining > 0 THEN
    INSERT INTO credit_transactions (
      organization_id, transaction_type, credits_amount,
      credits_before, credits_after, source, description
    ) VALUES (
      p_org_id, 'monthly_reset', -v_balance.monthly_credits_remaining,
      v_balance.monthly_credits_remaining + v_balance.topup_credits_remaining,
      v_balance.topup_credits_remaining,
      'monthly', 'Monthly credits expired — unused balance reset'
    );
  END IF;

  -- Allocate new monthly credits
  IF v_tier_credits > 0 THEN
    INSERT INTO credit_transactions (
      organization_id, transaction_type, credits_amount,
      credits_before, credits_after, source, description
    ) VALUES (
      p_org_id, 'monthly_allocation', v_tier_credits,
      v_balance.topup_credits_remaining,
      v_tier_credits + v_balance.topup_credits_remaining,
      'monthly', 'Monthly credit allocation for subscription tier'
    );
  END IF;

  -- Update balance
  UPDATE credit_balances SET
    monthly_credits_remaining = v_tier_credits,
    monthly_credits_total = v_tier_credits,
    period_start = v_now,
    period_end = v_now + INTERVAL '1 month',
    updated_at = v_now
  WHERE organization_id = p_org_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
