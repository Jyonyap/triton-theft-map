import pool from '../config/database.js';
import RiskRatingCalculator from '../services/riskRatingCalculator.js';
import NotificationService from '../services/notificationService.js';

/**
 * Create a new theft incident report
 * POST /api/incidents/theft
 */
export const createTheftIncident = async (req, res, next) => {
  const client = await pool.connect();
  
  try {
    const { zoneId, dateTime, description, policeReportNumber } = req.body;
    const userId = req.userId; // From auth middleware
    
    // Validate required fields
    if (!zoneId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Zone ID is required',
        statusCode: 400
      });
    }
    
    if (!dateTime) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Date and time of theft is required',
        statusCode: 400
      });
    }
    
    if (!description || description.trim().length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Description is required',
        statusCode: 400
      });
    }
    
    // Validate dateTime format
    const theftDate = new Date(dateTime);
    if (isNaN(theftDate.getTime())) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Invalid date/time format',
        statusCode: 400
      });
    }
    
    // Verify zone exists
    const zoneCheck = await client.query(
      'SELECT id, name FROM parking_zones WHERE id = $1',
      [zoneId]
    );
    
    if (zoneCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Parking zone not found',
        statusCode: 404
      });
    }
    
    const zoneName = zoneCheck.rows[0].name;
    
    // Insert theft incident
    // Note: verified field is automatically calculated by database
    const result = await client.query(
      `INSERT INTO theft_incidents 
        (user_id, zone_id, date_time, description, police_report_number)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, verified, created_at`,
      [
        userId,
        zoneId,
        theftDate,
        description.trim(),
        policeReportNumber?.trim() || null
      ]
    );
    
    const incident = result.rows[0];
    
    // Trigger risk rating recalculation
    const riskUpdate = await RiskRatingCalculator.calculateAndUpdateRating(zoneId);
    
    // Trigger theft alert notifications for users who favorited this zone
    try {
      const notificationCount = await NotificationService.createTheftAlert(zoneId, incident.id);
      console.log(`📢 Sent ${notificationCount} theft alert notification(s)`);
    } catch (notificationError) {
      // Log error but don't fail the request
      console.error('Error sending notifications:', notificationError);
    }
    
    res.status(201).json({
      incidentId: incident.id,
      verified: incident.verified,
      createdAt: incident.created_at,
      riskRatingUpdated: true,
      riskRating: {
        rating: riskUpdate.riskRating,
        verifiedCount: riskUpdate.verifiedCount,
        unverifiedCount: riskUpdate.unverifiedCount,
        weightedTotal: riskUpdate.weightedTotal
      },
      zone: {
        id: zoneId,
        name: zoneName
      }
    });
    
  } catch (error) {
    console.error('Error creating theft incident:', error);
    next(error);
  } finally {
    client.release();
  }
};

/**
 * Get theft incidents for a specific zone
 * GET /api/incidents/theft/:zoneId
 */
export const getTheftIncidentsByZone = async (req, res, next) => {
  try {
    const { zoneId } = req.params;
    const days = parseInt(req.query.days) || 90;
    
    // Verify zone exists
    const zoneCheck = await pool.query(
      'SELECT id, name FROM parking_zones WHERE id = $1',
      [zoneId]
    );
    
    if (zoneCheck.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Parking zone not found',
        statusCode: 404
      });
    }
    
    // Get incidents for the zone within the time period
    const result = await pool.query(
      `SELECT 
        id,
        date_time,
        description,
        police_report_number,
        verified,
        created_at
       FROM theft_incidents
       WHERE zone_id = $1 
         AND date_time > NOW() - INTERVAL '${days} days'
       ORDER BY date_time DESC`,
      [zoneId]
    );
    
    res.json({
      incidents: result.rows,
      count: result.rows.length,
      zone: {
        id: zoneId,
        name: zoneCheck.rows[0].name
      },
      timeRange: {
        days,
        from: new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      }
    });
    
  } catch (error) {
    console.error('Error fetching theft incidents:', error);
    next(error);
  }
};
