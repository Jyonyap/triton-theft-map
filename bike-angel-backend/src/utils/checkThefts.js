import pool from '../config/database.js';

async function checkThefts() {
  const result = await pool.query(`
    SELECT 
      ti.id,
      pz.name as zone_name,
      ti.date_time,
      ti.description,
      ti.police_report_number
    FROM theft_incidents ti
    JOIN parking_zones pz ON pz.id = ti.zone_id
    ORDER BY ti.date_time DESC
    LIMIT 20
  `);
  
  console.log(`\n📊 Found ${result.rows.length} theft incidents:\n`);
  result.rows.forEach(row => {
    const verified = row.police_report_number ? '🔒 VERIFIED' : '';
    console.log(`- ${row.zone_name} (${row.date_time.toISOString().split('T')[0]}) ${verified}`);
    console.log(`  ${row.description.substring(0, 80)}...`);
  });
  
  await pool.end();
}

checkThefts();
