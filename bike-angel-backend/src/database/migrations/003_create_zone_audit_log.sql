-- Migration: Create zone audit log table
-- Tracks all admin actions on parking zones for accountability

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create zone audit log table
CREATE TABLE IF NOT EXISTS zone_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  zone_id UUID REFERENCES parking_zones(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action VARCHAR(50) NOT NULL,
  changes JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add check constraint for valid actions
ALTER TABLE zone_audit_log 
ADD CONSTRAINT check_audit_action 
CHECK (action IN ('created', 'updated', 'deleted', 'status_changed', 'photo_uploaded'));

-- Create indexes for common audit queries
CREATE INDEX IF NOT EXISTS idx_audit_zone ON zone_audit_log(zone_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON zone_audit_log(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_action ON zone_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON zone_audit_log(created_at DESC);

-- Add comments for documentation
COMMENT ON TABLE zone_audit_log IS 'Audit trail of all admin actions on parking zones';
COMMENT ON COLUMN zone_audit_log.zone_id IS 'The parking zone that was modified';
COMMENT ON COLUMN zone_audit_log.admin_id IS 'The admin user who performed the action';
COMMENT ON COLUMN zone_audit_log.action IS 'Type of action performed (created, updated, deleted, status_changed, photo_uploaded)';
COMMENT ON COLUMN zone_audit_log.changes IS 'JSON object containing the changes made (before/after values)';
COMMENT ON COLUMN zone_audit_log.created_at IS 'Timestamp when the action occurred';
