-- Check if permission_templates table exists and has data
SELECT 
  COUNT(*) as total_templates,
  COUNT(*) FILTER (WHERE is_system_template = true) as system_templates,
  COUNT(*) FILTER (WHERE is_system_template = false) as custom_templates
FROM permission_templates;

-- Show all templates
SELECT 
  name, 
  is_system_template, 
  sort_order,
  description
FROM permission_templates
ORDER BY is_system_template DESC, sort_order ASC;
