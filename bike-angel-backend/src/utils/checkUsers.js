// Check what users exist in the database
import { query } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkUsers() {
  try {
    console.log('🔍 Checking users in database...\n');
    
    const result = await query(
      'SELECT id, email, name, email_verified, role, created_at FROM users ORDER BY created_at DESC',
      []
    );
    
    if (result.rows.length === 0) {
      console.log('No users found in database');
    } else {
      console.log(`Found ${result.rows.length} user(s):\n`);
      result.rows.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Email Verified: ${user.email_verified}`);
        console.log(`   Role: ${user.role || 'student'}`);
        console.log(`   Created: ${user.created_at}`);
        console.log('');
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

checkUsers();
