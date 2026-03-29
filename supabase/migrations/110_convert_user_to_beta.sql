-- ================================================
-- CONVERT SPECIFIC USER TO BETA TIER
-- ================================================
-- This migration converts sumasteenkamp@gmail.com to beta tier
-- Run this after migration 109 (simplified permissions system)
-- ================================================

DO $$
DECLARE
  v_beta_tier_id UUID;
  v_org_id UUID;
  v_user_id UUID := '63102121-2062-4d91-9120-19f28a120a16'; -- sumasteenkamp@gmail.com
  v_current_tier TEXT;
BEGIN
  -- Get beta tier ID
  SELECT id INTO v_beta_tier_id FROM subscription_tiers WHERE slug = 'beta';

  IF v_beta_tier_id IS NULL THEN
    RAISE EXCEPTION 'Beta tier not found. Please run migration 109 first.';
  END IF;

  -- Get user's org
  SELECT organization_id INTO v_org_id
  FROM org_members
  WHERE user_id = v_user_id
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'User has no organization';
  END IF;

  -- Get current tier for logging
  SELECT st.slug INTO v_current_tier
  FROM subscriptions s
  JOIN subscription_tiers st ON st.id = s.tier_id
  WHERE s.organization_id = v_org_id AND s.status = 'active';

  RAISE NOTICE 'Converting user from % tier to beta tier', COALESCE(v_current_tier, 'no');

  -- Update subscription to beta tier
  UPDATE subscriptions
  SET
    tier_id = v_beta_tier_id,
    status = 'active',
    updated_at = CURRENT_TIMESTAMP,
    current_period_start = CURRENT_TIMESTAMP,
    current_period_end = CURRENT_TIMESTAMP + INTERVAL '1 year'
  WHERE organization_id = v_org_id;

  -- Set credits to 0 (beta tier = no monthly credits)
  UPDATE credit_balances
  SET
    monthly_credits_total = 0,
    monthly_credits_remaining = 0,
    topup_credits_remaining = 0, -- Reset topup credits too
    period_start = CURRENT_TIMESTAMP,
    period_end = CURRENT_TIMESTAMP + INTERVAL '1 month',
    updated_at = CURRENT_TIMESTAMP
  WHERE organization_id = v_org_id;

  -- Log the conversion
  RAISE NOTICE 'Successfully converted sumasteenkamp@gmail.com to beta tier';
  RAISE NOTICE 'Organization ID: %', v_org_id;
  RAISE NOTICE 'Beta tier ID: %', v_beta_tier_id;
  RAISE NOTICE 'Credits set to 0 (user must purchase topup credits)';
END $$;

-- ================================================
-- Verify the conversion
-- ================================================

SELECT
  u.email,
  u.full_name,
  o.name AS org_name,
  st.name AS tier_name,
  st.slug AS tier_slug,
  st.features,
  cb.monthly_credits_remaining,
  cb.topup_credits_remaining,
  (cb.monthly_credits_remaining + cb.topup_credits_remaining) AS total_credits
FROM users u
JOIN org_members om ON om.user_id = u.id
JOIN organizations o ON o.id = om.organization_id
JOIN subscriptions s ON s.organization_id = o.id AND s.status = 'active'
JOIN subscription_tiers st ON st.id = s.tier_id
JOIN credit_balances cb ON cb.organization_id = o.id
WHERE u.id = '63102121-2062-4d91-9120-19f28a120a16';

-- Expected output:
-- tier_name: "Beta"
-- tier_slug: "beta"
-- features: {"team": false, "pipeline": false, "analytics": false, "brand_engine": true, "ad_campaigns": false, "content_engine": true}
-- monthly_credits_remaining: 0
-- topup_credits_remaining: 0
-- total_credits: 0
