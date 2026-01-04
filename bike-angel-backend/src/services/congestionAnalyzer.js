import pool from '../config/database.js';

/**
 * CongestionAnalyzer Service
 * Analyzes parking congestion based on recent reports
 * 
 * Congestion levels:
 * - "available": < 60% of capacity
 * - "filling": 60-89% of capacity
 * - "full": >= 90% of capacity
 */
export class CongestionAnalyzer {
  /**
   * Analyze congestion for a specific zone
   * @param {string} zoneId - Zone UUID
   * @returns {Promise<{level: string, bikeCount: number, capacity: number}>}
   */
  static async analyzeCongestion(zoneId) {
    const client = await pool.connect();
    
    try {
      // Get zone capacity
      const zoneResult = await client.query(
        'SELECT capacity FROM parking_zones WHERE id = $1',
        [zoneId]
      );
      
      if (zoneResult.rows.length === 0) {
        throw new Error('Zone not found');
      }
      
      const capacity = zoneResult.rows[0].capacity;
      
      // Get active reports (past 12 hours)
      const activeReports = await this.getActiveReports(zoneId, client);
      const bikeCount = activeReports.length;
      
      // Calculate congestion level
      const level = this.calculateCongestionLevel(bikeCount, capacity);
      
      return {
        level,
        bikeCount,
        capacity,
        percentage: Math.round((bikeCount / capacity) * 100)
      };
      
    } finally {
      client.release();
    }
  }
  
  /**
   * Get active parking reports for a zone (past 12 hours)
   * @param {string} zoneId - Zone UUID
   * @param {Object} client - Database client (optional)
   * @returns {Promise<Array>}
   */
  static async getActiveReports(zoneId, client = null) {
    const dbClient = client || pool;
    
    const result = await dbClient.query(
      `SELECT id, timestamp, expires_at
       FROM parking_reports
       WHERE zone_id = $1 AND expires_at > NOW()
       ORDER BY timestamp DESC`,
      [zoneId]
    );
    
    return result.rows;
  }
  
  /**
   * Calculate congestion level based on bike count and capacity
   * @param {number} bikeCount - Number of bikes currently parked
   * @param {number} capacity - Zone capacity
   * @returns {string} - "available", "filling", or "full"
   */
  static calculateCongestionLevel(bikeCount, capacity) {
    const percentage = bikeCount / capacity;
    
    if (percentage >= 0.9) {
      return 'full';
    } else if (percentage >= 0.6) {
      return 'filling';
    } else {
      return 'available';
    }
  }
  
  /**
   * Estimate bike count for a zone based on active reports
   * @param {string} zoneId - Zone UUID
   * @returns {Promise<number>}
   */
  static async estimateBikeCount(zoneId) {
    const activeReports = await this.getActiveReports(zoneId);
    return activeReports.length;
  }
  
  /**
   * Update congestion level in database for a zone
   * @param {string} zoneId - Zone UUID
   * @returns {Promise<{level: string, updated: boolean}>}
   */
  static async updateZoneCongestion(zoneId) {
    const client = await pool.connect();
    
    try {
      // Analyze congestion
      const analysis = await this.analyzeCongestion(zoneId);
      
      // Update parking_zones table
      await client.query(
        `UPDATE parking_zones
         SET congestion_level = $1, last_updated = NOW()
         WHERE id = $2`,
        [analysis.level, zoneId]
      );
      
      return {
        level: analysis.level,
        bikeCount: analysis.bikeCount,
        capacity: analysis.capacity,
        percentage: analysis.percentage,
        updated: true
      };
      
    } finally {
      client.release();
    }
  }
  
  /**
   * Update congestion for all zones
   * Useful for scheduled jobs or bulk updates
   * @returns {Promise<Array>}
   */
  static async updateAllZonesCongestion() {
    const client = await pool.connect();
    
    try {
      // Get all zones
      const zonesResult = await client.query('SELECT id, name FROM parking_zones');
      const zones = zonesResult.rows;
      
      const results = [];
      
      for (const zone of zones) {
        try {
          const result = await this.updateZoneCongestion(zone.id);
          results.push({
            zoneId: zone.id,
            zoneName: zone.name,
            ...result
          });
        } catch (error) {
          console.error(`Error updating congestion for zone ${zone.name}:`, error);
          results.push({
            zoneId: zone.id,
            zoneName: zone.name,
            error: error.message
          });
        }
      }
      
      return results;
      
    } finally {
      client.release();
    }
  }
  
  /**
   * Get congestion statistics for all zones
   * @returns {Promise<Array>}
   */
  static async getAllZonesCongestion() {
    const result = await pool.query(
      `SELECT 
        pz.id,
        pz.name,
        pz.capacity,
        pz.congestion_level,
        pz.last_updated,
        COUNT(pr.id) FILTER (WHERE pr.expires_at > NOW()) as active_reports
       FROM parking_zones pz
       LEFT JOIN parking_reports pr ON pz.id = pr.zone_id
       GROUP BY pz.id, pz.name, pz.capacity, pz.congestion_level, pz.last_updated
       ORDER BY pz.name`
    );
    
    return result.rows.map(row => ({
      zoneId: row.id,
      zoneName: row.name,
      capacity: row.capacity,
      congestionLevel: row.congestion_level,
      activeReports: parseInt(row.active_reports),
      percentage: Math.round((parseInt(row.active_reports) / row.capacity) * 100),
      lastUpdated: row.last_updated
    }));
  }
}

export default CongestionAnalyzer;
