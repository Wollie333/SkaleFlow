-- Migration 102: Fix workspace_members RLS policies
-- Removes circular dependency that causes 500 errors

-- Drop existing policies
DROP POLICY IF EXISTS "workspace_members_select" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_insert" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_update" ON workspace_members;
DROP POLICY IF EXISTS "workspace_members_delete" ON workspace_members;

-- Simpler SELECT policy without circular dependency
-- Users can see their own memberships + org admins can see all memberships in their org
CREATE POLICY "workspace_members_select" ON workspace_members
  FOR SELECT USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- INSERT policy: Only org admins can add members
CREATE POLICY "workspace_members_insert" ON workspace_members
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- UPDATE policy: Org admins can update any membership in their org
CREATE POLICY "workspace_members_update" ON workspace_members
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- DELETE policy: Org admins can remove members
CREATE POLICY "workspace_members_delete" ON workspace_members
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
