import pool from '../config/database.js';
import storageService from '../services/storageService.js';
import CongestionAnalyzer from '../services/congestionAnalyzer.js';
import { detectNightMode, validatePhotoBrightness } from '../utils/photoValidation.js';

/**
 * Create a new parking report with photo upload
 * POST /api/reports/parking
 */
export const createParkingReport = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { zoneId } = req.body;
    const userId = req.userId; // From auth middleware
    
    // Validate required fields
    if (!zoneId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Zone ID is required',
        statusCode: 400
      });
    }
    
    // Validate file upload
    if (!req.file) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Photo is required',
        statusCode: 400
      });
    }
    
    // Verify zone exists
    const zoneCheck = await client.query(
      'SELECT id FROM parking_zones WHERE id = $1',
      [zoneId]
    );
    
    if (zoneCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not Found',
        message: 'Parking zone not found',
        statusCode: 404
      });
    }
    
    // Check night mode and validate brightness
    const nightModeStatus = getNightModeStatus();
    if (nightModeStatus.isNightMode) {
      const brightnessCheck = await validatePhotoBrightness(
        req.file.buffer,
        req.file.size
      );
      
      if (!brightnessCheck.isValid) {
        await client.query('ROLLBACK');
        return res.status(400).json({
          error: 'Validation Error',
          message: brightnessCheck.reason,
          statusCode: 400,
          isNightMode: true
        });
      }
    }
    
    // Upload photo to cloud storage (processes and strips EXIF)
    const uploadResult = await storageService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    
    // Save report to database
    // Note: expires_at is automatically set by database trigger (timestamp + 12 hours)
    const result = await client.query(
      `INSERT INTO parking_reports (user_id, zone_id, photo_url, thumbnail_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, timestamp, expires_at`,
      [userId, zoneId, uploadResult.imageUrl, uploadResult.thumbnailUrl]
    );
    
    const report = result.rows[0];
    
    // Create parking session for photo timeline access
    const sessionResult = await client.query(
      `INSERT INTO parking_sessions (user_id, zone_id, parking_report_id, can_view_photos)
       VALUES ($1, $2, $3, true)
       ON CONFLICT (user_id, zone_id) 
       WHERE ended_at IS NULL
       DO UPDATE SET 
         parking_report_id = EXCLUDED.parking_report_id,
         started_at = NOW(),
         can_view_photos = true
       RETURNING id, started_at`,
      [userId, zoneId, report.id]
    );
    
    const session = sessionResult.rows[0];
    
    // Update congestion level for the zone
    const congestionUpdate = await CongestionAnalyzer.updateZoneCongestion(zoneId);
    
    await client.query('COMMIT');
    
    res.status(201).json({
      reportId: report.id,
      timestamp: report.timestamp,
      expiresAt: report.expires_at,
      photoUrl: uploadResult.imageUrl,
      thumbnailUrl: uploadResult.thumbnailUrl,
      sessionId: session.id,
      sessionStarted: session.started_at,
      congestionUpdated: true,
      congestion: {
        level: congestionUpdate.level,
        bikeCount: congestionUpdate.bikeCount,
        capacity: congestionUpdate.capacity,
        percentage: congestionUpdate.percentage
      },
      nightMode: nightModeStatus
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating parking report:', error);
    
    // Handle specific errors
    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({
        error: 'Validation Error',
        message: error.message,
        statusCode: 400
      });
    }
    
    if (error.message.includes('File too large')) {
      return res.status(413).json({
        error: 'Payload Too Large',
        message: error.message,
        statusCode: 413
      });
    }
    
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Get parking reports for a specific zone
 * GET /api/reports/parking/:zoneId
 */
export const getParkingReportsByZone = async (req, res, next) => {
  try {
    const { zoneId } = req.params;
    const limit = parseInt(req.query.limit) || 5;
    
    // Get active reports (not expired) for the zone with uploader info
    const result = await pool.query(
      `SELECT 
        pr.id,
        pr.photo_url,
        pr.thumbnail_url,
        pr.timestamp,
        pr.expires_at,
        u.bike_name,
        u.name as user_name
       FROM parking_reports pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.zone_id = $1 AND pr.expires_at > NOW()
       ORDER BY pr.timestamp DESC
       LIMIT $2`,
      [zoneId, limit]
    );
    
    res.json({
      reports: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching parking reports:', error);
    next(error);
  }
};

/**
 * Get all active parking reports (for map view)
 * GET /api/reports/parking
 */
export const getAllActiveParkingReports = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT 
        pr.id,
        pr.zone_id,
        pr.thumbnail_url,
        pr.timestamp,
        pr.expires_at,
        pz.name as zone_name
       FROM parking_reports pr
       JOIN parking_zones pz ON pr.zone_id = pz.id
       WHERE pr.expires_at > NOW()
       ORDER BY pr.timestamp DESC`
    );
    
    res.json({
      reports: result.rows,
      count: result.rows.length
    });
    
  } catch (error) {
    console.error('Error fetching all parking reports:', error);
    next(error);
  }
};

/**
 * End parking session
 * POST /api/reports/parking/end
 */
export const endParkingSession = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { zoneId, leavingPhoto } = req.body;
    const userId = req.userId;
    
    if (!zoneId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Zone ID is required',
        statusCode: 400
      });
    }
    
    // Find active session
    const sessionCheck = await client.query(
      `SELECT id, started_at FROM parking_sessions
       WHERE user_id = $1 AND zone_id = $2 AND ended_at IS NULL`,
      [userId, zoneId]
    );
    
    if (sessionCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not Found',
        message: 'No active parking session found for this zone',
        statusCode: 404
      });
    }
    
    const session = sessionCheck.rows[0];
    let leavingPhotoUrl = null;
    
    // Handle optional leaving photo
    if (req.file) {
      // Check night mode and validate brightness
      const nightModeStatus = getNightModeStatus();
      if (nightModeStatus.isNightMode) {
        const brightnessCheck = await validatePhotoBrightness(
          req.file.buffer,
          req.file.size
        );
        
        if (!brightnessCheck.isValid) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            error: 'Validation Error',
            message: brightnessCheck.reason,
            statusCode: 400,
            isNightMode: true
          });
        }
      }
      
      // Upload leaving photo
      const uploadResult = await storageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype
      );
      
      leavingPhotoUrl = uploadResult.imageUrl;
      
      // Create a parking report for the leaving photo
      await client.query(
        `INSERT INTO parking_reports (user_id, zone_id, photo_url, thumbnail_url)
         VALUES ($1, $2, $3, $4)`,
        [userId, zoneId, uploadResult.imageUrl, uploadResult.thumbnailUrl]
      );
    }
    
    // End the session
    const endResult = await client.query(
      `UPDATE parking_sessions
       SET ended_at = NOW(), can_view_photos = false, leaving_photo_url = $1
       WHERE id = $2
       RETURNING ended_at`,
      [leavingPhotoUrl, session.id]
    );
    
    const parkingDuration = new Date(endResult.rows[0].ended_at) - new Date(session.started_at);
    const durationMinutes = Math.floor(parkingDuration / 60000);
    
    await client.query('COMMIT');
    
    res.json({
      message: 'Parking session ended successfully',
      sessionId: session.id,
      startedAt: session.started_at,
      endedAt: endResult.rows[0].ended_at,
      durationMinutes,
      leavingPhotoUploaded: !!leavingPhotoUrl
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error ending parking session:', error);
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Get active parking session for user
 * GET /api/reports/parking/session
 */
export const getActiveSession = async (req, res, next) => {
  try {
    const userId = req.userId;
    
    const result = await pool.query(
      `SELECT 
        ps.id,
        ps.zone_id,
        ps.started_at,
        ps.can_view_photos,
        pz.name as zone_name,
        pz.latitude,
        pz.longitude
       FROM parking_sessions ps
       JOIN parking_zones pz ON ps.zone_id = pz.id
       WHERE ps.user_id = $1 AND ps.ended_at IS NULL
       ORDER BY ps.started_at DESC
       LIMIT 1`,
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.json({
        hasActiveSession: false,
        session: null
      });
    }
    
    const session = result.rows[0];
    const parkingDuration = new Date() - new Date(session.started_at);
    const durationMinutes = Math.floor(parkingDuration / 60000);
    
    res.json({
      hasActiveSession: true,
      session: {
        ...session,
        durationMinutes
      }
    });
    
  } catch (error) {
    console.error('Error fetching active session:', error);
    next(error);
  }
};

/**
 * Get photo timeline for a zone with permission-based filtering
 * GET /api/reports/parking/zone/:zoneId/timeline
 */
export const getPhotoTimeline = async (req, res, next) => {
  try {
    const { zoneId } = req.params;
    const userId = req.userId;
    const limit = parseInt(req.query.limit) || 50;
    const canViewHighRes = req.canViewHighRes || false; // Set by checkPhotoPermission middleware
    
    // Get photos for the zone (not expired, not hidden)
    const result = await pool.query(
      `SELECT 
        pr.id,
        pr.photo_url,
        pr.thumbnail_url,
        pr.timestamp,
        pr.expires_at,
        pr.is_hidden,
        u.bike_name,
        u.name as user_name,
        pr.user_id = $1 as is_own_photo
       FROM parking_reports pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.zone_id = $2 
         AND pr.expires_at > NOW()
         AND (pr.is_hidden = false OR pr.user_id = $1)
       ORDER BY pr.timestamp DESC
       LIMIT $3`,
      [userId, zoneId, limit]
    );
    
    // Filter URLs based on permission
    const photos = result.rows.map(photo => ({
      id: photo.id,
      // Show high-res if: user has permission OR it's their own photo
      photoUrl: (canViewHighRes || photo.is_own_photo) ? photo.photo_url : null,
      thumbnailUrl: photo.thumbnail_url,
      timestamp: photo.timestamp,
      expiresAt: photo.expires_at,
      uploaderName: photo.bike_name || photo.user_name,
      isOwnPhoto: photo.is_own_photo,
      isHidden: photo.is_hidden,
      canViewHighRes: canViewHighRes || photo.is_own_photo
    }));
    
    // Get zone info
    const zoneInfo = await pool.query(
      'SELECT name, latitude, longitude FROM parking_zones WHERE id = $1',
      [zoneId]
    );
    
    res.json({
      zone: zoneInfo.rows[0] || null,
      photos,
      count: photos.length,
      canViewHighRes,
      hasActiveSession: !!req.sessionId
    });
    
  } catch (error) {
    console.error('Error fetching photo timeline:', error);
    next(error);
  }
};

/**
 * Report a photo as inappropriate
 * POST /api/reports/parking/photo/:photoId/report
 */
export const reportPhoto = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { photoId } = req.params;
    const { reason } = req.body;
    const userId = req.userId;
    
    if (!reason) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Report reason is required',
        statusCode: 400
      });
    }
    
    // Check if photo exists
    const photoCheck = await client.query(
      'SELECT id, user_id, zone_id FROM parking_reports WHERE id = $1',
      [photoId]
    );
    
    if (photoCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not Found',
        message: 'Photo not found',
        statusCode: 404
      });
    }
    
    const photo = photoCheck.rows[0];
    
    // Prevent reporting own photos
    if (photo.user_id === userId) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Validation Error',
        message: 'You cannot report your own photo',
        statusCode: 400
      });
    }
    
    // Check for duplicate report
    const duplicateCheck = await client.query(
      'SELECT id FROM photo_reports WHERE photo_id = $1 AND reporter_id = $2',
      [photoId, userId]
    );
    
    if (duplicateCheck.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        error: 'Validation Error',
        message: 'You have already reported this photo',
        statusCode: 400
      });
    }
    
    // Create report
    await client.query(
      'INSERT INTO photo_reports (photo_id, reporter_id, reason) VALUES ($1, $2, $3)',
      [photoId, userId, reason]
    );
    
    // Count total reports for this photo
    const reportCount = await client.query(
      'SELECT COUNT(*) as count FROM photo_reports WHERE photo_id = $1',
      [photoId]
    );
    
    const totalReports = parseInt(reportCount.rows[0].count);
    
    // Auto-hide if >= 3 reports
    if (totalReports >= 3) {
      await client.query(
        'UPDATE parking_reports SET is_hidden = true WHERE id = $1',
        [photoId]
      );
      
      // TODO: Notify photo uploader (implement in notification service)
      // TODO: Add to moderation queue
    }
    
    await client.query('COMMIT');
    
    res.json({
      message: 'Photo reported successfully',
      totalReports,
      autoHidden: totalReports >= 3
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error reporting photo:', error);
    next(error);
  } finally {
    client.release();
  }
};
