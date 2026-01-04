/**
 * Geocoding Service for UCSD Locations
 * Converts location text (from Reddit or user input) to GPS coordinates
 */

import { UCSD_LOCATIONS, isWithinUCSD } from '../data/ucsdLocations.js';

/**
 * Geocode a UCSD location from text
 * @param {string} locationText - Location description (e.g., "Geisel Library", "near Warren")
 * @returns {Object} - { lat, lng, name, confidence, approximate }
 */
export function geocodeUCSDLocation(locationText) {
  if (!locationText || typeof locationText !== 'string') {
    return getDefaultLocation();
  }

  const normalized = locationText.toLowerCase().trim();
  
  // Strategy 1: Direct exact match
  if (UCSD_LOCATIONS[normalized]) {
    return {
      ...UCSD_LOCATIONS[normalized],
      confidence: 'high',
      approximate: false,
      matchType: 'exact'
    };
  }
  
  // Strategy 2: Fuzzy match (contains)
  for (const [key, location] of Object.entries(UCSD_LOCATIONS)) {
    if (normalized.includes(key)) {
      return {
        ...location,
        confidence: 'medium',
        approximate: false,
        matchType: 'fuzzy',
        matchedKey: key
      };
    }
  }
  
  // Strategy 3: Reverse fuzzy (key contains text)
  for (const [key, location] of Object.entries(UCSD_LOCATIONS)) {
    if (key.includes(normalized)) {
      return {
        ...location,
        confidence: 'medium',
        approximate: false,
        matchType: 'partial',
        matchedKey: key
    };
    }
  }
  
  // Strategy 4: Check for common patterns
  const patterns = [
    { regex: /near\s+(\w+)/i, extract: 1 },
    { regex: /at\s+(\w+)/i, extract: 1 },
    { regex: /by\s+(\w+)/i, extract: 1 },
    { regex: /outside\s+(\w+)/i, extract: 1 },
  ];
  
  for (const pattern of patterns) {
    const match = normalized.match(pattern.regex);
    if (match && match[pattern.extract]) {
      const extracted = match[pattern.extract];
      if (UCSD_LOCATIONS[extracted]) {
        return {
          ...UCSD_LOCATIONS[extracted],
          confidence: 'low',
          approximate: true,
          matchType: 'pattern',
          originalText: locationText
        };
      }
    }
  }
  
  // Fallback: Return UCSD center with low confidence
  return getDefaultLocation(locationText);
}

/**
 * Get default UCSD center location (fallback)
 */
function getDefaultLocation(originalText = null) {
  return {
    lat: 32.8801,
    lng: -117.2340,
    name: 'UCSD Campus (approximate)',
    type: 'campus',
    confidence: 'none',
    approximate: true,
    matchType: 'fallback',
    originalText,
    needsReview: true // Flag for manual review
  };
}

/**
 * Batch geocode multiple locations
 * @param {Array<string>} locations - Array of location texts
 * @returns {Array<Object>} - Array of geocoded results
 */
export function batchGeocode(locations) {
  return locations.map(loc => geocodeUCSDLocation(loc));
}

/**
 * Validate if coordinates are within UCSD campus
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {boolean}
 */
export function validateUCSDCoordinates(lat, lng) {
  return isWithinUCSD(lat, lng);
}

/**
 * Get geocoding confidence score
 * @param {Object} geocodedResult - Result from geocodeUCSDLocation
 * @returns {number} - Score from 0-100
 */
export function getConfidenceScore(geocodedResult) {
  const scores = {
    high: 100,
    medium: 75,
    low: 50,
    none: 0
  };
  
  return scores[geocodedResult.confidence] || 0;
}

/**
 * Filter results that need manual review
 * @param {Array<Object>} geocodedResults - Array of geocoded results
 * @returns {Array<Object>} - Results that need review
 */
export function filterNeedsReview(geocodedResults) {
  return geocodedResults.filter(result => 
    result.needsReview || 
    result.approximate || 
    result.confidence === 'none' ||
    result.confidence === 'low'
  );
}

/**
 * Test the geocoder with sample inputs
 */
export function testGeocoder() {
  const testCases = [
    'Geisel Library',
    'stolen at Warren',
    'near Price Center',
    'by the CSE building',
    'somewhere on campus',
    'Muir College bike racks',
    'Hopkins parking structure'
  ];
  
  console.log('🧪 Testing Geocoder:\n');
  
  testCases.forEach(test => {
    const result = geocodeUCSDLocation(test);
    console.log(`Input: "${test}"`);
    console.log(`  → ${result.name} (${result.lat}, ${result.lng})`);
    console.log(`  → Confidence: ${result.confidence}, Match: ${result.matchType}`);
    console.log(`  → Needs Review: ${result.needsReview || false}\n`);
  });
}
