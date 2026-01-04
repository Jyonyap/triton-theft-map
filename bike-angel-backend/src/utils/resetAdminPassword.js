// Reset admin password to Admin123!
import bcrypt from 'bcrypt';
import { query } from '../config/database.js';
import dotenv from 'dotenv';

dotenv.config();

async function resetAdminPassword() {
  try {
    console.log('🔐 Resetting passwords...\n');
    
    // Reset both admin and demo accounts
    const accounts = [
      { email: 'admin@ucsd.edu', password: 'Admin123!' },
      { email: 'demo@ucsd.edu', password: 'Demo123!' },
      { email: 'test@ucsd.edu', password: 'Test123!' }
    ];
    
    for (const account of accounts) {
      const email = account.email;
      const newPassword = account.password;
    
      // Hash the new password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);
      
      // Update the password
      const result = await query(
        'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email, name',
        [passwordHash, email]
      );
      
      if (result.rows.length === 0) {
        console.log(`❌ User ${email} not found`);
      } else {
        console.log(`✅ Password reset for ${email}`);
        console.log(`   Name: ${result.rows[0].name}`);
        console.log(`   New Password: ${newPassword}\n`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
  
  process.exit(0);
}

resetAdminPassword();
