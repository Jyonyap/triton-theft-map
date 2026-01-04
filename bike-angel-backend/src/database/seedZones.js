/**
 * Seed Parking Zones Script
 * 
 * This script populates the parking_zones table with official UCSD bike parking locations.
 * It can be run independently or as part of database initialization.
 * 
 * Usage:
 *   node src/database/seedZones.js
 */

import pool from '../config/database.js';
import { parkingZones, getTotalZones, getTotalCapacity } from './seeds/parkingZones.js';

/**
 * Seed parking zones into the database
 */
async function seedParkingZones() {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting parking zones seed...');
    console.log(`📍 Seeding ${getTotalZones()} parking zones`);
    console.log(`🚲 Total capacity: ${getTotalCapacity()} bikes`);
    console.log('');
    
    // Begin transaction
    await client.query('BEGIN');
    
    // Clear existing zones (optional - comment out if you want to preserve existing data)
    const deleteResult = await client.query('DELETE FROM parking_zones');
    if (deleteResult.rowCount > 0) {
      console.log(`🗑️  Cleared ${deleteResult.rowCount} existing zones`);
    }
    
    // Insert each parking zone
    let insertedCount = 0;
    let skippedCount = 0;
    
    for (const zone of parkingZones) {
      try {
        const result = await client.query(
          `INSERT INTO parking_zones (name, latitude, longitude, capacity)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT DO NOTHING
           RETURNING id, name`,
          [zone.name, zone.latitude, zone.longitude, zone.capacity]
        );
        
        if (result.rowCount > 0) {
          insertedCount++;
          console.log(`  ✓ ${zone.name} (capacity: ${zone.capacity})`);
        } else {
          skippedCount++;
          console.log(`  ⊘ ${zone.name} (already exists)`);
        }
      } catch (error) {
        console.error(`  ✗ Failed to insert ${zone.name}:`, error.message);
      }
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    console.log('');
    console.log('📊 Seed Summary:');
    console.log(`   ✅ Inserted: ${insertedCount} zones`);
    if (skippedCount > 0) {
      console.log(`   ⊘ Skipped: ${skippedCount} zones (already exist)`);
    }
    
    // Verify the data
    const countResult = await client.query('SELECT COUNT(*) FROM parking_zones');
    const totalZones = countResult.rows[0].count;
    console.log(`   📍 Total zones in database: ${totalZones}`);
    
    // Show capacity statistics
    const statsResult = await client.query(`
      SELECT 
        COUNT(*) as total_zones,
        SUM(capacity) as total_capacity,
        AVG(capacity)::INTEGER as avg_capacity,
        MIN(capacity) as min_capacity,
        MAX(capacity) as max_capacity
      FROM parking_zones
    `);
    
    const stats = statsResult.rows[0];
    console.log('');
    console.log('📈 Capacity Statistics:');
    console.log(`   Total Capacity: ${stats.total_capacity} bikes`);
    console.log(`   Average Capacity: ${stats.avg_capacity} bikes per zone`);
    console.log(`   Range: ${stats.min_capacity} - ${stats.max_capacity} bikes`);
    
    console.log('');
    console.log('✅ Parking zones seeded successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding parking zones:', error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * List all zones in the database
 */
async function listZones() {
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT 
        name,
        latitude,
        longitude,
        capacity,
        risk_rating,
        congestion_level
      FROM parking_zones
      ORDER BY name
    `);
    
    console.log('📍 Parking Zones in Database:');
    console.log('');
    
    result.rows.forEach((zone, index) => {
      console.log(`${index + 1}. ${zone.name}`);
      console.log(`   Location: ${zone.latitude}, ${zone.longitude}`);
      console.log(`   Capacity: ${zone.capacity} bikes`);
      console.log(`   Risk: ${zone.risk_rating} | Congestion: ${zone.congestion_level}`);
      console.log('');
    });
    
    console.log(`Total: ${result.rows.length} zones`);
    
  } catch (error) {
    console.error('❌ Error listing zones:', error);
    throw error;
  } finally {
    client.release();
  }
}

// CLI interface
const command = process.argv[2];

if (command === 'seed') {
  seedParkingZones()
    .then(() => {
      console.log('🎉 Seed complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed zones:', error);
      process.exit(1);
    });
} else if (command === 'list') {
  listZones()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to list zones:', error);
      process.exit(1);
    });
} else {
  console.log('Usage:');
  console.log('  node src/database/seedZones.js seed  - Seed parking zones');
  console.log('  node src/database/seedZones.js list  - List all zones');
  process.exit(1);
}

export { seedParkingZones, listZones };
