import cron from 'node-cron';
import pool from '../config/database.js';
import storageService from './storageService.js';
import CongestionAnalyzer from './congestionAnalyzer.js';

/**
 * Report Cleanup Service
 * Handles automatic deletion of expired parking reports
 * and recalculation of congestion levels
 */
export class ReportCleanupService {
  constructor() {
    this.isRunning = false;
    this.cronJob = null;
  }
  
  /**
   * Start the cleanup scheduler
   * Runs every hour to clean up expired reports
   */
  start() {
    if (this.isRunning) {
      console.log('⚠️  Cleanup service is already running');
      return;
    }
    
    // Schedule cleanup to run every hour
    // Cron format: minute hour day month weekday
    // '0 * * * *' = at minute 0 of every hour
    this.cronJob = cron.schedule('0 * * * *', async () => {
      console.log('🧹 Running scheduled parking report cleanup...');
      await this.cleanupExpiredReports();
    });
    
    this.isRunning = true;
    console.log('✅ Report cleanup service started (runs every hour)');
    
    // Run cleanup immediately on start (non-blocking, with error handling)
    this.cleanupExpiredReports().catch(error => {
      console.log('⚠️  Initial cleanup skipped (database not ready yet):', error.message);
    });
  }
  
  /**
   * Stop the cleanup scheduler
   */
  stop() {
    if (this.cronJob) {
      this.cronJob.stop();
      this.isRunning = false;
      console.log('🛑 Report cleanup service stopped');
    }
  }
  
  /**
   * Clean up expired parking reports
   * Deletes reports older than 12 hours and recalculates congestion
   * @returns {Promise<Object>} - Cleanup statistics
   */
  async cleanupExpiredReports() {
    const client = await pool.connect();
    const startTime = Date.now();
    
    try {
      console.log('🔍 Finding expired reports...');
      
      // Get expired reports with their storage keys
      const expiredReportsResult = await client.query(
        `SELECT id, zone_id, photo_url, thumbnail_url
         FROM parking_reports
         WHERE expires_at <= NOW()`
      );
      
      const expiredReports = expiredReportsResult.rows;
      console.log(`📊 Found ${expiredReports.length} expired report(s)`);
      
      if (expiredReports.length === 0) {
        return {
          deletedCount: 0,
          zonesUpdated: 0,
          duration: Date.now() - startTime
        };
      }
      
      // Extract storage keys for deletion
      const storageKeys = expiredReports.map(report => {
        // Extract key from URL
        // Format: https://bucket.s3.region.amazonaws.com/photos/uuid.jpeg
        const photoKey = report.photo_url.split('.com/')[1];
        const thumbnailKey = report.thumbnail_url.split('.com/')[1];
        return { photoKey, thumbnailKey };
      });
      
      // Get unique zones that need congestion recalculation
      const affectedZones = [...new Set(expiredReports.map(r => r.zone_id))];
      
      // Delete reports from database
      console.log('🗑️  Deleting expired reports from database...');
      const deleteResult = await client.query(
        'DELETE FROM parking_reports WHERE expires_at <= NOW()'
      );
      
      console.log(`✅ Deleted ${deleteResult.rowCount} report(s) from database`);
      
      // Delete photos from cloud storage (async, don't wait)
      console.log('☁️  Deleting photos from cloud storage...');
      this.deletePhotosAsync(storageKeys);
      
      // Recalculate congestion for affected zones
      console.log(`🔄 Recalculating congestion for ${affectedZones.length} zone(s)...`);
      let zonesUpdated = 0;
      
      for (const zoneId of affectedZones) {
        try {
          await CongestionAnalyzer.updateZoneCongestion(zoneId);
          zonesUpdated++;
        } catch (error) {
          console.error(`❌ Error updating congestion for zone ${zoneId}:`, error.message);
        }
      }
      
      const duration = Date.now() - startTime;
      
      console.log(`✅ Cleanup complete in ${duration}ms`);
      console.log(`   - Reports deleted: ${deleteResult.rowCount}`);
      console.log(`   - Zones updated: ${zonesUpdated}`);
      
      return {
        deletedCount: deleteResult.rowCount,
        zonesUpdated,
        duration
      };
      
    } catch (error) {
      console.error('❌ Error during cleanup:', error);
      throw error;
    } finally {
      client.release();
    }
  }
  
  /**
   * Delete photos from cloud storage asynchronously
   * @param {Array} storageKeys - Array of {photoKey, thumbnailKey} objects
   */
  async deletePhotosAsync(storageKeys) {
    let successCount = 0;
    let errorCount = 0;
    
    for (const { photoKey, thumbnailKey } of storageKeys) {
      try {
        await storageService.deleteFile(photoKey, thumbnailKey);
        successCount++;
      } catch (error) {
        console.error(`⚠️  Failed to delete photo ${photoKey}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`☁️  Cloud storage cleanup: ${successCount} deleted, ${errorCount} errors`);
  }
  
  /**
   * Get cleanup statistics
   * @returns {Promise<Object>} - Statistics about expired reports
   */
  async getCleanupStats() {
    const result = await pool.query(
      `SELECT 
        COUNT(*) as expired_count,
        COUNT(DISTINCT zone_id) as affected_zones
       FROM parking_reports
       WHERE expires_at <= NOW()`
    );
    
    return {
      expiredReports: parseInt(result.rows[0].expired_count),
      affectedZones: parseInt(result.rows[0].affected_zones)
    };
  }
  
  /**
   * Manually trigger cleanup (for testing or admin use)
   * @returns {Promise<Object>} - Cleanup results
   */
  async manualCleanup() {
    console.log('🔧 Manual cleanup triggered');
    return await this.cleanupExpiredReports();
  }
}

// Export singleton instance
const reportCleanupService = new ReportCleanupService();
export default reportCleanupService;
