-- Migration 100: Fix brand_phases trigger to set workspace_id
-- Updates the create_default_brand_phases trigger to set workspace_id from the default workspace

-- Drop and recreate the function to include workspace_id
CREATE OR REPLACE FUNCTION create_default_brand_phases()
RETURNS TRIGGER AS $$
DECLARE
  default_workspace_id UUID;
BEGIN
  -- Get the default workspace for this organization
  SELECT id INTO default_workspace_id
  FROM workspaces
  WHERE organization_id = NEW.id
  AND is_default = TRUE
  LIMIT 1;

  -- If no default workspace exists yet, create one
  IF default_workspace_id IS NULL THEN
    INSERT INTO workspaces (
      organization_id,
      name,
      slug,
      is_default,
      created_by,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      'Default Workspace',
      'default',
      TRUE,
      NEW.created_by,
      NOW(),
      NOW()
    )
    RETURNING id INTO default_workspace_id;
  END IF;

  -- Create brand phases with workspace_id
  INSERT INTO brand_phases (organization_id, workspace_id, phase_number, phase_name, sort_order)
  VALUES
    (NEW.id, default_workspace_id, '1', 'Brand Substance', 1),
    (NEW.id, default_workspace_id, '2', 'ICP Definition', 2),
    (NEW.id, default_workspace_id, '2A', 'Enemy Definition', 3),
    (NEW.id, default_workspace_id, '3', 'Offer Design', 4),
    (NEW.id, default_workspace_id, '4', 'Brandable Naming', 5),
    (NEW.id, default_workspace_id, '5', 'Positioning', 6),
    (NEW.id, default_workspace_id, '6A', 'Brand Vocabulary', 7),
    (NEW.id, default_workspace_id, '6B', 'Messaging Framework', 8),
    (NEW.id, default_workspace_id, '7', 'Brand Governance', 9),
    (NEW.id, default_workspace_id, '8', 'Website Architecture', 10),
    (NEW.id, default_workspace_id, '8A', 'Content Themes', 11),
    (NEW.id, default_workspace_id, '8B', 'Homepage Copy', 12),
    (NEW.id, default_workspace_id, '8C', 'Sales Page Copy', 13),
    (NEW.id, default_workspace_id, '8D', 'Supporting Pages', 14),
    (NEW.id, default_workspace_id, '8E', 'Conversion Pages', 15),
    (NEW.id, default_workspace_id, '8F', 'Visual Direction', 16),
    (NEW.id, default_workspace_id, '9', 'Conversion System', 17),
    (NEW.id, default_workspace_id, '10', 'Authority System', 18),
    (NEW.id, default_workspace_id, '11', 'Content Calendar', 19),
    (NEW.id, default_workspace_id, '12', 'Final Review', 20);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fix any existing brand_phases that don't have workspace_id
UPDATE brand_phases bp
SET workspace_id = (
  SELECT id FROM workspaces w
  WHERE w.organization_id = bp.organization_id
  AND w.is_default = TRUE
  LIMIT 1
)
WHERE workspace_id IS NULL;

-- Verify all brand_phases have workspace_id
DO $$
DECLARE
  null_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_count FROM brand_phases WHERE workspace_id IS NULL;
  IF null_count > 0 THEN
    RAISE EXCEPTION 'Migration validation failed: % brand_phases records without workspace_id', null_count;
  END IF;
  RAISE NOTICE 'Migration 100 complete: All brand_phases have workspace_id';
END $$;
