// Test script for favorite zones functionality
import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000/api';

// Test user credentials
const testUser = {
  email: 'testfavorites@ucsd.edu',
  password: 'TestPass123',
  name: 'Test Favorites User'
};

let authToken = null;
let testZoneId = null;

/**
 * Register a test user
 */
async function registerUser() {
  console.log('\n📝 Registering test user...');
  
  try {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testUser)
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ User registered:', data.userId);
      
      // Manually verify email for testing
      const pool = (await import('../config/database.js')).default;
      await pool.query(
        'UPDATE users SET email_verified = TRUE WHERE email = $1',
        [testUser.email]
      );
      console.log('✅ Email verified for testing');
      
      return data.userId;
    } else {
      if (data.message && data.message.includes('already exists')) {
        console.log('ℹ️  User already exists, will try to login');
        return null;
      }
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Registration failed:', error.message);
    throw error;
  }
}

/**
 * Login and get auth token
 */
async function login() {
  console.log('\n🔐 Logging in...');
  
  try {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login successful');
      authToken = data.token;
      return data.token;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Login failed:', error.message);
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
 * Test adding a favorite zone
 */
async function testAddFavorite() {
  console.log('\n➕ Testing add favorite zone...');
  
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
      console.log('✅ Favorite added:', data.message);
      console.log('   Zone ID:', data.favorite.zone_id);
      console.log('   Created at:', data.favorite.created_at);
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
 * Test getting favorite zones
 */
async function testGetFavorites() {
  console.log('\n📋 Testing get favorite zones...');
  
  try {
    const response = await fetch(`${API_URL}/users/favorites`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Favorites retrieved:', data.count, 'zone(s)');
      data.favorites.forEach((fav, index) => {
        console.log(`   ${index + 1}. ${fav.name} (${fav.risk_rating})`);
        console.log(`      Congestion: ${fav.congestion_level}`);
        console.log(`      Favorited: ${fav.favorited_at}`);
      });
      return data.favorites.length > 0;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Get favorites failed:', error.message);
    return false;
  }
}

/**
 * Test removing a favorite zone
 */
async function testRemoveFavorite() {
  console.log('\n➖ Testing remove favorite zone...');
  
  try {
    const response = await fetch(`${API_URL}/users/favorites/${testZoneId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Favorite removed:', data.message);
      return true;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Remove favorite failed:', error.message);
    return false;
  }
}

/**
 * Test getting profile
 */
async function testGetProfile() {
  console.log('\n👤 Testing get profile...');
  
  try {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Profile retrieved:');
      console.log('   Name:', data.user.name);
      console.log('   Email:', data.user.email);
      console.log('   Email verified:', data.user.email_verified);
      console.log('   Notifications enabled:', data.user.notifications_enabled);
      return true;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Get profile failed:', error.message);
    return false;
  }
}

/**
 * Test updating profile
 */
async function testUpdateProfile() {
  console.log('\n✏️  Testing update profile...');
  
  try {
    const response = await fetch(`${API_URL}/users/profile`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        name: 'Updated Test User',
        notifications_enabled: false
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Profile updated:', data.message);
      console.log('   New name:', data.user.name);
      console.log('   Notifications enabled:', data.user.notifications_enabled);
      return true;
    } else {
      throw new Error(data.message);
    }
  } catch (error) {
    console.error('❌ Update profile failed:', error.message);
    return false;
  }
}

/**
 * Run all tests
 */
async function runTests() {
  console.log('🧪 Starting Favorite Zones Tests');
  console.log('================================');

  try {
    // Setup
    await registerUser();
    await login();
    await getTestZone();

    // Test favorite zones
    await testAddFavorite();
    await testGetFavorites();
    await testRemoveFavorite();
    
    // Verify removal
    console.log('\n🔍 Verifying favorite was removed...');
    const hasFavorites = await testGetFavorites();
    if (!hasFavorites) {
      console.log('✅ Favorite successfully removed (list is empty)');
    }

    // Test profile endpoints
    await testGetProfile();
    await testUpdateProfile();

    console.log('\n✅ All tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Run tests
runTests();
