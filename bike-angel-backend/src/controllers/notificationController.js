// Notification controller
// Handles notification retrieval and management

import NotificationService from '../services/notificationService.js';

/**
 * Get user's notifications
 * GET /api/notifications
 */
export const getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
    const unreadOnly = req.query.unreadOnly === 'true';

    const notifications = await NotificationService.getUserNotifications(userId, unreadOnly);

    res.status(200).json({
      notifications,
      count: notifications.length
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware

    const count = await NotificationService.getUnreadCount(userId);

    res.status(200).json({
      unreadCount: count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark a notification as read
 * PUT /api/notifications/:notificationId/read
 */
export const markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { notificationId } = req.params;

    const success = await NotificationService.markAsRead(notificationId, userId);

    if (!success) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found',
        statusCode: 404
      });
    }

    res.status(200).json({
      message: 'Notification marked as read'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Mark all notifications as read
 * PUT /api/notifications/read-all
 */
export const markAllAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware

    const count = await NotificationService.markAllAsRead(userId);

    res.status(200).json({
      message: `${count} notification(s) marked as read`,
      count
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a notification
 * DELETE /api/notifications/:notificationId
 */
export const deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.id; // From auth middleware
    const { notificationId } = req.params;

    const success = await NotificationService.deleteNotification(notificationId, userId);

    if (!success) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Notification not found',
        statusCode: 404
      });
    }

    res.status(200).json({
      message: 'Notification deleted'
    });
  } catch (error) {
    next(error);
  }
};
