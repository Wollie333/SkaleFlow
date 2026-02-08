-- Migration 025: Restructure Brand Engine to 10 clean phases
-- Old phases: 1, 2, 2A, 3, 4, 5, 6A, 6B, 7, 8, 8A, 8B, 8C, 8D, 8E, 8F, 9, 10
-- New phases: 1-10 (clean numbering)
--
-- Phase mapping:
--   OLD 1 (Brand Substance)     → NEW 1 (Brand Foundation)
--   OLD 2 (ICP Definition)      → NEW 2 (Ideal Customer)
--   OLD 2A (Enemy Definition)   → NEW 3 (Market Enemy)
--   OLD 3 (Offer Design)        → NEW 4 (Offer & Lead Magnet) — merged with old 4
--   OLD 4 (Brandable Naming)    → NEW 4 (merged into new 4, then deleted)
--   OLD 5 (Positioning)         → NEW 5 (Market Positioning)
--   OLD 6A (Brand Vocabulary)   → NEW 6 (Brand Voice & Messaging) — merged with old 6B
--   OLD 6B (Messaging Framework)→ NEW 6 (merged into new 6, then deleted)
--   OLD 7 (Brand Governance)    → NEW 7 (Visual Identity)
--   OLD 8F (Visual Direction)   → NEW 8 (Design System)
--   OLD 8 (Website Architecture)→ NEW 9 (Website Strategy & Copy) — merged with 8A-8E
--   OLD 8A-8E (various copy)    → NEW 9 (merged into new 9, then deleted)
--   OLD 9 (Conversion System)   → NEW 10 (Growth Engine) — merged with old 10
--   OLD 10 (Authority System)   → NEW 10 (merged into new 10, then deleted)

-- ============================================================
-- STEP 1: Rename ALL surviving phases to temp_ names to avoid
--         unique constraint collisions during renumbering.
--         Phases that will be MERGED (deleted) keep their names.
-- ============================================================

UPDATE brand_phases SET phase_number = 'temp_1',  phase_name = 'Brand Foundation',        sort_order = 1  WHERE phase_number = '1';
UPDATE brand_phases SET phase_number = 'temp_2',  phase_name = 'Ideal Customer',           sort_order = 2  WHERE phase_number = '2';
UPDATE brand_phases SET phase_number = 'temp_3',  phase_name = 'Market Enemy',             sort_order = 3  WHERE phase_number = '2A';
UPDATE brand_phases SET phase_number = 'temp_4',  phase_name = 'Offer & Lead Magnet',      sort_order = 4  WHERE phase_number = '3';
-- OLD '4' stays as '4' for now (will be merged into temp_4, then deleted)
UPDATE brand_phases SET phase_number = 'temp_5',  phase_name = 'Market Positioning',       sort_order = 5  WHERE phase_number = '5';
UPDATE brand_phases SET phase_number = 'temp_6',  phase_name = 'Brand Voice & Messaging',  sort_order = 6  WHERE phase_number = '6A';
-- OLD '6B' stays as '6B' for now (will be merged into temp_6, then deleted)
UPDATE brand_phases SET phase_number = 'temp_7',  phase_name = 'Visual Identity',          sort_order = 7  WHERE phase_number = '7';
UPDATE brand_phases SET phase_number = 'temp_8',  phase_name = 'Design System',            sort_order = 8  WHERE phase_number = '8F';
UPDATE brand_phases SET phase_number = 'temp_9',  phase_name = 'Website Strategy & Copy',  sort_order = 9  WHERE phase_number = '8';
-- OLD '8A'-'8E' stay for now (will be merged into temp_9, then deleted)
UPDATE brand_phases SET phase_number = 'temp_10', phase_name = 'Growth Engine',            sort_order = 10 WHERE phase_number = '9';
-- OLD '10' stays for now (will be merged into temp_10, then deleted)

-- ============================================================
-- STEP 2: Move brand_outputs from phases being MERGED into their
--         target phases, then delete the source phases.
-- ============================================================

-- Merge old phase 4 (Brandable Naming) outputs → temp_4 (Offer & Lead Magnet)
UPDATE brand_outputs SET phase_id = (
  SELECT id FROM brand_phases bp2 WHERE bp2.phase_number = 'temp_4' AND bp2.organization_id = brand_outputs.organization_id LIMIT 1
)
WHERE phase_id IN (SELECT id FROM brand_phases WHERE phase_number = '4')
AND EXISTS (SELECT 1 FROM brand_phases bp2 WHERE bp2.phase_number = 'temp_4' AND bp2.organization_id = brand_outputs.organization_id);

DELETE FROM brand_conversations WHERE phase_id IN (SELECT id FROM brand_phases WHERE phase_number = '4');
DELETE FROM brand_phases WHERE phase_number = '4';

-- Merge old phase 6B (Messaging Framework) outputs → temp_6 (Brand Voice & Messaging)
UPDATE brand_outputs SET phase_id = (
  SELECT id FROM brand_phases bp2 WHERE bp2.phase_number = 'temp_6' AND bp2.organization_id = brand_outputs.organization_id LIMIT 1
)
WHERE phase_id IN (SELECT id FROM brand_phases WHERE phase_number = '6B')
AND EXISTS (SELECT 1 FROM brand_phases bp2 WHERE bp2.phase_number = 'temp_6' AND bp2.organization_id = brand_outputs.organization_id);

DELETE FROM brand_conversations WHERE phase_id IN (SELECT id FROM brand_phases WHERE phase_number = '6B');
DELETE FROM brand_phases WHERE phase_number = '6B';

-- Merge old phases 8A-8E outputs → temp_9 (Website Strategy & Copy)
UPDATE brand_outputs SET phase_id = (
  SELECT id FROM brand_phases bp2 WHERE bp2.phase_number = 'temp_9' AND bp2.organization_id = brand_outputs.organization_id LIMIT 1
)
WHERE phase_id IN (SELECT id FROM brand_phases WHERE phase_number IN ('8A', '8B', '8C', '8D', '8E'))
AND EXISTS (SELECT 1 FROM brand_phases bp2 WHERE bp2.phase_number = 'temp_9' AND bp2.organization_id = brand_outputs.organization_id);

DELETE FROM brand_conversations WHERE phase_id IN (SELECT id FROM brand_phases WHERE phase_number IN ('8A', '8B', '8C', '8D', '8E'));
DELETE FROM brand_phases WHERE phase_number IN ('8A', '8B', '8C', '8D', '8E');

-- Merge old phase 10 (Authority System) outputs → temp_10 (Growth Engine)
UPDATE brand_outputs SET phase_id = (
  SELECT id FROM brand_phases bp2 WHERE bp2.phase_number = 'temp_10' AND bp2.organization_id = brand_outputs.organization_id LIMIT 1
)
WHERE phase_id IN (SELECT id FROM brand_phases WHERE phase_number = '10')
AND EXISTS (SELECT 1 FROM brand_phases bp2 WHERE bp2.phase_number = 'temp_10' AND bp2.organization_id = brand_outputs.organization_id);

DELETE FROM brand_conversations WHERE phase_id IN (SELECT id FROM brand_phases WHERE phase_number = '10');
DELETE FROM brand_phases WHERE phase_number = '10';

-- ============================================================
-- STEP 3: Rename temp_ phases to final clean numbers.
--         At this point all old numbered phases are gone, so
--         no unique constraint collisions are possible.
-- ============================================================

UPDATE brand_phases SET phase_number = '1'  WHERE phase_number = 'temp_1';
UPDATE brand_phases SET phase_number = '2'  WHERE phase_number = 'temp_2';
UPDATE brand_phases SET phase_number = '3'  WHERE phase_number = 'temp_3';
UPDATE brand_phases SET phase_number = '4'  WHERE phase_number = 'temp_4';
UPDATE brand_phases SET phase_number = '5'  WHERE phase_number = 'temp_5';
UPDATE brand_phases SET phase_number = '6'  WHERE phase_number = 'temp_6';
UPDATE brand_phases SET phase_number = '7'  WHERE phase_number = 'temp_7';
UPDATE brand_phases SET phase_number = '8'  WHERE phase_number = 'temp_8';
UPDATE brand_phases SET phase_number = '9'  WHERE phase_number = 'temp_9';
UPDATE brand_phases SET phase_number = '10' WHERE phase_number = 'temp_10';

-- ============================================================
-- STEP 4: Reset question index for restructured phases since
--         question counts have changed.
-- ============================================================

UPDATE brand_phases SET current_question_index = 0
WHERE status IN ('not_started', 'in_progress');

-- ============================================================
-- STEP 5: Replace the trigger function for NEW organizations.
-- ============================================================

CREATE OR REPLACE FUNCTION create_default_brand_phases()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO brand_phases (organization_id, phase_number, phase_name, sort_order)
  VALUES
    (NEW.id, '1', 'Brand Foundation', 1),
    (NEW.id, '2', 'Ideal Customer', 2),
    (NEW.id, '3', 'Market Enemy', 3),
    (NEW.id, '4', 'Offer & Lead Magnet', 4),
    (NEW.id, '5', 'Market Positioning', 5),
    (NEW.id, '6', 'Brand Voice & Messaging', 6),
    (NEW.id, '7', 'Visual Identity', 7),
    (NEW.id, '8', 'Design System', 8),
    (NEW.id, '9', 'Website Strategy & Copy', 9),
    (NEW.id, '10', 'Growth Engine', 10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
