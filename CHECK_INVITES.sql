-- Check if invite exists for wollie333@gmail.com
SELECT
  id,
  email,
  organization_id,
  invited_by,
  role,
  status,
  token,
  expires_at,
  created_at,
  sent_at
FROM org_invites
WHERE email = 'wollie333@gmail.com'
ORDER BY created_at DESC;

-- Check all recent invites
SELECT
  email,
  role,
  status,
  created_at,
  sent_at,
  expires_at
FROM org_invites
ORDER BY created_at DESC
LIMIT 10;
