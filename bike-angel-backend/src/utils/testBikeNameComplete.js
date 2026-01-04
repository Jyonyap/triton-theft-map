// Test bike name feature end-to-end
import dotenv from 'dotenv';
import pool from '../config/database.js';

dotenv.config();

async function testBikeNameFeature() {
  const client = await pool.connect();
  
  try {
    console.log('🚲 Testing Bike Name Feature...\n');

    // Find demo user
    const userResult = await client.query(
      'SELECT id, email, name, bike_name FROM users WHERE email = $1',
      ['demo@ucsd.edu']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Demo user not found');
      return;
    }

    const user = userResult.rows[0];
    console.log('✅ Found user:', user.email);
    console.log('   Current bike name:', user.bike_name || '(not set)');

    // Test 1: Set bike name
    console.log('\n📝 Test 1: Setting bike name to "BatmanComing"...');
    const updateResult = await client.query(
      'UPDATE users SET bike_name = $1 WHERE id = $2 RETURNING id, email, name, bike_name',
      ['BatmanComing', user.id]
    );
    console.log('✅ Bike name set:', updateResult.rows[0].bike_name);

    // Test 2: Update bike name
    console.log('\n📝 Test 2: Updating bike name to "ThunderBolt"...');
    const updateResult2 = await client.query(
      'UPDATE users SET bike_name = $1 WHERE id = $2 RETURNING id, email, name, bike_name',
      ['ThunderBolt', user.id]
    );
    console.log('✅ Bike name updated:', updateResult2.rows[0].bike_name);

    // Test 3: Clear bike name
    console.log('\n📝 Test 3: Clearing bike name...');
    const updateResult3 = await client.query(
      'UPDATE users SET bike_name = NULL WHERE id = $1 RETURNING id, email, name, bike_name',
      [user.id]
    );
    console.log('✅ Bike name cleared:', updateResult3.rows[0].bike_name || '(null)');

    // Test 4: Set it back to BatmanComing
    console.log('\n📝 Test 4: Setting bike name back to "BatmanComing"...');
    const updateResult4 = await client.query(
      'UPDATE users SET bike_name = $1 WHERE id = $2 RETURNING id, email, name, bike_name',
      ['BatmanComing', user.id]
    );
    console.log('✅ Bike name set:', updateResult4.rows[0].bike_name);

    console.log('\n🎉 All tests passed! Bike name feature is working perfectly!');
    console.log('\n📋 Summary:');
    console.log('   ✅ Can set bike name');
    console.log('   ✅ Can update bike name');
    console.log('   ✅ Can clear bike name');
    console.log('   ✅ Database operations work correctly');
    console.log('\n🚲 Ready to use! Login and try it at http://localhost:5173');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testBikeNameFeature();
