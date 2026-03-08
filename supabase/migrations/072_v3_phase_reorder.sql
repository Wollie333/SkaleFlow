-- Migration 072: V3 Brand Engine — Phase sequence reorder
-- Market Enemy moves to position 1, Offer to position 3, Brand Foundation to position 4.
-- phase_number stays the same, only sort_order changes.
--
-- V3 sort_order mapping:
--   phase '3' (Market Enemy)       → sort_order 1
--   phase '2' (Ideal Customer)     → sort_order 2 (unchanged)
--   phase '4' (Offer & Lead Magnet)→ sort_order 3
--   phase '1' (Brand Foundation)   → sort_order 4
--   phases '5'-'10'                → sort_order 5-10 (unchanged)

-- ============================================================
-- STEP 1: Update sort_order for ALL existing organizations
-- ============================================================

UPDATE brand_phases SET sort_order = 1 WHERE phase_number = '3';
UPDATE brand_phases SET sort_order = 3 WHERE phase_number = '4';
UPDATE brand_phases SET sort_order = 4 WHERE phase_number = '1';

-- phase '2' already has sort_order = 2, no change needed
-- phases '5'-'10' already have sort_order 5-10, no change needed

-- ============================================================
-- STEP 2: Update trigger function for NEW organizations
-- ============================================================

CREATE OR REPLACE FUNCTION create_default_brand_phases()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO brand_phases (organization_id, phase_number, phase_name, sort_order)
  VALUES
    (NEW.id, '1', 'Brand Foundation', 4),
    (NEW.id, '2', 'Ideal Customer', 2),
    (NEW.id, '3', 'Market Enemy', 1),
    (NEW.id, '4', 'Offer & Lead Magnet', 3),
    (NEW.id, '5', 'Market Positioning', 5),
    (NEW.id, '6', 'Brand Voice & Messaging', 6),
    (NEW.id, '7', 'Visual Identity', 7),
    (NEW.id, '8', 'Design System', 8),
    (NEW.id, '9', 'Website Strategy & Copy', 9),
    (NEW.id, '10', 'Growth Engine', 10);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
