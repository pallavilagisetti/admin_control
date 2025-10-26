const { Pool } = require('pg');

// Test with connection string
const connectionString = 'postgresql://developer:localpass@localhost:5432/resume_db';

console.log('🔍 Testing with connection string:');
console.log(`   Connection string: ${connectionString.replace('localpass', '***')}`);
console.log('');

async function testConnectionString() {
  const pool = new Pool({
    connectionString: connectionString,
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    console.log('🔄 Testing database connection...');
    
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version, current_user, current_database()');
    console.log('📊 Database info:');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].postgres_version}`);
    console.log(`   Current user: ${result.rows[0].current_user}`);
    console.log(`   Current database: ${result.rows[0].current_database}`);
    
    client.release();
    await pool.end();
    console.log('🔌 Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error(`   Detail: ${error.detail || 'N/A'}`);
    console.error(`   Hint: ${error.hint || 'N/A'}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure PostgreSQL is running and accessible');
    } else if (error.code === '28P01') {
      console.error('💡 Check your username and password');
    } else if (error.code === '3D000') {
      console.error('💡 Check your database name');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Check your hostname/IP address');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('💡 Connection timeout - check if PostgreSQL is running');
    }
    
    process.exit(1);
  }
}

testConnectionString();








