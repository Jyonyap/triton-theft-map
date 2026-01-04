import dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

const API_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * Test script for theft incident reporting
 */
async function testTheftIncidentAPI() {
  console.log('🧪 Testing Theft Incident API\n');
  
  try {
    // Step 1: Login to get auth token
    console.log('1️⃣ Logging in...');
    const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@ucsd.edu',
        password: 'Test1234'
      })
    });
    
    if (!loginResponse.ok) {
      throw new Error(`Login failed: ${loginResponse.status}`);
    }
    
    const loginData = await loginResponse.json();
    const token = loginData.token;
    console.log('✅ Login successful\n');
    
    // Step 2: Get zones to select one for testing
    console.log('2️⃣ Fetching parking zones...');
    const zonesResponse = await fetch(`${API_URL}/api/zones`);
    const zonesData = await zonesResponse.json();
    const testZone = zonesData.zones[0];
    console.log(`✅ Using zone: ${testZone.name} (${testZone.id})\n`);
    
    // Step 3: Create unverified theft incident
    console.log('3️⃣ Creating unverified theft incident...');
    const unverifiedIncident = {
      zoneId: testZone.id,
      dateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
      description: 'My bike was stolen from this location. Blue mountain bike with black seat.'
    };
    
    const unverifiedResponse = await fetch(`${API_URL}/api/incidents/theft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(unverifiedIncident)
    });
    
    if (!unverifiedResponse.ok) {
      const error = await unverifiedResponse.json();
      throw new Error(`Unverified incident creation failed: ${JSON.stringify(error)}`);
    }
    
    const unverifiedData = await unverifiedResponse.json();
    console.log('✅ Unverified incident created:');
    console.log(`   - Incident ID: ${unverifiedData.incidentId}`);
    console.log(`   - Verified: ${unverifiedData.verified}`);
    console.log(`   - Risk Rating: ${unverifiedData.riskRating.rating}`);
    console.log(`   - Verified Count: ${unverifiedData.riskRating.verifiedCount}`);
    console.log(`   - Unverified Count: ${unverifiedData.riskRating.unverifiedCount}`);
    console.log(`   - Weighted Total: ${unverifiedData.riskRating.weightedTotal}\n`);
    
    // Step 4: Create verified theft incident
    console.log('4️⃣ Creating verified theft incident...');
    const verifiedIncident = {
      zoneId: testZone.id,
      dateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
      description: 'Bike stolen, reported to UCSD Police. Lock was cut.',
      policeReportNumber: 'UCSD-2024-12345'
    };
    
    const verifiedResponse = await fetch(`${API_URL}/api/incidents/theft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(verifiedIncident)
    });
    
    if (!verifiedResponse.ok) {
      const error = await verifiedResponse.json();
      throw new Error(`Verified incident creation failed: ${JSON.stringify(error)}`);
    }
    
    const verifiedData = await verifiedResponse.json();
    console.log('✅ Verified incident created:');
    console.log(`   - Incident ID: ${verifiedData.incidentId}`);
    console.log(`   - Verified: ${verifiedData.verified}`);
    console.log(`   - Risk Rating: ${verifiedData.riskRating.rating}`);
    console.log(`   - Verified Count: ${verifiedData.riskRating.verifiedCount}`);
    console.log(`   - Unverified Count: ${verifiedData.riskRating.unverifiedCount}`);
    console.log(`   - Weighted Total: ${verifiedData.riskRating.weightedTotal}\n`);
    
    // Step 5: Get incidents for the zone
    console.log('5️⃣ Fetching incidents for zone...');
    const incidentsResponse = await fetch(`${API_URL}/api/incidents/theft/${testZone.id}`);
    const incidentsData = await incidentsResponse.json();
    console.log(`✅ Found ${incidentsData.count} incidents:`);
    incidentsData.incidents.forEach((incident, index) => {
      console.log(`   ${index + 1}. ${incident.verified ? '✓ VERIFIED' : '○ Unverified'}`);
      console.log(`      Date: ${new Date(incident.date_time).toLocaleDateString()}`);
      console.log(`      Description: ${incident.description.substring(0, 50)}...`);
      if (incident.police_report_number) {
        console.log(`      Police Report: ${incident.police_report_number}`);
      }
    });
    console.log();
    
    // Step 6: Test validation errors
    console.log('6️⃣ Testing validation errors...');
    
    // Missing zoneId
    const missingZoneResponse = await fetch(`${API_URL}/api/incidents/theft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        dateTime: new Date().toISOString(),
        description: 'Test'
      })
    });
    console.log(`   Missing zoneId: ${missingZoneResponse.status === 400 ? '✅' : '❌'} (Expected 400)`);
    
    // Missing dateTime
    const missingDateResponse = await fetch(`${API_URL}/api/incidents/theft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        zoneId: testZone.id,
        description: 'Test'
      })
    });
    console.log(`   Missing dateTime: ${missingDateResponse.status === 400 ? '✅' : '❌'} (Expected 400)`);
    
    // Missing description
    const missingDescResponse = await fetch(`${API_URL}/api/incidents/theft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        zoneId: testZone.id,
        dateTime: new Date().toISOString()
      })
    });
    console.log(`   Missing description: ${missingDescResponse.status === 400 ? '✅' : '❌'} (Expected 400)`);
    
    // Invalid zone ID
    const invalidZoneResponse = await fetch(`${API_URL}/api/incidents/theft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        zoneId: '00000000-0000-0000-0000-000000000000',
        dateTime: new Date().toISOString(),
        description: 'Test'
      })
    });
    console.log(`   Invalid zone ID: ${invalidZoneResponse.status === 404 ? '✅' : '❌'} (Expected 404)`);
    
    console.log('\n✅ All theft incident API tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testTheftIncidentAPI();
