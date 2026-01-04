import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Database connection pool
// Use connection pooler to avoid Render IPv6 issues
const pool = new Pool({
  host: process.env.DB_HOST || 'aws-0-us-east-2.pooler.supabase.com',
  port: parseInt(process.env.DB_PORT) || 6543,
  database: process.env.DB_NAME || 'postgres',
  user: process.env.DB_USER || 'postgres.ujfwjpxdjfqtjeexllsr',
  password: process.env.DB_PASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
  options: '-c search_path=public',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000
});

// Log connection method
console.log('📊 Using Supabase connection pooler (IPv4)');
console.log(`   Host: ${process.env.DB_HOST || 'aws-0-us-east-2.pooler.supabase.com'}`);
console.log(`   Port: ${process.env.DB_PORT || 6543}`);
console.log(`   Database: ${process.env.DB_NAME || 'postgres'}`);
console.log('   Note: Connection pooler avoids Render IPv6 issues');

// Test database connection
pool.on('connect', () => {
  console.log('✅ Database connected successfully');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
  console.error('Error details:', err.message);
});

/**
 * Execute a query
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise} - Query result
 */
export const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Executed query', { text, duration, rows: res.rowCount });
  return res;
};

/**
 * Get a client from the pool
 * @returns {Promise} - Database client
 */
export const getClient = async () => {
  const client = await pool.connect();
  return client;
};

export default pool;
