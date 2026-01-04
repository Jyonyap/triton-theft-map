-- ============================================================================
-- BIKE ANGEL PRODUCTION DATABASE MIGRATION
-- Complete schema setup for Supabase deployment
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS postgis;
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
  role VARCHAR(20) DEFAULT 'student' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@ucsd\.edu$'),
  CONSTRAINT check_user_role CHECK (role IN ('student', 'admin'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

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
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive')),
  reference_photo_day_url TEXT,
  reference_photo_night_url TEXT,
  gps_accuracy FLOAT,
  created_by_admin_id UUID REFERENCES users(id),
  updated_by_admin_id UUID REFERENCES users(id),
  description TEXT,
  last_updated TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_zones_location ON parking_zones 
  USING GIST (ST_SetSRID(ST_MakePoint(longitude, latitude), 4326));
CREATE INDEX IF NOT EXISTS idx_zones_name ON parking_zones(name);
CREATE INDEX IF NOT EXISTS idx_zones_status ON parking_zones(status);
CREATE INDEX IF NOT EXISTS idx_zones_created_by ON parking_zones(created_by_admin_id);
CREATE INDEX IF NOT EXISTS idx_zones_updated_at ON parking_zones(last_updated);

-- ============================================================================
-- PARKING REPORTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS parking_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  zone_id UUID REFERENCES parking_zones(id) ON DELETE CASCADE,
  photo_url TEXT,
  thumbnail_url TEXT,
  photo_thumbnail_url TEXT,
  is_night_mode BOOLEAN DEFAULT false,
  photo_uploaded_at TIMESTAMP,
  timestamp TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reports_zone_time ON parking_reports(zone_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reports_expires ON parking_reports(expires_at);
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

CREATE INDEX IF NOT EXISTS idx_incidents_zone_time ON theft_incidents(zone_id, date_time DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_verified ON theft_incidents(zone_id, verified, date_time DESC);
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

CREATE INDEX IF NOT EXISTS idx_favorites_user ON favorite_zones(user_id);
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

CREATE INDEX IF NOT EXISTS idx_suggestions_status ON zone_suggestions(status, created_at DESC);
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

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, created_at DESC);
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

CREATE INDEX IF NOT EXISTS idx_verification_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_verification_expires ON email_verification_tokens(expires_at);

-- ============================================================================
-- PARKING SESSIONS TABLE
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS idx_parking_sessions_active 
ON parking_sessions(zone_id, ended_at) 
WHERE ended_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_parking_sessions_user 
ON parking_sessions(user_id, ended_at);
CREATE INDEX IF NOT EXISTS idx_parking_sessions_zone 
ON parking_sessions(zone_id);

-- ============================================================================
-- PHOTO REPORTS TABLE
-- ============================================================================
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

-- ============================================================================
-- NOTIFICATION THROTTLE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS notification_throttle (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  zone_id UUID NOT NULL REFERENCES parking_zones(id) ON DELETE CASCADE,
  last_notification_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT unique_user_zone_throttle UNIQUE (user_id, zone_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_throttle_lookup 
ON notification_throttle(user_id, zone_id);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to automatically set expires_at for parking reports (12 hours from timestamp)
CREATE OR REPLACE FUNCTION set_parking_report_expiry()
RETURNS TRIGGER AS $$
BEGIN
  NEW.expires_at := NEW.timestamp + INTERVAL '12 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

DROP TRIGGER IF EXISTS trigger_update_zone_on_report ON parking_reports;
CREATE TRIGGER trigger_update_zone_on_report
  AFTER INSERT ON parking_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_zone_timestamp();

DROP TRIGGER IF EXISTS trigger_update_zone_on_incident ON theft_incidents;
CREATE TRIGGER trigger_update_zone_on_incident
  AFTER INSERT ON theft_incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_zone_timestamp();

-- ============================================================================
-- VIEWS
-- ============================================================================

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
-- SEED DATA - UCSD Parking Zones
-- ============================================================================

INSERT INTO parking_zones (name, latitude, longitude, capacity, status) VALUES
  ('Geisel Library', 32.881111, -117.237222, 50, 'active'),
  ('Price Center', 32.879722, -117.236111, 80, 'active'),
  ('Warren College', 32.882500, -117.234167, 40, 'active'),
  ('Revelle College', 32.877778, -117.240556, 35, 'active'),
  ('Muir College', 32.878333, -117.243056, 45, 'active'),
  ('Marshall College', 32.880556, -117.239444, 40, 'active'),
  ('ERC (Eleanor Roosevelt College)', 32.886944, -117.241667, 50, 'active'),
  ('Sixth College', 32.885278, -117.237778, 45, 'active'),
  ('Seventh College', 32.888056, -117.240278, 40, 'active'),
  ('CSE Building', 32.882222, -117.233889, 60, 'active'),
  ('Jacobs Hall', 32.881667, -117.234444, 55, 'active'),
  ('Center Hall', 32.879167, -117.238889, 45, 'active'),
  ('York Hall', 32.882778, -117.241111, 30, 'active'),
  ('Peterson Hall', 32.878889, -117.242222, 35, 'active'),
  ('RIMAC', 32.886111, -117.238333, 70, 'active')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- COMPLETE
-- ============================================================================
