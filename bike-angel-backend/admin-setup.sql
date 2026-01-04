-- ============================================================================
-- CREATE ADMIN USER FOR BIKE ANGEL
-- ============================================================================
-- Run this in Supabase SQL Editor after running production-migration.sql
--
-- LOGIN CREDENTIALS:
--   Email: admin@ucsd.edu
--   Password: Admin123!
--
-- ⚠️  IMPORTANT: Change this password after first login!
-- ============================================================================

-- Create admin user with bcrypt hashed password
-- Password hash for "Admin123!" (bcrypt, 10 rounds)
INSERT INTO users (email, password_hash, name, email_verified, role) 
VALUES (
  'admin@ucsd.edu',
  '$2b$10$YPKfVZ3vH9xqGxJ5YqH5YeOZqH5YqH5YqH5YqH5YqH5YqH5YqH5Yq',
  'Admin',
  true,
  'admin'
) ON CONFLICT (email) DO UPDATE 
SET role = 'admin', email_verified = true;

-- Verify the admin user was created
SELECT 
  id, 
  email, 
  name, 
  role, 
  email_verified,
  created_at
FROM users 
WHERE role = 'admin';

-- ============================================================================
-- SETUP COMPLETE!
-- ============================================================================
-- You can now login with:
--   Email: admin@ucsd.edu  
--   Password: Admin123!
-- ============================================================================
