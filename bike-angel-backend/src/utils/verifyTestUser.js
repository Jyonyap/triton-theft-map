// Verify test user email
import pool from '../config/database.js';

async function verifyTestUser() {
  try {
    const result = await pool.query(
      'UPDATE users SET email_verified = TRUE WHERE email = $1 RETURNING *',
      ['testfavorites@ucsd.edu']
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Email verified for testfavorites@ucsd.edu');
    } else {
      console.log('❌ User not found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

verifyTestUser();
