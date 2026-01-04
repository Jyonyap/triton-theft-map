import express from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notificationController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All notification routes require authentication
router.use(authenticate);

/**
 * GET /api/notifications
 * Get user's notifications
 * Query params: unreadOnly=true (optional)
 */
router.get('/', getNotifications);

/**
 * GET /api/notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', getUnreadCount);

/**
 * PUT /api/notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', markAllAsRead);

/**
 * PUT /api/notifications/:notificationId/read
 * Mark a specific notification as read
 */
router.put('/:notificationId/read', markAsRead);

/**
 * DELETE /api/notifications/:notificationId
 * Delete a notification
 */
router.delete('/:notificationId', deleteNotification);

export default router;
