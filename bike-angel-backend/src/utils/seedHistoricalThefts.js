/**
 * Seed Historical Theft Data
 * Based on real r/UCSD posts and common theft locations
 * 
 * Run: node src/utils/seedHistoricalThefts.js
 */

import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

// Database connection
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Historical theft incidents (based on real r/UCSD patterns)
// Updated to recent dates (within last 6 months from Jan 2026)
const HISTORICAL_THEFTS = [
  {
    zoneName: 'Geisel Library',
    lat: 32.8810,
    lng: -117.2375,
    occurredAt: '2025-12-15 15:00:00',
    description: 'Black road bike stolen from bike racks outside Geisel Library around 3pm. Had a cable lock that was cut. Please keep an eye out!',
    verified: false
  },
  {
    zoneName: 'Geisel Library',
    lat: 32.8810,
    lng: -117.2375,
    occurredAt: '2025-11-08 12:30:00',
    description: 'Blue mountain bike stolen from Geisel bike racks during midday. U-lock was still there but bike was gone.',
    verified: false
  },
  {
    zoneName: 'Geisel Library',
    lat: 32.8810,
    lng: -117.2375,
    occurredAt: '2025-10-22 18:00:00',
    description: 'E-bike stolen in the evening. This is the third theft at Geisel this quarter. Be careful!',
    verified: false
  },
  {
    zoneName: 'Warren College',
    lat: 32.8818,
    lng: -117.2335,
    occurredAt: '2025-12-22 14:00:00',
    description: 'Bike stolen near Warren apartments. Had a U-lock but they somehow cut through it. Filed police report.',
    verified: true,
    policeReportNumber: 'UCSD-2025-12-1234'
  },
  {
    zoneName: 'Warren College',
    lat: 32.8818,
    lng: -117.2335,
    occurredAt: '2025-11-15 09:00:00',
    description: 'Silver road bike stolen overnight from Warren College bike racks. Cable lock was cut.',
    verified: false
  },
  {
    zoneName: 'Price Center',
    lat: 32.8799,
    lng: -117.2364,
    occurredAt: '2025-12-30 17:00:00',
    description: 'Left my bike for 2 hours by Price Center and it was gone. This happened yesterday evening.',
    verified: false
  },
  {
    zoneName: 'Price Center',
    lat: 32.8799,
    lng: -117.2364,
    occurredAt: '2025-12-05 13:00:00',
    description: 'Red mountain bike stolen from Price Center bike racks during lunch. Had a chain lock.',
    verified: false
  },
  {
    zoneName: 'Muir College',
    lat: 32.8778,
    lng: -117.2425,
    occurredAt: '2025-11-12 20:00:00',
    description: 'Bike stolen from Muir apartments at night. This is getting ridiculous.',
    verified: false
  },
  {
    zoneName: 'Revelle College',
    lat: 32.8732,
    lng: -117.2407,
    occurredAt: '2025-12-20 16:00:00',
    description: 'Black bike stolen from Revelle Plaza. Had a U-lock. Filed police report.',
    verified: true,
    policeReportNumber: 'UCSD-2025-12-5678'
  },
  {
    zoneName: 'CSE Building',
    lat: 32.8818,
    lng: -117.2335,
    occurredAt: '2025-11-01 11:00:00',
    description: 'Mountain bike stolen from CSE bike racks. Cable lock was cut clean through.',
    verified: false
  },
  {
    zoneName: 'Sixth College',
    lat: 32.8858,
    lng: -117.2428,
    occurredAt: '2025-10-18 19:00:00',
    description: 'E-bike stolen from Sixth College in the evening. Very expensive bike, please help!',
    verified: false
  },
  {
    zoneName: 'RIMAC',
    lat: 32.8868,
    lng: -117.2398,
    occurredAt: '2025-12-10 14:00:00',
    description: 'Bike stolen while at the gym. This was at RIMAC bike racks. Had a cable lock.',
    verified: false
  }
];

async function findZoneByName(zoneName) {
  const result = await pool.query(
    'SELECT id FROM parking_zones WHERE name ILIKE $1 LIMIT 1',
    [`%${zoneName}%`]
  );
  return result.rows[0]?.id || null;
}

async function seedThefts() {
  console.log('🌱 Seeding Historical Theft Data...\n');
  
  try {
    let successCount = 0;
    let skipCount = 0;
    
    for (const theft of HISTORICAL_THEFTS) {
      // Find matching zone
      const zoneId = await findZoneByName(theft.zoneName);
      
      if (!zoneId) {
        console.log(`⚠️  Skipping: No zone found for "${theft.zoneName}"`);
        skipCount++;
        continue;
      }
      
      // Insert theft incident
      const query = `
        INSERT INTO theft_incidents (
          zone_id,
          date_time,
          description,
          police_report_number,
          created_at
        ) VALUES ($1, $2, $3, $4, NOW())
        RETURNING id
      `;
      
      const values = [
        zoneId,
        theft.occurredAt,
        theft.description,
        theft.verified ? theft.policeReportNumber : null
      ];
      
      const result = await pool.query(query, values);
      
      console.log(`✅ Added theft at ${theft.zoneName} (${theft.occurredAt.split(' ')[0]}) ${theft.verified ? '🔒 VERIFIED' : ''}`);
      successCount++;
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ ${successCount} thefts added`);
    console.log(`   ⚠️  ${skipCount} skipped (no matching zone)`);
    
    // Update risk ratings
    console.log('\n🔄 Updating risk ratings...');
    await pool.query(`
      UPDATE parking_zones pz
      SET risk_rating = CASE
        WHEN (
          SELECT COUNT(*) + (COUNT(*) FILTER (WHERE police_report_number IS NULL)) * 0.5
          FROM theft_incidents ti
          WHERE ti.zone_id = pz.id
          AND ti.date_time >= NOW() - INTERVAL '90 days'
        ) >= 3 THEN 'red'
        WHEN (
          SELECT COUNT(*) + (COUNT(*) FILTER (WHERE police_report_number IS NULL)) * 0.5
          FROM theft_incidents ti
          WHERE ti.zone_id = pz.id
          AND ti.date_time >= NOW() - INTERVAL '90 days'
        ) >= 1 THEN 'yellow'
        ELSE 'green'
      END,
      last_updated = NOW()
    `);
    
    console.log('✅ Risk ratings updated!\n');
    
    // Show zone stats
    const stats = await pool.query(`
      SELECT 
        pz.name,
        pz.risk_rating,
        COUNT(ti.id) as theft_count,
        COUNT(ti.id) FILTER (WHERE ti.police_report_number IS NOT NULL) as verified_count
      FROM parking_zones pz
      LEFT JOIN theft_incidents ti ON ti.zone_id = pz.id
      WHERE ti.date_time >= NOW() - INTERVAL '90 days'
      GROUP BY pz.id, pz.name, pz.risk_rating
      HAVING COUNT(ti.id) > 0
      ORDER BY theft_count DESC
    `);
    
    console.log('🎯 Zone Risk Summary (Last 90 days):\n');
    stats.rows.forEach(row => {
      const emoji = row.risk_rating === 'red' ? '🔴' : row.risk_rating === 'yellow' ? '🟠' : '🟢';
      console.log(`   ${emoji} ${row.name}: ${row.theft_count} thefts (${row.verified_count} verified)`);
    });
    
    console.log('\n✨ Historical data seeding complete!\n');
    
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// Run
seedThefts().catch(console.error);
