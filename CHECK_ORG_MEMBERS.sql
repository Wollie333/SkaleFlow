-- Check if you have any organization members
SELECT
  u.email,
  om.role,
  om.created_at,
  o.name as org_name
FROM org_members om
JOIN users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.organization_id
ORDER BY om.created_at DESC
LIMIT 10;

-- Count members per org
SELECT
  o.name as organization_name,
  COUNT(om.id) as member_count
FROM organizations o
LEFT JOIN org_members om ON om.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY member_count DESC;
