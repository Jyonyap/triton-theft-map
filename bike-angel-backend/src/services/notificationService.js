// Notification service
// Handles creating and sending notifications to users

import pool from '../config/database.js';

/**
 * NotificationService class
 * Manages user notifications for theft alerts
 */
export class NotificationService {
  /**
   * Create a theft alert notification for users who favorited the zone
   * @param {string} zoneId - The parking zone ID where theft occurred
   * @param {string} incidentId - The theft incident ID
   * @returns {Promise<number>} - Number of notifications created
   */
  static async createTheftAlert(zoneId, incidentId) {
    try {
      // Get zone details
      const zoneResult = await pool.query(
        'SELECT name FROM parking_zones WHERE id = $1',
        [zoneId]
      );

      if (zoneResult.rows.length === 0) {
        throw new Error('Zone not found');
      }

      const zoneName = zoneResult.rows[0].name;

      // Get incident details
      const incidentResult = await pool.query(
        'SELECT date_time, verified FROM theft_incidents WHERE id = $1',
        [incidentId]
      );

      if (incidentResult.rows.length === 0) {
        throw new Error('Incident not found');
      }

      const incident = incidentResult.rows[0];
      const verifiedText = incident.verified ? 'Verified' : 'Reported';

      // Create notification message
      const message = `${verifiedText} bicycle theft at ${zoneName}`;

      // Find all users who favorited this zone and have notifications enabled
      const usersResult = await pool.query(
        `SELECT DISTINCT fz.user_id
         FROM favorite_zones fz
         JOIN users u ON fz.user_id = u.id
         WHERE fz.zone_id = $1 
         AND u.notifications_enabled = TRUE`,
        [zoneId]
      );

      if (usersResult.rows.length === 0) {
        console.log('No users to notify for zone:', zoneName);
        return 0;
      }

      // Create notifications for each user
      const notificationPromises = usersResult.rows.map(row =>
        pool.query(
          `INSERT INTO notifications (user_id, zone_id, type, message)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [row.user_id, zoneId, 'theft_alert', message]
        )
      );

      const results = await Promise.all(notificationPromises);
      const notificationCount = results.length;

      console.log(`✅ Created ${notificationCount} theft alert notification(s) for ${zoneName}`);

      // In a production environment, this is where you would:
      // 1. Send push notifications via Firebase Cloud Messaging or similar
      // 2. Send email notifications via SendGrid or AWS SES
      // For now, we just store them in the database

      return notificationCount;
    } catch (error) {
      console.error('Error creating theft alert:', error);
      throw error;
    }
  }

  /**
   * Get notifications for a user
   * @param {string} userId - The user ID
   * @param {boolean} unreadOnly - If true, only return unread notifications
   * @returns {Promise<Array>} - Array of notifications
   */
  static async getUserNotifications(userId, unreadOnly = false) {
    try {
      let query = `
        SELECT 
          n.id,
          n.zone_id,
          n.type,
          n.message,
          n.read,
          n.created_at,
          pz.name as zone_name,
          pz.risk_rating
        FROM notifications n
        JOIN parking_zones pz ON n.zone_id = pz.id
        WHERE n.user_id = $1
      `;

      if (unreadOnly) {
        query += ' AND n.read = FALSE';
      }

      query += ' ORDER BY n.created_at DESC';

      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw error;
    }
  }

  /**
   * Mark a notification as read
   * @param {string} notificationId - The notification ID
   * @param {string} userId - The user ID (for authorization)
   * @returns {Promise<boolean>} - True if successful
   */
  static async markAsRead(notificationId, userId) {
    try {
      const result = await pool.query(
        `UPDATE notifications
         SET read = TRUE
         WHERE id = $1 AND user_id = $2
         RETURNING id`,
        [notificationId, userId]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for a user
   * @param {string} userId - The user ID
   * @returns {Promise<number>} - Number of notifications marked as read
   */
  static async markAllAsRead(userId) {
    try {
      const result = await pool.query(
        `UPDATE notifications
         SET read = TRUE
         WHERE user_id = $1 AND read = FALSE
         RETURNING id`,
        [userId]
      );

      return result.rows.length;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }

  /**
   * Get unread notification count for a user
   * @param {string} userId - The user ID
   * @returns {Promise<number>} - Count of unread notifications
   */
  static async getUnreadCount(userId) {
    try {
      const result = await pool.query(
        'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND read = FALSE',
        [userId]
      );

      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Delete a notification
   * @param {string} notificationId - The notification ID
   * @param {string} userId - The user ID (for authorization)
   * @returns {Promise<boolean>} - True if successful
   */
  static async deleteNotification(notificationId, userId) {
    try {
      const result = await pool.query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING id',
        [notificationId, userId]
      );

      return result.rows.length > 0;
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw error;
    }
  }
}

export default NotificationService;
