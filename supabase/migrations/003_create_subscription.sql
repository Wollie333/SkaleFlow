-- Create subscription for admin user
-- Run this after 002_create_admin_user.sql

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
