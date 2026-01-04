// Favorite service
// Handles favorite zones API calls

import api from './api';

/**
 * Get user's favorite zones
 * @returns {Promise} - Favorite zones data
 */
export const getFavoriteZones = async () => {
  try {
    const response = await api.get('/users/favorites');
    return response.data;
  } catch (error) {
    console.error('Error fetching favorite zones:', error);
    throw error;
  }
};

/**
 * Add a zone to favorites
 * @param {string} zoneId - The zone ID to add
 * @returns {Promise} - Response data
 */
export const addFavoriteZone = async (zoneId) => {
  try {
    const response = await api.post('/users/favorites', { zoneId });
    return response.data;
  } catch (error) {
    console.error('Error adding favorite zone:', error);
    throw error;
  }
};

/**
 * Remove a zone from favorites
 * @param {string} zoneId - The zone ID to remove
 * @returns {Promise} - Response data
 */
export const removeFavoriteZone = async (zoneId) => {
  try {
    const response = await api.delete(`/users/favorites/${zoneId}`);
    return response.data;
  } catch (error) {
    console.error('Error removing favorite zone:', error);
    throw error;
  }
};

/**
 * Check if a zone is favorited
 * @param {string} zoneId - The zone ID to check
 * @returns {Promise<boolean>} - True if zone is favorited
 */
export const isZoneFavorited = async (zoneId) => {
  try {
    const data = await getFavoriteZones();
    return data.favorites.some((zone) => zone.id === zoneId);
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return false;
  }
};

export default {
  getFavoriteZones,
  addFavoriteZone,
  removeFavoriteZone,
  isZoneFavorited
};

