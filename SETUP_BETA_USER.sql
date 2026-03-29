-- ================================================
-- SETUP BETA USER SCRIPT
-- ================================================
-- Run this script in Supabase SQL Editor to create
-- your first beta user: sumasteenkamp@gmail.com
-- ================================================

-- STEP 1: Create the beta user
-- ================================================
SELECT * FROM create_beta_user(
  'sumasteenkamp@gmail.com',
  'Suma Steenkamp'
);

-- Expected output:
-- user_id: <uuid>
-- org_id: <uuid>
-- message: "Beta user created successfully. User must purchase credits to use AI features."

-- ================================================
-- STEP 2: Verify the setup
-- ================================================

-- Check user was created
SELECT
  id,
  email,
  full_name,
  role,
  approved,
  created_at
FROM users
WHERE email = 'sumasteenkamp@gmail.com';

-- Check organization was created
SELECT
  o.id,
  o.name,
  o.slug,
  o.owner_id,
  st.name AS tier_name,
  st.slug AS tier_slug,
  s.status AS subscription_status
FROM users u
JOIN organizations o ON o.owner_id = u.id
JOIN subscriptions s ON s.organization_id = o.id
JOIN subscription_tiers st ON st.id = s.tier_id
WHERE u.email = 'sumasteenkamp@gmail.com';

-- Check credit balance (should be 0 monthly + 0 topup)
SELECT
  cb.organization_id,
  cb.monthly_credits_total,
  cb.monthly_credits_remaining,
  cb.topup_credits_remaining,
  (cb.monthly_credits_remaining + cb.topup_credits_remaining) AS total_credits
FROM users u
JOIN org_members om ON om.user_id = u.id
JOIN credit_balances cb ON cb.organization_id = om.organization_id
WHERE u.email = 'sumasteenkamp@gmail.com';

-- Check feature access using the helper view
SELECT
  email,
  full_name,
  organization_name,
  org_role,
  tier_name,
  tier_slug,
  tier_features,
  monthly_credits_remaining,
  topup_credits_remaining,
  total_credits
FROM user_feature_access
WHERE email = 'sumasteenkamp@gmail.com';

-- ================================================
-- STEP 3: Test feature access
-- ================================================

-- Get the user_id and org_id for testing
DO $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
BEGIN
  SELECT u.id, om.organization_id INTO v_user_id, v_org_id
  FROM users u
  JOIN org_members om ON om.user_id = u.id
  WHERE u.email = 'sumasteenkamp@gmail.com';

  -- Test Brand Engine access (should be TRUE)
  RAISE NOTICE 'Brand Engine access: %',
    (SELECT allowed FROM check_feature_access(v_user_id, v_org_id, 'brand_engine'));

  -- Test Content Engine access (should be TRUE)
  RAISE NOTICE 'Content Engine access: %',
    (SELECT allowed FROM check_feature_access(v_user_id, v_org_id, 'content_engine'));

  -- Test Analytics access (should be FALSE)
  RAISE NOTICE 'Analytics access: %',
    (SELECT allowed FROM check_feature_access(v_user_id, v_org_id, 'analytics'));

  -- Test Team access (should be FALSE)
  RAISE NOTICE 'Team access: %',
    (SELECT allowed FROM check_feature_access(v_user_id, v_org_id, 'team'));

  -- Test Pipeline access (should be FALSE)
  RAISE NOTICE 'Pipeline access: %',
    (SELECT allowed FROM check_feature_access(v_user_id, v_org_id, 'pipeline'));

  -- Test Ad Campaigns access (should be FALSE)
  RAISE NOTICE 'Ad Campaigns access: %',
    (SELECT allowed FROM check_feature_access(v_user_id, v_org_id, 'ad_campaigns'));
END $$;

-- ================================================
-- STEP 4: (Optional) Grant topup credits for testing
-- ================================================
-- Uncomment below to give the user 1000 test credits

-- UPDATE credit_balances
-- SET
--   topup_credits_remaining = 1000,
--   updated_at = NOW()
-- WHERE organization_id = (
--   SELECT om.organization_id
--   FROM users u
--   JOIN org_members om ON om.user_id = u.id
--   WHERE u.email = 'sumasteenkamp@gmail.com'
-- );

-- -- Record the credit grant
-- INSERT INTO credit_transactions (
--   organization_id,
--   amount,
--   transaction_type,
--   description,
--   balance_after
-- )
-- SELECT
--   om.organization_id,
--   1000,
--   'admin_adjustment',
--   'Beta testing credits grant',
--   1000
-- FROM users u
-- JOIN org_members om ON om.user_id = u.id
-- WHERE u.email = 'sumasteenkamp@gmail.com';

-- ================================================
-- STEP 5: (Optional) Upgrade to paid tier later
-- ================================================
-- When ready to upgrade the user to a paid tier:

-- SELECT * FROM upgrade_user_tier(
--   'sumasteenkamp@gmail.com',
--   'foundation'  -- or 'momentum' or 'authority'
-- );
