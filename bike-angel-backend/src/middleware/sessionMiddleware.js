/**
 * Middleware to check parking session permissions
 */
import pool from '../config/database.js';

/**
 * Check if user has an active parking session in the specified zone
 * Adds sessionInfo to req object if session exists
 * 
 * Usage: Add zoneId to req.params or req.body before this middleware
 */
export const checkActiveSession = async (req, res, next) => {
  try {
    const userId = req.userId; // From auth middleware
    const zoneId = req.params.zoneId || req.body.zoneId;
    
    if (!zoneId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Zone ID is required',
        statusCode: 400
      });
    }
    
    // Check for active session
    const result = await pool.query(
      `SELECT 
        id,
        started_at,
        can_view_photos,
        parking_report_id
       FROM parking_sessions
       WHERE user_id = $1 AND zone_id = $2 AND ended_at IS NULL`,
      [userId, zoneId]
    );
    
    if (result.rows.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You must have an active parking session in this zone to access this resource',
        statusCode: 403,
        hasActiveSession: false
      });
    }
    
    // Add session info to request
    req.sessionInfo = result.rows[0];
    req.hasActiveSession = true;
    req.canViewPhotos = result.rows[0].can_view_photos;
    
    next();
  } catch (error) {
    console.error('Error checking active session:', error);
    next(error);
  }
};

/**
 * Check if user can view high-resolution photos
 * More lenient than checkActiveSession - allows request to proceed but sets permission flag
 */
export const checkPhotoPermission = async (req, res, next) => {
  try {
    const userId = req.userId;
    const zoneId = req.params.zoneId || req.body.zoneId;
    
    if (!zoneId) {
      req.canViewHighRes = false;
      return next();
    }
    
    // Check for active session with photo viewing permission
    const result = await pool.query(
      `SELECT id, can_view_photos
       FROM parking_sessions
       WHERE user_id = $1 AND zone_id = $2 AND ended_at IS NULL AND can_view_photos = true`,
      [userId, zoneId]
    );
    
    req.canViewHighRes = result.rows.length > 0;
    req.sessionId = result.rows.length > 0 ? result.rows[0].id : null;
    
    next();
  } catch (error) {
    console.error('Error checking photo permission:', error);
    req.canViewHighRes = false;
    next();
  }
};

/**
 * Verify user has permission to view photos in a zone
 * Returns 403 if no permission
 */
export const requirePhotoPermission = async (req, res, next) => {
  try {
    const userId = req.userId;
    const zoneId = req.params.zoneId || req.body.zoneId;
    
    if (!zoneId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Zone ID is required',
        statusCode: 400
      });
    }
    
    const result = await pool.query(
      `SELECT id, can_view_photos
       FROM parking_sessions
       WHERE user_id = $1 AND zone_id = $2 AND ended_at IS NULL AND can_view_photos = true`,
      [userId, zoneId]
    );
    
    if (result.rows.length === 0) {
      return res.status(403).json({
        error: 'Forbidden',
        message: 'You must be actively parked in this zone to view high-resolution photos',
        statusCode: 403,
        canViewHighRes: false
      });
    }
    
    req.canViewHighRes = true;
    req.sessionId = result.rows[0].id;
    
    next();
  } catch (error) {
    console.error('Error verifying photo permission:', error);
    next(error);
  }
};
