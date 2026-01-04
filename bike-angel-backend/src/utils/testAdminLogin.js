// Test admin login directly
import { AuthService } from '../services/authService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testAdminLogin() {
  try {
    console.log('🧪 Testing admin login...\n');
    
    const email = 'admin@ucsd.edu';
    const password = 'Admin123!';
    
    console.log(`Attempting to login: ${email}`);
    console.log(`Password: ${password}\n`);
    
    const result = await AuthService.login(email, password);
    
    console.log('✅ Login successful!');
    console.log('User:', result.user);
    console.log('Token:', result.token.substring(0, 50) + '...');
    
  } catch (error) {
    console.error('❌ Login failed!');
    console.error('Error:', error.message);
    console.error('Status Code:', error.statusCode);
  }
  
  process.exit(0);
}

testAdminLogin();
