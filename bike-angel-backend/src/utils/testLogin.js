/**
 * Test login functionality
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000';

async function testLogin() {
  try {
    console.log('🧪 Testing Login...\n');

    // Test credentials
    const email = 'test@ucsd.edu';
    const password = 'Test123!';

    console.log('Attempting login with:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('');

    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Login successful!');
      console.log('');
      console.log('User:', data.user);
      console.log('Token:', data.token.substring(0, 20) + '...');
    } else {
      console.log('❌ Login failed!');
      console.log('Status:', response.status);
      console.log('Error:', data);
      console.log('');
      console.log('💡 Try registering a new account instead:');
      console.log('   1. Go to http://localhost:5173');
      console.log('   2. Click "Register"');
      console.log('   3. Use any @ucsd.edu email');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('Make sure the backend is running on port 3000');
  } finally {
    process.exit(0);
  }
}

testLogin();
