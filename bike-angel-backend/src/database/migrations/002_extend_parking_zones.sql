-- Migration: Extend parking_zones table for admin zone management
-- Adds status, reference photos, GPS accuracy, and admin tracking

-- Add status column for zone publication state
ALTER TABLE parking_zones 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'draft';

ALTER TABLE parking_zones 
ADD CONSTRAINT check_zone_status 
CHECK (status IN ('draft', 'active', 'inactive'));

-- Add reference photo URLs (day and night)
ALTER TABLE parking_zones 
ADD COLUMN IF NOT EXISTS reference_photo_day_url TEXT;

ALTER TABLE parking_zones 
ADD COLUMN IF NOT EXISTS reference_photo_night_url TEXT;

-- Add GPS accuracy tracking
ALTER TABLE parking_zones 
ADD COLUMN IF NOT EXISTS gps_accuracy FLOAT;

-- Add admin tracking columns
ALTER TABLE parking_zones 
ADD COLUMN IF NOT EXISTS created_by_admin_id UUID REFERENCES users(id);

ALTER TABLE parking_zones 
ADD COLUMN IF NOT EXISTS updated_by_admin_id UUID REFERENCES users(id);

-- Add description field for zone details
ALTER TABLE parking_zones 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Update existing zones to 'active' status (they were manually seeded)
UPDATE parking_zones SET status = 'active' WHERE status IS NULL;

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_zones_status ON parking_zones(status);
CREATE INDEX IF NOT EXISTS idx_zones_created_by ON parking_zones(created_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_zones_updated_at ON parking_zones(last_updated);

-- Add comments for documentation
COMMENT ON COLUMN parking_zones.status IS 'Publication state: draft (not visible to students), active (visible), inactive (hidden)';
COMMENT ON COLUMN parking_zones.reference_photo_day_url IS 'Official daytime photo taken by admin showing what the zone looks like';
COMMENT ON COLUMN parking_zones.reference_photo_night_url IS 'Official nighttime photo taken by admin showing what the zone looks like';
COMMENT ON COLUMN parking_zones.gps_accuracy IS 'GPS accuracy in meters when coordinates were captured';
COMMENT ON COLUMN parking_zones.created_by_admin_id IS 'Admin user who created this zone';
COMMENT ON COLUMN parking_zones.updated_by_admin_id IS 'Admin user who last updated this zone';
COMMENT ON COLUMN parking_zones.description IS 'Detailed description of the zone location and features';
