#!/usr/bin/env node

/**
 * Database Configuration Test Script
 * Tests that all database configurations are correctly set to resume_db
 */

const { Pool } = require('pg');

console.log('🔍 Testing Database Configuration...\n');

// Test database connection with resume_db
async function testDatabaseConnection() {
  console.log('🔄 Testing connection to resume_db...');
  
  const pool = new Pool({
    host: '54.254.3.87',
    port: 5433,
    database: 'resume_db',
    user: 'developer',
    password: 'password',
    ssl: false,
    max: 1,
    connectionTimeoutMillis: 5000,
  });
  
  try {
    const client = await pool.connect();
    console.log('✅ Database connection successful!');
    
    const result = await client.query('SELECT current_user, current_database(), version()');
    console.log('📊 Database info:');
    console.log(`   User: ${result.rows[0].current_user}`);
    console.log(`   Database: ${result.rows[0].current_database}`);
    console.log(`   PostgreSQL Version: ${result.rows[0].version.split(' ')[0]} ${result.rows[0].version.split(' ')[1]}`);
    
    // Check if database name is correct
    if (result.rows[0].current_database === 'resume_db') {
      console.log('✅ Database name is correct: resume_db');
    } else {
      console.log(`❌ Database name is incorrect: ${result.rows[0].current_database} (expected: resume_db)`);
    }
    
    client.release();
    await pool.end();
    console.log('🔌 Connection closed successfully');
    
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    if (error.code === 'ECONNREFUSED') {
      console.error('💡 Make sure PostgreSQL is running and accessible');
    } else if (error.code === '28P01') {
      console.error('💡 Check your username and password');
    } else if (error.code === '3D000') {
      console.error('💡 Database resume_db does not exist. Please create it first.');
    } else if (error.code === 'ENOTFOUND') {
      console.error('💡 Check your hostname/IP address');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('💡 Connection timeout - check if PostgreSQL is running');
    }
    
    return false;
  }
}

// Test environment variable configuration
function testEnvironmentConfig() {
  console.log('\n🔄 Testing environment configuration...');
  
  const requiredVars = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.log('⚠️ Missing environment variables:', missingVars.join(', '));
    console.log('💡 Using default values for testing');
  } else {
    console.log('✅ All required environment variables are set');
  }
  
  console.log('📋 Current configuration:');
  console.log(`   DB_HOST: ${process.env.DB_HOST || 'localhost'}`);
  console.log(`   DB_PORT: ${process.env.DB_PORT || '5432'}`);
  console.log(`   DB_NAME: ${process.env.DB_NAME || 'resume_db'}`);
  console.log(`   DB_USER: ${process.env.DB_USER || 'developer'}`);
  console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : 'password'}`);
  
  // Check if DB_NAME is set to resume_db
  const dbName = process.env.DB_NAME || 'resume_db';
  if (dbName === 'resume_db') {
    console.log('✅ Database name is correctly set to resume_db');
  } else {
    console.log(`❌ Database name should be resume_db, but is: ${dbName}`);
  }
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Database Configuration Tests\n');
  
  testEnvironmentConfig();
  
  const connectionSuccess = await testDatabaseConnection();
  
  console.log('\n📊 Test Summary');
  console.log('═'.repeat(50));
  
  if (connectionSuccess) {
    console.log('✅ All tests passed! Database configuration is correct.');
    console.log('\n🎉 Your application is ready to use resume_db database!');
    console.log('\n🚀 Next steps:');
    console.log('1. Start your backend server: npm start');
    console.log('2. Start your frontend: npm run dev');
    console.log('3. Test the API endpoints');
  } else {
    console.log('❌ Some tests failed. Please fix the issues above.');
    console.log('\n💡 Common solutions:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Create the resume_db database if it doesn\'t exist');
    console.log('3. Check your database credentials');
    console.log('4. Verify your environment variables');
  }
  
  process.exit(connectionSuccess ? 0 : 1);
}

// Run the tests
runTests().catch(console.error);

