import express from 'express';
import { register, login, verifyEmail } from '../controllers/authController.js';

const router = express.Router();

/**
 * POST /api/auth/register
 * Register a new user with UCSD email
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', login);

/**
 * POST /api/auth/verify-email
 * Verify email with token
 */
router.post('/verify-email', verifyEmail);

export default router;
