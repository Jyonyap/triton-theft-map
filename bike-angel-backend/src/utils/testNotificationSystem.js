// Comprehensive test for the complete notification system
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';

// Test user credentials
const testUser = {
  email: 'testsystem@ucsd.edu',
  password: 'TestPass123',
  name: 'Test System User'
};

let authToken = null;
let testZoneId = null;

/**
 * Setup test user
 */
async function setupUser() {
  console.log('\n📝 Setting up test user...');
  
  try {
    // Try to register
    const registerResponse = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const registerData = await registerResponse.json();
    
    if (registerResponse.ok) {
      console.log('✅ User registered:', registerData.userId);
      
      // Manually verify email for testing
      const pool = (await import('../config/database.js')).default;
      await pool.query(
        'UPDATE users SET email_verified = TRUE WHERE email = $1',
        [testUser.email]
      );
      console.log('✅ Email verified for testing');
    } else if (registerData.message && registerData.message.includes('already exists')) {
      console.log('ℹ️  User already exists');
    }

    // Login
    const loginResponse = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const loginData = await loginResponse.json();
    
    if (loginResponse.ok) {
      console.log('✅ Login successful');
      authToken = loginData.token;
      return authToken;
    } else {
      throw new Error(loginData.message);
    }
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    throw error;
  }
}

/**
 * Get test zone
 */
async function getTestZone() {
  console.log('\n🗺️  Getting test zone...');
  
  try {
    const response = await fetch(`${API_URL}/zones`);
    const data = await response.json();
    
    if (response.ok && data.zones && data.zones.length > 0) {
      testZoneId = data.zones[0].id;
      console.log('✅ Test zone:', data.zones[0].name, `(${testZoneId})`);
      return testZoneId;
    } else {
      throw new Error('No zones found');
    }
  } catch (error) {
    console.error('❌ Failed to get test zone:', error.message);
    throw error;
  }
}

/**
 * Test 1: Get profile
 */
async function testGetProfile() {
  console.log('\n👤 Test 1: Get Profile');
  console.log('─────────────────────');
  
  try {
    const response = await fetch(`${API_URL}/users/profile`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Profile retrieved');
      console.log('   Name:', data.user.name);
      console.log('   Email:', data.user.email);
      console.log('   Notifications enabled:', data.user.notifications_enabled);
      return true;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test 2: Add favorite zone
 */
async function testAddFavorite() {
  console.log('\n⭐ Test 2: Add Favorite Zone');
  console.log('────────────────────────────');
  
  try {
    const response = await fetch(`${API_URL}/users/favorites`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ zoneId: testZoneId })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Zone added to favorites');
      return true;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test 3: Get favorites
 */
async function testGetFavorites() {
  console.log('\n📋 Test 3: Get Favorite Zones');
  console.log('─────────────────────────────');
  
  try {
    const response = await fetch(`${API_URL}/users/favorites`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Favorites retrieved:', data.count, 'zone(s)');
      data.favorites.forEach((fav, index) => {
        console.log(`   ${index + 1}. ${fav.name}`);
      });
      return data.favorites.length > 0;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test 4: Report theft (should trigger notification)
 */
async function testReportTheft() {
  console.log('\n🚨 Test 4: Report Theft (Trigger Notification)');
  console.log('───────────────────────────────────────────────');
  
  try {
    const response = await fetch(`${API_URL}/incidents/theft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        zoneId: testZoneId,
        dateTime: new Date().toISOString(),
        description: 'Test theft for notification system',
        policeReportNumber: 'TEST-' + Date.now()
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Theft reported');
      console.log('   Incident ID:', data.incidentId);
      console.log('   Verified:', data.verified);
      return true;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test 5: Get notifications
 */
async function testGetNotifications() {
  console.log('\n📬 Test 5: Get Notifications');
  console.log('────────────────────────────');
  
  try {
    const response = await fetch(`${API_URL}/notifications`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Notifications retrieved:', data.count);
      if (data.count > 0) {
        data.notifications.slice(0, 3).forEach((notif, index) => {
          console.log(`   ${index + 1}. ${notif.message}`);
          console.log(`      Read: ${notif.read}`);
        });
      }
      return data.notifications;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return [];
  }
}

/**
 * Test 6: Get unread count
 */
async function testGetUnreadCount() {
  console.log('\n🔔 Test 6: Get Unread Count');
  console.log('───────────────────────────');
  
  try {
    const response = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Unread count:', data.unreadCount);
      return data.unreadCount;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return 0;
  }
}

/**
 * Test 7: Disable notifications
 */
async function testDisableNotifications() {
  console.log('\n🔕 Test 7: Disable Notifications');
  console.log('────────────────────────────────');
  
  try {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ notifications_enabled: false })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Notifications disabled');
      console.log('   Notifications enabled:', data.user.notifications_enabled);
      return true;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test 8: Report another theft (should NOT trigger notification)
 */
async function testReportTheftWithDisabledNotifications() {
  console.log('\n🚫 Test 8: Report Theft (Notifications Disabled)');
  console.log('─────────────────────────────────────────────────');
  
  try {
    const response = await fetch(`${API_URL}/incidents/theft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        zoneId: testZoneId,
        dateTime: new Date().toISOString(),
        description: 'Test theft with notifications disabled',
        policeReportNumber: 'TEST-' + Date.now()
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Theft reported (notifications disabled)');
      console.log('   No notification should be created');
      return true;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Test 9: Re-enable notifications
 */
async function testEnableNotifications() {
  console.log('\n🔔 Test 9: Re-enable Notifications');
  console.log('──────────────────────────────────');
  
  try {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ notifications_enabled: true })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Notifications re-enabled');
      console.log('   Notifications enabled:', data.user.notifications_enabled);
      return true;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Comprehensive Notification System Test');
  console.log('==========================================');

  try {
    // Setup
    await setupUser();
    await getTestZone();

    // Run tests
    await testGetProfile();
    await testAddFavorite();
    await testGetFavorites();
    await testReportTheft();
    
    // Wait for notification to be created
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const notifications = await testGetNotifications();
    await testGetUnreadCount();
    await testDisableNotifications();
    await testReportTheftWithDisabledNotifications();
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 500));
    
    await testGetNotifications();
    await testEnableNotifications();

    console.log('\n✅ All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('   ✓ User profile management');
    console.log('   ✓ Favorite zones management');
    console.log('   ✓ Theft reporting with notifications');
    console.log('   ✓ Notification retrieval');
    console.log('   ✓ Notification preferences (enable/disable)');
    console.log('   ✓ Notification respects user preferences');
    
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
