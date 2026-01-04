import express from 'express';
import { authenticate } from '../middleware/authMiddleware.js';
import { rateLimitMiddleware } from '../middleware/rateLimiter.js';
import {
  createTheftIncident,
  getTheftIncidentsByZone
} from '../controllers/incidentController.js';

const router = express.Router();

/**
 * POST /api/incidents/theft
 * Create a new theft incident report
 * Requires authentication
 * Rate limited: 1 report per 15 minutes per user
 * Body:
 *   - zoneId: UUID of parking zone
 *   - dateTime: ISO timestamp of theft
 *   - description: text description
 *   - policeReportNumber: optional police report number
 */
router.post('/theft', authenticate, rateLimitMiddleware('theft_incident'), createTheftIncident);

/**
 * GET /api/incidents/theft/:zoneId
 * Get theft incidents for a specific zone
 * Query params:
 *   - days: number of days to look back (default: 90)
 */
router.get('/theft/:zoneId', getTheftIncidentsByZone);

export default router;
