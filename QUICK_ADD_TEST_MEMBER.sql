-- =====================================================
-- QUICKEST PATH: Add yourself as a test member
-- This creates a second membership for testing
-- =====================================================

-- Step 1: Get your current user_id and org_id
WITH current_user AS (
  SELECT
    u.id as user_id,
    u.email,
    om.organization_id,
    o.name as org_name
  FROM users u
  JOIN org_members om ON om.user_id = u.id
  JOIN organizations o ON o.id = om.organization_id
  WHERE om.role = 'owner'
  LIMIT 1
)
SELECT * FROM current_user;

-- Step 2: Create a test user in Supabase Auth Dashboard first
-- Go to: Authentication → Users → Add user
-- Email: test@example.com
-- Password: TestPassword123!
-- Auto Confirm User: YES
-- Then copy the UUID and paste below

-- Step 3: Add the test user to your org (REPLACE THE UUIDs)
/*
INSERT INTO org_members (user_id, organization_id, role, created_at)
VALUES (
  'PASTE_TEST_USER_UUID_HERE',  -- UUID from Supabase Auth
  (SELECT organization_id FROM org_members WHERE user_id = (SELECT id FROM users WHERE email = 'wollie@manamarketing.co.za') LIMIT 1),
  'member',
  NOW()
);
*/

-- Step 4: Verify the member was added
SELECT
  u.email,
  om.role,
  o.name as org_name,
  om.created_at
FROM org_members om
JOIN users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.organization_id
ORDER BY om.created_at DESC
LIMIT 5;
