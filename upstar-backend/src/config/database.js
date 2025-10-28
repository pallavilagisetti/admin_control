const { Pool } = require('pg');

// PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'resume_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Redis removed - not needed for now

// Database connection function
const connectDB = async () => {
  try {
    // Test PostgreSQL connection
    const client = await pool.connect();
    console.log('✅ PostgreSQL connected successfully');
    client.release();
    
    return { pool };
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Database query helper
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
};

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

// Cache functions removed - Redis not needed

// Health check function
const healthCheck = async () => {
  try {
    // Check PostgreSQL
    const pgResult = await pool.query('SELECT 1 as status');
    const pgHealthy = pgResult.rows[0].status === 1;
    
    return {
      database: pgHealthy,
      overall: pgHealthy
    };
  } catch (error) {
    console.error('Health check failed:', error);
    return {
      database: false,
      overall: false,
      error: error.message
    };
  }
};

module.exports = {
  connectDB,
  query,
  transaction,
  healthCheck,
  pool
};