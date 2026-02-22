-- Migration 071: Fix FK constraints that block user deletion
-- All bare REFERENCES users(id) default to ON DELETE RESTRICT.
-- This migration drops and re-adds them with ON DELETE SET NULL or CASCADE.

-- ============================================================
-- NULLABLE columns → ON DELETE SET NULL
-- ============================================================

-- org_members.invited_by
ALTER TABLE org_members DROP CONSTRAINT IF EXISTS org_members_invited_by_fkey;
ALTER TABLE org_members
  ADD CONSTRAINT org_members_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;

-- invitations.invited_by
ALTER TABLE invitations DROP CONSTRAINT IF EXISTS invitations_invited_by_fkey;
ALTER TABLE invitations
  ADD CONSTRAINT invitations_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES users(id) ON DELETE SET NULL;

-- brand_phases.locked_by
ALTER TABLE brand_phases DROP CONSTRAINT IF EXISTS brand_phases_locked_by_fkey;
ALTER TABLE brand_phases
  ADD CONSTRAINT brand_phases_locked_by_fkey
  FOREIGN KEY (locked_by) REFERENCES users(id) ON DELETE SET NULL;

-- brand_conversations.user_id
ALTER TABLE brand_conversations DROP CONSTRAINT IF EXISTS brand_conversations_user_id_fkey;
ALTER TABLE brand_conversations
  ADD CONSTRAINT brand_conversations_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- brand_playbooks.generated_by
ALTER TABLE brand_playbooks DROP CONSTRAINT IF EXISTS brand_playbooks_generated_by_fkey;
ALTER TABLE brand_playbooks
  ADD CONSTRAINT brand_playbooks_generated_by_fkey
  FOREIGN KEY (generated_by) REFERENCES users(id) ON DELETE SET NULL;

-- content_items.assigned_to
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_assigned_to_fkey;
ALTER TABLE content_items
  ADD CONSTRAINT content_items_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

-- content_items.approved_by
ALTER TABLE content_items DROP CONSTRAINT IF EXISTS content_items_approved_by_fkey;
ALTER TABLE content_items
  ADD CONSTRAINT content_items_approved_by_fkey
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL;

-- ai_usage.user_id
ALTER TABLE ai_usage DROP CONSTRAINT IF EXISTS ai_usage_user_id_fkey;
ALTER TABLE ai_usage
  ADD CONSTRAINT ai_usage_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- applications.activated_user_id
ALTER TABLE applications DROP CONSTRAINT IF EXISTS applications_activated_user_id_fkey;
ALTER TABLE applications
  ADD CONSTRAINT applications_activated_user_id_fkey
  FOREIGN KEY (activated_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- application_activity.performed_by
ALTER TABLE application_activity DROP CONSTRAINT IF EXISTS application_activity_performed_by_fkey;
ALTER TABLE application_activity
  ADD CONSTRAINT application_activity_performed_by_fkey
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL;

-- pipelines.created_by
ALTER TABLE pipelines DROP CONSTRAINT IF EXISTS pipelines_created_by_fkey;
ALTER TABLE pipelines
  ADD CONSTRAINT pipelines_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- pipeline_contacts.assigned_to
ALTER TABLE pipeline_contacts DROP CONSTRAINT IF EXISTS pipeline_contacts_assigned_to_fkey;
ALTER TABLE pipeline_contacts
  ADD CONSTRAINT pipeline_contacts_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

-- pipeline_contacts.created_by
ALTER TABLE pipeline_contacts DROP CONSTRAINT IF EXISTS pipeline_contacts_created_by_fkey;
ALTER TABLE pipeline_contacts
  ADD CONSTRAINT pipeline_contacts_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- pipeline_activity.performed_by
ALTER TABLE pipeline_activity DROP CONSTRAINT IF EXISTS pipeline_activity_performed_by_fkey;
ALTER TABLE pipeline_activity
  ADD CONSTRAINT pipeline_activity_performed_by_fkey
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL;

-- email_templates.created_by
ALTER TABLE email_templates DROP CONSTRAINT IF EXISTS email_templates_created_by_fkey;
ALTER TABLE email_templates
  ADD CONSTRAINT email_templates_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- automation_workflows.created_by
ALTER TABLE automation_workflows DROP CONSTRAINT IF EXISTS automation_workflows_created_by_fkey;
ALTER TABLE automation_workflows
  ADD CONSTRAINT automation_workflows_created_by_fkey
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL;

-- integration_configs.connected_by
ALTER TABLE integration_configs DROP CONSTRAINT IF EXISTS integration_configs_connected_by_fkey;
ALTER TABLE integration_configs
  ADD CONSTRAINT integration_configs_connected_by_fkey
  FOREIGN KEY (connected_by) REFERENCES users(id) ON DELETE SET NULL;

-- change_requests.assigned_to
ALTER TABLE change_requests DROP CONSTRAINT IF EXISTS change_requests_assigned_to_fkey;
ALTER TABLE change_requests
  ADD CONSTRAINT change_requests_assigned_to_fkey
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL;

-- team_credit_allocations.allocated_by (031)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'team_credit_allocations') THEN
    ALTER TABLE team_credit_allocations DROP CONSTRAINT IF EXISTS team_credit_allocations_allocated_by_fkey;
    ALTER TABLE team_credit_allocations
      ADD CONSTRAINT team_credit_allocations_allocated_by_fkey
      FOREIGN KEY (allocated_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- authority_checklist_items.completed_by (048)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'authority_checklist_items') THEN
    ALTER TABLE authority_checklist_items DROP CONSTRAINT IF EXISTS authority_checklist_items_completed_by_fkey;
    ALTER TABLE authority_checklist_items
      ADD CONSTRAINT authority_checklist_items_completed_by_fkey
      FOREIGN KEY (completed_by) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- NOT NULL columns → make nullable, then ON DELETE SET NULL
-- ============================================================

-- generation_batches.user_id
ALTER TABLE generation_batches ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE generation_batches DROP CONSTRAINT IF EXISTS generation_batches_user_id_fkey;
ALTER TABLE generation_batches
  ADD CONSTRAINT generation_batches_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- change_requests.requested_by
ALTER TABLE change_requests ALTER COLUMN requested_by DROP NOT NULL;
ALTER TABLE change_requests DROP CONSTRAINT IF EXISTS change_requests_requested_by_fkey;
ALTER TABLE change_requests
  ADD CONSTRAINT change_requests_requested_by_fkey
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL;

-- ad_generation_batches.user_id (may not exist in all environments)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ad_generation_batches') THEN
    ALTER TABLE ad_generation_batches ALTER COLUMN user_id DROP NOT NULL;
    ALTER TABLE ad_generation_batches DROP CONSTRAINT IF EXISTS ad_generation_batches_user_id_fkey;
    ALTER TABLE ad_generation_batches
      ADD CONSTRAINT ad_generation_batches_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- NOT NULL user-specific columns → ON DELETE CASCADE
-- ============================================================

-- Ad tables (may not exist in all environments)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ad_accounts') THEN
    ALTER TABLE ad_accounts DROP CONSTRAINT IF EXISTS ad_accounts_connected_by_fkey;
    ALTER TABLE ad_accounts
      ADD CONSTRAINT ad_accounts_connected_by_fkey
      FOREIGN KEY (connected_by) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ad_campaigns') THEN
    ALTER TABLE ad_campaigns DROP CONSTRAINT IF EXISTS ad_campaigns_created_by_fkey;
    ALTER TABLE ad_campaigns
      ADD CONSTRAINT ad_campaigns_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ad_creatives') THEN
    ALTER TABLE ad_creatives DROP CONSTRAINT IF EXISTS ad_creatives_created_by_fkey;
    ALTER TABLE ad_creatives
      ADD CONSTRAINT ad_creatives_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ad_audiences') THEN
    ALTER TABLE ad_audiences DROP CONSTRAINT IF EXISTS ad_audiences_created_by_fkey;
    ALTER TABLE ad_audiences
      ADD CONSTRAINT ad_audiences_created_by_fkey
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;
