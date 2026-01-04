-- Migration: Allow NULL user_id for anonymization on account deletion
-- This preserves safety data (parking reports and theft incidents) while removing personal information

-- Modify parking_reports to allow NULL user_id
ALTER TABLE parking_reports 
  ALTER COLUMN user_id DROP NOT NULL;

-- Modify theft_incidents to allow NULL user_id
ALTER TABLE theft_incidents 
  ALTER COLUMN user_id DROP NOT NULL;

-- Modify zone_suggestions to allow NULL user_id
ALTER TABLE zone_suggestions 
  ALTER COLUMN user_id DROP NOT NULL;

-- Change CASCADE behavior to SET NULL for parking_reports
ALTER TABLE parking_reports 
  DROP CONSTRAINT parking_reports_user_id_fkey,
  ADD CONSTRAINT parking_reports_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE SET NULL;

-- Change CASCADE behavior to SET NULL for theft_incidents
ALTER TABLE theft_incidents 
  DROP CONSTRAINT theft_incidents_user_id_fkey,
  ADD CONSTRAINT theft_incidents_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE SET NULL;

-- Change CASCADE behavior to SET NULL for zone_suggestions
ALTER TABLE zone_suggestions 
  DROP CONSTRAINT zone_suggestions_user_id_fkey,
  ADD CONSTRAINT zone_suggestions_user_id_fkey 
    FOREIGN KEY (user_id) 
    REFERENCES users(id) 
    ON DELETE SET NULL;

-- Keep CASCADE for other tables (favorite_zones, notifications, email_verification_tokens)
-- These should be deleted when user is deleted as they're personal data

COMMENT ON CONSTRAINT parking_reports_user_id_fkey ON parking_reports IS 
  'ON DELETE SET NULL to preserve safety data while anonymizing user';

COMMENT ON CONSTRAINT theft_incidents_user_id_fkey ON theft_incidents IS 
  'ON DELETE SET NULL to preserve safety data while anonymizing user';

COMMENT ON CONSTRAINT zone_suggestions_user_id_fkey ON zone_suggestions IS 
  'ON DELETE SET NULL to preserve suggestion data while anonymizing user';
