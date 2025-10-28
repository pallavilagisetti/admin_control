const { Pool } = require('pg');

// Database connection configuration - uses environment variables
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'resume_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupCompleteDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Setting up complete database for analytics...');
    
    // Create all missing tables and columns
    const setupQueries = [
      // Add last_login_at column if it doesn't exist
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP DEFAULT NOW()`,
      
      // Create payments table if it doesn't exist
      `CREATE TABLE IF NOT EXISTS payments (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        currency VARCHAR(3) DEFAULT 'USD',
        status VARCHAR(20) DEFAULT 'pending',
        payment_method VARCHAR(50),
        transaction_id VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )`,
      
      // Create other missing tables
      `CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(20) DEFAULT 'pending',
        type VARCHAR(20) NOT NULL,
        payment_method VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS user_engagement_metrics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID REFERENCES users(id),
        session_duration_minutes INTEGER,
        retention_rate DECIMAL(5,2),
        engagement_score DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS job_performance_metrics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        click_through_rate DECIMAL(5,2),
        application_rate DECIMAL(5,2),
        interview_success_rate DECIMAL(5,2),
        match_accuracy DECIMAL(5,2),
        click_through_rate_change DECIMAL(5,2),
        application_rate_change DECIMAL(5,2),
        interview_success_rate_change DECIMAL(5,2),
        match_accuracy_change DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS conversion_metrics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        conversion_rate DECIMAL(5,2),
        conversion_rate_change DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT NOW()
      )`,
      
      `CREATE TABLE IF NOT EXISTS churn_metrics (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        churn_rate DECIMAL(5,2),
        churn_rate_change DECIMAL(5,2),
        created_at TIMESTAMP DEFAULT NOW()
      )`
    ];
    
    for (const query of setupQueries) {
      try {
        await client.query(query);
        console.log('✅ Query executed successfully');
      } catch (error) {
        console.log('⚠️ Query skipped (table/column may already exist):', error.message);
      }
    }
    
    // Insert sample data
    console.log('🌱 Inserting sample data...');
    
    // Sample payments
    await client.query(`
      INSERT INTO payments (user_id, amount, currency, status, payment_method, transaction_id, created_at)
      SELECT 
        u.id,
        CASE 
          WHEN u.subscription_tier = 'enterprise' THEN 299.99
          WHEN u.subscription_tier = 'pro' THEN 99.99
          ELSE 0
        END as amount,
        'USD',
        'completed',
        'credit_card',
        'txn_' || substr(md5(random()::text), 1, 10),
        NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days'
      FROM users u
      WHERE u.subscription_tier IN ('pro', 'enterprise')
      ON CONFLICT DO NOTHING
    `);
    
    // Update user login times
    await client.query(`
      UPDATE users 
      SET last_login_at = NOW() - INTERVAL '${Math.floor(Math.random() * 7)} days'
      WHERE last_login_at IS NULL OR last_login_at < NOW() - INTERVAL '30 days'
    `);
    
    // Sample API logs (if table exists)
    try {
      await client.query(`
        INSERT INTO api_logs (endpoint, method, url, response_time, status_code, created_at)
        VALUES 
          ('/api/dashboard/analytics-report', 'GET', '/api/dashboard/analytics-report', 1200, 200, NOW()),
          ('/api/users', 'GET', '/api/users', 800, 200, NOW() - INTERVAL '1 hour'),
          ('/api/jobs', 'GET', '/api/jobs', 1500, 200, NOW() - INTERVAL '2 hours'),
          ('/api/skills/analytics', 'GET', '/api/skills/analytics', 900, 200, NOW() - INTERVAL '3 hours')
        ON CONFLICT DO NOTHING
      `);
    } catch (error) {
      console.log('⚠️ API logs insertion skipped:', error.message);
    }
    
    console.log('✅ Sample data inserted successfully');
    
    // Test analytics report query
    console.log('🧪 Testing analytics report generation...');
    
    const testQuery = `
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_period,
        COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '30 days' THEN 1 END) as active_users_30d
      FROM users
    `;
    
    const result = await client.query(testQuery);
    console.log('✅ Analytics test successful:', result.rows[0]);
    
    console.log('🎉 Database setup completed successfully!');
    console.log('📊 Analytics report should now work properly.');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  setupCompleteDatabase()
    .then(() => {
      console.log('Complete database setup finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupCompleteDatabase };
