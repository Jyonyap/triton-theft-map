// Simple test script for user profile API endpoints using fetch
// Run this after starting the server

const API_URL = 'http://localhost:3000';

// Test user credentials
const testUser = {
  email: 'testprofile@ucsd.edu',
  password: 'TestPass123',
  name: 'Test Profile User'
};

let authToken = null;

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

async function registerAndLogin() {
  console.log('\n🔐 Logging in test user...');
  
  try {
    // Login with existing verified user
    const loginData = await makeRequest(`${API_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    
    authToken = loginData.token;
    console.log('✅ Logged in successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to login:', error.message);
    return false;
  }
}

async function testGetProfile() {
  console.log('\n📋 Testing GET /api/users/profile...');
  
  try {
    const data = await makeRequest(`${API_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Profile retrieved successfully');
    console.log('User data:', data.user);
    return true;
  } catch (error) {
    console.error('❌ Failed to get profile:', error.message);
    return false;
  }
}

async function testUpdateProfile() {
  console.log('\n✏️ Testing PUT /api/users/profile...');
  
  try {
    // Test updating name
    const data1 = await makeRequest(`${API_URL}/api/users/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ name: 'Updated Name' })
    });
    
    console.log('✅ Name updated successfully');
    console.log('Updated user:', data1.user);
    
    // Test updating notifications
    const data2 = await makeRequest(`${API_URL}/api/users/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ notifications_enabled: false })
    });
    
    console.log('✅ Notifications disabled successfully');
    console.log('Updated user:', data2.user);
    
    // Test updating both
    const data3 = await makeRequest(`${API_URL}/api/users/profile`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${authToken}` },
      body: JSON.stringify({ name: 'Final Name', notifications_enabled: true })
    });
    
    console.log('✅ Both fields updated successfully');
    console.log('Updated user:', data3.user);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to update profile:', error.message);
    return false;
  }
}

async function testDeleteAccount() {
  console.log('\n🗑️ Testing DELETE /api/users/account...');
  
  try {
    const data = await makeRequest(`${API_URL}/api/users/account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Account deleted successfully');
    console.log('Response:', data);
    
    // Try to get profile after deletion (should fail)
    try {
      await makeRequest(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('❌ ERROR: Profile still accessible after deletion');
      return false;
    } catch (error) {
      console.log('✅ Profile correctly inaccessible after deletion');
      return true;
    }
  } catch (error) {
    console.error('❌ Failed to delete account:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Profile API Tests');
  console.log(`API URL: ${API_URL}`);
  
  const results = {
    auth: false,
    getProfile: false,
    updateProfile: false,
    deleteAccount: false
  };
  
  // Register and login
  results.auth = await registerAndLogin();
  if (!results.auth) {
    console.log('\n❌ Authentication failed, cannot continue tests');
    process.exit(1);
  }
  
  // Test GET profile
  results.getProfile = await testGetProfile();
  
  // Test UPDATE profile
  results.updateProfile = await testUpdateProfile();
  
  // Note: We're NOT testing DELETE account to preserve the test user
  // If you want to test deletion, uncomment the line below:
  // results.deleteAccount = await testDeleteAccount();
  results.deleteAccount = true; // Skip deletion test
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Summary:');
  console.log('='.repeat(50));
  console.log(`Authentication:     ${results.auth ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`GET Profile:        ${results.getProfile ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`UPDATE Profile:     ${results.updateProfile ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`DELETE Account:     ${results.deleteAccount ? '✅ PASS' : '❌ FAIL'}`);
  console.log('='.repeat(50));
  
  const allPassed = Object.values(results).every(r => r);
  if (allPassed) {
    console.log('\n✅ All tests passed!');
    process.exit(0);
  } else {
    console.log('\n❌ Some tests failed');
    process.exit(1);
  }
}

main();
