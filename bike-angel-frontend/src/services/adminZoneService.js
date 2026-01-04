import api from './api';

/**
 * Admin Zone Management Service
 * Handles all admin zone operations
 */

/**
 * Create a new parking zone
 * @param {Object} zoneData - Zone creation data
 * @returns {Promise<Object>} - Created zone
 */
export const createZone = async (zoneData) => {
  const response = await api.post('/admin/zones', zoneData);
  return response.data;
};

/**
 * Get all zones (admin view)
 * @param {Object} filters - Optional filters
 * @returns {Promise<Object>} - Zones list
 */
export const getAdminZones = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  const response = await api.get(`/admin/zones?${params}`);
  return response.data;
};

/**
 * Get zone by ID
 * @param {string} zoneId - Zone ID
 * @returns {Promise<Object>} - Zone details
 */
export const getZoneById = async (zoneId) => {
  const response = await api.get(`/admin/zones/${zoneId}`);
  return response.data;
};

/**
 * Update zone
 * @param {string} zoneId - Zone ID
 * @param {Object} updates - Zone updates
 * @returns {Promise<Object>} - Updated zone
 */
export const updateZone = async (zoneId, updates) => {
  const response = await api.put(`/admin/zones/${zoneId}`, updates);
  return response.data;
};

/**
 * Delete zone
 * @param {string} zoneId - Zone ID
 * @returns {Promise<Object>} - Deletion response
 */
export const deleteZone = async (zoneId) => {
  const response = await api.delete(`/admin/zones/${zoneId}`);
  return response.data;
};

/**
 * Change zone status
 * @param {string} zoneId - Zone ID
 * @param {string} status - New status (draft/active/inactive)
 * @returns {Promise<Object>} - Updated zone
 */
export const changeZoneStatus = async (zoneId, status) => {
  const response = await api.patch(`/admin/zones/${zoneId}/status`, { status });
  return response.data;
};

/**
 * Upload zone photo
 * @param {string} zoneId - Zone ID
 * @param {File} photoFile - Photo file
 * @param {string} photoType - Photo type (day/night)
 * @returns {Promise<Object>} - Updated zone
 */
export const uploadZonePhoto = async (zoneId, photoFile, photoType) => {
  const formData = new FormData();
  formData.append('photo', photoFile);
  formData.append('photo_type', photoType);
  
  const response = await api.post(`/admin/zones/${zoneId}/photo`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

/**
 * Get zone statistics
 * @returns {Promise<Object>} - Zone stats
 */
export const getZoneStats = async () => {
  const response = await api.get('/admin/zones/stats');
  return response.data;
};

/**
 * Batch update zone status
 * @param {Array<string>} zoneIds - Array of zone IDs
 * @param {string} status - New status
 * @returns {Promise<Object>} - Batch operation result
 */
export const batchUpdateStatus = async (zoneIds, status) => {
  const response = await api.post('/admin/zones/batch', {
    zone_ids: zoneIds,
    action: 'update_status',
    status,
  });
  return response.data;
};

/**
 * Batch delete zones
 * @param {Array<string>} zoneIds - Array of zone IDs
 * @returns {Promise<Object>} - Batch operation result
 */
export const batchDeleteZones = async (zoneIds) => {
  const response = await api.post('/admin/zones/batch', {
    zone_ids: zoneIds,
    action: 'delete',
  });
  return response.data;
};
