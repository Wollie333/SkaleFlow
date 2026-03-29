-- =====================================================
-- FIX PERMISSION_TEMPLATES TABLE STRUCTURE
-- Adds missing columns if they don't exist
-- =====================================================

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add is_system_template column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'permission_templates'
    AND column_name = 'is_system_template'
  ) THEN
    ALTER TABLE permission_templates
    ADD COLUMN is_system_template BOOLEAN DEFAULT false;
  END IF;

  -- Add sort_order column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'permission_templates'
    AND column_name = 'sort_order'
  ) THEN
    ALTER TABLE permission_templates
    ADD COLUMN sort_order INTEGER DEFAULT 0;
  END IF;

  -- Add organization_id column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'permission_templates'
    AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE permission_templates
    ADD COLUMN organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
  END IF;

  -- Add description column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'permission_templates'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE permission_templates
    ADD COLUMN description TEXT;
  END IF;

  -- Add timestamps if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'permission_templates'
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE permission_templates
    ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'permission_templates'
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE permission_templates
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_permission_templates_org ON permission_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_permission_templates_system ON permission_templates(is_system_template) WHERE is_system_template = true;

-- Add unique constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'unique_template_name'
  ) THEN
    ALTER TABLE permission_templates
    ADD CONSTRAINT unique_template_name UNIQUE NULLS NOT DISTINCT (organization_id, name);
  END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE permission_templates ENABLE ROW LEVEL SECURITY;

-- Drop old policies if they exist
DROP POLICY IF EXISTS "permission_templates_select" ON permission_templates;
DROP POLICY IF EXISTS "permission_templates_insert" ON permission_templates;
DROP POLICY IF EXISTS "permission_templates_update" ON permission_templates;
DROP POLICY IF EXISTS "permission_templates_delete" ON permission_templates;

-- Create policies
CREATE POLICY "permission_templates_select" ON permission_templates
  FOR SELECT USING (
    is_system_template = true
    OR organization_id IN (
      SELECT organization_id FROM org_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "permission_templates_insert" ON permission_templates
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    AND is_system_template = false
  );

CREATE POLICY "permission_templates_update" ON permission_templates
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    AND is_system_template = false
  );

CREATE POLICY "permission_templates_delete" ON permission_templates
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM org_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
    AND is_system_template = false
  );

-- Verify structure
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'permission_templates'
ORDER BY ordinal_position;
