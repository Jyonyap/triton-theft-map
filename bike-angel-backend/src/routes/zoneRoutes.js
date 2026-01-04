/**
 * Zone Routes
 * Handles all parking zone related endpoints
 */

import express from 'express';
import { getAllZones, getZoneById, suggestZone, getAllSuggestions } from '../controllers/zoneController.js';
import { authenticate } from '../middleware/authMiddleware.js';
import { validateZoneSuggestion } from '../middleware/zoneValidation.js';
import { validate } from '../middleware/validationMiddleware.js';

const router = express.Router();

/**
 * GET /api/zones
 * Get all parking zones with risk ratings and congestion levels
 * Public endpoint - no authentication required
 */
router.get('/', getAllZones);

/**
 * GET /api/zones/suggestions
 * Get all zone suggestions for admin review
 * Note: Should be restricted to admin users in production
 */
router.get('/suggestions', authenticate, getAllSuggestions);

/**
 * GET /api/zones/:id
 * Get detailed information about a specific zone
 * Public endpoint - no authentication required
 */
router.get('/:id', getZoneById);

/**
 * POST /api/zones/suggest
 * Submit a suggestion for a new parking zone
 * Requires authentication
 */
router.post('/suggest', authenticate, validateZoneSuggestion, validate, suggestZone);

export default router;
