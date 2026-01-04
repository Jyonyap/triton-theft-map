/**
 * Create a test user for development
 */

import pool from '../config/database.js';
import bcrypt from 'bcrypt';

async function createTestUser() {
  try {
    const email = 'test@ucsd.edu';
    const password = 'Test123!';
    const name = 'Test User';

    // Delete existing user if exists
    await pool.query('DELETE FROM users WHERE email = $1', [email]);
    console.log('🗑️  Deleted existing test user (if any)');

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, email_verified)
       VALUES ($1, $2, $3, true)
       RETURNING id, email, name`,
      [email, passwordHash, name]
    );

    console.log('✅ Test user created successfully!');
    console.log('');
    console.log('Login Credentials:');
    console.log('==================');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('');
    console.log('User ID:', result.rows[0].id);
    console.log('');
    console.log('You can now login at: http://localhost:5173');
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    process.exit(0);
  }
}

createTestUser();
