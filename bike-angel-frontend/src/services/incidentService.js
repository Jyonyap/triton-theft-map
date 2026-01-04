const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

/**
 * Create a new theft incident report
 * @param {Object} incidentData - Theft incident data
 * @param {string} incidentData.zoneId - UUID of parking zone
 * @param {string} incidentData.dateTime - ISO timestamp of theft
 * @param {string} incidentData.description - Description of the incident
 * @param {string} [incidentData.policeReportNumber] - Optional police report number
 * @returns {Promise<Object>} Created incident data
 */
export async function createTheftIncident(incidentData) {
  const token = localStorage.getItem('token');
  
  if (!token) {
    throw new Error('Authentication required. Please log in.');
  }
  
  const response = await fetch(`${API_URL}/api/incidents/theft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(incidentData)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to create theft incident');
  }
  
  return data;
}

/**
 * Get theft incidents for a specific zone
 * @param {string} zoneId - UUID of parking zone
 * @param {number} [days=90] - Number of days to look back
 * @returns {Promise<Object>} Theft incidents data
 */
export async function getTheftIncidentsByZone(zoneId, days = 90) {
  const response = await fetch(`${API_URL}/api/incidents/theft/${zoneId}?days=${days}`);
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Failed to fetch theft incidents');
  }
  
  return data;
}
