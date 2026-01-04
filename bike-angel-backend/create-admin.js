// Quick script to create admin user with proper password hash
import bcrypt from 'bcrypt';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function createAdmin() {
  try {
    // Hash the password
    const password = 'Admin123!';
    const passwordHash = await bcrypt.hash(password, 10);
    
    console.log('Generated password hash:', passwordHash);
    
    // Insert admin user
    const result = await pool.query(`
      INSERT INTO users (email, password_hash, name, email_verified, role) 
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (email) 
      DO UPDATE SET 
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        email_verified = EXCLUDED.email_verified
      RETURNING id, email, name, role, email_verified
    `, ['admin@ucsd.edu', passwordHash, 'Admin', true, 'admin']);
    
    console.log('\n✅ Admin user created successfully!');
    console.log(result.rows[0]);
    console.log('\nLogin credentials:');
    console.log('  Email: admin@ucsd.edu');
    console.log('  Password: Admin123!');
    
    await pool.end();
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    await pool.end();
    process.exit(1);
  }
}

createAdmin();
