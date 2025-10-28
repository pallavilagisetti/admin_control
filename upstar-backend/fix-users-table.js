const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || '54.254.3.87',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'resume_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'localpass',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixUsersTable() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking users table structure...');
    
    // Check the structure of users table
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 users table structure:');
    structureResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Check if last_login_at column exists
    const hasLastLoginAt = structureResult.rows.some(row => row.column_name === 'last_login_at');
    
    if (!hasLastLoginAt) {
      console.log('🔧 Adding last_login_at column to users table...');
      await client.query(`
        ALTER TABLE users 
        ADD COLUMN last_login_at TIMESTAMP DEFAULT NOW()
      `);
      console.log('✅ last_login_at column added successfully');
    } else {
      console.log('✅ last_login_at column already exists');
    }
    
    // Update some users with recent login times for testing
    console.log('🌱 Updating user login times...');
    await client.query(`
      UPDATE users 
      SET last_login_at = NOW() - INTERVAL '${Math.floor(Math.random() * 7)} days'
      WHERE id IN (
        SELECT id FROM users ORDER BY RANDOM() LIMIT 3
      )
    `);
    
    console.log('✅ User login times updated');
    
    // Test the analytics query again
    console.log('🧪 Testing analytics query with last_login_at...');
    
    const userStatsResult = await client.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_period,
        COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '30 days' THEN 1 END) as active_users_30d
      FROM users
    `);
    
    console.log('✅ User stats query successful:', userStatsResult.rows[0]);
    
    console.log('🎉 Users table fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Users table fix failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  fixUsersTable()
    .then(() => {
      console.log('Users table fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Users table fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixUsersTable };
