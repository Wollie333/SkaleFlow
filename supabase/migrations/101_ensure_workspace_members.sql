-- Migration 101: Ensure all org members are in workspace_members
-- Fixes any users who weren't added to their default workspace

-- Add any org members who aren't in workspace_members yet
INSERT INTO workspace_members (workspace_id, user_id, organization_id, role, added_at)
SELECT
  w.id as workspace_id,
  om.user_id,
  om.organization_id,
  CASE
    WHEN om.role IN ('owner', 'admin') THEN 'admin'
    WHEN om.role = 'member' THEN 'member'
    ELSE 'viewer'
  END as role,
  NOW() as added_at
FROM org_members om
INNER JOIN workspaces w ON w.organization_id = om.organization_id AND w.is_default = TRUE
WHERE NOT EXISTS (
  SELECT 1 FROM workspace_members wm
  WHERE wm.user_id = om.user_id
  AND wm.organization_id = om.organization_id
  AND wm.workspace_id = w.id
);

-- Verify all org members now have workspace memberships
DO $$
DECLARE
  missing_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO missing_count
  FROM org_members om
  WHERE NOT EXISTS (
    SELECT 1 FROM workspace_members wm
    WHERE wm.user_id = om.user_id
    AND wm.organization_id = om.organization_id
  );

  IF missing_count > 0 THEN
    RAISE WARNING 'Still have % org members without workspace memberships', missing_count;
  ELSE
    RAISE NOTICE 'Migration 101 complete: All org members have workspace memberships';
  END IF;
END $$;
