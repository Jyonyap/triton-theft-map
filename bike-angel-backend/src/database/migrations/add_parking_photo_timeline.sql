-- Migration: Add Parking Photo Timeline Feature
-- Description: Adds tables and columns for photo sharing in parking zones
-- Date: 2024-12-26

-- Add photo columns to parking_reports table
ALTER TABLE parking_reports 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS photo_thumbnail_url TEXT,
ADD COLUMN IF NOT EXISTS is_night_mode BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS photo_uploaded_at TIMESTAMP;

-- Create parking_sessions table
CREATE TABLE IF NOT EXISTS parking_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES parking_zones(id) ON DELETE CASCADE,
  parking_report_id UUID NOT NULL REFERENCES parking_reports(id) ON DELETE CASCADE,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  can_view_photos BOOLEAN DEFAULT true,
  leaving_photo_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for parking_sessions
CREATE INDEX IF NOT EXISTS idx_parking_sessions_active 
ON parking_sessions(zone_id, ended_at) 
WHERE ended_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_parking_sessions_user 
ON parking_sessions(user_id, ended_at);

CREATE INDEX IF NOT EXISTS idx_parking_sessions_zone 
ON parking_sessions(zone_id);

-- Create photo_reports table for moderation
CREATE TABLE IF NOT EXISTS photo_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parking_report_id UUID NOT NULL REFERENCES parking_reports(id) ON DELETE CASCADE,
  reporter_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reason TEXT,
  reported_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_report UNIQUE (parking_report_id, reporter_user_id)
);

CREATE INDEX IF NOT EXISTS idx_photo_reports_parking 
ON photo_reports(parking_report_id);

CREATE INDEX IF NOT EXISTS idx_photo_reports_count 
ON photo_reports(parking_report_id, reported_at);

-- Create notification_throttle table
CREATE TABLE IF NOT EXISTS notification_throttle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES parking_zones(id) ON DELETE CASCADE,
  last_notification_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_zone_throttle UNIQUE (user_id, zone_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_throttle_lookup 
ON notification_throttle(user_id, zone_id);

-- Add comment for documentation
COMMENT ON TABLE parking_sessions IS 'Tracks active parking sessions for photo timeline access control';
COMMENT ON TABLE photo_reports IS 'Stores user reports of inappropriate photos for moderation';
COMMENT ON TABLE notification_throttle IS 'Prevents notification spam by throttling to max 1 per 5 minutes';

COMMENT ON COLUMN parking_reports.photo_url IS 'High-resolution photo URL from Supabase Storage';
COMMENT ON COLUMN parking_reports.photo_thumbnail_url IS 'Blurred thumbnail URL for non-parked users';
COMMENT ON COLUMN parking_reports.is_night_mode IS 'Whether photo was taken in night mode (6pm-6am)';
COMMENT ON COLUMN parking_reports.photo_uploaded_at IS 'Timestamp for 24-hour cleanup';
