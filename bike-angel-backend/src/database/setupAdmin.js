// Setup admin functionality: run migrations and create initial admin user
import dotenv from 'dotenv';
import pool from '../config/database.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const migrations = [
    '001_add_user_role.sql',
    '002_extend_parking_zones.sql',
    '003_create_zone_audit_log.sql'
  ];

  console.log('🚀 Running admin setup migrations...\n');

  for (const migration of migrations) {
    try {
      console.log(`📦 Running: ${migration}`);
      const migrationPath = path.join(__dirname, 'migrations', migration);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await pool.query(migrationSQL);
      console.log(`✅ ${migration} completed\n`);
    } catch (error) {
      console.error(`❌ ${migration} failed:`, error.message);
      throw error;
    }
  }
}

async function createAdminUser() {
  console.log('👤 Creating initial admin user...\n');

  const adminEmail = 'admin@ucsd.edu';
  const adminPassword = 'Admin123!'; // Change this in production!
  const adminName = 'System Administrator';

  try {
    // Check if admin user already exists
    const existingUser = await pool.query(
      'SELECT id, role FROM users WHERE email = $1',
      [adminEmail]
    );

    if (existingUser.rows.length > 0) {
      const user = existingUser.rows[0];
      if (user.role === 'admin') {
        console.log('ℹ️  Admin user already exists with admin role');
        console.log(`   Email: ${adminEmail}`);
        return;
      } else {
        // Update existing user to admin
        await pool.query(
          'UPDATE users SET role = $1 WHERE email = $2',
          ['admin', adminEmail]
        );
        console.log('✅ Existing user promoted to admin');
        console.log(`   Email: ${adminEmail}`);
        return;
      }
    }

    // Create new admin user
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, role, email_verified)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, name, role`,
      [adminEmail, passwordHash, adminName, 'admin', true]
    );

    console.log('✅ Admin user created successfully!');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log(`   ⚠️  IMPORTANT: Change this password after first login!`);
    
  } catch (error) {
    console.error('❌ Failed to create admin user:', error.message);
    throw error;
  }
}

async function main() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  BIKE ANGEL - ADMIN SETUP');
    console.log('═══════════════════════════════════════════════════════\n');

    await runMigrations();
    await createAdminUser();

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ✅ ADMIN SETUP COMPLETE!');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nYou can now log in with:');
    console.log('  Email: admin@ucsd.edu');
    console.log('  Password: Admin123!');
    console.log('\n⚠️  Remember to change the password after first login!\n');

  } catch (error) {
    console.error('\n❌ Admin setup failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
