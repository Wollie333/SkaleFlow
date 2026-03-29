-- Mark the invite for wollie333@gmail.com as accepted
UPDATE org_invites
SET
  status = 'accepted',
  accepted_at = NOW()
WHERE email = 'wollie333@gmail.com'
AND status = 'pending';

-- Verify it was updated
SELECT
  email,
  status,
  accepted_at,
  created_at
FROM org_invites
WHERE email = 'wollie333@gmail.com';
