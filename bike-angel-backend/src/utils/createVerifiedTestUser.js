// Create a verified test user directly in the database
import pool from '../config/database.js';
import bcrypt from 'bcrypt';

async function createVerifiedTestUser() {
  const testUser = {
    email: 'testprofile@ucsd.edu',
    password: 'TestPass123',
    name: 'Test Profile User'
  };

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(testUser.password, 10);

    // Check if user exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [testUser.email]
    );

    if (existingUser.rows.length > 0) {
      console.log('ℹ️ User already exists, updating to verified status');
      await pool.query(
        'UPDATE users SET email_verified = TRUE WHERE email = $1',
        [testUser.email]
      );
      console.log('✅ User updated to verified status');
    } else {
      // Create user with verified email
      await pool.query(
        `INSERT INTO users (email, password_hash, name, email_verified)
         VALUES ($1, $2, $3, TRUE)`,
        [testUser.email, passwordHash, testUser.name]
      );
      console.log('✅ Verified test user created successfully');
    }

    console.log('\nTest user credentials:');
    console.log(`Email: ${testUser.email}`);
    console.log(`Password: ${testUser.password}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating test user:', error);
    process.exit(1);
  }
}

createVerifiedTestUser();
