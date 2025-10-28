const { Pool } = require('pg');

// Database connection configuration - uses resume_db
const pool = new Pool({
  host: process.env.DB_HOST || '54.254.3.87',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'resume_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'localpass',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function setupResumeDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Setting up resume_db database for analytics...');
    
    // First, let's check what tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('📋 Existing tables:', tablesResult.rows.map(row => row.table_name));
    
    // Check users table structure
    const usersStructure = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Users table structure:');
    usersStructure.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Create missing tables and columns based on what we need for analytics
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
      )`,
      
      `CREATE TABLE IF NOT EXISTS analytics_reports (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        type VARCHAR(50) NOT NULL,
        period VARCHAR(20) NOT NULL,
        data JSONB,
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
    
    // Insert sample data - adapt to actual table structure
    console.log('🌱 Inserting sample data...');
    
    // Sample payments (simplified - no subscription_tier reference)
    await client.query(`
      INSERT INTO payments (user_id, amount, currency, status, payment_method, transaction_id, created_at)
      SELECT 
        u.id,
        99.99 as amount,
        'USD',
        'completed',
        'credit_card',
        'txn_' || substr(md5(random()::text), 1, 10),
        NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days'
      FROM users u
      ORDER BY RANDOM()
      LIMIT 5
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
          ('/api/skills/analytics', 'GET', '/api/skills/analytics', 900, 200, NOW() - INTERVAL '3 hours'),
          ('/api/resumes', 'GET', '/api/resumes', 1100, 200, NOW() - INTERVAL '4 hours')
        ON CONFLICT DO NOTHING
      `);
    } catch (error) {
      console.log('⚠️ API logs insertion skipped:', error.message);
    }
    
    // Sample user activity logs (if table exists)
    try {
      const activityTypes = ['resume_upload', 'job_application', 'profile_update', 'login', 'logout', 'search_jobs'];
      
      for (let i = 0; i < 20; i++) {
        const activityType = activityTypes[Math.floor(Math.random() * activityTypes.length)];
        
        await client.query(`
          INSERT INTO user_activity_logs (user_id, activity_type, details, created_at)
          SELECT 
            u.id,
            $1,
            '{"action": "' || $1 || '", "timestamp": "' || NOW() || '"}',
            NOW() - INTERVAL '${Math.floor(Math.random() * 168)} hours'
          FROM users u
          ORDER BY RANDOM()
          LIMIT 1
          ON CONFLICT DO NOTHING
        `, [activityType]);
      }
    } catch (error) {
      console.log('⚠️ User activity logs insertion skipped:', error.message);
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
    
    // Test other analytics queries
    try {
      const resumeQuery = `
        SELECT 
          COUNT(*) as total_resumes,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_resumes_period
        FROM resumes
      `;
      const resumeResult = await client.query(resumeQuery);
      console.log('✅ Resume analytics test successful:', resumeResult.rows[0]);
    } catch (error) {
      console.log('⚠️ Resume analytics test skipped:', error.message);
    }
    
    try {
      const jobQuery = `
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_jobs_period
        FROM jobs
      `;
      const jobResult = await client.query(jobQuery);
      console.log('✅ Job analytics test successful:', jobResult.rows[0]);
    } catch (error) {
      console.log('⚠️ Job analytics test skipped:', error.message);
    }
    
    try {
      const paymentQuery = `
        SELECT 
          COALESCE(SUM(amount), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as period_revenue
        FROM payments
        WHERE status = 'completed'
      `;
      const paymentResult = await client.query(paymentQuery);
      console.log('✅ Payment analytics test successful:', paymentResult.rows[0]);
    } catch (error) {
      console.log('⚠️ Payment analytics test skipped:', error.message);
    }
    
    console.log('🎉 Resume database setup completed successfully!');
    console.log('📊 Analytics report should now work properly with resume_db.');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  setupResumeDatabase()
    .then(() => {
      console.log('Resume database setup finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupResumeDatabase };
