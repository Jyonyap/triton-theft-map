import express from 'express';
import { 
  getRequestLogs, 
  getErrorLogs, 
  getSlowRequests, 
  getUsageMetrics 
} from '../middleware/requestLogger.js';
import pool from '../config/database.js';

const router = express.Router();

/**
 * GET /api/monitoring/logs
 * Get recent request logs
 */
router.get('/logs', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const logs = getRequestLogs(limit);
    
    res.json({
      logs,
      count: logs.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to retrieve logs',
      statusCode: 500
    });
  }
});

/**
 * GET /api/monitoring/errors
 * Get recent error logs
 */
router.get('/errors', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const errors = getErrorLogs(limit);
    
    res.json({
      errors,
      count: errors.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to retrieve error logs',
      statusCode: 500
    });
  }
});

/**
 * GET /api/monitoring/slow-requests
 * Get slow requests (> threshold ms)
 */
router.get('/slow-requests', async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 1000;
    const limit = parseInt(req.query.limit) || 50;
    const slowRequests = getSlowRequests(threshold, limit);
    
    res.json({
      slowRequests,
      count: slowRequests.length,
      threshold
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to retrieve slow requests',
      statusCode: 500
    });
  }
});

/**
 * GET /api/monitoring/metrics
 * Get usage metrics and statistics
 */
router.get('/metrics', async (req, res) => {
  try {
    const metrics = getUsageMetrics();
    
    // Add database metrics
    const dbMetrics = await getDatabaseMetrics();
    
    res.json({
      api: metrics,
      database: dbMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to retrieve metrics',
      statusCode: 500
    });
  }
});

/**
 * GET /api/monitoring/feedback
 * Get user feedback submissions
 */
router.get('/feedback', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    
    const result = await pool.query(
      `SELECT id, user_id, category, message, created_at, status
       FROM user_feedback
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    
    res.json({
      feedback: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to retrieve feedback',
      statusCode: 500
    });
  }
});

/**
 * POST /api/monitoring/feedback
 * Submit user feedback
 */
router.post('/feedback', async (req, res) => {
  try {
    const { userId, category, message } = req.body;
    
    if (!category || !message) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Category and message are required',
        statusCode: 400
      });
    }
    
    const result = await pool.query(
      `INSERT INTO user_feedback (user_id, category, message, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id, category, message, created_at`,
      [userId || null, category, message]
    );
    
    res.status(201).json({
      feedback: result.rows[0],
      message: 'Feedback submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to submit feedback',
      statusCode: 500
    });
  }
});

/**
 * Helper function to get database metrics
 */
async function getDatabaseMetrics() {
  try {
    const [users, zones, reports, incidents] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM parking_zones'),
      pool.query('SELECT COUNT(*) FROM parking_reports WHERE expires_at > NOW()'),
      pool.query('SELECT COUNT(*) FROM theft_incidents WHERE created_at > NOW() - INTERVAL \'90 days\'')
    ]);
    
    return {
      totalUsers: parseInt(users.rows[0].count),
      totalZones: parseInt(zones.rows[0].count),
      activeParkingReports: parseInt(reports.rows[0].count),
      recentTheftIncidents: parseInt(incidents.rows[0].count)
    };
  } catch (error) {
    console.error('Error getting database metrics:', error);
    return {
      error: 'Failed to retrieve database metrics'
    };
  }
}

export default router;
