// User service
// Handles user profile and preferences API calls

import api from './api';

/**
 * Get user profile
 * @returns {Promise} - User profile data
 */
export const getProfile = async () => {
  try {
    const response = await api.get('/users/profile');
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

/**
 * Update user profile
 * @param {Object} updates - Profile updates (name, notifications_enabled)
 * @returns {Promise} - Updated user data
 */
export const updateProfile = async (updates) => {
  try {
    const response = await api.put('/users/profile', updates);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

/**
 * Delete user account
 * @returns {Promise} - Response data
 */
export const deleteAccount = async () => {
  try {
    const response = await api.delete('/users/account');
    return response.data;
  } catch (error) {
    console.error('Error deleting account:', error);
    throw error;
  }
};

export default {
  getProfile,
  updateProfile,
  deleteAccount
};
