import express from 'express';
import {
  logError,
  getRecentErrors,
  getErrorStats,
  trackFeatureUsage,
  getFeatureUsageStats,
  createIssueReport,
  getOpenIssues,
  updateIssueStatus
} from '../utils/bugTracker.js';

const router = express.Router();

/**
 * GET /api/issues/errors
 * Get recent error logs
 */
router.get('/errors', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const errors = await getRecentErrors(limit);
    
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
 * GET /api/issues/error-stats
 * Get error statistics
 */
router.get('/error-stats', async (req, res) => {
  try {
    const stats = await getErrorStats();
    
    res.json({
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to retrieve error statistics',
      statusCode: 500
    });
  }
});

/**
 * POST /api/issues/track-feature
 * Track feature usage
 */
router.post('/track-feature', async (req, res) => {
  try {
    const { featureName, userId } = req.body;
    
    if (!featureName) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Feature name is required',
        statusCode: 400
      });
    }
    
    await trackFeatureUsage(featureName, userId);
    
    res.json({
      message: 'Feature usage tracked successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to track feature usage',
      statusCode: 500
    });
  }
});

/**
 * GET /api/issues/feature-stats
 * Get feature usage statistics
 */
router.get('/feature-stats', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const stats = await getFeatureUsageStats(days);
    
    res.json({
      stats,
      period: `${days} days`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to retrieve feature statistics',
      statusCode: 500
    });
  }
});

/**
 * POST /api/issues/report
 * Create a new issue report
 */
router.post('/report', async (req, res) => {
  try {
    const { title, description, severity, reporterId } = req.body;
    
    if (!title || !description) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Title and description are required',
        statusCode: 400
      });
    }
    
    const issue = await createIssueReport({
      title,
      description,
      severity,
      reporterId
    });
    
    res.status(201).json({
      issue,
      message: 'Issue reported successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to create issue report',
      statusCode: 500
    });
  }
});

/**
 * GET /api/issues/open
 * Get all open issues
 */
router.get('/open', async (req, res) => {
  try {
    const issues = await getOpenIssues();
    
    res.json({
      issues,
      count: issues.length
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to retrieve open issues',
      statusCode: 500
    });
  }
});

/**
 * PATCH /api/issues/:id/status
 * Update issue status
 */
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution } = req.body;
    
    if (!status) {
      return res.status(400).json({
        error: 'ValidationError',
        message: 'Status is required',
        statusCode: 400
      });
    }
    
    const issue = await updateIssueStatus(id, status, resolution);
    
    res.json({
      issue,
      message: 'Issue status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to update issue status',
      statusCode: 500
    });
  }
});

export default router;
