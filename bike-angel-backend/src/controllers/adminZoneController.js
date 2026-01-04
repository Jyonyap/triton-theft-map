// Admin Zone Controller
// Handles admin-only zone management operations

import pool from '../config/database.js';
import storageService from '../services/storageService.js';

/**
 * Create a new parking zone (field capture)
 * POST /api/admin/zones
 */
export const createZone = async (req, res, next) => {
  try {
    const { name, latitude, longitude, gps_accuracy, capacity, description } = req.body;
    const adminId = req.user.id;

    // Validate required fields
    if (!latitude || !longitude) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Latitude and longitude are required',
        statusCode: 400
      });
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Latitude must be between -90 and 90',
        statusCode: 400
      });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Longitude must be between -180 and 180',
        statusCode: 400
      });
    }

    // Auto-generate name if not provided
    let zoneName = name;
    if (!zoneName) {
      // Get next spot number
      const countResult = await pool.query(
        `SELECT COUNT(*) as count FROM parking_zones WHERE name LIKE 'Spot #%'`
      );
      const nextNumber = parseInt(countResult.rows[0].count) + 1;
      zoneName = `Spot #${nextNumber}`;
    }

    // Handle photo uploads
    let dayPhotoUrl = null;
    let nightPhotoUrl = null;

    if (req.files) {
      if (req.files.photo_day) {
        const dayFile = req.files.photo_day[0];
        const result = await storageService.uploadFile(dayFile.buffer, dayFile.originalname, dayFile.mimetype);
        dayPhotoUrl = result.imageUrl;
      }
      if (req.files.photo_night) {
        const nightFile = req.files.photo_night[0];
        const result = await storageService.uploadFile(nightFile.buffer, nightFile.originalname, nightFile.mimetype);
        nightPhotoUrl = result.imageUrl;
      }
    }

    // Create zone with draft status
    const result = await pool.query(
      `INSERT INTO parking_zones 
       (name, latitude, longitude, gps_accuracy, capacity, description, status, created_by_admin_id, risk_rating, congestion_level, reference_photo_day_url, reference_photo_night_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        zoneName,
        latitude,
        longitude,
        gps_accuracy || null,
        capacity || 30, // Default capacity
        description || null,
        'draft', // Always start as draft
        adminId,
        'green', // Default risk rating
        'available', // Default congestion
        dayPhotoUrl,
        nightPhotoUrl
      ]
    );

    const zone = result.rows[0];

    // Log audit trail
    await pool.query(
      `INSERT INTO zone_audit_log (zone_id, admin_id, action, changes)
       VALUES ($1, $2, $3, $4)`,
      [zone.id, adminId, 'created', JSON.stringify({ zone: zoneName })]
    );

    res.status(201).json({
      message: 'Zone created successfully',
      zone: {
        id: zone.id,
        name: zone.name,
        latitude: parseFloat(zone.latitude),
        longitude: parseFloat(zone.longitude),
        gps_accuracy: zone.gps_accuracy,
        capacity: zone.capacity,
        description: zone.description,
        status: zone.status,
        risk_rating: zone.risk_rating,
        congestion_level: zone.congestion_level,
        reference_photo_day_url: zone.reference_photo_day_url,
        reference_photo_night_url: zone.reference_photo_night_url,
        created_at: zone.created_at
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all zones (admin view with filters)
 * GET /api/admin/zones?status=draft&search=library
 */
export const listZones = async (req, res, next) => {
  try {
    const { status, search } = req.query;

    let query = `
      SELECT 
        pz.*,
        u.name as created_by_name,
        (SELECT COUNT(*) FROM parking_reports pr WHERE pr.zone_id = pz.id AND pr.expires_at > NOW()) as active_reports,
        (SELECT COUNT(*) FROM theft_incidents ti WHERE ti.zone_id = pz.id AND ti.date_time > NOW() - INTERVAL '90 days') as recent_thefts
      FROM parking_zones pz
      LEFT JOIN users u ON pz.created_by_admin_id = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    // Filter by status
    if (status) {
      query += ` AND pz.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    // Search by name
    if (search) {
      query += ` AND pz.name ILIKE $${paramCount}`;
      params.push(`%${search}%`);
      paramCount++;
    }

    query += ` ORDER BY pz.created_at DESC`;

    const result = await pool.query(query, params);

    // Get statistics
    const statsResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM parking_zones
      GROUP BY status
    `);

    const stats = {
      draft: 0,
      active: 0,
      inactive: 0
    };

    statsResult.rows.forEach(row => {
      stats[row.status] = parseInt(row.count);
    });

    res.status(200).json({
      zones: result.rows.map(zone => ({
        id: zone.id,
        name: zone.name,
        latitude: parseFloat(zone.latitude),
        longitude: parseFloat(zone.longitude),
        capacity: zone.capacity,
        status: zone.status,
        risk_rating: zone.risk_rating,
        congestion_level: zone.congestion_level,
        reference_photo_day_url: zone.reference_photo_day_url,
        reference_photo_night_url: zone.reference_photo_night_url,
        gps_accuracy: zone.gps_accuracy,
        created_by_name: zone.created_by_name,
        active_reports: parseInt(zone.active_reports),
        recent_thefts: parseInt(zone.recent_thefts),
        created_at: zone.created_at,
        last_updated: zone.last_updated
      })),
      stats
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single zone details (admin view)
 * GET /api/admin/zones/:id
 */
export const getZone = async (req, res, next) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT 
        pz.*,
        creator.name as created_by_name,
        updater.name as updated_by_name
       FROM parking_zones pz
       LEFT JOIN users creator ON pz.created_by_admin_id = creator.id
       LEFT JOIN users updater ON pz.updated_by_admin_id = updater.id
       WHERE pz.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Zone not found',
        statusCode: 404
      });
    }

    const zone = result.rows[0];

    res.status(200).json({
      zone: {
        id: zone.id,
        name: zone.name,
        latitude: parseFloat(zone.latitude),
        longitude: parseFloat(zone.longitude),
        capacity: zone.capacity,
        description: zone.description,
        status: zone.status,
        risk_rating: zone.risk_rating,
        congestion_level: zone.congestion_level,
        reference_photo_day_url: zone.reference_photo_day_url,
        reference_photo_night_url: zone.reference_photo_night_url,
        gps_accuracy: zone.gps_accuracy,
        created_by_name: zone.created_by_name,
        updated_by_name: zone.updated_by_name,
        created_at: zone.created_at,
        last_updated: zone.last_updated
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update zone
 * PUT /api/admin/zones/:id
 */
export const updateZone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, capacity, description, risk_rating } = req.body;
    const adminId = req.user.id;

    // Check if zone exists
    const existingZone = await pool.query(
      'SELECT * FROM parking_zones WHERE id = $1',
      [id]
    );

    if (existingZone.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Zone not found',
        statusCode: 404
      });
    }

    // Build update query dynamically
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }

    if (latitude !== undefined) {
      if (latitude < -90 || latitude > 90) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Latitude must be between -90 and 90',
          statusCode: 400
        });
      }
      updates.push(`latitude = $${paramCount}`);
      params.push(latitude);
      paramCount++;
    }

    if (longitude !== undefined) {
      if (longitude < -180 || longitude > 180) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Longitude must be between -180 and 180',
          statusCode: 400
        });
      }
      updates.push(`longitude = $${paramCount}`);
      params.push(longitude);
      paramCount++;
    }

    if (capacity !== undefined) {
      updates.push(`capacity = $${paramCount}`);
      params.push(capacity);
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }

    if (risk_rating !== undefined) {
      updates.push(`risk_rating = $${paramCount}`);
      params.push(risk_rating);
      paramCount++;
    }

    // Always update the updater and timestamp
    updates.push(`updated_by_admin_id = $${paramCount}`);
    params.push(adminId);
    paramCount++;

    updates.push(`last_updated = NOW()`);

    // Add zone ID as last parameter
    params.push(id);

    const query = `
      UPDATE parking_zones 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await pool.query(query, params);
    const zone = result.rows[0];

    // Log audit trail
    await pool.query(
      `INSERT INTO zone_audit_log (zone_id, admin_id, action, changes)
       VALUES ($1, $2, $3, $4)`,
      [id, adminId, 'updated', JSON.stringify(req.body)]
    );

    res.status(200).json({
      message: 'Zone updated successfully',
      zone: {
        id: zone.id,
        name: zone.name,
        latitude: parseFloat(zone.latitude),
        longitude: parseFloat(zone.longitude),
        capacity: zone.capacity,
        description: zone.description,
        status: zone.status,
        risk_rating: zone.risk_rating,
        last_updated: zone.last_updated
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete zone
 * DELETE /api/admin/zones/:id
 */
export const deleteZone = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    // Check if zone exists
    const existingZone = await pool.query(
      'SELECT name FROM parking_zones WHERE id = $1',
      [id]
    );

    if (existingZone.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Zone not found',
        statusCode: 404
      });
    }

    // Check for active parking reports
    const activeReports = await pool.query(
      'SELECT COUNT(*) as count FROM parking_reports WHERE zone_id = $1 AND expires_at > NOW()',
      [id]
    );

    if (parseInt(activeReports.rows[0].count) > 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Cannot delete zone with active parking reports',
        statusCode: 400
      });
    }

    // Log audit trail before deletion
    await pool.query(
      `INSERT INTO zone_audit_log (zone_id, admin_id, action, changes)
       VALUES ($1, $2, $3, $4)`,
      [id, adminId, 'deleted', JSON.stringify({ name: existingZone.rows[0].name })]
    );

    // Delete zone (cascade will handle related records)
    await pool.query('DELETE FROM parking_zones WHERE id = $1', [id]);

    res.status(200).json({
      message: 'Zone deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Change zone status
 * PATCH /api/admin/zones/:id/status
 */
export const changeZoneStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;

    // Validate status
    if (!['draft', 'active', 'inactive'].includes(status)) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Status must be draft, active, or inactive',
        statusCode: 400
      });
    }

    // Get current zone
    const zoneResult = await pool.query(
      'SELECT * FROM parking_zones WHERE id = $1',
      [id]
    );

    if (zoneResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Zone not found',
        statusCode: 404
      });
    }

    const zone = zoneResult.rows[0];

    // Validate activation requirements
    if (status === 'active') {
      if (!zone.name || zone.name.trim() === '') {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Zone must have a name before activation',
          statusCode: 400
        });
      }

      if (!zone.reference_photo_day_url && !zone.reference_photo_night_url) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Zone must have at least one reference photo before activation',
          statusCode: 400
        });
      }
    }

    // Update status
    const result = await pool.query(
      `UPDATE parking_zones 
       SET status = $1, updated_by_admin_id = $2, last_updated = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, adminId, id]
    );

    // Log audit trail
    await pool.query(
      `INSERT INTO zone_audit_log (zone_id, admin_id, action, changes)
       VALUES ($1, $2, $3, $4)`,
      [id, adminId, 'status_changed', JSON.stringify({ from: zone.status, to: status })]
    );

    res.status(200).json({
      message: 'Zone status updated successfully',
      zone: {
        id: result.rows[0].id,
        name: result.rows[0].name,
        status: result.rows[0].status,
        last_updated: result.rows[0].last_updated
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get zone statistics
 * GET /api/admin/zones/stats
 */
export const getZoneStats = async (req, res, next) => {
  try {
    const statsResult = await pool.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM parking_zones
      GROUP BY status
    `);

    const stats = {
      draft: 0,
      active: 0,
      inactive: 0,
      total: 0
    };

    statsResult.rows.forEach(row => {
      stats[row.status] = parseInt(row.count);
      stats.total += parseInt(row.count);
    });

    res.status(200).json({ stats });
  } catch (error) {
    next(error);
  }
};
