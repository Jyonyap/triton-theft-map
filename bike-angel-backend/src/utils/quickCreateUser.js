import dotenv from 'dotenv';
import pool from '../config/database.js';
import bcrypt from 'bcrypt';

dotenv.config();

async function quickCreateUser() {
  try {
    console.log('🔍 Checking for demo user...\n');
    
    const email = 'demo@ucsd.edu';
    const password = 'Demo123!';
    const name = 'Demo User';
    
    // Check if user exists
    const checkResult = await pool.query(
      'SELECT id, email, name, email_verified FROM users WHERE email = $1',
      [email]
    );
    
    if (checkResult.rows.length > 0) {
      const user = checkResult.rows[0];
      console.log('✅ User already exists!');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📧 Email:', email);
      console.log('🔑 Password:', password);
      console.log('👤 Name:', user.name);
      console.log('✉️  Email Verified:', user.email_verified);
      console.log('🆔 User ID:', user.id);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      
      // Make sure email is verified
      if (!user.email_verified) {
        await pool.query(
          'UPDATE users SET email_verified = TRUE WHERE email = $1',
          [email]
        );
        console.log('✅ Email verified!\n');
      }
      
      await pool.end();
      process.exit(0);
    }
    
    // Create user
    console.log('📝 Creating new user...\n');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, email_verified, created_at)
       VALUES ($1, $2, $3, TRUE, NOW())
       RETURNING id, email, name, email_verified`,
      [email, hashedPassword, name]
    );
    
    const user = result.rows[0];
    
    console.log('✅ User created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('👤 Name:', name);
    console.log('✉️  Email Verified: Yes');
    console.log('🆔 User ID:', user.id);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    
    await pool.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    await pool.end();
    process.exit(1);
  }
}

quickCreateUser();
