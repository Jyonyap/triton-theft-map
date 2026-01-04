import api from './api';

/**
 * Zone Service
 * Handles parking zone API calls
 */

/**
 * Get all parking zones
 * @returns {Promise<Object>} - Zones data
 */
export const getAllZones = async () => {
  try {
    const response = await api.get('/zones');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get a specific zone by ID
 * @param {string} zoneId - Zone UUID
 * @returns {Promise<Object>} - Zone data
 */
export const getZoneById = async (zoneId) => {
  try {
    const response = await api.get(`/zones/${zoneId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
