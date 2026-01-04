import pool from '../config/database.js';

/**
 * Test database connection and verify schema
 */
async function testConnection() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Testing database connection...\n');
    
    // Test basic connection
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection successful!');
    console.log(`   Server time: ${result.rows[0].now}\n`);
    
    // Check PostgreSQL version
    const versionResult = await client.query('SELECT version()');
    const version = versionResult.rows[0].version;
    console.log('📊 PostgreSQL Version:');
    console.log(`   ${version.split(',')[0]}\n`);
    
    // Check if PostGIS is installed
    const postgisResult = await client.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      WHERE extname = 'postgis'
    `);
    
    if (postgisResult.rows.length > 0) {
      console.log('✅ PostGIS Extension:');
      console.log(`   Version ${postgisResult.rows[0].extversion} installed\n`);
    } else {
      console.log('⚠️  PostGIS Extension: Not installed');
      console.log('   Run: npm run db:init to install\n');
    }
    
    // Check if tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log('📋 Database Tables:');
      tablesResult.rows.forEach(row => {
        console.log(`   ✓ ${row.table_name}`);
      });
      console.log('');
      
      // Check parking zones count
      const zonesResult = await client.query('SELECT COUNT(*) FROM parking_zones');
      console.log(`📍 Parking Zones: ${zonesResult.rows[0].count} zones loaded\n`);
      
      // Check indexes
      const indexResult = await client.query(`
        SELECT 
          schemaname,
          tablename,
          indexname
        FROM pg_indexes
        WHERE schemaname = 'public'
        ORDER BY tablename, indexname
      `);
      
      console.log(`🔍 Database Indexes: ${indexResult.rows.length} indexes created`);
      
      // Group indexes by table
      const indexesByTable = {};
      indexResult.rows.forEach(row => {
        if (!indexesByTable[row.tablename]) {
          indexesByTable[row.tablename] = [];
        }
        indexesByTable[row.tablename].push(row.indexname);
      });
      
      Object.keys(indexesByTable).sort().forEach(table => {
        console.log(`   ${table}: ${indexesByTable[table].length} indexes`);
      });
      
      console.log('\n✅ Database is ready for use!');
      
    } else {
      console.log('⚠️  No tables found in database');
      console.log('   Run: npm run db:init to create tables\n');
    }
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if PostgreSQL is running');
    console.error('2. Verify .env file has correct database credentials');
    console.error('3. Ensure database exists: CREATE DATABASE bike_angel;');
    console.error('4. Check firewall settings\n');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the test
testConnection()
  .then(() => {
    console.log('🎉 Connection test complete!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Connection test failed');
    process.exit(1);
  });
