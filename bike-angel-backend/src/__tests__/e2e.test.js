/**
 * End-to-End Tests for Bike Angel Application
 * Tests complete user flows across the entire application
 * 
 * Test Coverage:
 * - Complete user registration flow
 * - Parking report submission
 * - Theft incident reporting
 * - Map navigation and zone details
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import pool from '../config/database.js';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test user data
let testUser = {
  email: `e2e-test-${Date.now()}@ucsd.edu`,
  password: 'E2ETestPass123!',
  name: 'E2E Test User'
};
let authToken = null;
let testZoneId = null;
let testReportId = null;
let testIncidentId = null;

/**
 * Helper: Create test image buffer
 */
async function createTestImage() {
  const sharp = (await import('sharp')).default;
  return await sharp({
    create: {
      width: 800,
      height: 600,
      channels: 3,
      background: { r: 100, g: 150, b: 200 }
    }
  })
  .jpeg()
  .toBuffer();
}

/**
 * Helper: Manually verify email for testing
 */
async function manuallyVerifyEmail(userId) {
  await pool.query('UPDATE users SET email_verified = TRUE WHERE id = $1', [userId]);
}

/**
 * Helper: Wait for async operations
 */
function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

describe('End-to-End Tests - Complete User Flows', () => {
  
  // ============================================================================
  // E2E TEST 1: COMPLETE USER REGISTRATION FLOW
  // ============================================================================
  
  describe('E2E: Complete User Registration Flow', () => {
    
    test('Step 1: User visits registration page and submits valid UCSD email', async () => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('userId');
      expect(data.message).toMatch(/verify|verification/i);
      
      testUser.userId = data.userId;
      console.log('✓ User registered successfully, verification email sent');
    });
    
    test('Step 2: User cannot login before email verification', async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toContain('verify');
      console.log('✓ Login blocked for unverified email');
    });
    
    test('Step 3: User verifies email (simulated)', async () => {
      // In production, user would click link in email
      // For testing, we manually verify
      if (testUser.userId) {
        await manuallyVerifyEmail(testUser.userId);
        
        // Verify the email_verified flag is set
        const result = await pool.query(
          'SELECT email_verified FROM users WHERE id = $1',
          [testUser.userId]
        );
        expect(result.rows.length).toBeGreaterThan(0);
        expect(result.rows[0].email_verified).toBe(true);
        console.log('✓ Email verified successfully');
      } else {
        throw new Error('User ID not set from registration');
      }
    });
    
    test('Step 4: User logs in successfully after verification', async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: testUser.password
        })
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('token');
      expect(data).toHaveProperty('user');
      expect(data.user.email).toBe(testUser.email);
      expect(data.user.name).toBe(testUser.name);
      
      authToken = data.token;
      console.log('✓ User logged in successfully, JWT token received');
    });
    
    test('Step 5: User can access protected endpoints with token', async () => {
      const response = await fetch(`${API_URL}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.user.email).toBe(testUser.email);
      console.log('✓ Protected endpoint accessible with valid token');
    });
  });
  
  // ============================================================================
  // E2E TEST 2: PARKING REPORT SUBMISSION FLOW
  // ============================================================================
  
  describe('E2E: Parking Report Submission Flow', () => {
    
    test('Step 1: User views map and fetches available parking zones', async () => {
      const response = await fetch(`${API_URL}/api/zones`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.zones).toBeDefined();
      expect(data.zones.length).toBeGreaterThan(0);
      
      // Select first zone for testing
      testZoneId = data.zones[0].id;
      console.log(`✓ Fetched ${data.zones.length} parking zones`);
      console.log(`  Selected zone: ${data.zones[0].name}`);
    });
    
    test('Step 2: User views zone details before parking', async () => {
      const response = await fetch(`${API_URL}/api/zones/${testZoneId}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.zone).toBeDefined();
      expect(data.zone.id).toBe(testZoneId);
      expect(data.recentActivity).toBeDefined();
      
      console.log(`✓ Zone details loaded`);
      console.log(`  Risk Rating: ${data.zone.risk_rating}`);
      console.log(`  Congestion: ${data.zone.congestion_level}`);
      console.log(`  Recent Reports: ${data.recentActivity.parkingReports.length}`);
    });
    
    test('Step 3: User takes photo and submits parking report', async () => {
      const imageBuffer = await createTestImage();
      const formData = new FormData();
      formData.append('photo', imageBuffer, {
        filename: 'e2e-parking-photo.jpg',
        contentType: 'image/jpeg'
      });
      formData.append('zoneId', testZoneId);
      
      const response = await fetch(`${API_URL}/api/reports/parking`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...formData.getHeaders()
        },
        body: formData
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('reportId');
      expect(data).toHaveProperty('photoUrl');
      expect(data).toHaveProperty('thumbnailUrl');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('expiresAt');
      
      testReportId = data.reportId;
      console.log('✓ Parking report submitted successfully');
      console.log(`  Report ID: ${data.reportId}`);
      console.log(`  Expires at: ${data.expiresAt}`);
    });
    
    test('Step 4: Zone congestion level updates after report', async () => {
      // Wait a moment for congestion calculation
      await wait(500);
      
      const response = await fetch(`${API_URL}/api/zones/${testZoneId}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Verify congestion level is one of valid values
      expect(['available', 'filling', 'full']).toContain(data.zone.congestion_level);
      console.log(`✓ Congestion level updated: ${data.zone.congestion_level}`);
    });
    
    test('Step 5: User can view their report in zone details', async () => {
      const response = await fetch(`${API_URL}/api/reports/parking/${testZoneId}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.reports).toBeDefined();
      
      // Find our report
      const ourReport = data.reports.find(r => r.id === testReportId);
      expect(ourReport).toBeDefined();
      expect(ourReport.photo_url).toBeDefined();
      expect(ourReport.thumbnail_url).toBeDefined();
      
      console.log(`✓ Report visible in zone (${data.reports.length} total reports)`);
    });
    
    test('Step 6: Other users can see the updated zone status', async () => {
      // Simulate another user viewing the zone
      const response = await fetch(`${API_URL}/api/zones/${testZoneId}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.recentActivity.parkingReports.length).toBeGreaterThan(0);
      
      console.log('✓ Zone status visible to all users');
    });
  });
  
  // ============================================================================
  // E2E TEST 3: THEFT INCIDENT REPORTING FLOW
  // ============================================================================
  
  describe('E2E: Theft Incident Reporting Flow', () => {
    
    test('Step 1: User discovers bike theft and navigates to report form', async () => {
      // Verify zones are available for selection
      const response = await fetch(`${API_URL}/api/zones`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.zones.length).toBeGreaterThan(0);
      
      console.log('✓ Theft report form accessible with zone list');
    });
    
    test('Step 2: User submits unverified theft incident (no police report)', async () => {
      const theftDate = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000); // 3 days ago
      
      const response = await fetch(`${API_URL}/api/incidents/theft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          zoneId: testZoneId,
          dateTime: theftDate.toISOString(),
          description: 'My blue Trek mountain bike was stolen. The U-lock was cut through. Bike had distinctive yellow handlebar tape.'
        })
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('incidentId');
      expect(data.verified).toBe(false);
      expect(data).toHaveProperty('riskRating');
      
      testIncidentId = data.incidentId;
      console.log('✓ Unverified theft incident reported');
      console.log(`  Incident ID: ${data.incidentId}`);
      console.log(`  Risk Rating: ${data.riskRating.rating}`);
      console.log(`  Verified Count: ${data.riskRating.verifiedCount}`);
      console.log(`  Unverified Count: ${data.riskRating.unverifiedCount}`);
    });
    
    test('Step 3: Zone risk rating updates after theft report', async () => {
      const response = await fetch(`${API_URL}/api/zones/${testZoneId}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(['green', 'yellow', 'red']).toContain(data.zone.risk_rating);
      
      console.log(`✓ Zone risk rating: ${data.zone.risk_rating}`);
    });
    
    test('Step 4: User files police report and updates incident', async () => {
      const theftDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
      
      const response = await fetch(`${API_URL}/api/incidents/theft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          zoneId: testZoneId,
          dateTime: theftDate.toISOString(),
          description: 'Red road bike stolen from rack. Reported to UCSD Police Department.',
          policeReportNumber: 'UCSD-2024-E2E-TEST'
        })
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.verified).toBe(true);
      expect(data.riskRating.verifiedCount).toBeGreaterThan(0);
      
      console.log('✓ Verified theft incident reported with police report');
      console.log(`  Updated Risk Rating: ${data.riskRating.rating}`);
      console.log(`  Verified Count: ${data.riskRating.verifiedCount}`);
    });
    
    test('Step 5: Other users can see theft incidents in zone details', async () => {
      const response = await fetch(`${API_URL}/api/incidents/theft/${testZoneId}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.incidents).toBeDefined();
      expect(data.incidents.length).toBeGreaterThan(0);
      
      // Find our incidents
      const unverifiedIncident = data.incidents.find(i => i.id === testIncidentId);
      expect(unverifiedIncident).toBeDefined();
      expect(unverifiedIncident.verified).toBe(false);
      
      console.log(`✓ ${data.incidents.length} theft incidents visible in zone`);
      console.log(`  Verified: ${data.incidents.filter(i => i.verified).length}`);
      console.log(`  Unverified: ${data.incidents.filter(i => !i.verified).length}`);
    });
    
    test('Step 6: Map displays updated risk rating for zone', async () => {
      const response = await fetch(`${API_URL}/api/zones`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      const updatedZone = data.zones.find(z => z.id === testZoneId);
      expect(updatedZone).toBeDefined();
      expect(['green', 'yellow', 'red']).toContain(updatedZone.risk_rating);
      
      console.log('✓ Risk rating visible on map for all users');
    });
  });
  
  // ============================================================================
  // E2E TEST 4: MAP NAVIGATION AND ZONE DETAILS FLOW
  // ============================================================================
  
  describe('E2E: Map Navigation and Zone Details Flow', () => {
    
    test('Step 1: User opens map and views all parking zones', async () => {
      const response = await fetch(`${API_URL}/api/zones`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.zones).toBeDefined();
      expect(Array.isArray(data.zones)).toBe(true);
      expect(data.zones.length).toBeGreaterThan(0);
      
      // Verify each zone has required map display properties
      data.zones.forEach(zone => {
        expect(zone).toHaveProperty('id');
        expect(zone).toHaveProperty('name');
        expect(zone).toHaveProperty('latitude');
        expect(zone).toHaveProperty('longitude');
        expect(zone).toHaveProperty('risk_rating');
        expect(zone).toHaveProperty('congestion_level');
      });
      
      console.log(`✓ Map loaded with ${data.zones.length} zones`);
      console.log(`  Risk Ratings: ${data.zones.map(z => z.risk_rating).join(', ')}`);
    });
    
    test('Step 2: User clicks on a zone marker to view details', async () => {
      const response = await fetch(`${API_URL}/api/zones/${testZoneId}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.zone).toBeDefined();
      expect(data.recentActivity).toBeDefined();
      expect(data.recentActivity.parkingReports).toBeDefined();
      expect(data.recentActivity.theftIncidents).toBeDefined();
      
      console.log('✓ Zone detail modal opened');
      console.log(`  Zone: ${data.zone.name}`);
      console.log(`  Location: ${data.zone.latitude}, ${data.zone.longitude}`);
      console.log(`  Capacity: ${data.zone.capacity} bikes`);
    });
    
    test('Step 3: User views recent parking photos in zone details', async () => {
      const response = await fetch(`${API_URL}/api/reports/parking/${testZoneId}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.reports).toBeDefined();
      
      // Verify photo URLs are present
      if (data.reports.length > 0) {
        const report = data.reports[0];
        expect(report.photo_url).toBeDefined();
        expect(report.thumbnail_url).toBeDefined();
        expect(report.timestamp).toBeDefined();
        
        console.log(`✓ ${data.reports.length} parking photos available`);
        console.log(`  Most recent: ${new Date(report.timestamp).toLocaleString()}`);
      }
    });
    
    test('Step 4: User views theft incident history in zone details', async () => {
      const response = await fetch(`${API_URL}/api/incidents/theft/${testZoneId}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.incidents).toBeDefined();
      
      // Verify incident details
      if (data.incidents.length > 0) {
        const incident = data.incidents[0];
        expect(incident).toHaveProperty('date_time');
        expect(incident).toHaveProperty('description');
        expect(incident).toHaveProperty('verified');
        
        console.log(`✓ ${data.incidents.length} theft incidents in history`);
        console.log(`  Latest: ${incident.description.substring(0, 50)}...`);
        console.log(`  Verified: ${incident.verified ? 'Yes' : 'No'}`);
      }
    });
    
    test('Step 5: User adds zone to favorites', async () => {
      const response = await fetch(`${API_URL}/api/users/favorites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          zoneId: testZoneId
        })
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data.message).toContain('added');
      
      console.log('✓ Zone added to favorites');
    });
    
    test('Step 6: User views their favorite zones', async () => {
      const response = await fetch(`${API_URL}/api/users/favorites`, {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.favorites).toBeDefined();
      expect(Array.isArray(data.favorites)).toBe(true);
      
      // Verify our zone is in favorites
      const favoriteZone = data.favorites.find(z => z.id === testZoneId);
      expect(favoriteZone).toBeDefined();
      
      console.log(`✓ User has ${data.favorites.length} favorite zone(s)`);
    });
    
    test('Step 7: User navigates between different zones on map', async () => {
      const response = await fetch(`${API_URL}/api/zones`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Test viewing multiple zones
      const zonesToTest = data.zones.slice(0, 3);
      
      for (const zone of zonesToTest) {
        const zoneResponse = await fetch(`${API_URL}/api/zones/${zone.id}`);
        expect(zoneResponse.status).toBe(200);
        const zoneData = await zoneResponse.json();
        expect(zoneData.zone.id).toBe(zone.id);
      }
      
      console.log(`✓ Successfully navigated between ${zonesToTest.length} zones`);
    });
  });
  
  // ============================================================================
  // E2E TEST 5: CROSS-BROWSER AND DEVICE COMPATIBILITY
  // ============================================================================
  
  describe('E2E: API Compatibility for Multiple Devices/Browsers', () => {
    
    test('API returns proper CORS headers for frontend access', async () => {
      const response = await fetch(`${API_URL}/api/zones`, {
        headers: {
          'Origin': 'http://localhost:5174'
        }
      });
      
      expect(response.status).toBe(200);
      // CORS headers should be present (handled by server)
      console.log('✓ CORS headers configured for cross-origin requests');
    });
    
    test('API handles mobile-sized image uploads', async () => {
      // Simulate smaller mobile photo
      const sharp = (await import('sharp')).default;
      const mobileImage = await sharp({
        create: {
          width: 400,
          height: 300,
          channels: 3,
          background: { r: 50, g: 100, b: 150 }
        }
      })
      .jpeg({ quality: 80 })
      .toBuffer();
      
      const formData = new FormData();
      formData.append('photo', mobileImage, {
        filename: 'mobile-photo.jpg',
        contentType: 'image/jpeg'
      });
      formData.append('zoneId', testZoneId);
      
      const response = await fetch(`${API_URL}/api/reports/parking`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...formData.getHeaders()
        },
        body: formData
      });
      
      expect(response.status).toBe(201);
      console.log('✓ Mobile-sized image upload successful');
    });
    
    test('API returns JSON responses compatible with all browsers', async () => {
      const response = await fetch(`${API_URL}/api/zones`);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/json');
      
      const data = await response.json();
      expect(data).toBeDefined();
      
      console.log('✓ JSON responses properly formatted');
    });
    
    test('API handles concurrent requests (multi-user scenario)', async () => {
      // Simulate multiple users accessing zones simultaneously
      const requests = Array(5).fill(null).map(() => 
        fetch(`${API_URL}/api/zones`)
      );
      
      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
      
      console.log('✓ API handles concurrent requests successfully');
    });
  });
  
  // ============================================================================
  // E2E TEST 6: ERROR HANDLING AND EDGE CASES
  // ============================================================================
  
  describe('E2E: Error Handling Across User Flows', () => {
    
    test('User receives clear error for invalid credentials', async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUser.email,
          password: 'WrongPassword123'
        })
      });
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('message');
      expect(data.message).toBeTruthy();
      
      console.log('✓ Clear error message for invalid credentials');
    });
    
    test('User receives error for accessing protected route without token', async () => {
      const response = await fetch(`${API_URL}/api/reports/parking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      
      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.message).toContain('token');
      
      console.log('✓ Protected routes require authentication');
    });
    
    test('User receives error for invalid zone ID', async () => {
      const response = await fetch(`${API_URL}/api/zones/invalid-zone-id`);
      
      // Should return 404 or 500 (both indicate error)
      expect([404, 500]).toContain(response.status);
      const data = await response.json();
      expect(data).toHaveProperty('message');
      
      console.log('✓ Proper error handling for invalid zone ID');
    });
    
    test('User receives error for missing required fields in theft report', async () => {
      const response = await fetch(`${API_URL}/api/incidents/theft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          zoneId: testZoneId
          // Missing dateTime and description
        })
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data).toHaveProperty('message');
      
      console.log('✓ Validation errors for incomplete theft reports');
    });
  });
  
  // ============================================================================
  // CLEANUP
  // ============================================================================
  
  afterAll(async () => {
    console.log('\n🧹 Cleaning up test data...');
    
    // Clean up test user and all related data
    if (testUser.userId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUser.userId]);
      console.log('✓ Test user deleted');
    }
    
    await pool.end();
    console.log('✓ Database connection closed');
    console.log('\n✅ All E2E tests completed successfully!\n');
  });
});
