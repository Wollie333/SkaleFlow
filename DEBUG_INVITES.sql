-- Check if invite was created
SELECT
  id,
  email,
  role,
  status,
  created_at,
  sent_at,
  expires_at,
  token
FROM org_invites
WHERE email = 'wollie333@gmail.com'
ORDER BY created_at DESC
LIMIT 1;

-- Check all invites
SELECT
  email,
  status,
  created_at,
  sent_at
FROM org_invites
ORDER BY created_at DESC
LIMIT 5;
