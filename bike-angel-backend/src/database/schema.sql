-- Bike Angel Database Schema
-- This script creates all tables, indexes, and extensions for the Bike Angel platform

-- Enable PostGIS extension for geospatial queries
CREATE EXTENSION IF NOT EXISTS postgis;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email_verified BOOLEAN DEFAULT FALSE,
  notifications_enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@ucsd\.edu$')
);

-- Index for email lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- ============================================================================
-- PARKING ZONES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS parking_zones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  capacity INTEGER NOT NULL,
  risk_rating VARCHAR(10) DEFAULT 'green' CHECK (risk_rating IN ('green', 'yellow', 'red')),
  congestion_level VARCHAR(20) DEFAULT 'available' CHECK (congestion_level IN ('available', 'filling', 'full')),
  last_updated TIMESTAMP DEFAULT NOW()
);

-- Geospatial index for location-based queries (PostGIS)
-- Note: PostGIS must be enabled first
CREATE INDEX IF NOT EXISTS idx_zones_location ON parking_zones 
  USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));

-- Index for zone name searches
CREATE INDEX IF NOT EXISTS idx_zones_name ON parking_zones(name);

-- ============================================================================
-- PARKING REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS parking_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES parking_zones(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  thumbnail_url TEXT NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

-- Index for querying reports by zone and time (most common query)
CREATE INDEX IF NOT EXISTS idx_reports_zone_time ON parking_reports(zone_id, timestamp DESC);

-- Index for cleanup job (finding expired reports)
CREATE INDEX IF NOT EXISTS idx_reports_expires ON parking_reports(expires_at);

-- Index for user's reports
CREATE INDEX IF NOT EXISTS idx_reports_user ON parking_reports(user_id);

-- ============================================================================
-- THEFT INCIDENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS theft_incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES parking_zones(id) ON DELETE CASCADE,
  date_time TIMESTAMP NOT NULL,
  description TEXT NOT NULL,
  police_report_number VARCHAR(100),
  verified BOOLEAN GENERATED ALWAYS AS (police_report_number IS NOT NULL) STORED,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for querying incidents by zone and time (risk rating calculation)
CREATE INDEX IF NOT EXISTS idx_incidents_zone_time ON theft_incidents(zone_id, date_time DESC);

-- Index for verified incidents (risk rating calculation)
CREATE INDEX IF NOT EXISTS idx_incidents_verified ON theft_incidents(zone_id, verified, date_time DESC);

-- Index for user's incidents
CREATE INDEX IF NOT EXISTS idx_incidents_user ON theft_incidents(user_id);

-- ============================================================================
-- FAVORITE ZONES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS favorite_zones (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES parking_zones(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, zone_id)
);

-- Index for querying user's favorites
CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorite_zones(user_id);

-- Index for finding users who favorited a zone (for notifications)
CREATE INDEX IF NOT EXISTS idx_favorites_zone ON favorite_zones(zone_id);

-- ============================================================================
-- ZONE SUGGESTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS zone_suggestions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  suggested_name VARCHAR(255) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  estimated_capacity INTEGER,
  description TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

-- Index for querying suggestions by status
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON zone_suggestions(status, created_at DESC);

-- Index for querying user's suggestions
CREATE INDEX IF NOT EXISTS idx_suggestions_user ON zone_suggestions(user_id);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES parking_zones(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'theft_alert',
  message TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for querying user's notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);

-- Index for unread notifications
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = FALSE;

-- ============================================================================
-- EMAIL VERIFICATION TOKENS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for token lookups
CREATE INDEX IF NOT EXISTS idx_verification_token ON email_verification_tokens(token);

-- Index for cleanup (expired tokens)
CREATE INDEX IF NOT EXISTS idx_verification_expires ON email_verification_tokens(expires_at);

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for zone statistics (useful for dashboard/analytics)
CREATE OR REPLACE VIEW zone_statistics AS
SELECT 
  pz.id,
  pz.name,
  pz.risk_rating,
  pz.congestion_level,
  COUNT(DISTINCT pr.id) FILTER (WHERE pr.expires_at > NOW()) as active_reports,
  COUNT(DISTINCT ti.id) FILTER (WHERE ti.date_time > NOW() - INTERVAL '90 days') as recent_thefts,
  COUNT(DISTINCT ti.id) FILTER (WHERE ti.verified = TRUE AND ti.date_time > NOW() - INTERVAL '90 days') as verified_thefts
FROM parking_zones pz
LEFT JOIN parking_reports pr ON pz.id = pr.zone_id
LEFT JOIN theft_incidents ti ON pz.id = ti.zone_id
GROUP BY pz.id, pz.name, pz.risk_rating, pz.congestion_level;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to automatically set expires_at for parking reports (12 hours from timestamp)
CREATE OR REPLACE FUNCTION set_parking_report_expiry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := NEW.timestamp + INTERVAL '12 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to set expires_at on insert
DROP TRIGGER IF EXISTS trigger_set_parking_report_expiry ON parking_reports;
CREATE TRIGGER trigger_set_parking_report_expiry
  BEFORE INSERT ON parking_reports
  FOR EACH ROW
  EXECUTE FUNCTION set_parking_report_expiry();

-- Function to update zone last_updated timestamp
CREATE OR REPLACE FUNCTION update_zone_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE parking_zones 
  SET last_updated = NOW() 
  WHERE id = NEW.zone_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update zone timestamp when reports are added
DROP TRIGGER IF EXISTS trigger_update_zone_on_report ON parking_reports;
CREATE TRIGGER trigger_update_zone_on_report
  AFTER INSERT ON parking_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_zone_timestamp();

-- Trigger to update zone timestamp when incidents are added
DROP TRIGGER IF EXISTS trigger_update_zone_on_incident ON theft_incidents;
CREATE TRIGGER trigger_update_zone_on_incident
  AFTER INSERT ON theft_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_zone_timestamp();

-- ============================================================================
-- SEED DATA - UCSD Parking Zones
-- ============================================================================

-- Insert official UCSD bike parking zones
-- Coordinates are approximate and should be verified with actual UCSD locations
INSERT INTO parking_zones (name, latitude, longitude, capacity) VALUES
  ('Geisel Library', 32.881111, -117.237222, 50),
  ('Price Center', 32.879722, -117.236111, 80),
  ('Warren College', 32.882500, -117.234167, 40),
  ('Revelle College', 32.877778, -117.240556, 35),
  ('Muir College', 32.878333, -117.243056, 45),
  ('Marshall College', 32.880556, -117.239444, 40),
  ('ERC (Eleanor Roosevelt College)', 32.886944, -117.241667, 50),
  ('Sixth College', 32.885278, -117.237778, 45),
  ('Seventh College', 32.888056, -117.240278, 40),
  ('CSE Building', 32.882222, -117.233889, 60),
  ('Jacobs Hall', 32.881667, -117.234444, 55),
  ('Center Hall', 32.879167, -117.238889, 45),
  ('York Hall', 32.882778, -117.241111, 30),
  ('Peterson Hall', 32.878889, -117.242222, 35),
  ('RIMAC', 32.886111, -117.238333, 70)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE users IS 'Registered UCSD students with verified @ucsd.edu emails';
COMMENT ON TABLE parking_zones IS 'Pre-defined official bike parking locations on UCSD campus';
COMMENT ON TABLE parking_reports IS 'User-submitted photos of parking zones with 12-hour expiry';
COMMENT ON TABLE theft_incidents IS 'Reported bicycle theft incidents with optional police report verification';
COMMENT ON TABLE favorite_zones IS 'User favorite zones for theft alert notifications';
COMMENT ON TABLE zone_suggestions IS 'User-submitted suggestions for new parking zones pending admin review';
COMMENT ON TABLE notifications IS 'Push notifications for theft alerts in favorite zones';
COMMENT ON TABLE email_verification_tokens IS 'Temporary tokens for email verification';

COMMENT ON COLUMN theft_incidents.verified IS 'Automatically TRUE when police_report_number is provided';
COMMENT ON COLUMN parking_reports.expires_at IS 'Automatically set to timestamp + 12 hours';
