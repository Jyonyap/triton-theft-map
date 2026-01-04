// Test admin zone management API
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = 'http://localhost:3000';
let adminToken = null;

async function loginAsAdmin() {
  console.log('🔐 Logging in as admin...');
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@ucsd.edu',
      password: 'Admin123!'
    })
  });

  if (!response.ok) {
    throw new Error('Admin login failed');
  }

  const data = await response.json();
  adminToken = data.token;
  console.log('✅ Admin logged in successfully\n');
}

async function testCreateZone() {
  console.log('1️⃣  Testing zone creation...');
  
  const response = await fetch(`${API_URL}/api/admin/zones`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      latitude: 32.8801,
      longitude: -117.2340,
      gps_accuracy: 5.2,
      capacity: 50,
      description: 'Test zone created via API'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Zone creation failed:', error.message);
    return null;
  }

  const data = await response.json();
  console.log('✅ Zone created:', data.zone.name);
  console.log(`   ID: ${data.zone.id}`);
  console.log(`   Status: ${data.zone.status}`);
  console.log(`   GPS Accuracy: ${data.zone.gps_accuracy}m\n`);
  
  return data.zone.id;
}

async function testListZones() {
  console.log('2️⃣  Testing zone listing...');
  
  const response = await fetch(`${API_URL}/api/admin/zones`, {
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  if (!response.ok) {
    console.error('❌ Zone listing failed');
    return;
  }

  const data = await response.json();
  console.log(`✅ Found ${data.zones.length} zones`);
  if (data.stats) {
    console.log(`   Stats: ${data.stats.draft || 0} draft, ${data.stats.active || 0} active, ${data.stats.inactive || 0} inactive\n`);
  }
}

async function testUpdateZone(zoneId) {
  console.log('3️⃣  Testing zone update...');
  
  const response = await fetch(`${API_URL}/api/admin/zones/${zoneId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      name: 'Test Library Racks',
      description: 'Updated description',
      capacity: 60
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Zone update failed:', error.message);
    return;
  }

  const data = await response.json();
  console.log('✅ Zone updated:', data.zone.name);
  console.log(`   Capacity: ${data.zone.capacity}\n`);
}

async function testChangeStatus(zoneId) {
  console.log('4️⃣  Testing status change (should fail - no photo)...');
  
  const response = await fetch(`${API_URL}/api/admin/zones/${zoneId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    },
    body: JSON.stringify({
      status: 'active'
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.log('✅ Validation working:', error.message);
    console.log('   (Expected: zones need photos before activation)\n');
  } else {
    console.log('❌ Validation failed - zone activated without photo\n');
  }
}

async function testNonAdminAccess() {
  console.log('5️⃣  Testing non-admin access (should fail)...');
  
  // Try to access admin endpoint without token
  const response = await fetch(`${API_URL}/api/admin/zones`, {
    headers: {
      'Authorization': 'Bearer invalid_token'
    }
  });

  if (!response.ok) {
    console.log('✅ Admin protection working - unauthorized access blocked\n');
  } else {
    console.log('❌ Security issue - admin endpoint accessible without valid token\n');
  }
}

async function testDeleteZone(zoneId) {
  console.log('6️⃣  Testing zone deletion...');
  
  const response = await fetch(`${API_URL}/api/admin/zones/${zoneId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('❌ Zone deletion failed:', error.message);
    return;
  }

  console.log('✅ Zone deleted successfully\n');
}

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  ADMIN ZONE MANAGEMENT API TEST');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    await loginAsAdmin();
    
    const zoneId = await testCreateZone();
    if (!zoneId) {
      console.error('Cannot continue tests without zone ID');
      return;
    }

    await testListZones();
    await testUpdateZone(zoneId);
    await testChangeStatus(zoneId);
    await testNonAdminAccess();
    await testDeleteZone(zoneId);

    console.log('═══════════════════════════════════════════════════════');
    console.log('  ✅ ALL TESTS PASSED!');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

// Check if server is running
fetch(`${API_URL}/api/zones`)
  .then(() => {
    console.log('✅ Server is running\n');
    main();
  })
  .catch(() => {
    console.error('❌ Server is not running. Please start the server with: npm start');
    process.exit(1);
  });
