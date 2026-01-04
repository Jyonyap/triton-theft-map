// Authentication service
// Business logic for user authentication

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from '../config/database.js';
import { User } from '../models/User.js';
import { isUCSDEmail, isStrongPassword } from '../utils/validators.js';
import { badRequest, unauthorized } from '../utils/errorHandler.js';

export class AuthService {
  /**
   * Register a new user
   * @param {string} email - User's UCSD email
   * @param {string} password - User's password
   * @param {string} name - User's name
   * @returns {Promise<{userId: string, message: string}>}
   */
  static async register(email, password, name) {
    // Validate UCSD email format
    if (!isUCSDEmail(email)) {
      throw badRequest('Email must be a valid @ucsd.edu address');
    }

    // Validate password strength
    if (!isStrongPassword(password)) {
      throw badRequest('Password must be at least 8 characters with 1 uppercase letter and 1 number');
    }

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      throw badRequest('An account with this email already exists');
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Insert user into database
    const result = await query(
      `INSERT INTO users (email, password_hash, name, email_verified)
       VALUES ($1, $2, $3, FALSE)
       RETURNING id`,
      [email.toLowerCase(), passwordHash, name]
    );

    const userId = result.rows[0].id;

    return {
      userId,
      message: 'Registration successful. Please check your email to verify your account.'
    };
  }

  /**
   * Login user
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @returns {Promise<{token: string, user: User}>}
   */
  static async login(email, password) {
    // Find user by email (include role column)
    const result = await query(
      'SELECT id, email, password_hash, name, email_verified, role, notifications_enabled, created_at FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      throw unauthorized('Invalid email or password');
    }

    const userData = result.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password_hash);

    if (!isPasswordValid) {
      throw unauthorized('Invalid email or password');
    }

    // Check if email is verified
    if (!userData.email_verified) {
      throw unauthorized('Please verify your email before logging in');
    }

    // Generate JWT token with user ID and role
    const token = jwt.sign(
      { 
        userId: userData.id,
        role: userData.role || 'student'  // Include role in token payload
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Create User object
    const user = new User(userData);

    return {
      token,
      user: user.toJSON()
    };
  }

  /**
   * Get user by ID
   * @param {string} userId - User ID
   * @returns {Promise<User>}
   */
  static async getUserById(userId) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw unauthorized('User not found');
    }

    return new User(result.rows[0]);
  }
}
