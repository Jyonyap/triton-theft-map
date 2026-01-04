// Test registration directly
import { AuthService } from '../services/authService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testRegistration() {
  try {
    console.log('🧪 Testing registration...');
    
    const testEmail = 'test@ucsd.edu';
    const testPassword = 'Test123!';
    const testName = 'Test User';
    
    console.log(`\nAttempting to register: ${testEmail}`);
    
    const result = await AuthService.register(testEmail, testPassword, testName);
    
    console.log('✅ Registration successful!');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('❌ Registration failed!');
    console.error('Error:', error.message);
    console.error('Full error:', error);
  }
  
  process.exit(0);
}

testRegistration();
