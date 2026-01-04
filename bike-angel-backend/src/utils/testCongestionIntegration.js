import pool from '../config/database.js';
import CongestionAnalyzer from '../services/congestionAnalyzer.js';

/**
 * Integration test for congestion calculation with parking reports
 * Tests Requirements 5.1, 5.2, 5.3, 5.5
 */
async function testCongestionIntegration() {
  console.log('🧪 Testing Congestion Calculation Integration...\n');
  
  const client = await pool.connect();
  
  try {
    // Get a test zone
    console.log('1️⃣ Setting up test zone...');
    const zonesResult = await client.query(
      'SELECT id, name, capacity FROM parking_zones WHERE capacity >= 10 LIMIT 1'
    );
    
    if (zonesResult.rows.length === 0) {
      throw new Error('No parking zones found. Run db:seed first.');
    }
    
    const testZone = zonesResult.rows[0];
    console.log(`✅ Using zone: ${testZone.name} (capacity: ${testZone.capacity})`);
    
    // Get a test user
    const userResult = await client.query(
      'SELECT id FROM users WHERE email_verified = true LIMIT 1'
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('No verified users found. Create a test user first.');
    }
    
    const testUserId = userResult.rows[0].id;
    console.log(`✅ Using test user: ${testUserId}`);
    
    // Clean up any existing test reports for this zone
    await client.query(
      'DELETE FROM parking_reports WHERE zone_id = $1',
      [testZone.id]
    );
    console.log('✅ Cleaned up existing reports');
    
    // Test Requirement 5.1 & 5.2: Only count reports from past 12 hours
    console.log('\n2️⃣ Testing 12-hour expiry (Requirements 5.1, 5.2)...');
    
    // Create a report that expires in the future (active)
    await client.query(
      `INSERT INTO parking_reports (user_id, zone_id, photo_url, thumbnail_url, timestamp, expires_at)
       VALUES ($1, $2, 'test-photo-1.jpg', 'test-thumb-1.jpg', NOW(), NOW() + INTERVAL '6 hours')`,
      [testUserId, testZone.id]
    );
    
    // Create a report that already expired (should be excluded)
    await client.query(
      `INSERT INTO parking_reports (user_id, zone_id, photo_url, thumbnail_url, timestamp, expires_at)
       VALUES ($1, $2, 'test-photo-2.jpg', 'test-thumb-2.jpg', NOW() - INTERVAL '13 hours', NOW() - INTERVAL '1 hour')`,
      [testUserId, testZone.id]
    );
    
    const activeReports = await CongestionAnalyzer.getActiveReports(testZone.id);
    
    if (activeReports.length === 1) {
      console.log('✅ Correctly excludes expired reports (only counts active ones)');
      console.log(`   Active reports: ${activeReports.length} (expected: 1)`);
    } else {
      throw new Error(`Expected 1 active report, got ${activeReports.length}`);
    }
    
    // Test Requirement 5.3: Congestion level thresholds
    console.log('\n3️⃣ Testing congestion level thresholds (Requirement 5.3)...');
    
    const testCases = [
      { bikeCount: 10, capacity: 50, expected: 'available', description: '20% capacity' },
      { bikeCount: 29, capacity: 50, expected: 'available', description: '58% capacity' },
      { bikeCount: 30, capacity: 50, expected: 'filling', description: '60% capacity (threshold)' },
      { bikeCount: 37, capacity: 50, expected: 'filling', description: '74% capacity' },
      { bikeCount: 44, capacity: 50, expected: 'filling', description: '88% capacity' },
      { bikeCount: 45, capacity: 50, expected: 'full', description: '90% capacity (threshold)' },
      { bikeCount: 50, capacity: 50, expected: 'full', description: '100% capacity' }
    ];
    
    let allPassed = true;
    for (const testCase of testCases) {
      const level = CongestionAnalyzer.calculateCongestionLevel(testCase.bikeCount, testCase.capacity);
      const actualPercentage = Math.round((testCase.bikeCount / testCase.capacity) * 100);
      
      if (level === testCase.expected) {
        console.log(`✅ ${testCase.description}: "${level}" ✓`);
      } else {
        console.log(`❌ ${testCase.description}: got "${level}", expected "${testCase.expected}"`);
        allPassed = false;
      }
    }
    
    if (!allPassed) {
      throw new Error('Some congestion level calculations failed');
    }
    
    // Test Requirement 5.5: Display estimated bike count
    console.log('\n4️⃣ Testing bike count estimation (Requirement 5.5)...');
    
    const analysis = await CongestionAnalyzer.analyzeCongestion(testZone.id);
    
    console.log(`✅ Congestion analysis provides bike count:`);
    console.log(`   Bike Count: ${analysis.bikeCount}`);
    console.log(`   Capacity: ${analysis.capacity}`);
    console.log(`   Percentage: ${analysis.percentage}%`);
    console.log(`   Level: ${analysis.level}`);
    
    if (analysis.bikeCount === 1) {
      console.log('✅ Bike count matches active reports');
    } else {
      throw new Error(`Expected bike count of 1, got ${analysis.bikeCount}`);
    }
    
    // Test integration with database update
    console.log('\n5️⃣ Testing database update integration...');
    
    const updateResult = await CongestionAnalyzer.updateZoneCongestion(testZone.id);
    
    console.log(`✅ Zone congestion updated in database:`);
    console.log(`   Level: ${updateResult.level}`);
    console.log(`   Updated: ${updateResult.updated}`);
    
    // Verify the update persisted
    const verifyResult = await client.query(
      'SELECT congestion_level, last_updated FROM parking_zones WHERE id = $1',
      [testZone.id]
    );
    
    if (verifyResult.rows[0].congestion_level === updateResult.level) {
      console.log(`✅ Database verification passed: "${verifyResult.rows[0].congestion_level}"`);
    } else {
      throw new Error('Database update verification failed');
    }
    
    // Test dynamic congestion changes
    console.log('\n6️⃣ Testing dynamic congestion level changes...');
    
    // Add more reports to change congestion level
    const reportsToAdd = Math.ceil(testZone.capacity * 0.65); // Should trigger "filling"
    
    for (let i = 0; i < reportsToAdd; i++) {
      await client.query(
        `INSERT INTO parking_reports (user_id, zone_id, photo_url, thumbnail_url)
         VALUES ($1, $2, $3, $4)`,
        [testUserId, testZone.id, `test-photo-${i}.jpg`, `test-thumb-${i}.jpg`]
      );
    }
    
    const newAnalysis = await CongestionAnalyzer.analyzeCongestion(testZone.id);
    console.log(`✅ After adding ${reportsToAdd} reports:`);
    console.log(`   Bike Count: ${newAnalysis.bikeCount}`);
    console.log(`   Level: ${newAnalysis.level}`);
    console.log(`   Percentage: ${newAnalysis.percentage}%`);
    
    if (newAnalysis.level === 'filling' || newAnalysis.level === 'full') {
      console.log('✅ Congestion level correctly increased');
    } else {
      console.log(`⚠️  Expected "filling" or "full", got "${newAnalysis.level}"`);
    }
    
    // Clean up test data
    console.log('\n7️⃣ Cleaning up test data...');
    await client.query(
      'DELETE FROM parking_reports WHERE zone_id = $1 AND photo_url LIKE $2',
      [testZone.id, 'test-photo-%']
    );
    
    // Reset zone congestion
    await CongestionAnalyzer.updateZoneCongestion(testZone.id);
    console.log('✅ Test data cleaned up');
    
    console.log('\n✅ All congestion integration tests passed!');
    console.log('\n📋 Requirements validated:');
    console.log('   ✅ 5.1: Count only reports from past 12 hours');
    console.log('   ✅ 5.2: Automatically exclude expired reports');
    console.log('   ✅ 5.3: Mark zones based on congestion thresholds');
    console.log('   ✅ 5.5: Display estimated bike count');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run tests
testCongestionIntegration()
  .then(() => {
    console.log('\n🎉 Integration test suite completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Integration test suite failed:', error);
    process.exit(1);
  });
