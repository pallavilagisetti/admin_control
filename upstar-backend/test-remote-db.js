#!/usr/bin/env node

/**
 * Database Connection Test Script
 * Tests the actual database connection with the configured IP address
 */

require('dotenv').config({ path: './env.local' });
const { Pool } = require('pg');

console.log('🔍 Testing Database Connection with Remote IP...\n');

// Display current configuration
console.log('📋 Current Database Configuration:');
console.log(`   Host: ${process.env.DB_HOST}`);
console.log(`   Port: ${process.env.DB_PORT}`);
console.log(`   Database: ${process.env.DB_NAME}`);
console.log(`   User: ${process.env.DB_USER}`);
console.log(`   Password: ${process.env.DB_PASSWORD ? '***' : 'Not set'}`);
console.log(`   SSL: ${process.env.DB_SSL}`);
console.log('');

// Test database connection
async function testDatabaseConnection() {
  console.log('🔄 Testing connection to remote database...');
  
  const pool = new Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    max: 1,
    connectionTimeoutMillis: 10000,
  });
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT current_user, current_database(), version(), inet_server_addr(), inet_server_port()');
    console.log('📊 Database info:');
    console.log(`   User: ${result.rows[0].current_user}`);
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   PostgreSQL Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    console.log(`   Server IP: ${result.rows[0].inet_server_addr}`);
    console.log(`   Server Port: ${result.rows[0].inet_server_port}`);
    
    // Verify we're connected to the right database
    if (result.rows[0].current_database === 'resume_db') {
      console.log('✅ Connected to correct database: resume_db');
    } else {
      console.log(`❌ Wrong database: ${result.rows[0].current_database} (expected: resume_db)`);
    }
    
    // Verify we're connected to the right server
    if (result.rows[0].inet_server_addr === process.env.DB_HOST) {
      console.log(`✅ Connected to correct server: ${process.env.DB_HOST}`);
    } else {
      console.log(`❌ Wrong server: ${result.rows[0].inet_server_addr} (expected: ${process.env.DB_HOST})`);
    }
    
    client.release();
    await pool.end();
    console.log('🔌 Connection closed successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error(`   Detail: ${error.detail || 'N/A'}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused - check if PostgreSQL is running on the remote server');
    } else if (error.code === '28P01') {
      console.error('💡 Authentication failed - check username and password');
    } else if (error.code === '3D000') {
      console.error('💡 Database does not exist - check database name');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Hostname not found - check IP address');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('💡 Connection timeout - check network connectivity');
    } else if (error.code === 'EHOSTUNREACH') {
      console.error('💡 Host unreachable - check IP address and network');
    }
    
    return false;
  }
}

// Test environment variable loading
function testEnvironmentLoading() {
  console.log('🔄 Testing environment variable loading...');
  
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('❌ Missing environment variables:', missingVars.join(', '));
    return false;
  } else {
    console.log('✅ All required environment variables loaded');
    return true;
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Database Connection Tests\n');
  
  const envTest = testEnvironmentLoading();
  
  if (!envTest) {
    console.log('\n❌ Environment test failed. Please check your env.local file.');
    process.exit(1);
  }
  
  const connectionSuccess = await testDatabaseConnection();
  
  console.log('\n📊 Test Summary');
  console.log('═'.repeat(50));
  
  if (connectionSuccess) {
    console.log('✅ All tests passed! Database connection is working correctly.');
    console.log('\n🎉 Your application should now connect to the remote database!');
    console.log('\n🚀 Next steps:');
    console.log('1. Start your backend server: npm start');
    console.log('2. Test the API endpoints');
    console.log('3. Verify data operations work correctly');
  } else {
    console.log('❌ Database connection test failed.');
    console.log('\n💡 Troubleshooting:');
    console.log('1. Verify the IP address is correct: 54.254.3.87');
    console.log('2. Check if PostgreSQL is running on port 5433');
    console.log('3. Ensure firewall allows connections on port 5433');
    console.log('4. Verify database credentials are correct');
    console.log('5. Test network connectivity: ping 54.254.3.87');
  }
  
  process.exit(connectionSuccess ? 0 : 1);
}

// Run the tests
runTests().catch(console.error);

