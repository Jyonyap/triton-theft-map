-- Migration: Add role column to users table
-- This enables admin role management for zone administration

-- Add role column with default 'student'
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'student';

-- Add check constraint for valid roles
ALTER TABLE users 
ADD CONSTRAINT check_user_role 
CHECK (role IN ('student', 'admin'));

-- Create index for role-based queries
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Update existing users to have 'student' role (if any exist without role)
UPDATE users SET role = 'student' WHERE role IS NULL;

-- Make role NOT NULL after setting defaults
ALTER TABLE users 
ALTER COLUMN role SET NOT NULL;

COMMENT ON COLUMN users.role IS 'User role: student (default) or admin (elevated permissions for zone management)';
