import pool from '../config/database.js';

/**
 * RiskRatingCalculator Service
 * Calculates theft risk ratings for zones - Triton Theft Map
 * 
 * Risk Rating Logic (Updated for Triton Theft Map):
 * - Count theft incidents in past 6 months (180 days)
 * - HIGH (Red): 3+ thefts in 6 months
 * - MEDIUM (Orange): 1-2 thefts in 6 months  
 * - SAFE (Gray): 0 thefts in 6 months
 * 
 * Simple and clear - no weighting, just raw theft count
 */
class RiskRatingCalculator {
  /**
   * Calculate and update risk rating for a specific zone
   * @param {string} zoneId - UUID of the parking zone
   * @returns {Promise<Object>} Updated risk rating information
   */
  static async calculateAndUpdateRating(zoneId) {
    const client = await pool.connect();
    
    try {
      // Get theft counts for the past 6 months (180 days)
      const counts = await this.getTheftCounts(zoneId, 180);
      
      // Simple count - no weighting for Triton Theft Map
      const theftCount = counts.totalCount;
      
      // Determine risk rating based on theft frequency
      let riskRating;
      if (theftCount >= 3) {
        riskRating = 'red'; // High risk - 3+ thefts
      } else if (theftCount >= 1) {
        riskRating = 'yellow'; // Medium risk - 1-2 thefts (using yellow for orange)
      } else {
        riskRating = 'green'; // Safe - 0 thefts
      }
      
      // Update parking_zones table
      await client.query(
        `UPDATE parking_zones 
         SET risk_rating = $1, last_updated = NOW()
         WHERE id = $2`,
        [riskRating, zoneId]
      );
      
      return {
        zoneId,
        riskRating,
        theftCount,
        timeWindow: '6 months',
        calculatedAt: new Date()
      };
      
    } finally {
      client.release();
    }
  }
  
  /**
   * Get theft counts for a zone within a time period
   * @param {string} zoneId - UUID of the parking zone
   * @param {number} days - Number of days to look back (default 180 = 6 months)
   * @returns {Promise<Object>} Theft counts
   */
  static async getTheftCounts(zoneId, days = 180) {
    const result = await pool.query(
      `SELECT COUNT(*) as total_count
       FROM theft_incidents
       WHERE zone_id = $1 
         AND date_time > NOW() - INTERVAL '${days} days'`,
      [zoneId]
    );
    
    const row = result.rows[0];
    
    return {
      totalCount: parseInt(row.total_count) || 0,
      timeWindowDays: days
    };
  }
  
  /**
   * Get current risk rating for a zone
   * @param {string} zoneId - UUID of the parking zone
   * @returns {Promise<string>} Current risk rating (HIGH/MEDIUM/SAFE)
   */
  static async getCurrentRating(zoneId) {
    const result = await pool.query(
      'SELECT risk_rating FROM parking_zones WHERE id = $1',
      [zoneId]
    );
    
    if (result.rows.length === 0) {
      throw new Error('Zone not found');
    }
    
    return result.rows[0].risk_rating;
  }
  
  /**
   * Recalculate risk ratings for all zones
   * Useful for batch updates or maintenance
   * @returns {Promise<Array>} Array of updated zone ratings
   */
  static async recalculateAllRatings() {
    const zonesResult = await pool.query('SELECT id FROM parking_zones');
    const zones = zonesResult.rows;
    
    const updates = [];
    
    for (const zone of zones) {
      try {
        const update = await this.calculateAndUpdateRating(zone.id);
        updates.push(update);
      } catch (error) {
        console.error(`Error updating risk rating for zone ${zone.id}:`, error);
        updates.push({
          zoneId: zone.id,
          error: error.message
        });
      }
    }
    
    return updates;
  }
}

export default RiskRatingCalculator;
