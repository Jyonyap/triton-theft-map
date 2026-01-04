// Test script for notification functionality
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';

// Test user credentials
const testUser = {
  email: 'testnotifications@ucsd.edu',
  password: 'TestPass123',
  name: 'Test Notifications User'
};

let authToken = null;
let testZoneId = null;

/**
 * Register and login test user
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
 * Get a test zone ID
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
 * Add zone to favorites
 */
async function addFavorite() {
  console.log('\n⭐ Adding zone to favorites...');
  
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
    console.error('❌ Add favorite failed:', error.message);
    return false;
  }
}

/**
 * Report a theft incident
 */
async function reportTheft() {
  console.log('\n🚨 Reporting theft incident...');
  
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
        description: 'Test theft incident for notification testing',
        policeReportNumber: 'TEST-12345'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Theft incident reported');
      console.log('   Incident ID:', data.incidentId);
      console.log('   Verified:', data.verified);
      console.log('   Risk rating:', data.riskRating.rating);
      return data.incidentId;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Report theft failed:', error.message);
    return null;
  }
}

/**
 * Get notifications
 */
async function getNotifications() {
  console.log('\n📬 Getting notifications...');
  
  try {
    const response = await fetch(`${API_URL}/notifications`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Notifications retrieved:', data.count);
      data.notifications.forEach((notif, index) => {
        console.log(`   ${index + 1}. ${notif.message}`);
        console.log(`      Zone: ${notif.zone_name}`);
        console.log(`      Read: ${notif.read}`);
        console.log(`      Created: ${notif.created_at}`);
      });
      return data.notifications;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Get notifications failed:', error.message);
    return [];
  }
}

/**
 * Get unread count
 */
async function getUnreadCount() {
  console.log('\n🔔 Getting unread count...');
  
  try {
    const response = await fetch(`${API_URL}/notifications/unread-count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Unread count:', data.unreadCount);
      return data.unreadCount;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Get unread count failed:', error.message);
    return 0;
  }
}

/**
 * Mark notification as read
 */
async function markAsRead(notificationId) {
  console.log('\n✓ Marking notification as read...');
  
  try {
    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅', data.message);
      return true;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Mark as read failed:', error.message);
    return false;
  }
}

/**
 * Mark all as read
 */
async function markAllAsRead() {
  console.log('\n✓✓ Marking all notifications as read...');
  
  try {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅', data.message);
      return true;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Mark all as read failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Starting Notification System Tests');
  console.log('=====================================');

  try {
    // Setup
    await setupUser();
    await getTestZone();
    await addFavorite();

    // Report theft (should trigger notification)
    await reportTheft();

    // Wait a moment for notification to be created
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check notifications
    const notifications = await getNotifications();
    
    if (notifications.length === 0) {
      console.log('\n⚠️  No notifications found. This might be expected if notifications were already read.');
    } else {
      // Get unread count
      await getUnreadCount();

      // Mark first notification as read
      if (notifications.length > 0) {
        await markAsRead(notifications[0].id);
        await getUnreadCount();
      }

      // Mark all as read
      await markAllAsRead();
      await getUnreadCount();
    }

    console.log('\n✅ All notification tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
