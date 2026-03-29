-- =====================================================
-- QUICK TEST: Add wollie333@gmail.com as test member
-- Bypasses email invite for immediate testing
-- =====================================================

-- Step 1: Check if user already exists
SELECT id, email FROM users WHERE email = 'wollie333@gmail.com';

-- If user doesn't exist, you'll need to create via Supabase Auth first
-- OR we can add your CURRENT user to the org as a second member

-- Step 2: Get your current user ID and org ID
SELECT
  u.id as user_id,
  u.email,
  om.organization_id,
  o.name as org_name
FROM users u
JOIN org_members om ON om.user_id = u.id
JOIN organizations o ON o.id = om.organization_id
WHERE u.email = 'wollie@manamarketing.co.za'
LIMIT 1;

-- Copy the user_id and organization_id from above, then run this:
-- (Replace USER_ID and ORG_ID with actual values)

/*
INSERT INTO org_members (user_id, organization_id, role, created_at)
VALUES (
  'USER_ID_HERE',  -- Your user ID
  'ORG_ID_HERE',   -- Your org ID
  'member',        -- Role: member (not owner/admin)
  NOW()
)
ON CONFLICT (user_id, organization_id) DO NOTHING;
*/

-- Step 3: Verify member was added
SELECT
  u.email,
  om.role,
  o.name as org_name
FROM org_members om
JOIN users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.organization_id
ORDER BY om.created_at DESC
LIMIT 5;
