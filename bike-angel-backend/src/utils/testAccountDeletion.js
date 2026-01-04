// Test account deletion and data anonymization
import pool from '../config/database.js';
import bcrypt from 'bcrypt';

const API_URL = 'http://localhost:3000';

async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(JSON.stringify(data));
    }
    
    return data;
  } catch (error) {
    throw error;
  }
}

async function createTestUserWithData() {
  console.log('\n📝 Creating test user with parking reports and theft incidents...');
  
  const testUser = {
    email: 'deletiontest@ucsd.edu',
    password: 'TestPass123',
    name: 'Deletion Test User'
  };

  try {
    // Hash password
    const passwordHash = await bcrypt.hash(testUser.password, 10);

    // Create user
    const userResult = await pool.query(
      `INSERT INTO users (email, password_hash, name, email_verified)
       VALUES ($1, $2, $3, TRUE)
       RETURNING id`,
      [testUser.email, passwordHash, testUser.name]
    );

    const userId = userResult.rows[0].id;
    console.log(`✅ Test user created with ID: ${userId}`);

    // Get a zone to use for reports
    const zoneResult = await pool.query('SELECT id FROM parking_zones LIMIT 1');
    const zoneId = zoneResult.rows[0].id;

    // Create a parking report
    const reportResult = await pool.query(
      `INSERT INTO parking_reports (user_id, zone_id, photo_url, thumbnail_url, expires_at)
       VALUES ($1, $2, $3, $4, NOW() + INTERVAL '12 hours')
       RETURNING id`,
      [userId, zoneId, 'https://example.com/photo.jpg', 'https://example.com/thumb.jpg']
    );
    const reportId = reportResult.rows[0].id;
    console.log(`✅ Parking report created with ID: ${reportId}`);

    // Create a theft incident
    const incidentResult = await pool.query(
      `INSERT INTO theft_incidents (user_id, zone_id, date_time, description, police_report_number)
       VALUES ($1, $2, NOW(), $3, $4)
       RETURNING id`,
      [userId, zoneId, 'Test theft incident', 'PD-12345']
    );
    const incidentId = incidentResult.rows[0].id;
    console.log(`✅ Theft incident created with ID: ${incidentId}`);

    return { userId, reportId, incidentId, testUser };
  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  }
}

async function testAccountDeletion() {
  console.log('\n🚀 Testing Account Deletion and Data Anonymization');
  console.log('='.repeat(50));

  try {
    // Create test user with data
    const { userId, reportId, incidentId, testUser } = await createTestUserWithData();

    // Login
    console.log('\n🔐 Logging in...');
    const loginData = await makeRequest(`${API_URL}/api/auth/login`, {
      method: 'POST',
      body: JSON.stringify({
        email: testUser.email,
        password: testUser.password
      })
    });
    const authToken = loginData.token;
    console.log('✅ Logged in successfully');

    // Verify data exists before deletion
    console.log('\n🔍 Verifying data exists before deletion...');
    
    const userCheck = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    console.log(`✅ User exists: ${userCheck.rows.length > 0}`);
    
    const reportCheck = await pool.query('SELECT * FROM parking_reports WHERE id = $1', [reportId]);
    console.log(`✅ Parking report exists: ${reportCheck.rows.length > 0}`);
    console.log(`   Report user_id: ${reportCheck.rows[0]?.user_id}`);
    
    const incidentCheck = await pool.query('SELECT * FROM theft_incidents WHERE id = $1', [incidentId]);
    console.log(`✅ Theft incident exists: ${incidentCheck.rows.length > 0}`);
    console.log(`   Incident user_id: ${incidentCheck.rows[0]?.user_id}`);

    // Delete account
    console.log('\n🗑️ Deleting account...');
    await makeRequest(`${API_URL}/api/users/account`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Account deleted successfully');

    // Verify user is deleted
    console.log('\n🔍 Verifying data after deletion...');
    
    const userCheckAfter = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
    console.log(`✅ User deleted: ${userCheckAfter.rows.length === 0}`);
    
    // Verify parking report is anonymized (user_id should be NULL)
    const reportCheckAfter = await pool.query('SELECT * FROM parking_reports WHERE id = $1', [reportId]);
    if (reportCheckAfter.rows.length > 0) {
      const isAnonymized = reportCheckAfter.rows[0].user_id === null;
      console.log(`✅ Parking report preserved: true`);
      console.log(`✅ Parking report anonymized (user_id is NULL): ${isAnonymized}`);
      
      if (!isAnonymized) {
        console.log(`❌ ERROR: Parking report user_id should be NULL but is: ${reportCheckAfter.rows[0].user_id}`);
        return false;
      }
    } else {
      console.log(`❌ ERROR: Parking report was deleted instead of anonymized`);
      return false;
    }
    
    // Verify theft incident is anonymized (user_id should be NULL)
    const incidentCheckAfter = await pool.query('SELECT * FROM theft_incidents WHERE id = $1', [incidentId]);
    if (incidentCheckAfter.rows.length > 0) {
      const isAnonymized = incidentCheckAfter.rows[0].user_id === null;
      console.log(`✅ Theft incident preserved: true`);
      console.log(`✅ Theft incident anonymized (user_id is NULL): ${isAnonymized}`);
      
      if (!isAnonymized) {
        console.log(`❌ ERROR: Theft incident user_id should be NULL but is: ${incidentCheckAfter.rows[0].user_id}`);
        return false;
      }
    } else {
      console.log(`❌ ERROR: Theft incident was deleted instead of anonymized`);
      return false;
    }

    console.log('\n' + '='.repeat(50));
    console.log('✅ All account deletion tests passed!');
    console.log('='.repeat(50));
    console.log('\nVerified:');
    console.log('  ✓ User account deleted');
    console.log('  ✓ Parking reports preserved and anonymized');
    console.log('  ✓ Theft incidents preserved and anonymized');
    console.log('  ✓ Safety data maintained for community');
    
    return true;
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    return false;
  }
}

async function main() {
  const success = await testAccountDeletion();
  process.exit(success ? 0 : 1);
}

main();
