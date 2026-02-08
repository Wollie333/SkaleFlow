-- Rename subscription tiers to Foundation / Momentum / Authority

UPDATE subscription_tiers SET name = 'Foundation', slug = 'foundation' WHERE slug = 'starter';
UPDATE subscription_tiers SET name = 'Momentum',  slug = 'momentum'  WHERE slug = 'growth';
UPDATE subscription_tiers SET name = 'Authority',  slug = 'authority'  WHERE slug = 'scale';
