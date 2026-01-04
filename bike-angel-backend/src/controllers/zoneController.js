/**
 * Zone Controller
 * Handles parking zone operations including listing zones, getting zone details,
 * and zone suggestions.
 */

import pool from '../config/database.js';

/**
 * GET /api/zones
 * Get all parking zones with their current risk ratings and congestion levels
 * 
 * Response includes:
 * - Zone basic info (id, name, coordinates, capacity)
 * - Current risk rating (green/yellow/red)
 * - Current congestion level (available/filling/full)
 * - Last updated timestamp
 */
export const getAllZones = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        latitude,
        longitude,
        capacity,
        risk_rating,
        congestion_level,
        last_updated
      FROM parking_zones
      ORDER BY name ASC
    `);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      zones: result.rows
    });
  } catch (error) {
    console.error('Error fetching zones:', error);
    next({
      statusCode: 500,
      message: 'Failed to fetch parking zones',
      error: error.message
    });
  }
};

/**
 * GET /api/zones/:id
 * Get detailed information about a specific parking zone
 * 
 * Includes:
 * - Zone basic info
 * - Risk rating and congestion level
 * - Recent parking reports (past 12 hours)
 * - Recent theft incidents (past 90 days)
 * - Statistics (active reports count, theft count)
 */
export const getZoneById = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Get zone basic information
    const zoneResult = await pool.query(`
      SELECT 
        id,
        name,
        latitude,
        longitude,
        capacity,
        risk_rating,
        congestion_level,
        last_updated
      FROM parking_zones
      WHERE id = $1
    `, [id]);

    if (zoneResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Parking zone not found',
        statusCode: 404
      });
    }

    const zone = zoneResult.rows[0];

    // Get recent parking reports (past 12 hours, not expired)
    const reportsResult = await pool.query(`
      SELECT 
        id,
        photo_url,
        thumbnail_url,
        timestamp,
        expires_at
      FROM parking_reports
      WHERE zone_id = $1 
        AND expires_at > NOW()
      ORDER BY timestamp DESC
      LIMIT 10
    `, [id]);

    // Get recent theft incidents (past 90 days)
    const incidentsResult = await pool.query(`
      SELECT 
        id,
        date_time,
        description,
        police_report_number,
        verified,
        created_at
      FROM theft_incidents
      WHERE zone_id = $1 
        AND date_time > NOW() - INTERVAL '90 days'
      ORDER BY date_time DESC
    `, [id]);

    // Calculate statistics
    const activeReportsCount = reportsResult.rows.length;
    const totalTheftsCount = incidentsResult.rows.length;
    const verifiedTheftsCount = incidentsResult.rows.filter(i => i.verified).length;

    // Estimate current bike count based on active reports
    const estimatedBikeCount = Math.min(activeReportsCount, zone.capacity);

    res.status(200).json({
      success: true,
      zone: {
        ...zone,
        statistics: {
          activeReports: activeReportsCount,
          estimatedBikes: estimatedBikeCount,
          totalThefts90Days: totalTheftsCount,
          verifiedThefts90Days: verifiedTheftsCount
        }
      },
      recentActivity: {
        parkingReports: reportsResult.rows,
        theftIncidents: incidentsResult.rows
      }
    });
  } catch (error) {
    console.error('Error fetching zone details:', error);
    next({
      statusCode: 500,
      message: 'Failed to fetch zone details',
      error: error.message
    });
  }
};

/**
 * POST /api/zones/suggest
 * Submit a suggestion for a new parking zone
 * 
 * Request body:
 * - suggestedName: string (required) - Name of the suggested zone
 * - latitude: number (required) - GPS latitude
 * - longitude: number (required) - GPS longitude
 * - estimatedCapacity: number (optional) - Estimated bike capacity
 * - description: string (optional) - Additional details about the location
 * 
 * Requires authentication
 */
export const suggestZone = async (req, res, next) => {
  const { suggestedName, latitude, longitude, estimatedCapacity, description } = req.body;
  const userId = req.userId; // From auth middleware

  // Validation
  if (!suggestedName || !latitude || !longitude) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Missing required fields: suggestedName, latitude, longitude',
      statusCode: 400
    });
  }

  // Validate coordinates
  if (latitude < -90 || latitude > 90) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Invalid latitude. Must be between -90 and 90',
      statusCode: 400
    });
  }

  if (longitude < -180 || longitude > 180) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Invalid longitude. Must be between -180 and 180',
      statusCode: 400
    });
  }

  // Validate capacity if provided
  if (estimatedCapacity !== undefined && (estimatedCapacity < 1 || estimatedCapacity > 500)) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Invalid capacity. Must be between 1 and 500',
      statusCode: 400
    });
  }

  try {
    // Insert the suggestion
    const result = await pool.query(`
      INSERT INTO zone_suggestions 
        (user_id, suggested_name, latitude, longitude, estimated_capacity, description)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING 
        id,
        suggested_name,
        latitude,
        longitude,
        estimated_capacity,
        description,
        status,
        created_at
    `, [userId, suggestedName, latitude, longitude, estimatedCapacity || null, description || null]);

    const suggestion = result.rows[0];

    // TODO: In a production system, send notification to admin
    // This could be an email, Slack message, or in-app notification
    // For now, we'll just log it
    console.log(`📍 New zone suggestion from user ${userId}: ${suggestedName}`);

    res.status(201).json({
      success: true,
      message: 'Zone suggestion submitted successfully. An administrator will review your suggestion.',
      suggestion: {
        id: suggestion.id,
        suggestedName: suggestion.suggested_name,
        latitude: suggestion.latitude,
        longitude: suggestion.longitude,
        estimatedCapacity: suggestion.estimated_capacity,
        description: suggestion.description,
        status: suggestion.status,
        createdAt: suggestion.created_at
      }
    });
  } catch (error) {
    console.error('Error submitting zone suggestion:', error);
    next({
      statusCode: 500,
      message: 'Failed to submit zone suggestion',
      error: error.message
    });
  }
};

/**
 * GET /api/zones/suggestions
 * Get all zone suggestions (for admin review)
 * 
 * Query parameters:
 * - status: filter by status (pending/approved/rejected)
 * 
 * Note: In production, this should be restricted to admin users only
 */
export const getAllSuggestions = async (req, res, next) => {
  const { status } = req.query;

  try {
    let query = `
      SELECT 
        zs.id,
        zs.suggested_name,
        zs.latitude,
        zs.longitude,
        zs.estimated_capacity,
        zs.description,
        zs.status,
        zs.admin_notes,
        zs.created_at,
        zs.reviewed_at,
        u.name as suggested_by_name,
        u.email as suggested_by_email
      FROM zone_suggestions zs
      JOIN users u ON zs.user_id = u.id
    `;

    const params = [];

    if (status && ['pending', 'approved', 'rejected'].includes(status)) {
      query += ' WHERE zs.status = $1';
      params.push(status);
    }

    query += ' ORDER BY zs.created_at DESC';

    const result = await pool.query(query, params);

    res.status(200).json({
      success: true,
      count: result.rows.length,
      suggestions: result.rows
    });
  } catch (error) {
    console.error('Error fetching zone suggestions:', error);
    next({
      statusCode: 500,
      message: 'Failed to fetch zone suggestions',
      error: error.message
    });
  }
};
