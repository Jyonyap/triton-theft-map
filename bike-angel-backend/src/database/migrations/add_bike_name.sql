-- Add bike_name column to users table
-- This allows users to give their bike a custom name

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS bike_name VARCHAR(100);

-- Add index for bike name searches (optional, for future features)
CREATE INDEX IF NOT EXISTS idx_users_bike_name ON users(bike_name);

-- Add comment
COMMENT ON COLUMN users.bike_name IS 'Custom name given to the user''s bicycle';
