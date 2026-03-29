-- Check test user's status
SELECT
  u.id as user_id,
  u.email,
  om.role as org_role,
  om.organization_id
FROM users u
JOIN org_members om ON om.user_id = u.id
WHERE u.email = 'wollie333@gmail.com';

-- Check if they have any permissions set
SELECT
  tp.feature,
  tp.permissions
FROM team_permissions tp
JOIN users u ON u.id = tp.user_id
WHERE u.email = 'wollie333@gmail.com';

-- Check if they're in any workspaces
SELECT
  w.name as workspace_name,
  wm.role as workspace_role
FROM workspace_members wm
JOIN workspaces w ON w.id = wm.workspace_id
JOIN users u ON u.id = wm.user_id
WHERE u.email = 'wollie333@gmail.com';
