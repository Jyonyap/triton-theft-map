/**
 * API Integration Tests
 * Tests complete API flows including authentication, parking reports, theft incidents, and zones
 */

import fetch from 'node-fetch';
import FormData from 'form-data';
import pool from '../config/database.js';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test data
let testUser = {
  email: `test${Date.now()}@ucsd.edu`,
  password: 'TestPass123',
  name: 'Test User'
};
let authToken = null;
let testZoneId = null;
let testReportId = null;
let testIncidentId = null;

/**
 * Helper function to create a test image buffer
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
 * Helper function to manually verify email (bypass email verification for testing)
 */
async function manuallyVerifyEmail(userId) {
  await pool.query('UPDATE users SET email_verified = TRUE WHERE id = $1', [userId]);
}

describe('API Integration Tests', () => {
  
  // ============================================================================
  // AUTHENTICATION FLOW TESTS
  // ============================================================================
  
  describe('Authentication Flow', () => {
    
    test('should register a new user with valid UCSD email', async () => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('message');
      expect(data.message).toContain('verify');
      
      testUser.userId = data.userId;
    });
    
    test('should reject registration with non-UCSD email', async () => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@gmail.com',
          password: 'TestPass123',
          name: 'Invalid User'
        })
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('ucsd.edu');
    });
    
    test('should reject duplicate email registration', async () => {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser)
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('already exists');
    });
    
    test('should reject login with unverified email', async () => {
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
    });
    
    test('should login successfully after email verification', async () => {
      // Manually verify email for testing
      await manuallyVerifyEmail(testUser.userId);
      
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
      
      authToken = data.token;
    });
    
    test('should reject login with incorrect password', async () => {
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
      expect(data.message).toContain('Invalid');
    });
    
    test('should reject login with non-existent email', async () => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@ucsd.edu',
          password: 'TestPass123'
        })
      });
      
      expect(response.status).toBe(401);
    });
  });
  
  // ============================================================================
  // ZONE DATA RETRIEVAL TESTS
  // ============================================================================
  
  describe('Zone Data Retrieval', () => {
    
    test('should fetch all parking zones', async () => {
      const response = await fetch(`${API_URL}/api/zones`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('zones');
      expect(Array.isArray(data.zones)).toBe(true);
      expect(data.zones.length).toBeGreaterThan(0);
      
      // Verify zone structure
      const zone = data.zones[0];
      expect(zone).toHaveProperty('id');
      expect(zone).toHaveProperty('name');
      expect(zone).toHaveProperty('latitude');
      expect(zone).toHaveProperty('longitude');
      expect(zone).toHaveProperty('capacity');
      expect(zone).toHaveProperty('risk_rating');
      expect(zone).toHaveProperty('congestion_level');
      
      testZoneId = zone.id;
    });
    
    test('should fetch specific zone by ID', async () => {
      const response = await fetch(`${API_URL}/api/zones/${testZoneId}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('zone');
      expect(data.zone.id).toBe(testZoneId);
      expect(data).toHaveProperty('recentActivity');
      expect(data.recentActivity).toHaveProperty('parkingReports');
      expect(data.recentActivity).toHaveProperty('theftIncidents');
    });
    
    test('should return 404 for non-existent zone', async () => {
      const response = await fetch(`${API_URL}/api/zones/00000000-0000-0000-0000-000000000000`);
      
      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.message).toContain('not found');
    });
    
    test('should allow authenticated user to suggest new zone', async () => {
      const response = await fetch(`${API_URL}/api/zones/suggest`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          suggestedName: 'Test Suggested Zone',
          latitude: 32.8801,
          longitude: -117.2340,
          estimatedCapacity: 20,
          description: 'A new parking area near the library'
        })
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('suggestion');
      expect(data.suggestion).toHaveProperty('id');
      expect(data.message).toContain('submitted');
    });
    
    test('should reject zone suggestion without authentication', async () => {
      const response = await fetch(`${API_URL}/api/zones/suggest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suggestedName: 'Test Zone',
          latitude: 32.8801,
          longitude: -117.2340,
          estimatedCapacity: 20
        })
      });
      
      expect(response.status).toBe(401);
    });
  });
  
  // ============================================================================
  // PARKING REPORT SUBMISSION TESTS
  // ============================================================================
  
  describe('Parking Report Submission', () => {
    
    test('should create parking report with photo', async () => {
      const imageBuffer = await createTestImage();
      const formData = new FormData();
      formData.append('photo', imageBuffer, {
        filename: 'test-parking.jpg',
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
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('expiresAt');
      expect(data).toHaveProperty('photoUrl');
      expect(data).toHaveProperty('thumbnailUrl');
      
      testReportId = data.reportId;
    });
    
    test('should reject parking report without authentication', async () => {
      const imageBuffer = await createTestImage();
      const formData = new FormData();
      formData.append('photo', imageBuffer, {
        filename: 'test.jpg',
        contentType: 'image/jpeg'
      });
      formData.append('zoneId', testZoneId);
      
      const response = await fetch(`${API_URL}/api/reports/parking`, {
        method: 'POST',
        headers: formData.getHeaders(),
        body: formData
      });
      
      expect(response.status).toBe(401);
    });
    
    test('should reject parking report without photo', async () => {
      const formData = new FormData();
      formData.append('zoneId', testZoneId);
      
      const response = await fetch(`${API_URL}/api/reports/parking`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...formData.getHeaders()
        },
        body: formData
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.message).toContain('Photo');
    });
    
    test('should reject parking report with invalid zone', async () => {
      const imageBuffer = await createTestImage();
      const formData = new FormData();
      formData.append('photo', imageBuffer, {
        filename: 'test.jpg',
        contentType: 'image/jpeg'
      });
      formData.append('zoneId', '00000000-0000-0000-0000-000000000000');
      
      const response = await fetch(`${API_URL}/api/reports/parking`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          ...formData.getHeaders()
        },
        body: formData
      });
      
      expect(response.status).toBe(404);
    });
    
    test('should fetch parking reports for zone', async () => {
      const response = await fetch(`${API_URL}/api/reports/parking/${testZoneId}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('reports');
      expect(data).toHaveProperty('count');
      expect(Array.isArray(data.reports)).toBe(true);
      expect(data.count).toBeGreaterThan(0);
      
      // Verify report structure
      const report = data.reports.find(r => r.id === testReportId);
      expect(report).toBeDefined();
      expect(report).toHaveProperty('photo_url');
      expect(report).toHaveProperty('thumbnail_url');
      expect(report).toHaveProperty('timestamp');
    });
  });
  
  // ============================================================================
  // THEFT INCIDENT REPORTING TESTS
  // ============================================================================
  
  describe('Theft Incident Reporting', () => {
    
    test('should create unverified theft incident', async () => {
      const response = await fetch(`${API_URL}/api/incidents/theft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          zoneId: testZoneId,
          dateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'My blue mountain bike was stolen. Lock was cut.'
        })
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('incidentId');
      expect(data).toHaveProperty('verified');
      expect(data.verified).toBe(false);
      expect(data).toHaveProperty('riskRating');
      expect(data.riskRating).toHaveProperty('rating');
      expect(data.riskRating).toHaveProperty('verifiedCount');
      expect(data.riskRating).toHaveProperty('unverifiedCount');
      
      testIncidentId = data.incidentId;
    });
    
    test('should create verified theft incident with police report', async () => {
      const response = await fetch(`${API_URL}/api/incidents/theft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          zoneId: testZoneId,
          dateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          description: 'Bike stolen, reported to UCSD Police.',
          policeReportNumber: 'UCSD-2024-12345'
        })
      });
      
      expect(response.status).toBe(201);
      const data = await response.json();
      expect(data).toHaveProperty('incidentId');
      expect(data).toHaveProperty('verified');
      expect(data.verified).toBe(true);
      expect(data.riskRating.verifiedCount).toBeGreaterThan(0);
    });
    
    test('should reject theft incident without authentication', async () => {
      const response = await fetch(`${API_URL}/api/incidents/theft`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          zoneId: testZoneId,
          dateTime: new Date().toISOString(),
          description: 'Test incident'
        })
      });
      
      expect(response.status).toBe(401);
    });
    
    test('should reject theft incident without required fields', async () => {
      // Missing zoneId
      let response = await fetch(`${API_URL}/api/incidents/theft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          dateTime: new Date().toISOString(),
          description: 'Test'
        })
      });
      expect(response.status).toBe(400);
      
      // Missing dateTime
      response = await fetch(`${API_URL}/api/incidents/theft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          zoneId: testZoneId,
          description: 'Test'
        })
      });
      expect(response.status).toBe(400);
      
      // Missing description
      response = await fetch(`${API_URL}/api/incidents/theft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          zoneId: testZoneId,
          dateTime: new Date().toISOString()
        })
      });
      expect(response.status).toBe(400);
    });
    
    test('should reject theft incident with invalid zone', async () => {
      const response = await fetch(`${API_URL}/api/incidents/theft`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          zoneId: '00000000-0000-0000-0000-000000000000',
          dateTime: new Date().toISOString(),
          description: 'Test incident'
        })
      });
      
      expect(response.status).toBe(404);
    });
    
    test('should fetch theft incidents for zone', async () => {
      const response = await fetch(`${API_URL}/api/incidents/theft/${testZoneId}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data).toHaveProperty('incidents');
      expect(data).toHaveProperty('count');
      expect(Array.isArray(data.incidents)).toBe(true);
      expect(data.count).toBeGreaterThan(0);
      
      // Verify incident structure
      const incident = data.incidents.find(i => i.id === testIncidentId);
      expect(incident).toBeDefined();
      expect(incident).toHaveProperty('date_time');
      expect(incident).toHaveProperty('description');
      expect(incident).toHaveProperty('verified');
    });
    
    test('should update zone risk rating after theft incident', async () => {
      const response = await fetch(`${API_URL}/api/zones/${testZoneId}`);
      
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.zone).toHaveProperty('risk_rating');
      expect(['green', 'yellow', 'red']).toContain(data.zone.risk_rating);
    });
  });
  
  // ============================================================================
  // CLEANUP
  // ============================================================================
  
  afterAll(async () => {
    // Clean up test data
    if (testUser.userId) {
      await pool.query('DELETE FROM users WHERE id = $1', [testUser.userId]);
    }
    await pool.end();
  });
});
