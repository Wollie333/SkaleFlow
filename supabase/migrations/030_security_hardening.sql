-- Migration 030: Security hardening — add missing RLS policies
-- Fixes: applications + application_activity missing RLS, model_access_rules missing policy

-- =====================================================
-- 1. APPLICATIONS TABLE — Enable RLS + policies
-- =====================================================
-- Applications is a public form (anyone can submit) but only super_admins can read/manage

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- Public can insert (application form is unauthenticated)
CREATE POLICY applications_public_insert ON applications
  FOR INSERT WITH CHECK (true);

-- Only super_admins can view/update/delete applications
CREATE POLICY applications_admin_select ON applications
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY applications_admin_update ON applications
  FOR UPDATE USING (public.is_super_admin(auth.uid()));

CREATE POLICY applications_admin_delete ON applications
  FOR DELETE USING (public.is_super_admin(auth.uid()));

-- Service role bypass for API routes
CREATE POLICY applications_service_role ON applications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- 2. APPLICATION_ACTIVITY TABLE — Enable RLS + policies
-- =====================================================

ALTER TABLE application_activity ENABLE ROW LEVEL SECURITY;

-- Only super_admins can view activity
CREATE POLICY application_activity_admin_select ON application_activity
  FOR SELECT USING (public.is_super_admin(auth.uid()));

-- Service role can insert/update (API routes use createServiceClient)
CREATE POLICY application_activity_service_role ON application_activity
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- =====================================================
-- 3. MODEL_ACCESS_RULES — Add missing service_role policy
-- =====================================================
-- RLS is enabled (migration 029) but no policies were defined,
-- making the table completely inaccessible

CREATE POLICY model_access_rules_service_role ON model_access_rules
  FOR ALL TO service_role USING (true) WITH CHECK (true);
