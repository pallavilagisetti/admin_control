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

async function createUserActivityLogs() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Creating user_activity_logs table...');
    
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_activity_logs (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        activity_type VARCHAR(50) NOT NULL,
        details JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `);
    
    console.log('✅ user_activity_logs table created');
    
    // Insert sample data
    console.log('🌱 Inserting sample data...');
    const activityTypes = ['resume_upload', 'job_application', 'profile_update', 'login', 'logout', 'search_jobs'];
    
    for (let i = 0; i < 20; i++) {
      const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
      const details = JSON.stringify({
        action: activityType,
        timestamp: new Date().toISOString()
      });
      
      await client.query(`
        INSERT INTO user_activity_logs (user_id, activity_type, details, created_at)
        SELECT 
          u.id,
          $1,
          $2,
          NOW() - INTERVAL '${Math.floor(Math.random() * 168)} hours'
        FROM users u
        ORDER BY RANDOM()
        LIMIT 1
        ON CONFLICT DO NOTHING
      `, [activityType, details]);
    }
    
    console.log('✅ Sample data inserted successfully');
    
    // Test the table
    const testResult = await client.query(`
      SELECT COUNT(*) as count FROM user_activity_logs
    `);
    
    console.log('✅ Test successful - records in user_activity_logs:', testResult.rows[0].count);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createUserActivityLogs()
    .then(() => {
      console.log('User activity logs setup completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createUserActivityLogs };
