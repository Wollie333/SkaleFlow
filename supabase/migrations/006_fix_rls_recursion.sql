-- FIX: RLS infinite recursion
-- Problem: Policies on `users` query `users`, and policies on `org_members` query `org_members`,
-- causing infinite recursion. Fix: use SECURITY DEFINER functions that bypass RLS.

-- =====================================================
-- HELPER FUNCTIONS (SECURITY DEFINER = bypasses RLS)
-- =====================================================

CREATE OR REPLACE FUNCTION public.is_super_admin(check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = check_user_id AND role = 'super_admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_org_ids(check_user_id UUID)
RETURNS SETOF UUID AS $$
  SELECT organization_id FROM public.org_members WHERE user_id = check_user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.is_org_member(check_org_id UUID, check_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.org_members WHERE organization_id = check_org_id AND user_id = check_user_id
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.get_user_org_role(check_org_id UUID, check_user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.org_members WHERE organization_id = check_org_id AND user_id = check_user_id;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =====================================================
-- FIX: USERS POLICIES
-- =====================================================

DROP POLICY IF EXISTS users_select_own ON users;
DROP POLICY IF EXISTS users_select_admin ON users;
DROP POLICY IF EXISTS users_update_own ON users;
DROP POLICY IF EXISTS users_insert ON users;

CREATE POLICY users_select_own ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_select_admin ON users
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY users_update_own ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY users_update_admin ON users
  FOR UPDATE USING (public.is_super_admin(auth.uid()));

CREATE POLICY users_insert ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- FIX: ORGANIZATIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS orgs_select_member ON organizations;
DROP POLICY IF EXISTS orgs_select_admin ON organizations;
DROP POLICY IF EXISTS orgs_update_owner ON organizations;
DROP POLICY IF EXISTS orgs_insert_admin ON organizations;

CREATE POLICY orgs_select_member ON organizations
  FOR SELECT USING (public.is_org_member(id, auth.uid()));

CREATE POLICY orgs_select_admin ON organizations
  FOR SELECT USING (public.is_super_admin(auth.uid()));

CREATE POLICY orgs_update_owner ON organizations
  FOR UPDATE USING (
    public.get_user_org_role(id, auth.uid()) IN ('owner', 'admin')
  );

CREATE POLICY orgs_insert_admin ON organizations
  FOR INSERT WITH CHECK (public.is_super_admin(auth.uid()));

-- =====================================================
-- FIX: ORG_MEMBERS POLICIES
-- =====================================================

DROP POLICY IF EXISTS org_members_select ON org_members;
DROP POLICY IF EXISTS org_members_insert ON org_members;

CREATE POLICY org_members_select ON org_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR public.is_org_member(organization_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  );

CREATE POLICY org_members_insert ON org_members
  FOR INSERT WITH CHECK (
    public.is_super_admin(auth.uid())
    OR public.get_user_org_role(organization_id, auth.uid()) IN ('owner', 'admin')
  );

-- =====================================================
-- FIX: INVITATIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS invitations_admin ON invitations;
DROP POLICY IF EXISTS invitations_select_by_token ON invitations;

CREATE POLICY invitations_admin ON invitations
  FOR ALL USING (public.is_super_admin(auth.uid()));

CREATE POLICY invitations_select_by_token ON invitations
  FOR SELECT USING (true);

-- =====================================================
-- FIX: SUBSCRIPTIONS POLICIES
-- =====================================================

DROP POLICY IF EXISTS subscriptions_select ON subscriptions;

CREATE POLICY subscriptions_select ON subscriptions
  FOR SELECT USING (public.is_org_member(organization_id, auth.uid()));

-- =====================================================
-- FIX: BRAND ENGINE POLICIES
-- =====================================================

DROP POLICY IF EXISTS brand_phases_member ON brand_phases;
CREATE POLICY brand_phases_member ON brand_phases
  FOR ALL USING (public.is_org_member(organization_id, auth.uid()));

DROP POLICY IF EXISTS brand_outputs_member ON brand_outputs;
CREATE POLICY brand_outputs_member ON brand_outputs
  FOR ALL USING (public.is_org_member(organization_id, auth.uid()));

DROP POLICY IF EXISTS brand_conversations_member ON brand_conversations;
CREATE POLICY brand_conversations_member ON brand_conversations
  FOR ALL USING (public.is_org_member(organization_id, auth.uid()));

DROP POLICY IF EXISTS brand_playbooks_member ON brand_playbooks;
CREATE POLICY brand_playbooks_member ON brand_playbooks
  FOR ALL USING (public.is_org_member(organization_id, auth.uid()));

-- =====================================================
-- FIX: CONTENT ENGINE POLICIES
-- =====================================================

DROP POLICY IF EXISTS content_calendars_member ON content_calendars;
CREATE POLICY content_calendars_member ON content_calendars
  FOR ALL USING (public.is_org_member(organization_id, auth.uid()));

DROP POLICY IF EXISTS content_angles_member ON content_angles;
CREATE POLICY content_angles_member ON content_angles
  FOR ALL USING (public.is_org_member(organization_id, auth.uid()));

DROP POLICY IF EXISTS content_items_member ON content_items;
CREATE POLICY content_items_member ON content_items
  FOR ALL USING (public.is_org_member(organization_id, auth.uid()));

-- =====================================================
-- FIX: AI USAGE POLICIES
-- =====================================================

DROP POLICY IF EXISTS ai_usage_member ON ai_usage;
CREATE POLICY ai_usage_member ON ai_usage
  FOR ALL USING (public.is_org_member(organization_id, auth.uid()));
