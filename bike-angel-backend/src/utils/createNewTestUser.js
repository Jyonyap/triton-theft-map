import dotenv from 'dotenv';
import pool from '../config/database.js';
import bcrypt from 'bcrypt';

dotenv.config();

async function createNewTestUser() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating new test user...\n');

    const email = 'demo@ucsd.edu';
    const password = 'Demo123!';
    const name = 'Demo User';

    // Check if user already exists
    const existingUser = await client.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      console.log('⚠️  User already exists!');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      console.log('\n✅ You can use these credentials to login\n');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await client.query(
      `INSERT INTO users (email, password_hash, name, email_verified, created_at)
       VALUES ($1, $2, $3, true, NOW())
       RETURNING id, email, name, email_verified`,
      [email, hashedPassword, name]
    );

    const user = result.rows[0];

    console.log('✅ Test user created successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', name);
    console.log('✉️  Email Verified: Yes');
    console.log('🆔 User ID:', user.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('🎯 You can now login with these credentials!\n');

  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
    process.exit(0);
  }
}

createNewTestUser();
