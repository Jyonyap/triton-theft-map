// Test script for user profile API endpoints
import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3000';

// Test user credentials
const testUser = {
  email: 'testprofile@ucsd.edu',
  password: 'TestPass123',
  name: 'Test Profile User'
};

let authToken = null;

async function testGetProfile() {
  console.log('\n📋 Testing GET /api/users/profile...');
  
  try {
    const response = await axios.get(`${API_URL}/api/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Profile retrieved successfully');
    console.log('User data:', response.data.user);
    return true;
  } catch (error) {
    console.error('❌ Failed to get profile:', error.response?.data || error.message);
    return false;
  }
}

async function testUpdateProfile() {
  console.log('\n✏️ Testing PUT /api/users/profile...');
  
  try {
    // Test updating name
    const response1 = await axios.put(
      `${API_URL}/api/users/profile`,
      { name: 'Updated Name' },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Name updated successfully');
    console.log('Updated user:', response1.data.user);
    
    // Test updating notifications
    const response2 = await axios.put(
      `${API_URL}/api/users/profile`,
      { notifications_enabled: false },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Notifications disabled successfully');
    console.log('Updated user:', response2.data.user);
    
    // Test updating both
    const response3 = await axios.put(
      `${API_URL}/api/users/profile`,
      { name: 'Final Name', notifications_enabled: true },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    console.log('✅ Both fields updated successfully');
    console.log('Updated user:', response3.data.user);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to update profile:', error.response?.data || error.message);
    return false;
  }
}

async function testDeleteAccount() {
  console.log('\n🗑️ Testing DELETE /api/users/account...');
  
  try {
    const response = await axios.delete(`${API_URL}/api/users/account`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Account deleted successfully');
    console.log('Response:', response.data);
    
    // Try to get profile after deletion (should fail)
    try {
      await axios.get(`${API_URL}/api/users/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      console.log('❌ ERROR: Profile still accessible after deletion');
      return false;
    } catch (error) {
      if (error.response?.status === 401 || error.response?.status === 404) {
        console.log('✅ Profile correctly inaccessible after deletion');
        return true;
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Failed to delete account:', error.response?.data || error.message);
    return false;
  }
}

async function registerAndLogin() {
  console.log('\n🔐 Registering and logging in test user...');
  
  try {
    // Try to register
    try {
      await axios.post(`${API_URL}/api/auth/register`, testUser);
      console.log('✅ User registered');
    } catch (error) {
      if (error.response?.status === 409) {
        console.log('ℹ️ User already exists, proceeding to login');
      } else {
        throw error;
      }
    }
    
    // Login
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: testUser.email,
      password: testUser.password
    });
    
    authToken = loginResponse.data.token;
    console.log('✅ Logged in successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to register/login:', error.response?.data || error.message);
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
  
  // Test DELETE account (this should be last as it deletes the user)
  results.deleteAccount = await testDeleteAccount();
  
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
