-- Migration 014: Remove phases 11 (Content Calendar) and 12 (Implementation)
-- These are now handled by the Content Engine, so they're redundant in the Brand Engine.

-- 1. Delete brand_outputs linked to phase 11 and 12
DELETE FROM brand_outputs
WHERE phase_id IN (
  SELECT id FROM brand_phases WHERE phase_number IN ('11', '12')
);

-- 2. Delete brand_conversations linked to phase 11 and 12
DELETE FROM brand_conversations
WHERE phase_id IN (
  SELECT id FROM brand_phases WHERE phase_number IN ('11', '12')
);

-- 3. Delete the phase rows themselves
DELETE FROM brand_phases WHERE phase_number IN ('11', '12');

-- 4. Replace the trigger function so new organizations don't get phases 11 and 12
CREATE OR REPLACE FUNCTION create_default_brand_phases()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO brand_phases (organization_id, phase_number, phase_name, sort_order)
  VALUES
    (NEW.id, '1', 'Brand Substance', 1),
    (NEW.id, '2', 'ICP Definition', 2),
    (NEW.id, '2A', 'Enemy Definition', 3),
    (NEW.id, '3', 'Offer Design', 4),
    (NEW.id, '4', 'Brandable Naming', 5),
    (NEW.id, '5', 'Positioning', 6),
    (NEW.id, '6A', 'Brand Vocabulary', 7),
    (NEW.id, '6B', 'Messaging Framework', 8),
    (NEW.id, '7', 'Brand Governance', 9),
    (NEW.id, '8', 'Website Architecture', 10),
    (NEW.id, '8A', 'Content Themes', 11),
    (NEW.id, '8B', 'Homepage Copy', 12),
    (NEW.id, '8C', 'Sales Page Copy', 13),
    (NEW.id, '8D', 'Supporting Pages', 14),
    (NEW.id, '8E', 'Conversion Pages', 15),
    (NEW.id, '8F', 'Visual Direction', 16),
    (NEW.id, '9', 'Conversion System', 17),
    (NEW.id, '10', 'Authority System', 18);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
