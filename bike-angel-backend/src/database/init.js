import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Initialize the database schema
 * Reads and executes the schema.sql file
 */
async function initializeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database initialization...');
    
    // Read the schema SQL file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute the schema
    console.log('📝 Creating tables and indexes...');
    await client.query(schemaSql);
    
    console.log('✅ Database schema created successfully!');
    console.log('📊 Tables created:');
    console.log('   - users');
    console.log('   - parking_zones (with 15 UCSD locations)');
    console.log('   - parking_reports');
    console.log('   - theft_incidents');
    console.log('   - favorite_zones');
    console.log('   - notifications');
    console.log('   - email_verification_tokens');
    console.log('');
    console.log('🗺️  PostGIS extension enabled for geospatial queries');
    console.log('🔍 Indexes created for optimal query performance');
    console.log('⚡ Triggers configured for automatic timestamp updates');
    
    // Verify the setup
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('');
    console.log('📋 Verified tables in database:');
    result.rows.forEach(row => {
      console.log(`   ✓ ${row.table_name}`);
    });
    
    // Check if PostGIS is installed
    const postgisCheck = await client.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'postgis'
    `);
    
    if (postgisCheck.rows.length > 0) {
      console.log('');
      console.log(`✅ PostGIS extension installed (version ${postgisCheck.rows[0].extversion})`);
    }
    
    // Count parking zones
    const zoneCount = await client.query('SELECT COUNT(*) FROM parking_zones');
    console.log('');
    console.log(`📍 ${zoneCount.rows[0].count} parking zones seeded`);
    
  } catch (error) {
    console.error('❌ Error initializing database:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Drop all tables (use with caution!)
 */
async function dropAllTables() {
  const client = await pool.connect();
  
  try {
    console.log('⚠️  Dropping all tables...');
    
    await client.query(`
      DROP TABLE IF EXISTS notifications CASCADE;
      DROP TABLE IF EXISTS email_verification_tokens CASCADE;
      DROP TABLE IF EXISTS favorite_zones CASCADE;
      DROP TABLE IF EXISTS theft_incidents CASCADE;
      DROP TABLE IF EXISTS parking_reports CASCADE;
      DROP TABLE IF EXISTS parking_zones CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP VIEW IF EXISTS zone_statistics CASCADE;
    `);
    
    console.log('✅ All tables dropped');
  } catch (error) {
    console.error('❌ Error dropping tables:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Reset database (drop and recreate)
 */
async function resetDatabase() {
  console.log('🔄 Resetting database...');
  await dropAllTables();
  await initializeDatabase();
  console.log('✅ Database reset complete!');
}

// CLI interface
const command = process.argv[2];

if (command === 'init') {
  initializeDatabase()
    .then(() => {
      console.log('');
      console.log('🎉 Database initialization complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to initialize database:', error);
      process.exit(1);
    });
} else if (command === 'drop') {
  dropAllTables()
    .then(() => {
      console.log('🎉 Tables dropped successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to drop tables:', error);
      process.exit(1);
    });
} else if (command === 'reset') {
  resetDatabase()
    .then(() => {
      console.log('🎉 Database reset complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to reset database:', error);
      process.exit(1);
    });
} else {
  console.log('Usage:');
  console.log('  node src/database/init.js init   - Initialize database schema');
  console.log('  node src/database/init.js drop   - Drop all tables');
  console.log('  node src/database/init.js reset  - Drop and recreate all tables');
  process.exit(1);
}

export { initializeDatabase, dropAllTables, resetDatabase };
