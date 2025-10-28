const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'resume_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createMissingTables() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking and creating missing tables...');
    
    // Check what tables exist
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    const existingTables = tablesResult.rows.map(row => row.table_name);
    console.log('📋 Existing tables:', existingTables);
    
    // Create missing tables
    const tablesToCreate = [
      {
        name: 'payments',
        sql: `
          CREATE TABLE IF NOT EXISTS payments (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            amount DECIMAL(10,2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'USD',
            status VARCHAR(20) DEFAULT 'pending',
            payment_method VARCHAR(50),
            transaction_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'subscriptions',
        sql: `
          CREATE TABLE IF NOT EXISTS subscriptions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            plan_name VARCHAR(50) NOT NULL,
            status VARCHAR(20) DEFAULT 'active',
            amount DECIMAL(10,2),
            next_billing_date DATE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'transactions',
        sql: `
          CREATE TABLE IF NOT EXISTS transactions (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id) ON DELETE CASCADE,
            amount DECIMAL(10,2) NOT NULL,
            status VARCHAR(20) DEFAULT 'pending',
            type VARCHAR(20) NOT NULL,
            payment_method VARCHAR(50),
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'api_logs',
        sql: `
          CREATE TABLE IF NOT EXISTS api_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            endpoint VARCHAR(255),
            method VARCHAR(10),
            response_time INTEGER,
            status_code INTEGER,
            user_id UUID REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'user_activity_logs',
        sql: `
          CREATE TABLE IF NOT EXISTS user_activity_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id),
            activity_type VARCHAR(50) NOT NULL,
            details JSONB,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'user_engagement_metrics',
        sql: `
          CREATE TABLE IF NOT EXISTS user_engagement_metrics (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            user_id UUID REFERENCES users(id),
            session_duration_minutes INTEGER,
            retention_rate DECIMAL(5,2),
            engagement_score DECIMAL(5,2),
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'job_performance_metrics',
        sql: `
          CREATE TABLE IF NOT EXISTS job_performance_metrics (
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
          )
        `
      },
      {
        name: 'conversion_metrics',
        sql: `
          CREATE TABLE IF NOT EXISTS conversion_metrics (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            conversion_rate DECIMAL(5,2),
            conversion_rate_change DECIMAL(5,2),
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'churn_metrics',
        sql: `
          CREATE TABLE IF NOT EXISTS churn_metrics (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            churn_rate DECIMAL(5,2),
            churn_rate_change DECIMAL(5,2),
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
      },
      {
        name: 'analytics_reports',
        sql: `
          CREATE TABLE IF NOT EXISTS analytics_reports (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            type VARCHAR(50) NOT NULL,
            period VARCHAR(20) NOT NULL,
            data JSONB,
            created_at TIMESTAMP DEFAULT NOW()
          )
        `
      }
    ];
    
    // Create tables that don't exist
    for (const table of tablesToCreate) {
      if (!existingTables.includes(table.name)) {
        console.log(`🔧 Creating table: ${table.name}`);
        await client.query(table.sql);
        console.log(`✅ Table ${table.name} created successfully`);
      } else {
        console.log(`✅ Table ${table.name} already exists`);
      }
    }
    
    // Create indexes for performance
    console.log('🔧 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status)',
      'CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status)',
      'CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type)',
      'CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_logs(created_at)',
      'CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_logs(endpoint)',
      'CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_user_activity_logs_type ON user_activity_logs(activity_type)',
      'CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at)'
    ];
    
    for (const index of indexes) {
      await client.query(index);
    }
    console.log('✅ Indexes created successfully');
    
    // Insert sample data for testing
    console.log('🌱 Inserting sample data...');
    
    // Insert sample payments
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
    
    // Insert sample API logs
    const endpoints = ['/api/users', '/api/resumes', '/api/jobs', '/api/analytics', '/api/dashboard'];
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const statusCodes = [200, 201, 400, 401, 403, 404, 500];
    
    for (let i = 0; i < 100; i++) {
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const method = methods[Math.floor(Math.random() * methods.length)];
      const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];
      const responseTime = Math.floor(Math.random() * 2000) + 100;
      
      await client.query(`
        INSERT INTO api_logs (endpoint, method, response_time, status_code, created_at)
        VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${Math.floor(Math.random() * 168)} hours')
        ON CONFLICT DO NOTHING
      `, [endpoint, method, responseTime, statusCode]);
    }
    
    // Insert sample user activity logs
    const activityTypes = ['resume_upload', 'job_application', 'profile_update', 'login', 'logout', 'search_jobs'];
    
    for (let i = 0; i < 200; i++) {
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
    
    // Insert sample analytics reports
    await client.query(`
      INSERT INTO analytics_reports (type, period, data, created_at)
      VALUES 
        ('comprehensive', '30d', '{"generated_at": "' || NOW() || '", "period": "30d", "status": "completed"}', NOW()),
        ('user_analytics', '7d', '{"generated_at": "' || NOW() || '", "period": "7d", "status": "completed"}', NOW() - INTERVAL '1 day'),
        ('revenue_analytics', '90d', '{"generated_at": "' || NOW() || '", "period": "90d", "status": "completed"}', NOW() - INTERVAL '2 days')
      ON CONFLICT DO NOTHING
    `);
    
    console.log('✅ Sample data inserted successfully');
    console.log('🎉 Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  createMissingTables()
    .then(() => {
      console.log('Database setup completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createMissingTables };
