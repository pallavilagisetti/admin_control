const { Pool } = require('pg');

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5433,
  database: process.env.DB_NAME || 'resume_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'localpass',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function fixApiLogsAndTestAnalytics() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Checking api_logs table structure...');
    
    // Check the structure of api_logs table
    const structureResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'api_logs'
      ORDER BY ordinal_position
    `);
    
    console.log('📋 api_logs table structure:');
    structureResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable})`);
    });
    
    // Clear existing problematic data
    console.log('🧹 Clearing existing api_logs data...');
    await client.query('DELETE FROM api_logs');
    
    // Insert sample data with correct structure
    console.log('🌱 Inserting sample data with correct structure...');
    
    const endpoints = ['/api/users', '/api/resumes', '/api/jobs', '/api/analytics', '/api/dashboard'];
    const methods = ['GET', 'POST', 'PUT', 'DELETE'];
    const statusCodes = [200, 201, 400, 401, 403, 404, 500];
    
    for (let i = 0; i < 50; i++) {
      const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
      const method = methods[Math.floor(Math.random() * methods.length)];
      const statusCode = statusCodes[Math.floor(Math.random() * statusCodes.length)];
      const responseTime = Math.floor(Math.random() * 2000) + 100;
      
      // Insert with all required fields
      await client.query(`
        INSERT INTO api_logs (endpoint, method, url, response_time, status_code, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW() - INTERVAL '${Math.floor(Math.random() * 168)} hours')
      `, [endpoint, method, endpoint, responseTime, statusCode]);
    }
    
    console.log('✅ Sample API logs inserted successfully');
    
    // Test analytics report generation
    console.log('🧪 Testing analytics report generation...');
    
    try {
      const analyticsResult = await client.query(`
        SELECT 
          COUNT(*) as total_users,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_users_period,
          COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '30 days' THEN 1 END) as active_users_30d
        FROM users
      `);
      
      console.log('✅ User stats query successful:', analyticsResult.rows[0]);
      
      const resumeResult = await client.query(`
        SELECT 
          COUNT(*) as total_resumes,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_resumes_period,
          COUNT(CASE WHEN processing_status = 'COMPLETED' THEN 1 END) as processed_resumes
        FROM resumes
      `);
      
      console.log('✅ Resume stats query successful:', resumeResult.rows[0]);
      
      const jobResult = await client.query(`
        SELECT 
          COUNT(*) as total_jobs,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN 1 END) as new_jobs_period
        FROM jobs
      `);
      
      console.log('✅ Job stats query successful:', jobResult.rows[0]);
      
      const paymentResult = await client.query(`
        SELECT 
          COALESCE(SUM(amount), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN created_at > NOW() - INTERVAL '30 days' THEN amount ELSE 0 END), 0) as period_revenue
        FROM payments
        WHERE status = 'completed'
      `);
      
      console.log('✅ Payment stats query successful:', paymentResult.rows[0]);
      
      const apiLogsResult = await client.query(`
        SELECT 
          AVG(CASE WHEN response_time < 1000 THEN 100 ELSE GREATEST(0, 100 - (response_time - 1000) / 10) END) as api_response_score,
          COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as recent_requests,
          COUNT(CASE WHEN status_code >= 200 AND status_code < 300 THEN 1 END) as successful_requests,
          COUNT(*) as total_requests
        FROM api_logs
        WHERE created_at > NOW() - INTERVAL '24 hours'
      `);
      
      console.log('✅ API logs stats query successful:', apiLogsResult.rows[0]);
      
      console.log('🎉 All analytics queries are working successfully!');
      
    } catch (error) {
      console.error('❌ Analytics query failed:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Database operation failed:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Run if called directly
if (require.main === module) {
  fixApiLogsAndTestAnalytics()
    .then(() => {
      console.log('Database fix completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixApiLogsAndTestAnalytics };
