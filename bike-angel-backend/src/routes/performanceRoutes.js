import express from 'express';
import {
  analyzeSlowQueries,
  analyzeTableSizes,
  analyzeMissingIndexes,
  getPoolStats,
  optimizeQueries,
  cleanupOldData
} from '../utils/performanceAnalyzer.js';

const router = express.Router();

/**
 * GET /api/performance/slow-queries
 * Analyze slow database queries
 */
router.get('/slow-queries', async (req, res) => {
  try {
    const slowQueries = await analyzeSlowQueries();
    
    res.json({
      slowQueries,
      count: slowQueries.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to analyze slow queries',
      statusCode: 500
    });
  }
});

/**
 * GET /api/performance/table-sizes
 * Analyze table sizes
 */
router.get('/table-sizes', async (req, res) => {
  try {
    const tables = await analyzeTableSizes();
    
    res.json({
      tables,
      count: tables.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to analyze table sizes',
      statusCode: 500
    });
  }
});

/**
 * GET /api/performance/missing-indexes
 * Analyze potentially missing indexes
 */
router.get('/missing-indexes', async (req, res) => {
  try {
    const suggestions = await analyzeMissingIndexes();
    
    res.json({
      suggestions,
      count: suggestions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to analyze indexes',
      statusCode: 500
    });
  }
});

/**
 * GET /api/performance/pool-stats
 * Get database connection pool statistics
 */
router.get('/pool-stats', (req, res) => {
  try {
    const stats = getPoolStats();
    
    res.json({
      pool: stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to get pool stats',
      statusCode: 500
    });
  }
});

/**
 * POST /api/performance/optimize
 * Run query optimizations
 */
router.post('/optimize', async (req, res) => {
  try {
    const optimizations = await optimizeQueries();
    
    res.json({
      optimizations,
      count: optimizations.length,
      message: 'Optimizations applied successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to optimize queries',
      statusCode: 500
    });
  }
});

/**
 * POST /api/performance/cleanup
 * Clean up old data
 */
router.post('/cleanup', async (req, res) => {
  try {
    const results = await cleanupOldData();
    
    res.json({
      results,
      message: 'Cleanup completed successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error',
      message: 'Failed to cleanup old data',
      statusCode: 500
    });
  }
});

export default router;
