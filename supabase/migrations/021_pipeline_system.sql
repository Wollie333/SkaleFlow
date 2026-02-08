-- Migration: 021_pipeline_system.sql
-- Pipeline & Automation System (Phases 1-6)
-- Tables: pipelines, pipeline_stages, pipeline_contacts, pipeline_tags,
--         pipeline_contact_tags, pipeline_activity, email_templates,
--         automation_workflows, automation_steps, automation_runs,
--         automation_step_logs, webhook_endpoints, integration_configs

-- ============================================================================
-- PHASE 1: Core Pipeline Tables
-- ============================================================================

-- Pipelines (per-org)
CREATE TABLE IF NOT EXISTS pipelines (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pipeline Stages (custom stages per pipeline)
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6B7280',
  sort_order integer NOT NULL DEFAULT 0,
  is_win_stage boolean DEFAULT false,
  is_loss_stage boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Pipeline Contacts / Deals
CREATE TABLE IF NOT EXISTS pipeline_contacts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  stage_id uuid NOT NULL REFERENCES pipeline_stages(id),
  full_name text NOT NULL,
  email text,
  phone text,
  company text,
  value_cents bigint DEFAULT 0,
  currency text DEFAULT 'ZAR',
  assigned_to uuid REFERENCES users(id),
  custom_fields jsonb DEFAULT '{}',
  notes text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Pipeline Tags (org-level)
CREATE TABLE IF NOT EXISTS pipeline_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#6B7280',
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, name)
);

-- Pipeline Contact Tags (M2M junction)
CREATE TABLE IF NOT EXISTS pipeline_contact_tags (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES pipeline_contacts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES pipeline_tags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(contact_id, tag_id)
);

-- Pipeline Activity (immutable audit log)
CREATE TABLE IF NOT EXISTS pipeline_activity (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id uuid NOT NULL REFERENCES pipeline_contacts(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  from_stage_id uuid REFERENCES pipeline_stages(id),
  to_stage_id uuid REFERENCES pipeline_stages(id),
  metadata jsonb DEFAULT '{}',
  performed_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- ============================================================================
-- PHASE 2: Email Templates
-- ============================================================================

CREATE TABLE IF NOT EXISTS email_templates (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  subject text NOT NULL,
  body_html text NOT NULL,
  merge_fields text[] DEFAULT '{}',
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- PHASE 3: Automation Engine
-- ============================================================================

-- Automation Workflows (per-org, per-pipeline)
CREATE TABLE IF NOT EXISTS automation_workflows (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  pipeline_id uuid NOT NULL REFERENCES pipelines(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT false,
  trigger_type text NOT NULL,
  trigger_config jsonb DEFAULT '{}',
  graph_data jsonb DEFAULT '{}',
  version integer DEFAULT 1,
  created_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Automation Steps (normalized execution steps)
CREATE TABLE IF NOT EXISTS automation_steps (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id uuid NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  step_order integer NOT NULL DEFAULT 0,
  step_type text NOT NULL,
  config jsonb DEFAULT '{}',
  next_step_id uuid REFERENCES automation_steps(id),
  condition_true_step_id uuid REFERENCES automation_steps(id),
  condition_false_step_id uuid REFERENCES automation_steps(id),
  reactflow_node_id text,
  created_at timestamptz DEFAULT now()
);

-- Automation Runs (per-contact execution)
CREATE TABLE IF NOT EXISTS automation_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workflow_id uuid NOT NULL REFERENCES automation_workflows(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES pipeline_contacts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'running',
  current_step_id uuid REFERENCES automation_steps(id),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  error_message text,
  metadata jsonb DEFAULT '{}'
);

-- Automation Step Logs (per-step execution log)
CREATE TABLE IF NOT EXISTS automation_step_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  run_id uuid NOT NULL REFERENCES automation_runs(id) ON DELETE CASCADE,
  step_id uuid NOT NULL REFERENCES automation_steps(id),
  status text NOT NULL DEFAULT 'pending',
  started_at timestamptz,
  completed_at timestamptz,
  result jsonb DEFAULT '{}',
  retry_count integer DEFAULT 0,
  next_retry_at timestamptz
);

-- Webhook Endpoints (outbound configs)
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  method text DEFAULT 'POST',
  headers jsonb DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ============================================================================
-- PHASE 6: Integration Configs
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_configs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  integration_type text NOT NULL,
  config jsonb DEFAULT '{}',
  credentials jsonb DEFAULT '{}',
  is_active boolean DEFAULT false,
  connected_by uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, integration_type)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_pipeline_contacts_pipeline_stage
  ON pipeline_contacts(pipeline_id, stage_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_contacts_organization
  ON pipeline_contacts(organization_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_contacts_email
  ON pipeline_contacts(email);

CREATE INDEX IF NOT EXISTS idx_pipeline_activity_contact
  ON pipeline_activity(contact_id);

CREATE INDEX IF NOT EXISTS idx_pipeline_activity_org_created
  ON pipeline_activity(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_automation_runs_workflow_status
  ON automation_runs(workflow_id, status);

CREATE INDEX IF NOT EXISTS idx_automation_runs_contact
  ON automation_runs(contact_id);

CREATE INDEX IF NOT EXISTS idx_automation_step_logs_run
  ON automation_step_logs(run_id);

CREATE INDEX IF NOT EXISTS idx_automation_step_logs_status_retry
  ON automation_step_logs(status, next_retry_at);

-- ============================================================================
-- ROW LEVEL SECURITY — Enable on all tables
-- ============================================================================

ALTER TABLE pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_contact_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_step_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES — Org-membership pattern
-- Pattern: user must be a member of the same organization
-- ============================================================================

-- Helper: org membership check subquery
-- EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = T.organization_id AND org_members.user_id = auth.uid())

-- ---------------------------------------------------------------------------
-- pipelines
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipelines_select' AND tablename = 'pipelines') THEN
    CREATE POLICY pipelines_select ON pipelines FOR SELECT USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = pipelines.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipelines_insert' AND tablename = 'pipelines') THEN
    CREATE POLICY pipelines_insert ON pipelines FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = pipelines.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipelines_update' AND tablename = 'pipelines') THEN
    CREATE POLICY pipelines_update ON pipelines FOR UPDATE USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = pipelines.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipelines_delete' AND tablename = 'pipelines') THEN
    CREATE POLICY pipelines_delete ON pipelines FOR DELETE USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = pipelines.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- pipeline_stages (join through pipelines to get org)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_stages_select' AND tablename = 'pipeline_stages') THEN
    CREATE POLICY pipeline_stages_select ON pipeline_stages FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM pipelines
        JOIN org_members ON org_members.organization_id = pipelines.organization_id
        WHERE pipelines.id = pipeline_stages.pipeline_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_stages_insert' AND tablename = 'pipeline_stages') THEN
    CREATE POLICY pipeline_stages_insert ON pipeline_stages FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM pipelines
        JOIN org_members ON org_members.organization_id = pipelines.organization_id
        WHERE pipelines.id = pipeline_stages.pipeline_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_stages_update' AND tablename = 'pipeline_stages') THEN
    CREATE POLICY pipeline_stages_update ON pipeline_stages FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM pipelines
        JOIN org_members ON org_members.organization_id = pipelines.organization_id
        WHERE pipelines.id = pipeline_stages.pipeline_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_stages_delete' AND tablename = 'pipeline_stages') THEN
    CREATE POLICY pipeline_stages_delete ON pipeline_stages FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM pipelines
        JOIN org_members ON org_members.organization_id = pipelines.organization_id
        WHERE pipelines.id = pipeline_stages.pipeline_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- pipeline_contacts
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_contacts_select' AND tablename = 'pipeline_contacts') THEN
    CREATE POLICY pipeline_contacts_select ON pipeline_contacts FOR SELECT USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = pipeline_contacts.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_contacts_insert' AND tablename = 'pipeline_contacts') THEN
    CREATE POLICY pipeline_contacts_insert ON pipeline_contacts FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = pipeline_contacts.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_contacts_update' AND tablename = 'pipeline_contacts') THEN
    CREATE POLICY pipeline_contacts_update ON pipeline_contacts FOR UPDATE USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = pipeline_contacts.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_contacts_delete' AND tablename = 'pipeline_contacts') THEN
    CREATE POLICY pipeline_contacts_delete ON pipeline_contacts FOR DELETE USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = pipeline_contacts.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- pipeline_tags
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_tags_select' AND tablename = 'pipeline_tags') THEN
    CREATE POLICY pipeline_tags_select ON pipeline_tags FOR SELECT USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = pipeline_tags.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_tags_insert' AND tablename = 'pipeline_tags') THEN
    CREATE POLICY pipeline_tags_insert ON pipeline_tags FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = pipeline_tags.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_tags_update' AND tablename = 'pipeline_tags') THEN
    CREATE POLICY pipeline_tags_update ON pipeline_tags FOR UPDATE USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = pipeline_tags.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_tags_delete' AND tablename = 'pipeline_tags') THEN
    CREATE POLICY pipeline_tags_delete ON pipeline_tags FOR DELETE USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = pipeline_tags.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- pipeline_contact_tags (join through pipeline_contacts to get org)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_contact_tags_select' AND tablename = 'pipeline_contact_tags') THEN
    CREATE POLICY pipeline_contact_tags_select ON pipeline_contact_tags FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM pipeline_contacts
        JOIN org_members ON org_members.organization_id = pipeline_contacts.organization_id
        WHERE pipeline_contacts.id = pipeline_contact_tags.contact_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_contact_tags_insert' AND tablename = 'pipeline_contact_tags') THEN
    CREATE POLICY pipeline_contact_tags_insert ON pipeline_contact_tags FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM pipeline_contacts
        JOIN org_members ON org_members.organization_id = pipeline_contacts.organization_id
        WHERE pipeline_contacts.id = pipeline_contact_tags.contact_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_contact_tags_update' AND tablename = 'pipeline_contact_tags') THEN
    CREATE POLICY pipeline_contact_tags_update ON pipeline_contact_tags FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM pipeline_contacts
        JOIN org_members ON org_members.organization_id = pipeline_contacts.organization_id
        WHERE pipeline_contacts.id = pipeline_contact_tags.contact_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_contact_tags_delete' AND tablename = 'pipeline_contact_tags') THEN
    CREATE POLICY pipeline_contact_tags_delete ON pipeline_contact_tags FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM pipeline_contacts
        JOIN org_members ON org_members.organization_id = pipeline_contacts.organization_id
        WHERE pipeline_contacts.id = pipeline_contact_tags.contact_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- pipeline_activity
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_activity_select' AND tablename = 'pipeline_activity') THEN
    CREATE POLICY pipeline_activity_select ON pipeline_activity FOR SELECT USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = pipeline_activity.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_activity_insert' AND tablename = 'pipeline_activity') THEN
    CREATE POLICY pipeline_activity_insert ON pipeline_activity FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = pipeline_activity.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_activity_update' AND tablename = 'pipeline_activity') THEN
    CREATE POLICY pipeline_activity_update ON pipeline_activity FOR UPDATE USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = pipeline_activity.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'pipeline_activity_delete' AND tablename = 'pipeline_activity') THEN
    CREATE POLICY pipeline_activity_delete ON pipeline_activity FOR DELETE USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = pipeline_activity.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- email_templates
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'email_templates_select' AND tablename = 'email_templates') THEN
    CREATE POLICY email_templates_select ON email_templates FOR SELECT USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = email_templates.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'email_templates_insert' AND tablename = 'email_templates') THEN
    CREATE POLICY email_templates_insert ON email_templates FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = email_templates.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'email_templates_update' AND tablename = 'email_templates') THEN
    CREATE POLICY email_templates_update ON email_templates FOR UPDATE USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = email_templates.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'email_templates_delete' AND tablename = 'email_templates') THEN
    CREATE POLICY email_templates_delete ON email_templates FOR DELETE USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = email_templates.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- automation_workflows
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_workflows_select' AND tablename = 'automation_workflows') THEN
    CREATE POLICY automation_workflows_select ON automation_workflows FOR SELECT USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = automation_workflows.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_workflows_insert' AND tablename = 'automation_workflows') THEN
    CREATE POLICY automation_workflows_insert ON automation_workflows FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = automation_workflows.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_workflows_update' AND tablename = 'automation_workflows') THEN
    CREATE POLICY automation_workflows_update ON automation_workflows FOR UPDATE USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = automation_workflows.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_workflows_delete' AND tablename = 'automation_workflows') THEN
    CREATE POLICY automation_workflows_delete ON automation_workflows FOR DELETE USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = automation_workflows.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- automation_steps (join through automation_workflows to get org)
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_steps_select' AND tablename = 'automation_steps') THEN
    CREATE POLICY automation_steps_select ON automation_steps FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM automation_workflows
        JOIN org_members ON org_members.organization_id = automation_workflows.organization_id
        WHERE automation_workflows.id = automation_steps.workflow_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_steps_insert' AND tablename = 'automation_steps') THEN
    CREATE POLICY automation_steps_insert ON automation_steps FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM automation_workflows
        JOIN org_members ON org_members.organization_id = automation_workflows.organization_id
        WHERE automation_workflows.id = automation_steps.workflow_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_steps_update' AND tablename = 'automation_steps') THEN
    CREATE POLICY automation_steps_update ON automation_steps FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM automation_workflows
        JOIN org_members ON org_members.organization_id = automation_workflows.organization_id
        WHERE automation_workflows.id = automation_steps.workflow_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_steps_delete' AND tablename = 'automation_steps') THEN
    CREATE POLICY automation_steps_delete ON automation_steps FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM automation_workflows
        JOIN org_members ON org_members.organization_id = automation_workflows.organization_id
        WHERE automation_workflows.id = automation_steps.workflow_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- automation_runs (join through automation_workflows to get org)
-- + service_role bypass for the automation engine
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_runs_select' AND tablename = 'automation_runs') THEN
    CREATE POLICY automation_runs_select ON automation_runs FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM automation_workflows
        JOIN org_members ON org_members.organization_id = automation_workflows.organization_id
        WHERE automation_workflows.id = automation_runs.workflow_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_runs_insert' AND tablename = 'automation_runs') THEN
    CREATE POLICY automation_runs_insert ON automation_runs FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM automation_workflows
        JOIN org_members ON org_members.organization_id = automation_workflows.organization_id
        WHERE automation_workflows.id = automation_runs.workflow_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_runs_update' AND tablename = 'automation_runs') THEN
    CREATE POLICY automation_runs_update ON automation_runs FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM automation_workflows
        JOIN org_members ON org_members.organization_id = automation_workflows.organization_id
        WHERE automation_workflows.id = automation_runs.workflow_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_runs_delete' AND tablename = 'automation_runs') THEN
    CREATE POLICY automation_runs_delete ON automation_runs FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM automation_workflows
        JOIN org_members ON org_members.organization_id = automation_workflows.organization_id
        WHERE automation_workflows.id = automation_runs.workflow_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Service role bypass for automation_runs (automation engine uses createServiceClient)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_runs_service_role' AND tablename = 'automation_runs') THEN
    CREATE POLICY automation_runs_service_role ON automation_runs FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- automation_step_logs (join through automation_runs -> automation_workflows to get org)
-- + service_role bypass for the automation engine
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_step_logs_select' AND tablename = 'automation_step_logs') THEN
    CREATE POLICY automation_step_logs_select ON automation_step_logs FOR SELECT USING (
      EXISTS (
        SELECT 1 FROM automation_runs
        JOIN automation_workflows ON automation_workflows.id = automation_runs.workflow_id
        JOIN org_members ON org_members.organization_id = automation_workflows.organization_id
        WHERE automation_runs.id = automation_step_logs.run_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_step_logs_insert' AND tablename = 'automation_step_logs') THEN
    CREATE POLICY automation_step_logs_insert ON automation_step_logs FOR INSERT WITH CHECK (
      EXISTS (
        SELECT 1 FROM automation_runs
        JOIN automation_workflows ON automation_workflows.id = automation_runs.workflow_id
        JOIN org_members ON org_members.organization_id = automation_workflows.organization_id
        WHERE automation_runs.id = automation_step_logs.run_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_step_logs_update' AND tablename = 'automation_step_logs') THEN
    CREATE POLICY automation_step_logs_update ON automation_step_logs FOR UPDATE USING (
      EXISTS (
        SELECT 1 FROM automation_runs
        JOIN automation_workflows ON automation_workflows.id = automation_runs.workflow_id
        JOIN org_members ON org_members.organization_id = automation_workflows.organization_id
        WHERE automation_runs.id = automation_step_logs.run_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_step_logs_delete' AND tablename = 'automation_step_logs') THEN
    CREATE POLICY automation_step_logs_delete ON automation_step_logs FOR DELETE USING (
      EXISTS (
        SELECT 1 FROM automation_runs
        JOIN automation_workflows ON automation_workflows.id = automation_runs.workflow_id
        JOIN org_members ON org_members.organization_id = automation_workflows.organization_id
        WHERE automation_runs.id = automation_step_logs.run_id AND org_members.user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Service role bypass for automation_step_logs (automation engine uses createServiceClient)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'automation_step_logs_service_role' AND tablename = 'automation_step_logs') THEN
    CREATE POLICY automation_step_logs_service_role ON automation_step_logs FOR ALL
      TO service_role USING (true) WITH CHECK (true);
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- webhook_endpoints
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'webhook_endpoints_select' AND tablename = 'webhook_endpoints') THEN
    CREATE POLICY webhook_endpoints_select ON webhook_endpoints FOR SELECT USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = webhook_endpoints.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'webhook_endpoints_insert' AND tablename = 'webhook_endpoints') THEN
    CREATE POLICY webhook_endpoints_insert ON webhook_endpoints FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = webhook_endpoints.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'webhook_endpoints_update' AND tablename = 'webhook_endpoints') THEN
    CREATE POLICY webhook_endpoints_update ON webhook_endpoints FOR UPDATE USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = webhook_endpoints.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'webhook_endpoints_delete' AND tablename = 'webhook_endpoints') THEN
    CREATE POLICY webhook_endpoints_delete ON webhook_endpoints FOR DELETE USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = webhook_endpoints.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

-- ---------------------------------------------------------------------------
-- integration_configs
-- ---------------------------------------------------------------------------
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'integration_configs_select' AND tablename = 'integration_configs') THEN
    CREATE POLICY integration_configs_select ON integration_configs FOR SELECT USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = integration_configs.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'integration_configs_insert' AND tablename = 'integration_configs') THEN
    CREATE POLICY integration_configs_insert ON integration_configs FOR INSERT WITH CHECK (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = integration_configs.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'integration_configs_update' AND tablename = 'integration_configs') THEN
    CREATE POLICY integration_configs_update ON integration_configs FOR UPDATE USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = integration_configs.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'integration_configs_delete' AND tablename = 'integration_configs') THEN
    CREATE POLICY integration_configs_delete ON integration_configs FOR DELETE USING (
      EXISTS (SELECT 1 FROM org_members WHERE org_members.organization_id = integration_configs.organization_id AND org_members.user_id = auth.uid())
    );
  END IF;
END $$;
