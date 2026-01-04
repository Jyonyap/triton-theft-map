import pool from '../config/database.js';

async function makeAdmin() {
  const client = await pool.connect();
  
  try {
    // Check current user
    const checkResult = await client.query(
      'SELECT id, email, name, role FROM users WHERE email = $1',
      ['demo@ucsd.edu']
    );
    
    if (checkResult.rows.length === 0) {
      console.log('❌ User demo@ucsd.edu not found');
      return;
    }
    
    const user = checkResult.rows[0];
    console.log('Current user:', user);
    
    if (user.role === 'admin') {
      console.log('✅ User is already an admin!');
      return;
    }
    
    // Update to admin
    const updateResult = await client.query(
      'UPDATE users SET role = $1 WHERE email = $2 RETURNING id, email, name, role',
      ['admin', 'demo@ucsd.edu']
    );
    
    console.log('✅ User updated to admin:', updateResult.rows[0]);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

makeAdmin();
