// Admin Zone Routes
// Protected routes for admin zone management

import express from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authMiddleware.js';
import { requireAdmin } from '../middleware/requireAdmin.js';
import {
  createZone,
  listZones,
  getZone,
  updateZone,
  deleteZone,
  changeZoneStatus,
  getZoneStats
} from '../controllers/adminZoneController.js';

const router = express.Router();

// Configure multer for photo uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// All routes require authentication AND admin role
router.use(authenticate);
router.use(requireAdmin);

// Zone CRUD operations
router.post('/zones', upload.fields([
  { name: 'photo_day', maxCount: 1 },
  { name: 'photo_night', maxCount: 1 }
]), createZone);
router.get('/zones', listZones);
router.get('/zones/stats', getZoneStats);
router.get('/zones/:id', getZone);
router.put('/zones/:id', updateZone);
router.delete('/zones/:id', deleteZone);

// Zone status management
router.patch('/zones/:id/status', changeZoneStatus);

export default router;
