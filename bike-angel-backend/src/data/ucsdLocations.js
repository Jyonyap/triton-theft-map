/**
 * UCSD Campus Location Database
 * Maps common location names to GPS coordinates
 * Used for geocoding Reddit posts and user reports
 */

export const UCSD_LOCATIONS = {
  // ========== LIBRARIES ==========
  'geisel': { lat: 32.8810, lng: -117.2375, name: 'Geisel Library', type: 'library' },
  'geisel library': { lat: 32.8810, lng: -117.2375, name: 'Geisel Library', type: 'library' },
  'biomedical library': { lat: 32.8752, lng: -117.2364, name: 'Biomedical Library', type: 'library' },
  'biomed': { lat: 32.8752, lng: -117.2364, name: 'Biomedical Library', type: 'library' },
  
  // ========== COLLEGES ==========
  'warren': { lat: 32.8818, lng: -117.2335, name: 'Warren College', type: 'college' },
  'warren college': { lat: 32.8818, lng: -117.2335, name: 'Warren College', type: 'college' },
  'revelle': { lat: 32.8732, lng: -117.2407, name: 'Revelle College', type: 'college' },
  'revelle college': { lat: 32.8732, lng: -117.2407, name: 'Revelle College', type: 'college' },
  'muir': { lat: 32.8778, lng: -117.2425, name: 'Muir College', type: 'college' },
  'muir college': { lat: 32.8778, lng: -117.2425, name: 'Muir College', type: 'college' },
  'marshall': { lat: 32.8798, lng: -117.2382, name: 'Marshall College', type: 'college' },
  'marshall college': { lat: 32.8798, lng: -117.2382, name: 'Marshall College', type: 'college' },
  'erc': { lat: 32.8828, lng: -117.2408, name: 'Eleanor Roosevelt College', type: 'college' },
  'roosevelt': { lat: 32.8828, lng: -117.2408, name: 'Eleanor Roosevelt College', type: 'college' },
  'eleanor roosevelt': { lat: 32.8828, lng: -117.2408, name: 'Eleanor Roosevelt College', type: 'college' },
  'sixth': { lat: 32.8858, lng: -117.2428, name: 'Sixth College', type: 'college' },
  'sixth college': { lat: 32.8858, lng: -117.2428, name: 'Sixth College', type: 'college' },
  'seventh': { lat: 32.8888, lng: -117.2398, name: 'Seventh College', type: 'college' },
  'seventh college': { lat: 32.8888, lng: -117.2398, name: 'Seventh College', type: 'college' },
  
  // ========== ACADEMIC BUILDINGS ==========
  'cse': { lat: 32.8818, lng: -117.2335, name: 'CSE Building', type: 'academic' },
  'cse building': { lat: 32.8818, lng: -117.2335, name: 'CSE Building', type: 'academic' },
  'computer science': { lat: 32.8818, lng: -117.2335, name: 'CSE Building', type: 'academic' },
  'price center': { lat: 32.8799, lng: -117.2364, name: 'Price Center', type: 'student_center' },
  'pc': { lat: 32.8799, lng: -117.2364, name: 'Price Center', type: 'student_center' },
  'pepper canyon': { lat: 32.8808, lng: -117.2348, name: 'Pepper Canyon Hall', type: 'academic' },
  'pepper canyon hall': { lat: 32.8808, lng: -117.2348, name: 'Pepper Canyon Hall', type: 'academic' },
  'york hall': { lat: 32.8748, lng: -117.2418, name: 'York Hall', type: 'academic' },
  'york': { lat: 32.8748, lng: -117.2418, name: 'York Hall', type: 'academic' },
  
  // ========== RECREATION ==========
  'rimac': { lat: 32.8868, lng: -117.2398, name: 'RIMAC Arena', type: 'recreation' },
  'rimac arena': { lat: 32.8868, lng: -117.2398, name: 'RIMAC Arena', type: 'recreation' },
  'main gym': { lat: 32.8748, lng: -117.2388, name: 'Main Gym', type: 'recreation' },
  
  // ========== PARKING STRUCTURES ==========
  'gilman parking': { lat: 32.8788, lng: -117.2368, name: 'Gilman Parking Structure', type: 'parking' },
  'gilman': { lat: 32.8788, lng: -117.2368, name: 'Gilman Parking Structure', type: 'parking' },
  'hopkins parking': { lat: 32.8818, lng: -117.2428, name: 'Hopkins Parking Structure', type: 'parking' },
  'hopkins': { lat: 32.8818, lng: -117.2428, name: 'Hopkins Parking Structure', type: 'parking' },
  'pangea parking': { lat: 32.8858, lng: -117.2368, name: 'Pangea Parking Structure', type: 'parking' },
  'pangea': { lat: 32.8858, lng: -117.2368, name: 'Pangea Parking Structure', type: 'parking' },
  'regents parking': { lat: 32.8828, lng: -117.2448, name: 'Regents Parking Structure', type: 'parking' },
  'regents': { lat: 32.8828, lng: -117.2448, name: 'Regents Parking Structure', type: 'parking' },
  
  // ========== HOUSING ==========
  'mesa': { lat: 32.8838, lng: -117.2458, name: 'Mesa Nueva', type: 'housing' },
  'mesa nueva': { lat: 32.8838, lng: -117.2458, name: 'Mesa Nueva', type: 'housing' },
  'the village': { lat: 32.8888, lng: -117.2428, name: 'The Village', type: 'housing' },
  'village': { lat: 32.8888, lng: -117.2428, name: 'The Village', type: 'housing' },
  'rita atkinson': { lat: 32.8858, lng: -117.2448, name: 'Rita Atkinson Residences', type: 'housing' },
  'rita': { lat: 32.8858, lng: -117.2448, name: 'Rita Atkinson Residences', type: 'housing' },
  
  // ========== MEDICAL/HEALTH ==========
  'student health': { lat: 32.8778, lng: -117.2368, name: 'Student Health Services', type: 'health' },
  'health services': { lat: 32.8778, lng: -117.2368, name: 'Student Health Services', type: 'health' },
  
  // ========== GENERAL AREAS ==========
  'ucsd': { lat: 32.8801, lng: -117.2340, name: 'UCSD Campus Center', type: 'campus' },
  'campus': { lat: 32.8801, lng: -117.2340, name: 'UCSD Campus Center', type: 'campus' },
};

// UCSD campus boundary (for validation)
export const UCSD_BOUNDS = {
  north: 32.8950,
  south: 32.8650,
  east: -117.2250,
  west: -117.2550
};

/**
 * Check if coordinates are within UCSD campus
 */
export function isWithinUCSD(lat, lng) {
  return lat >= UCSD_BOUNDS.south &&
         lat <= UCSD_BOUNDS.north &&
         lng >= UCSD_BOUNDS.west &&
         lng <= UCSD_BOUNDS.east;
}

/**
 * Get all location names (for autocomplete)
 */
export function getAllLocationNames() {
  return Object.values(UCSD_LOCATIONS)
    .map(loc => loc.name)
    .filter((name, index, self) => self.indexOf(name) === index) // unique
    .sort();
}
