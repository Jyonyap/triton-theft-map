import api from './api';

/**
 * Report Service
 * Handles parking report API calls
 */

/**
 * Create a new parking report with photo
 * @param {File} photoFile - Image file
 * @param {string} zoneId - Zone UUID
 * @returns {Promise<Object>} - Report data
 */
export const createParkingReport = async (photoFile, zoneId) => {
  try {
    // Create FormData for multipart upload
    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('zoneId', zoneId);
    
    const response = await api.post('/reports/parking', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get parking reports for a specific zone
 * @param {string} zoneId - Zone UUID
 * @param {number} limit - Number of reports to fetch (default: 5)
 * @returns {Promise<Object>} - Reports data
 */
export const getParkingReportsByZone = async (zoneId, limit = 5) => {
  try {
    const response = await api.get(`/reports/parking/${zoneId}`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get all active parking reports
 * @returns {Promise<Object>} - All reports data
 */
export const getAllActiveParkingReports = async () => {
  try {
    const response = await api.get('/reports/parking');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get user's active parking session
 * @returns {Promise<Object>} - Session data
 */
export const getActiveSession = async () => {
  try {
    const response = await api.get('/reports/parking/session');
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * End active parking session
 * @param {string} zoneId - Zone UUID
 * @param {File} leavingPhoto - Optional leaving photo
 * @returns {Promise<Object>} - Session end data
 */
export const endParkingSession = async (zoneId, leavingPhoto = null) => {
  try {
    const formData = new FormData();
    formData.append('zoneId', zoneId);
    if (leavingPhoto) {
      formData.append('photo', leavingPhoto);
    }
    
    const response = await api.post('/reports/parking/end', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Get photo timeline for a zone
 * @param {string} zoneId - Zone UUID
 * @param {number} limit - Number of photos to fetch (default: 50)
 * @returns {Promise<Object>} - Timeline data
 */
export const getPhotoTimeline = async (zoneId, limit = 50) => {
  try {
    const response = await api.get(`/reports/parking/zone/${zoneId}/timeline`, {
      params: { limit }
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Report a photo as inappropriate
 * @param {string} photoId - Photo UUID
 * @param {string} reason - Report reason
 * @returns {Promise<Object>} - Report result
 */
export const reportPhoto = async (photoId, reason) => {
  try {
    const response = await api.post(`/reports/parking/photo/${photoId}/report`, {
      reason
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
