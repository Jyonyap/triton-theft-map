import api from './api';

/**
 * Authentication service
 * Handles user registration, login, and email verification
 */

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.email - UCSD email address
 * @param {string} userData.password - Password
 * @param {string} userData.name - User's name
 * @returns {Promise<Object>} - Registration response
 */
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - Email address
 * @param {string} credentials.password - Password
 * @returns {Promise<Object>} - Login response with token and user data
 */
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  
  // Store token in localStorage
  if (response.data.token) {
    localStorage.setItem('authToken', response.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.user));
  }
  
  return response.data;
};

/**
 * Verify email with token
 * @param {string} token - Verification token
 * @returns {Promise<Object>} - Verification response
 */
export const verifyEmail = async (token) => {
  const response = await api.post('/auth/verify-email', { token });
  return response.data;
};

/**
 * Logout user
 */
export const logout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};

/**
 * Get current user from localStorage
 * @returns {Object|null} - User object or null
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

/**
 * Check if user is authenticated
 * @returns {boolean} - True if user is authenticated
 */
export const isAuthenticated = () => {
  return !!localStorage.getItem('authToken');
};
