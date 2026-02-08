-- Add approved column to users table for admin approval flow
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved BOOLEAN DEFAULT false;

-- Set existing admin user as approved
UPDATE users SET approved = true WHERE email = 'wollie@manamarketing.co.za';

-- Set any existing super_admin users as approved
UPDATE users SET approved = true WHERE role = 'super_admin';
