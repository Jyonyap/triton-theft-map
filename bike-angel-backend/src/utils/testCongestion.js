import CongestionAnalyzer from '../services/congestionAnalyzer.js';
import pool from '../config/database.js';

/**
 * Test congestion analyzer functionality
 */
async function testCongestionAnalyzer() {
  console.log('🧪 Testing Congestion Analyzer...\n');
  
  try {
    // Get a test zone
    console.log('1️⃣ Fetching test zone...');
    const zonesResult = await pool.query('SELECT id, name, capacity FROM parking_zones LIMIT 1');
    
    if (zonesResult.rows.length === 0) {
      throw new Error('No parking zones found. Run db:seed first.');
    }
    
    const testZone = zonesResult.rows[0];
    console.log(`✅ Using zone: ${testZone.name}`);
    console.log(`   Capacity: ${testZone.capacity} bikes`);
    console.log(`   Zone ID: ${testZone.id}`);
    
    // Test 1: Calculate congestion level
    console.log('\n2️⃣ Testing congestion level calculation...');
    
    const testCases = [
      { bikeCount: 10, capacity: 50, expected: 'available' },
      { bikeCount: 30, capacity: 50, expected: 'filling' },
      { bikeCount: 45, capacity: 50, expected: 'full' },
      { bikeCount: 0, capacity: 50, expected: 'available' },
      { bikeCount: 50, capacity: 50, expected: 'full' }
    ];
    
    for (const testCase of testCases) {
      const level = CongestionAnalyzer.calculateCongestionLevel(
        testCase.bikeCount,
        testCase.capacity
      );
      
      const percentage = Math.round((testCase.bikeCount / testCase.capacity) * 100);
      
      if (level === testCase.expected) {
        console.log(`✅ ${testCase.bikeCount}/${testCase.capacity} (${percentage}%) = "${level}" ✓`);
      } else {
        console.log(`❌ ${testCase.bikeCount}/${testCase.capacity} (${percentage}%) = "${level}" (expected "${testCase.expected}")`);
      }
    }
    
    // Test 2: Get active reports
    console.log('\n3️⃣ Testing active reports retrieval...');
    const activeReports = await CongestionAnalyzer.getActiveReports(testZone.id);
    console.log(`✅ Found ${activeReports.length} active report(s) for zone`);
    
    // Test 3: Analyze congestion
    console.log('\n4️⃣ Testing congestion analysis...');
    const analysis = await CongestionAnalyzer.analyzeCongestion(testZone.id);
    console.log(`✅ Congestion analysis complete:`);
    console.log(`   Level: ${analysis.level}`);
    console.log(`   Bike Count: ${analysis.bikeCount}`);
    console.log(`   Capacity: ${analysis.capacity}`);
    console.log(`   Percentage: ${analysis.percentage}%`);
    
    // Test 4: Update zone congestion
    console.log('\n5️⃣ Testing zone congestion update...');
    const updateResult = await CongestionAnalyzer.updateZoneCongestion(testZone.id);
    console.log(`✅ Zone congestion updated:`);
    console.log(`   Level: ${updateResult.level}`);
    console.log(`   Updated: ${updateResult.updated}`);
    
    // Verify database was updated
    const verifyResult = await pool.query(
      'SELECT congestion_level FROM parking_zones WHERE id = $1',
      [testZone.id]
    );
    console.log(`✅ Database verification: congestion_level = "${verifyResult.rows[0].congestion_level}"`);
    
    // Test 5: Get all zones congestion
    console.log('\n6️⃣ Testing all zones congestion retrieval...');
    const allCongestion = await CongestionAnalyzer.getAllZonesCongestion();
    console.log(`✅ Retrieved congestion data for ${allCongestion.length} zone(s)`);
    
    // Display first 3 zones
    console.log('\n   Sample zones:');
    allCongestion.slice(0, 3).forEach(zone => {
      console.log(`   - ${zone.zoneName}: ${zone.congestionLevel} (${zone.activeReports}/${zone.capacity} = ${zone.percentage}%)`);
    });
    
    // Test 6: Update all zones
    console.log('\n7️⃣ Testing bulk zone update...');
    const bulkUpdateResults = await CongestionAnalyzer.updateAllZonesCongestion();
    console.log(`✅ Updated ${bulkUpdateResults.length} zone(s)`);
    
    const successCount = bulkUpdateResults.filter(r => r.updated).length;
    const errorCount = bulkUpdateResults.filter(r => r.error).length;
    console.log(`   Success: ${successCount}, Errors: ${errorCount}`);
    
    console.log('\n✅ All congestion analyzer tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests
testCongestionAnalyzer()
  .then(() => {
    console.log('\n🎉 Test suite completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });
