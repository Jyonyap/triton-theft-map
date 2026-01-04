import pool from '../config/database.js';

/**
 * Analyze slow database queries
 */
export async function analyzeSlowQueries() {
  try {
    // Enable query logging if not already enabled
    await pool.query(`
      ALTER DATABASE ${process.env.PGDATABASE || 'bike_angel'} 
      SET log_min_duration_statement = 1000
    `);
    
    // Get slow queries from pg_stat_statements if available
    const result = await pool.query(`
      SELECT 
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        max_exec_time
      FROM pg_stat_statements
      WHERE mean_exec_time > 100
      ORDER BY mean_exec_time DESC
      LIMIT 20
    `);
    
    return result.rows;
  } catch (error) {
    // pg_stat_statements might not be installed
    console.log('Note: pg_stat_statements extension not available');
    return [];
  }
}

/**
 * Analyze table sizes and suggest optimizations
 */
export async function analyzeTableSizes() {
  try {
    const result = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
        pg_total_relation_size(schemaname||'.'||tablename) AS size_bytes
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY size_bytes DESC
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error analyzing table sizes:', error);
    return [];
  }
}

/**
 * Analyze missing indexes
 */
export async function analyzeMissingIndexes() {
  try {
    const result = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        attname,
        n_distinct,
        correlation
      FROM pg_stats
      WHERE schemaname = 'public'
        AND n_distinct > 100
        AND correlation < 0.1
      ORDER BY n_distinct DESC
      LIMIT 10
    `);
    
    return result.rows;
  } catch (error) {
    console.error('Error analyzing indexes:', error);
    return [];
  }
}

/**
 * Get database connection pool stats
 */
export function getPoolStats() {
  return {
    totalCount: pool.totalCount,
    idleCount: pool.idleCount,
    waitingCount: pool.waitingCount
  };
}

/**
 * Optimize specific queries with better indexes
 */
export async function optimizeQueries() {
  const optimizations = [];
  
  try {
    // Check if we need index on parking_reports for zone lookups
    const reportsIndex = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'parking_reports' 
        AND indexname = 'idx_reports_zone_expires'
    `);
    
    if (reportsIndex.rows.length === 0) {
      await pool.query(`
        CREATE INDEX CONCURRENTLY idx_reports_zone_expires 
        ON parking_reports(zone_id, expires_at) 
        WHERE expires_at > NOW()
      `);
      optimizations.push('Created index on parking_reports(zone_id, expires_at)');
    }
    
    // Check if we need index on theft_incidents for recent lookups
    const incidentsIndex = await pool.query(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'theft_incidents' 
        AND indexname = 'idx_incidents_zone_recent'
    `);
    
    if (incidentsIndex.rows.length === 0) {
      await pool.query(`
        CREATE INDEX CONCURRENTLY idx_incidents_zone_recent 
        ON theft_incidents(zone_id, created_at DESC) 
        WHERE created_at > NOW() - INTERVAL '90 days'
      `);
      optimizations.push('Created index on theft_incidents(zone_id, created_at)');
    }
    
    // Analyze tables to update statistics
    await pool.query('ANALYZE parking_reports');
    await pool.query('ANALYZE theft_incidents');
    await pool.query('ANALYZE parking_zones');
    optimizations.push('Updated table statistics');
    
    return optimizations;
  } catch (error) {
    console.error('Error optimizing queries:', error);
    return optimizations;
  }
}

/**
 * Clean up old data to improve performance
 */
export async function cleanupOldData() {
  const results = {
    expiredReports: 0,
    oldNotifications: 0
  };
  
  try {
    // Delete expired parking reports
    const reports = await pool.query(`
      DELETE FROM parking_reports 
      WHERE expires_at < NOW() - INTERVAL '7 days'
      RETURNING id
    `);
    results.expiredReports = reports.rowCount;
    
    // Delete old read notifications (older than 30 days)
    const notifications = await pool.query(`
      DELETE FROM notifications 
      WHERE read = true 
        AND created_at < NOW() - INTERVAL '30 days'
      RETURNING id
    `);
    results.oldNotifications = notifications.rowCount;
    
    // Vacuum tables to reclaim space
    await pool.query('VACUUM ANALYZE parking_reports');
    await pool.query('VACUUM ANALYZE notifications');
    
    return results;
  } catch (error) {
    console.error('Error cleaning up old data:', error);
    return results;
  }
}
