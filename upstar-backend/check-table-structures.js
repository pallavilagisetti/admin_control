const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || '54.254.3.87',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'resume_db',
  user: process.env.DB_USER || 'developer',
  password: process.env.DB_PASSWORD || 'localpass',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkTableStructures() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking table structures...');
    
    // Check resumes table
    console.log('📋 Resumes table structure:');
    const resumes = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'resumes'
      ORDER BY ordinal_position
    `);
    resumes.rows.forEach(row => console.log(`  ${row.column_name}: ${row.data_type}`));
    
    // Check job_listings table
    console.log('\n📋 Job_listings table structure:');
    const jobs = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'job_listings'
      ORDER BY ordinal_position
    `);
    jobs.rows.forEach(row => console.log(`  ${row.column_name}: ${row.data_type}`));
    
    // Check users table
    console.log('\n📋 Users table structure:');
    const users = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    users.rows.forEach(row => console.log(`  ${row.column_name}: ${row.data_type}`));
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  checkTableStructures()
    .then(() => {
      console.log('Table structure check completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Check failed:', error);
      process.exit(1);
    });
}

module.exports = { checkTableStructures };
