-- ================================================
-- SIMPLIFIED PERMISSIONS SYSTEM
-- ================================================
-- This migration simplifies the permission system:
-- 1. Creates Beta tier (0 credits, limited features)
-- 2. Updates all tiers with clear feature definitions
-- 3. Adds helper functions to manage beta users
-- 4. Simplifies user roles
-- ================================================

-- ================================================
-- STEP 1: Update Subscription Tiers with Clear Features
-- ================================================

-- Beta Tier (NEW)
INSERT INTO subscription_tiers (
  name,
  slug,
  description,
  price_monthly,
  monthly_credits,
  features,
  sort_order
) VALUES (
  'Beta',
  'beta',
  'Beta access - Brand Engine and Content Engine only. Buy credits to use AI features.',
  0,
  0,
  '{
    "brand_engine": true,
    "content_engine": true,
    "analytics": false,
    "team": false,
    "pipeline": false,
    "ad_campaigns": false
  }'::jsonb,
  0
) ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price_monthly = EXCLUDED.price_monthly,
  monthly_credits = EXCLUDED.monthly_credits,
  features = EXCLUDED.features,
  sort_order = EXCLUDED.sort_order;

-- Foundation Tier (UPDATE)
UPDATE subscription_tiers SET
  features = '{
    "brand_engine": true,
    "content_engine": true,
    "analytics": true,
    "team": false,
    "pipeline": false,
    "ad_campaigns": false
  }'::jsonb,
  sort_order = 1
WHERE slug = 'foundation';

-- Momentum Tier (UPDATE)
UPDATE subscription_tiers SET
  features = '{
    "brand_engine": true,
    "content_engine": true,
    "analytics": true,
    "team": false,
    "pipeline": true,
    "ad_campaigns": true
  }'::jsonb,
  sort_order = 2
WHERE slug = 'momentum';

-- Authority Tier (UPDATE)
UPDATE subscription_tiers SET
  features = '{
    "brand_engine": true,
    "content_engine": true,
    "analytics": true,
    "team": true,
    "pipeline": true,
    "ad_campaigns": true
  }'::jsonb,
  sort_order = 3
WHERE slug = 'authority';

-- ================================================
-- STEP 2: Helper Function - Create Beta User
-- ================================================

CREATE OR REPLACE FUNCTION create_beta_user(
  p_email TEXT,
  p_full_name TEXT
) RETURNS TABLE(
  user_id UUID,
  org_id UUID,
  message TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_beta_tier_id UUID;
  v_org_slug TEXT;
BEGIN
  -- Check if user already exists
  SELECT id INTO v_user_id FROM users WHERE email = p_email;

  IF v_user_id IS NOT NULL THEN
    RETURN QUERY SELECT
      v_user_id,
      NULL::UUID,
      'User already exists with email: ' || p_email;
    RETURN;
  END IF;

  -- Get beta tier ID
  SELECT id INTO v_beta_tier_id FROM subscription_tiers WHERE slug = 'beta';

  IF v_beta_tier_id IS NULL THEN
    RAISE EXCEPTION 'Beta tier not found. Please run migration first.';
  END IF;

  -- Generate unique org slug
  v_org_slug := LOWER(REGEXP_REPLACE(p_full_name, '[^a-zA-Z0-9]', '-', 'g'));
  v_org_slug := REGEXP_REPLACE(v_org_slug, '-+', '-', 'g');
  v_org_slug := TRIM(BOTH '-' FROM v_org_slug);

  -- Make slug unique if needed
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = v_org_slug) LOOP
    v_org_slug := v_org_slug || '-' || FLOOR(RANDOM() * 1000)::TEXT;
  END LOOP;

  -- Create user
  INSERT INTO users (
    email,
    full_name,
    role,
    approved
  ) VALUES (
    p_email,
    p_full_name,
    'client',
    true
  ) RETURNING id INTO v_user_id;

  -- Create organization
  INSERT INTO organizations (
    name,
    slug,
    owner_id
  ) VALUES (
    p_full_name || '''s Organization',
    v_org_slug,
    v_user_id
  ) RETURNING id INTO v_org_id;

  -- Create org membership (owner)
  INSERT INTO org_members (
    organization_id,
    user_id,
    role
  ) VALUES (
    v_org_id,
    v_user_id,
    'owner'
  );

  -- Create beta subscription
  INSERT INTO subscriptions (
    organization_id,
    tier_id,
    status,
    current_period_start,
    current_period_end
  ) VALUES (
    v_org_id,
    v_beta_tier_id,
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 year' -- Beta never expires
  );

  -- Create credit balance with 0 monthly credits
  INSERT INTO credit_balances (
    organization_id,
    monthly_credits_total,
    monthly_credits_remaining,
    topup_credits_remaining,
    period_start,
    period_end
  ) VALUES (
    v_org_id,
    0, -- NO monthly credits
    0,
    0, -- Starts with 0 topup credits too
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '1 month'
  );

  -- Return success
  RETURN QUERY SELECT
    v_user_id,
    v_org_id,
    'Beta user created successfully. User must purchase credits to use AI features.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- STEP 3: Helper Function - Upgrade User Tier
-- ================================================

CREATE OR REPLACE FUNCTION upgrade_user_tier(
  p_email TEXT,
  p_new_tier_slug TEXT
) RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_new_tier_id UUID;
  v_new_monthly_credits INT;
BEGIN
  -- Find user
  SELECT id INTO v_user_id FROM users WHERE email = p_email;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'User not found: ' || p_email;
    RETURN;
  END IF;

  -- Get org
  SELECT organization_id INTO v_org_id
  FROM org_members
  WHERE user_id = v_user_id AND role IN ('owner', 'admin')
  LIMIT 1;

  IF v_org_id IS NULL THEN
    RETURN QUERY SELECT false, 'No organization found for user';
    RETURN;
  END IF;

  -- Get new tier
  SELECT id, monthly_credits INTO v_new_tier_id, v_new_monthly_credits
  FROM subscription_tiers
  WHERE slug = p_new_tier_slug;

  IF v_new_tier_id IS NULL THEN
    RETURN QUERY SELECT false, 'Tier not found: ' || p_new_tier_slug;
    RETURN;
  END IF;

  -- Update subscription
  UPDATE subscriptions
  SET tier_id = v_new_tier_id,
      updated_at = CURRENT_TIMESTAMP
  WHERE organization_id = v_org_id;

  -- Update credit balance
  UPDATE credit_balances
  SET monthly_credits_total = v_new_monthly_credits,
      monthly_credits_remaining = v_new_monthly_credits,
      updated_at = CURRENT_TIMESTAMP
  WHERE organization_id = v_org_id;

  RETURN QUERY SELECT true, 'User upgraded to ' || p_new_tier_slug || ' tier with ' || v_new_monthly_credits::TEXT || ' monthly credits';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- STEP 4: Helper Function - Check Feature Access
-- ================================================

CREATE OR REPLACE FUNCTION check_feature_access(
  p_user_id UUID,
  p_org_id UUID,
  p_feature TEXT
) RETURNS TABLE(
  allowed BOOLEAN,
  reason TEXT,
  tier_name TEXT
) AS $$
DECLARE
  v_user_role TEXT;
  v_org_role TEXT;
  v_tier_features JSONB;
  v_tier_name TEXT;
  v_feature_allowed BOOLEAN;
BEGIN
  -- Check if super admin
  SELECT role INTO v_user_role FROM users WHERE id = p_user_id;

  IF v_user_role = 'super_admin' THEN
    RETURN QUERY SELECT true, 'Super admin access'::TEXT, 'Super Admin'::TEXT;
    RETURN;
  END IF;

  -- Get org role
  SELECT role INTO v_org_role
  FROM org_members
  WHERE user_id = p_user_id AND organization_id = p_org_id;

  IF v_org_role IS NULL THEN
    RETURN QUERY SELECT false, 'Not a member of this organization'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Get tier features
  SELECT st.features, st.name INTO v_tier_features, v_tier_name
  FROM subscriptions s
  JOIN subscription_tiers st ON st.id = s.tier_id
  WHERE s.organization_id = p_org_id
    AND s.status = 'active';

  IF v_tier_features IS NULL THEN
    RETURN QUERY SELECT false, 'No active subscription found'::TEXT, NULL::TEXT;
    RETURN;
  END IF;

  -- Check if tier includes feature
  v_feature_allowed := COALESCE((v_tier_features->>p_feature)::BOOLEAN, false);

  IF NOT v_feature_allowed THEN
    RETURN QUERY SELECT
      false,
      'Feature not included in ' || v_tier_name || ' tier'::TEXT,
      v_tier_name;
    RETURN;
  END IF;

  -- Feature is allowed by tier, check org role
  IF v_org_role IN ('owner', 'admin') THEN
    RETURN QUERY SELECT true, 'Full access'::TEXT, v_tier_name;
  ELSE
    -- Members get limited access (read-only for most features)
    RETURN QUERY SELECT true, 'Limited access (member role)'::TEXT, v_tier_name;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- STEP 5: Helper View - User Feature Access Summary
-- ================================================

CREATE OR REPLACE VIEW user_feature_access AS
SELECT
  u.id AS user_id,
  u.email,
  u.full_name,
  o.id AS organization_id,
  o.name AS organization_name,
  om.role AS org_role,
  st.name AS tier_name,
  st.slug AS tier_slug,
  st.features AS tier_features,
  cb.monthly_credits_remaining,
  cb.topup_credits_remaining,
  (cb.monthly_credits_remaining + cb.topup_credits_remaining) AS total_credits
FROM users u
LEFT JOIN org_members om ON om.user_id = u.id
LEFT JOIN organizations o ON o.id = om.organization_id
LEFT JOIN subscriptions s ON s.organization_id = o.id AND s.status = 'active'
LEFT JOIN subscription_tiers st ON st.id = s.tier_id
LEFT JOIN credit_balances cb ON cb.organization_id = o.id;

-- ================================================
-- STEP 6: Grant Permissions
-- ================================================

GRANT EXECUTE ON FUNCTION create_beta_user(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION upgrade_user_tier(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_feature_access(UUID, UUID, TEXT) TO authenticated;
GRANT SELECT ON user_feature_access TO authenticated;

-- ================================================
-- DONE
-- ================================================

COMMENT ON FUNCTION create_beta_user IS 'Creates a new beta user with 0 credits and limited feature access (brand + content only)';
COMMENT ON FUNCTION upgrade_user_tier IS 'Upgrades a user to a different subscription tier';
COMMENT ON FUNCTION check_feature_access IS 'Checks if a user can access a specific feature based on tier and role';
COMMENT ON VIEW user_feature_access IS 'Summary view of all users with their tier, features, and credit balances';
