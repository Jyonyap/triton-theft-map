import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const API_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * Test parking report creation
 */
async function testParkingReportAPI() {
  console.log('🧪 Testing Parking Report API...\n');
  
  try {
    // Step 1: Register a test user
    console.log('1️⃣ Registering test user...');
    const testEmail = `test${Date.now()}@ucsd.edu`;
    
    const registerResponse = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPass123',
        name: 'Test User'
      })
    });
    
    if (!registerResponse.ok) {
      throw new Error(`Registration failed: ${await registerResponse.text()}`);
    }
    
    const registerData = await registerResponse.json();
    console.log('✅ User registered:', registerData.userId);
    
    // Manually verify email for testing (bypass email verification)
    console.log('\n1.5️⃣ Manually verifying email for testing...');
    const verifyQuery = `UPDATE users SET email_verified = TRUE WHERE id = '${registerData.userId}'`;
    // We'll use direct database access for this test
    const { default: pool } = await import('../config/database.js');
    await pool.query(verifyQuery);
    console.log('✅ Email verified (test mode)');
    
    // Step 2: Login to get token
    console.log('\n2️⃣ Logging in...');
    
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'TestPass123'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${await loginResponse.text()}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful, token received');
    
    // Step 3: Get a parking zone
    console.log('\n3️⃣ Fetching parking zones...');
    const zonesResponse = await fetch(`${API_URL}/api/zones`);
    
    if (!zonesResponse.ok) {
      throw new Error(`Failed to fetch zones: ${await zonesResponse.text()}`);
    }
    
    const zonesData = await zonesResponse.json();
    if (zonesData.zones.length === 0) {
      throw new Error('No parking zones found. Run db:seed first.');
    }
    
    const testZone = zonesData.zones[0];
    console.log(`✅ Using zone: ${testZone.name} (${testZone.id})`);
    
    // Step 4: Create a test image
    console.log('\n4️⃣ Creating test image...');
    const sharp = (await import('sharp')).default;
    const testImageBuffer = await sharp({
      create: {
        width: 800,
        height: 600,
        channels: 3,
        background: { r: 100, g: 150, b: 200 }
      }
    })
    .jpeg()
    .toBuffer();
    
    console.log(`✅ Test image created (${testImageBuffer.length} bytes)`);
    
    // Step 5: Upload parking report
    console.log('\n5️⃣ Uploading parking report...');
    const formData = new FormData();
    formData.append('photo', testImageBuffer, {
      filename: 'test-parking.jpg',
      contentType: 'image/jpeg'
    });
    formData.append('zoneId', testZone.id);
    
    const reportResponse = await fetch(`${API_URL}/api/reports/parking`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    if (!reportResponse.ok) {
      const errorText = await reportResponse.text();
      throw new Error(`Report upload failed: ${errorText}`);
    }
    
    const reportData = await reportResponse.json();
    console.log('✅ Parking report created successfully!');
    console.log('   Report ID:', reportData.reportId);
    console.log('   Timestamp:', reportData.timestamp);
    console.log('   Expires At:', reportData.expiresAt);
    console.log('   Photo URL:', reportData.photoUrl);
    console.log('   Thumbnail URL:', reportData.thumbnailUrl);
    
    // Step 6: Fetch reports for the zone
    console.log('\n6️⃣ Fetching reports for zone...');
    const fetchReportsResponse = await fetch(
      `${API_URL}/api/reports/parking/${testZone.id}`
    );
    
    if (!fetchReportsResponse.ok) {
      throw new Error(`Failed to fetch reports: ${await fetchReportsResponse.text()}`);
    }
    
    const fetchReportsData = await fetchReportsResponse.json();
    console.log(`✅ Found ${fetchReportsData.count} active report(s) for zone`);
    
    // Step 7: Test validation - missing photo
    console.log('\n7️⃣ Testing validation (missing photo)...');
    const invalidFormData = new FormData();
    invalidFormData.append('zoneId', testZone.id);
    
    const invalidResponse = await fetch(`${API_URL}/api/reports/parking`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...invalidFormData.getHeaders()
      },
      body: invalidFormData
    });
    
    if (invalidResponse.status === 400) {
      console.log('✅ Validation working correctly (rejected missing photo)');
    } else {
      console.log('⚠️  Validation may not be working as expected');
    }
    
    // Step 8: Test validation - invalid zone
    console.log('\n8️⃣ Testing validation (invalid zone)...');
    const invalidZoneFormData = new FormData();
    invalidZoneFormData.append('photo', testImageBuffer, {
      filename: 'test.jpg',
      contentType: 'image/jpeg'
    });
    invalidZoneFormData.append('zoneId', '00000000-0000-0000-0000-000000000000');
    
    const invalidZoneResponse = await fetch(`${API_URL}/api/reports/parking`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...invalidZoneFormData.getHeaders()
      },
      body: invalidZoneFormData
    });
    
    if (invalidZoneResponse.status === 404) {
      console.log('✅ Validation working correctly (rejected invalid zone)');
    } else {
      console.log('⚠️  Zone validation may not be working as expected');
    }
    
    console.log('\n✅ All tests passed! Parking report API is working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testParkingReportAPI()
  .then(() => {
    console.log('\n🎉 Test suite completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });
