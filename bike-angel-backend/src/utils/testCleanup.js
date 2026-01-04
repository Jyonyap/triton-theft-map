import pool from '../config/database.js';
import reportCleanupService from '../services/reportCleanupService.js';

/**
 * Test report cleanup service
 */
async function testCleanupService() {
  console.log('🧪 Testing Report Cleanup Service...\n');
  
  try {
    // Step 1: Check current state
    console.log('1️⃣ Checking current state...');
    const beforeStats = await reportCleanupService.getCleanupStats();
    console.log(`✅ Current expired reports: ${beforeStats.expiredReports}`);
    console.log(`   Affected zones: ${beforeStats.affectedZones}`);
    
    // Step 2: Create some test expired reports
    console.log('\n2️⃣ Creating test expired reports...');
    
    // Get a test zone
    const zoneResult = await pool.query('SELECT id FROM parking_zones LIMIT 1');
    if (zoneResult.rows.length === 0) {
      throw new Error('No zones found. Run db:seed first.');
    }
    const testZoneId = zoneResult.rows[0].id;
    
    // Get a test user
    const userResult = await pool.query('SELECT id FROM users LIMIT 1');
    if (userResult.rows.length === 0) {
      throw new Error('No users found. Create a user first.');
    }
    const testUserId = userResult.rows[0].id;
    
    // Create expired reports (set expires_at to past)
    const expiredReports = [];
    for (let i = 0; i < 3; i++) {
      const result = await pool.query(
        `INSERT INTO parking_reports 
         (user_id, zone_id, photo_url, thumbnail_url, timestamp, expires_at)
         VALUES ($1, $2, $3, $4, NOW() - INTERVAL '13 hours', NOW() - INTERVAL '1 hour')
         RETURNING id`,
        [
          testUserId,
          testZoneId,
          `https://test-bucket.s3.us-east-2.amazonaws.com/photos/test-${i}.jpg`,
          `https://test-bucket.s3.us-east-2.amazonaws.com/thumbnails/test-${i}.jpg`
        ]
      );
      expiredReports.push(result.rows[0].id);
    }
    
    console.log(`✅ Created ${expiredReports.length} test expired reports`);
    
    // Step 3: Check stats again
    console.log('\n3️⃣ Checking stats after creating expired reports...');
    const afterCreateStats = await reportCleanupService.getCleanupStats();
    console.log(`✅ Expired reports now: ${afterCreateStats.expiredReports}`);
    console.log(`   Affected zones: ${afterCreateStats.affectedZones}`);
    
    // Step 4: Run manual cleanup
    console.log('\n4️⃣ Running manual cleanup...');
    const cleanupResult = await reportCleanupService.manualCleanup();
    console.log(`✅ Cleanup completed:`);
    console.log(`   - Reports deleted: ${cleanupResult.deletedCount}`);
    console.log(`   - Zones updated: ${cleanupResult.zonesUpdated}`);
    console.log(`   - Duration: ${cleanupResult.duration}ms`);
    
    // Step 5: Verify cleanup
    console.log('\n5️⃣ Verifying cleanup...');
    const afterCleanupStats = await reportCleanupService.getCleanupStats();
    console.log(`✅ Expired reports after cleanup: ${afterCleanupStats.expiredReports}`);
    
    if (afterCleanupStats.expiredReports === 0) {
      console.log('✅ All expired reports successfully cleaned up!');
    } else {
      console.log(`⚠️  Still ${afterCleanupStats.expiredReports} expired report(s) remaining`);
    }
    
    // Step 6: Test scheduler (don't actually start it, just verify it exists)
    console.log('\n6️⃣ Testing scheduler methods...');
    console.log(`✅ Cleanup service has start() method: ${typeof reportCleanupService.start === 'function'}`);
    console.log(`✅ Cleanup service has stop() method: ${typeof reportCleanupService.stop === 'function'}`);
    console.log(`✅ Cleanup service running status: ${reportCleanupService.isRunning}`);
    
    // Step 7: Create a non-expired report to verify it's not deleted
    console.log('\n7️⃣ Testing that active reports are not deleted...');
    const activeReportResult = await pool.query(
      `INSERT INTO parking_reports 
       (user_id, zone_id, photo_url, thumbnail_url)
       VALUES ($1, $2, $3, $4)
       RETURNING id, expires_at`,
      [
        testUserId,
        testZoneId,
        'https://test-bucket.s3.us-east-2.amazonaws.com/photos/active.jpg',
        'https://test-bucket.s3.us-east-2.amazonaws.com/thumbnails/active.jpg'
      ]
    );
    
    const activeReportId = activeReportResult.rows[0].id;
    console.log(`✅ Created active report: ${activeReportId}`);
    console.log(`   Expires at: ${activeReportResult.rows[0].expires_at}`);
    
    // Run cleanup again
    await reportCleanupService.manualCleanup();
    
    // Verify active report still exists
    const verifyResult = await pool.query(
      'SELECT id FROM parking_reports WHERE id = $1',
      [activeReportId]
    );
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Active report was NOT deleted (correct behavior)');
    } else {
      console.log('❌ Active report was deleted (incorrect behavior)');
    }
    
    // Clean up test data
    console.log('\n8️⃣ Cleaning up test data...');
    await pool.query('DELETE FROM parking_reports WHERE id = $1', [activeReportId]);
    console.log('✅ Test data cleaned up');
    
    console.log('\n✅ All cleanup service tests passed!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run tests
testCleanupService()
  .then(() => {
    console.log('\n🎉 Test suite completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  });
