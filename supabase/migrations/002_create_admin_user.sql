-- Create Admin User: Wollie Steenkamp
-- Run this in Supabase SQL Editor after the initial schema
--
-- IMPORTANT: The users.id MUST match the Supabase Auth user ID (auth.uid()).
-- First create the auth user in the Supabase Dashboard (Authentication > Users > Add user),
-- then copy that user's UUID and paste it below.
--
-- To find your auth user ID, run:
--   SELECT id FROM auth.users WHERE email = 'wollie@manamarketing.co.za';

-- Create the admin user record (replace AUTH_USER_UUID with the actual auth user ID)
INSERT INTO users (id, email, full_name, role, email_verified, onboarding_completed, approved)
VALUES (
  -- IMPORTANT: Replace this with the UUID from auth.users for this email
  (SELECT id FROM auth.users WHERE email = 'wollie@manamarketing.co.za'),
  'wollie@manamarketing.co.za',
  'Wollie Steenkamp',
  'super_admin',
  true,
  true,
  true
);

-- Create the organization
INSERT INTO organizations (id, name, slug, owner_id, brand_engine_status)
SELECT
  gen_random_uuid(),
  'Mana',
  'mana',
  u.id,
  'not_started'
FROM users u
WHERE u.email = 'wollie@manamarketing.co.za';

-- Link user to organization as owner
INSERT INTO org_members (organization_id, user_id, role)
SELECT o.id, u.id, 'owner'
FROM users u
JOIN organizations o ON o.owner_id = u.id
WHERE u.email = 'wollie@manamarketing.co.za';

-- Create an active subscription (for testing)
INSERT INTO subscriptions (organization_id, tier_id, status, current_period_end)
SELECT
  o.id,
  t.id,
  'active',
  NOW() + INTERVAL '30 days'
FROM organizations o
JOIN users u ON o.owner_id = u.id
JOIN subscription_tiers t ON t.slug = 'growth'
WHERE u.email = 'wollie@manamarketing.co.za';
