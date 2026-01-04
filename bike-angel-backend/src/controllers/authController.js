// Authentication controller
// Handles user registration, login, and email verification

import { AuthService } from '../services/authService.js';
import { EmailVerificationService } from '../services/emailVerificationService.js';

/**
 * Register a new user
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const { email, password, name } = req.body;

    // Validate required fields
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email, password, and name are required',
        statusCode: 400
      });
    }

    // Register user
    const { userId, message } = await AuthService.register(email, password, name);

    // Generate and send verification email
    const emailService = new EmailVerificationService();
    await emailService.sendVerificationEmail(email, userId);

    res.status(201).json({
      message,
      userId
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Login user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Email and password are required',
        statusCode: 400
      });
    }

    // Login user
    const { token, user } = await AuthService.login(email, password);

    res.status(200).json({
      token,
      user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify email
 * POST /api/auth/verify-email
 */
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.body;

    // Validate token
    if (!token) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Verification token is required',
        statusCode: 400
      });
    }

    // Verify email
    const emailService = new EmailVerificationService();
    const success = await emailService.verifyToken(token);

    if (success) {
      res.status(200).json({
        success: true,
        message: 'Email verified successfully. You can now log in.'
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token',
        statusCode: 400
      });
    }
  } catch (error) {
    next(error);
  }
};
