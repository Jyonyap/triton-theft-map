import express from 'express';
import { 
  addFavoriteZone, 
  removeFavoriteZone, 
  getFavoriteZones,
  getProfile,
  updateProfile,
  deleteAccount
} from '../controllers/userController.js';
import { authenticate } from '../middleware/authMiddleware.js';

const router = express.Router();

// All user routes require authentication
router.use(authenticate);

/**
 * POST /api/users/favorites
 * Add a zone to user's favorites
 */
router.post('/favorites', addFavoriteZone);

/**
 * GET /api/users/favorites
 * Get user's favorite zones
 */
router.get('/favorites', getFavoriteZones);

/**
 * DELETE /api/users/favorites/:zoneId
 * Remove a zone from user's favorites
 */
router.delete('/favorites/:zoneId', removeFavoriteZone);

/**
 * GET /api/users/profile
 * Get user profile
 */
router.get('/profile', getProfile);

/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', updateProfile);

/**
 * DELETE /api/users/account
 * Delete user account
 */
router.delete('/account', deleteAccount);

export default router;
