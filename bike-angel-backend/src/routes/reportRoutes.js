import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authMiddleware.js';
import { rateLimitMiddleware } from '../middleware/rateLimiter.js';
import {
  createParkingReport,
  getParkingReportsByZone,
  getAllActiveParkingReports,
  endParkingSession,
  getActiveSession,
  getPhotoTimeline,
  reportPhoto
} from '../controllers/reportController.js';
import { checkPhotoPermission } from '../middleware/sessionMiddleware.js';

const router = express.Router();

// Configure multer for memory storage (we'll upload to cloud storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB default
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * POST /api/reports/parking
 * Create a new parking report with photo
 * Requires authentication
 * Rate limited: 1 report per 15 minutes per user
 * Accepts multipart/form-data with:
 *   - photo: image file (max 5MB)
 *   - zoneId: UUID of parking zone
 */
router.post(
  '/parking',
  authenticate,
  rateLimitMiddleware('parking_report'),
  upload.single('photo'),
  createParkingReport
);

/**
 * GET /api/reports/parking/:zoneId
 * Get parking reports for a specific zone
 * Query params:
 *   - limit: number of reports to return (default: 5)
 */
router.get('/parking/:zoneId', getParkingReportsByZone);

/**
 * GET /api/reports/parking
 * Get all active parking reports
 */
router.get('/parking', getAllActiveParkingReports);

/**
 * POST /api/reports/parking/end
 * End active parking session
 * Requires authentication
 * Accepts multipart/form-data with:
 *   - zoneId: UUID of parking zone
 *   - photo: optional leaving photo
 */
router.post(
  '/parking/end',
  authenticate,
  upload.single('photo'),
  endParkingSession
);

/**
 * GET /api/reports/parking/session
 * Get user's active parking session
 * Requires authentication
 */
router.get('/parking/session', authenticate, getActiveSession);

/**
 * GET /api/reports/parking/zone/:zoneId/timeline
 * Get photo timeline for a zone with permission-based filtering
 * Requires authentication
 * Returns high-res photos if user has active session, thumbnails otherwise
 */
router.get(
  '/parking/zone/:zoneId/timeline',
  authenticate,
  checkPhotoPermission,
  getPhotoTimeline
);

/**
 * POST /api/reports/parking/photo/:photoId/report
 * Report a photo as inappropriate
 * Requires authentication
 */
router.post(
  '/parking/photo/:photoId/report',
  authenticate,
  reportPhoto
);

export default router;
