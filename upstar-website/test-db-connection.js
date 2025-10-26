const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Database configuration
const config = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'resume_db',
  user: process.env.DB_USER || 'developer',
  password: process.env.DB_PASSWORD || 'localpass',
  ssl: process.env.DB_SSL === 'true' ? true : false,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,
};

console.log('🔍 Configuration being used:');
console.log(`   Host: ${config.host}`);
console.log(`   Port: ${config.port}`);
console.log(`   Database: ${config.database}`);
console.log(`   User: ${config.user}`);
console.log(`   SSL: ${config.ssl}`);
console.log('');

async function testConnection() {
  const pool = new Pool(config);
  
  try {
    console.log('🔄 Testing database connection...');
    console.log(`📡 Connecting to: ${config.host}:${config.port}/${config.database}`);
    
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version, current_user, current_database()');
    console.log('📊 Database info:');
    console.log(`   Current time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL version: ${result.rows[0].postgres_version}`);
    console.log(`   Current user: ${result.rows[0].current_user}`);
    console.log(`   Current database: ${result.rows[0].current_database}`);
    
    // Test pool stats
    console.log('📈 Connection pool stats:');
    console.log(`   Total connections: ${pool.totalCount}`);
    console.log(`   Idle connections: ${pool.idleCount}`);
    console.log(`   Waiting connections: ${pool.waitingCount}`);
    
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
      console.error('💡 Check your database name - the database might not exist');
      console.error('💡 Try connecting to "postgres" database first to create your database');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Check your hostname/IP address');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('💡 Connection timeout - check if PostgreSQL is running');
    }
    
    // Try connecting to default 'postgres' database
    console.log('\n🔄 Trying to connect to default "postgres" database...');
    try {
      const defaultConfig = { ...config, database: 'postgres' };
      const defaultPool = new Pool(defaultConfig);
      const defaultClient = await defaultPool.connect();
      console.log('✅ Successfully connected to "postgres" database');
      
      // Check if our target database exists
      const dbCheck = await defaultClient.query(
        "SELECT 1 FROM pg_database WHERE datname = $1", 
        [config.database]
      );
      
      if (dbCheck.rows.length === 0) {
        console.log(`💡 Database "${config.database}" does not exist. Creating it...`);
        await defaultClient.query(`CREATE DATABASE "${config.database}"`);
        console.log(`✅ Database "${config.database}" created successfully!`);
      } else {
        console.log(`✅ Database "${config.database}" exists`);
      }
      
      defaultClient.release();
      await defaultPool.end();
    } catch (defaultError) {
      console.error('❌ Even default "postgres" database connection failed:');
      console.error(`   Error: ${defaultError.message}`);
      console.error(`   Code: ${defaultError.code || 'N/A'}`);
    }
    
    process.exit(1);
  }
}

testConnection();
