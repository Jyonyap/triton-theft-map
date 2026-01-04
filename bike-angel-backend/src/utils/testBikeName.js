import dotenv from 'dotenv';
import pool from '../config/database.js';

dotenv.config();

async function testBikeName() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Testing Bike Name Feature...\n');

    // Find a test user
    const userResult = await client.query(
      'SELECT id, email, name, bike_name FROM users WHERE email = $1',
      ['demo@ucsd.edu']
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Test user not found');
      return;
    }

    const user = userResult.rows[0];
    console.log('📧 User:', user.email);
    console.log('👤 Name:', user.name);
    console.log('🚲 Current Bike Name:', user.bike_name || '(not set)');
    console.log('');

    // Update bike name
    const newBikeName = 'BatmanComing';
    console.log(`🔄 Setting bike name to: "${newBikeName}"`);
    
    const updateResult = await client.query(
      `UPDATE users 
       SET bike_name = $1 
       WHERE id = $2 
       RETURNING id, email, name, bike_name`,
      [newBikeName, user.id]
    );

    const updatedUser = updateResult.rows[0];
    console.log('✅ Bike name updated!');
    console.log('🚲 New Bike Name:', updatedUser.bike_name);
    console.log('');

    // Test clearing bike name
    console.log('🔄 Clearing bike name...');
    const clearResult = await client.query(
      `UPDATE users 
       SET bike_name = NULL 
       WHERE id = $1 
       RETURNING id, email, name, bike_name`,
      [user.id]
    );

    console.log('✅ Bike name cleared!');
    console.log('🚲 Bike Name:', clearResult.rows[0].bike_name || '(not set)');
    console.log('');

    // Set it back to BatmanComing
    await client.query(
      `UPDATE users 
       SET bike_name = $1 
       WHERE id = $2`,
      [newBikeName, user.id]
    );

    console.log(`✅ Bike name set back to: "${newBikeName}"`);
    console.log('');
    console.log('🎉 Bike Name Feature Test Complete!');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testBikeName();
