-- Migration 028: Backfill missing phases for existing organizations
-- After migration 025, orgs that lacked old phases 2A or 8F won't have new phases 3 or 8.
-- This inserts any missing phases (1-10) for all existing orgs.

INSERT INTO brand_phases (organization_id, phase_number, phase_name, sort_order, status)
SELECT o.id, p.phase_number, p.phase_name, p.sort_order, 'not_started'
FROM organizations o
CROSS JOIN (
  VALUES
    ('1', 'Brand Foundation', 1),
    ('2', 'Ideal Customer', 2),
    ('3', 'Market Enemy', 3),
    ('4', 'Offer & Lead Magnet', 4),
    ('5', 'Market Positioning', 5),
    ('6', 'Brand Voice & Messaging', 6),
    ('7', 'Visual Identity', 7),
    ('8', 'Design System', 8),
    ('9', 'Website Strategy & Copy', 9),
    ('10', 'Growth Engine', 10)
) AS p(phase_number, phase_name, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM brand_phases bp
  WHERE bp.organization_id = o.id
    AND bp.phase_number = p.phase_number
);
