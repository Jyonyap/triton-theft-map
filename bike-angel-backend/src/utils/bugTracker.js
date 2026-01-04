import pool from '../config/database.js';

/**
 * Bug tracking and issue management utilities
 */

/**
 * Log an error to the database
 */
export async function logError(error, context = {}) {
  try {
    await pool.query(
      `INSERT INTO error_logs (error_type, message, stack_trace, context, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [
        error.name || 'Error',
        error.message || 'Unknown error',
        error.stack || '',
        JSON.stringify(context)
      ]
    );
  } catch (err) {
    console.error('Failed to log error to database:', err);
  }
}

/**
 * Get recent errors
 */
export async function getRecentErrors(limit = 50) {
  try {
    const result = await pool.query(
      `SELECT id, error_type, message, stack_trace, context, created_at
       FROM error_logs
       ORDER BY created_at DESC
       LIMIT $1`,
      [limit]
    );
    
    return result.rows;
  } catch (error) {
    console.error('Failed to get recent errors:', error);
    return [];
  }
}

/**
 * Get error statistics
 */
export async function getErrorStats() {
  try {
    const [total, last24h, byType] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM error_logs'),
      pool.query(`SELECT COUNT(*) FROM error_logs WHERE created_at > NOW() - INTERVAL '24 hours'`),
      pool.query(`
        SELECT error_type, COUNT(*) as count
        FROM error_logs
        WHERE created_at > NOW() - INTERVAL '7 days'
        GROUP BY error_type
        ORDER BY count DESC
        LIMIT 10
      `)
    ]);
    
    return {
      totalErrors: parseInt(total.rows[0].count),
      last24Hours: parseInt(last24h.rows[0].count),
      errorsByType: byType.rows
    };
  } catch (error) {
    console.error('Failed to get error stats:', error);
    return {
      totalErrors: 0,
      last24Hours: 0,
      errorsByType: []
    };
  }
}

/**
 * Track feature usage
 */
export async function trackFeatureUsage(featureName, userId = null) {
  try {
    await pool.query(
      `INSERT INTO feature_usage (feature_name, user_id, used_at)
       VALUES ($1, $2, NOW())`,
      [featureName, userId]
    );
  } catch (error) {
    console.error('Failed to track feature usage:', error);
  }
}

/**
 * Get feature usage statistics
 */
export async function getFeatureUsageStats(days = 7) {
  try {
    const result = await pool.query(
      `SELECT 
         feature_name,
         COUNT(*) as usage_count,
         COUNT(DISTINCT user_id) as unique_users
       FROM feature_usage
       WHERE used_at > NOW() - INTERVAL '${days} days'
       GROUP BY feature_name
       ORDER BY usage_count DESC`,
    );
    
    return result.rows;
  } catch (error) {
    console.error('Failed to get feature usage stats:', error);
    return [];
  }
}

/**
 * Create issue report
 */
export async function createIssueReport(issue) {
  try {
    const result = await pool.query(
      `INSERT INTO issue_reports (
         title, description, severity, status, reporter_id, created_at
       ) VALUES ($1, $2, $3, 'open', $4, NOW())
       RETURNING id, title, severity, status, created_at`,
      [issue.title, issue.description, issue.severity || 'medium', issue.reporterId]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Failed to create issue report:', error);
    throw error;
  }
}

/**
 * Get open issues
 */
export async function getOpenIssues() {
  try {
    const result = await pool.query(
      `SELECT id, title, description, severity, status, created_at
       FROM issue_reports
       WHERE status IN ('open', 'in_progress')
       ORDER BY 
         CASE severity
           WHEN 'critical' THEN 1
           WHEN 'high' THEN 2
           WHEN 'medium' THEN 3
           WHEN 'low' THEN 4
         END,
         created_at DESC`
    );
    
    return result.rows;
  } catch (error) {
    console.error('Failed to get open issues:', error);
    return [];
  }
}

/**
 * Update issue status
 */
export async function updateIssueStatus(issueId, status, resolution = null) {
  try {
    const result = await pool.query(
      `UPDATE issue_reports
       SET status = $1, resolution = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING id, title, status, updated_at`,
      [status, resolution, issueId]
    );
    
    return result.rows[0];
  } catch (error) {
    console.error('Failed to update issue status:', error);
    throw error;
  }
}
