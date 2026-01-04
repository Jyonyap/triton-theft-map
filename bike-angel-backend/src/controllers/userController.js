// User controller
// Handles user profile, favorites, and preferences

import pool from '../config/database.js';

/**
 * Add a zone to user's favorites
 * POST /api/users/favorites
 */
export const addFavoriteZone = async (req, res, next) => {
  try {
    const { zoneId } = req.body;
    const userId = req.user.id; // From auth middleware

    // Validate required fields
    if (!zoneId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Zone ID is required',
        statusCode: 400
      });
    }

    // Check if zone exists
    const zoneCheck = await pool.query(
      'SELECT id FROM parking_zones WHERE id = $1',
      [zoneId]
    );

    if (zoneCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Parking zone not found',
        statusCode: 404
      });
    }

    // Check if already favorited
    const existingFavorite = await pool.query(
      'SELECT * FROM favorite_zones WHERE user_id = $1 AND zone_id = $2',
      [userId, zoneId]
    );

    if (existingFavorite.rows.length > 0) {
      return res.status(200).json({
        message: 'Zone already in favorites',
        favorite: existingFavorite.rows[0]
      });
    }

    // Add to favorites
    const result = await pool.query(
      `INSERT INTO favorite_zones (user_id, zone_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, zoneId]
    );

    res.status(201).json({
      message: 'Zone added to favorites',
      favorite: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Remove a zone from user's favorites
 * DELETE /api/users/favorites/:zoneId
 */
export const removeFavoriteZone = async (req, res, next) => {
  try {
    const { zoneId } = req.params;
    const userId = req.user.id; // From auth middleware

    // Delete favorite
    const result = await pool.query(
      'DELETE FROM favorite_zones WHERE user_id = $1 AND zone_id = $2 RETURNING *',
      [userId, zoneId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Favorite zone not found',
        statusCode: 404
      });
    }

    res.status(200).json({
      message: 'Zone removed from favorites',
      favorite: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's favorite zones
 * GET /api/users/favorites
 */
export const getFavoriteZones = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware

    // Get favorites with zone details
    const result = await pool.query(
      `SELECT 
        fz.created_at as favorited_at,
        pz.id,
        pz.name,
        pz.latitude,
        pz.longitude,
        pz.capacity,
        pz.risk_rating,
        pz.congestion_level,
        pz.last_updated
       FROM favorite_zones fz
       JOIN parking_zones pz ON fz.zone_id = pz.id
       WHERE fz.user_id = $1
       ORDER BY fz.created_at DESC`,
      [userId]
    );

    res.status(200).json({
      favorites: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user profile
 * GET /api/users/profile
 */
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware

    // Get user data (excluding password hash)
    const result = await pool.query(
      `SELECT id, email, name, bike_name, role, email_verified, notifications_enabled, created_at
       FROM users
       WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
        statusCode: 404
      });
    }

    res.status(200).json({
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user profile
 * PUT /api/users/profile
 */
export const updateProfile = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { name, bike_name, notifications_enabled } = req.body;

    // Build update query dynamically based on provided fields
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push('name = $' + paramCount);
      values.push(name);
      paramCount++;
    }

    if (bike_name !== undefined) {
      updates.push('bike_name = $' + paramCount);
      values.push(bike_name || null);
      paramCount++;
    }

    if (notifications_enabled !== undefined) {
      updates.push('notifications_enabled = $' + paramCount);
      values.push(notifications_enabled);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'No fields to update',
        statusCode: 400
      });
    }

    // Add user ID as last parameter
    values.push(userId);

    const result = await pool.query(
      'UPDATE users SET ' + updates.join(', ') + ' WHERE id = $' + paramCount + ' RETURNING id, email, name, bike_name, email_verified, notifications_enabled, created_at',
      values
    );

    res.status(200).json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user account
 * DELETE /api/users/account
 * 
 * Implements Requirement 10.4:
 * - Remove personal data (name, email)
 * - Anonymize parking reports and theft incidents (user_id set to NULL via ON DELETE SET NULL)
 * - Delete user record
 * - Frontend handles logout
 */
export const deleteAccount = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const userId = req.user.id; // From auth middleware

    // Start transaction
    await client.query('BEGIN');

    // Check if user exists
    const userCheck = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [userId]
    );

    if (userCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
        statusCode: 404
      });
    }

    // Delete user
    // The database schema handles anonymization automatically:
    // - parking_reports.user_id -> SET NULL (preserves safety data)
    // - theft_incidents.user_id -> SET NULL (preserves safety data)
    // - zone_suggestions.user_id -> SET NULL (preserves suggestions)
    // - favorite_zones -> CASCADE DELETE (personal preference)
    // - notifications -> CASCADE DELETE (personal data)
    // - email_verification_tokens -> CASCADE DELETE (personal data)
    await client.query(
      'DELETE FROM users WHERE id = $1',
      [userId]
    );

    // Commit transaction
    await client.query('COMMIT');

    res.status(200).json({
      message: 'Account deleted successfully'
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
