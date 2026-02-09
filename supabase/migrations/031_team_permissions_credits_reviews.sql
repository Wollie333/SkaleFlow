-- Migration 031: Team Permissions, Credit Allocations & Change Requests
-- Adds granular feature-level permissions, per-user credit budgets,
-- and a change request system for team member approval workflows.

-- ============================================================
-- 1. team_permissions — granular feature access for team members
-- ============================================================
CREATE TABLE IF NOT EXISTS team_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,  -- 'brand_engine', 'content_engine', 'pipeline', 'ad_campaigns'
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id, feature)
);

-- RLS
ALTER TABLE team_permissions ENABLE ROW LEVEL SECURITY;

-- Users can read their own permissions
CREATE POLICY "team_permissions_select_own" ON team_permissions
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.organization_id = team_permissions.organization_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

-- Owner/admin can insert/update/delete permissions
CREATE POLICY "team_permissions_manage" ON team_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.organization_id = team_permissions.organization_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 2. team_credit_allocations — per-user feature credit budgets
-- ============================================================
CREATE TABLE IF NOT EXISTS team_credit_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature TEXT NOT NULL,
  credits_allocated INTEGER NOT NULL DEFAULT 0,
  credits_remaining INTEGER NOT NULL DEFAULT 0,
  allocated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id, feature)
);

-- RLS
ALTER TABLE team_credit_allocations ENABLE ROW LEVEL SECURITY;

-- Users can read their own allocations
CREATE POLICY "team_credit_allocations_select_own" ON team_credit_allocations
  FOR SELECT USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.organization_id = team_credit_allocations.organization_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

-- Owner/admin can manage allocations
CREATE POLICY "team_credit_allocations_manage" ON team_credit_allocations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.organization_id = team_credit_allocations.organization_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 3. change_requests — approval workflow for team member changes
-- ============================================================
CREATE TABLE IF NOT EXISTS change_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES users(id),
  feature TEXT NOT NULL,           -- 'brand_engine', 'content_engine'
  entity_type TEXT NOT NULL,       -- 'brand_variable', 'content_item'
  entity_id TEXT,                  -- output_key for brand vars, content_item.id for content
  change_type TEXT NOT NULL,       -- 'create', 'update', 'delete'
  current_value JSONB,             -- snapshot of current state
  proposed_value JSONB,            -- proposed new state
  metadata JSONB DEFAULT '{}',     -- extra context (phase_id, question_index, etc.)
  status TEXT NOT NULL DEFAULT 'pending',  -- 'pending', 'approved', 'rejected', 'revision_requested'
  reviewed_by UUID REFERENCES users(id),
  review_comment TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE change_requests ENABLE ROW LEVEL SECURITY;

-- Users can read and create their own change requests
CREATE POLICY "change_requests_select" ON change_requests
  FOR SELECT USING (
    auth.uid() = requested_by
    OR EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.organization_id = change_requests.organization_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "change_requests_insert_own" ON change_requests
  FOR INSERT WITH CHECK (auth.uid() = requested_by);

-- Owner/admin can update (review) change requests
CREATE POLICY "change_requests_update" ON change_requests
  FOR UPDATE USING (
    auth.uid() = requested_by
    OR EXISTS (
      SELECT 1 FROM org_members
      WHERE org_members.organization_id = change_requests.organization_id
        AND org_members.user_id = auth.uid()
        AND org_members.role IN ('owner', 'admin')
    )
  );

-- ============================================================
-- 4. Indexes for fast queries
-- ============================================================
CREATE INDEX idx_change_requests_org_status ON change_requests(organization_id, status);
CREATE INDEX idx_change_requests_requested_by ON change_requests(requested_by);
CREATE INDEX idx_team_permissions_org_user ON team_permissions(organization_id, user_id);
CREATE INDEX idx_team_credit_allocations_org_user ON team_credit_allocations(organization_id, user_id);
