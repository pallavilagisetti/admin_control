#!/usr/bin/env node

/**
 * Environment Configuration Test Script
 * Tests that all required environment variables are properly configured
 */

require('dotenv').config({ path: './env.local' });

console.log('🔍 Testing Environment Configuration...\n');

// Required environment variables
const requiredVars = [
  'DB_HOST',
  'DB_PORT', 
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'SESSION_SECRET'
];

// Optional but important variables
const optionalVars = [
  'NODE_ENV',
  'PORT',
  'CORS_ORIGIN',
  'FRONTEND_URL',
  'REDIS_HOST',
  'AWS_ACCESS_KEY_ID',
  'OPENAI_API_KEY'
];

function testEnvironmentVariables() {
  console.log('🔄 Testing environment variables...');
  
  let allRequired = true;
  let missingVars = [];
  
  // Check required variables
  console.log('\n📋 Required Variables:');
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value && value !== 'your_' + varName.toLowerCase() + '_change_this') {
      console.log(`✅ ${varName}: ${varName.includes('PASSWORD') || varName.includes('SECRET') ? '***' : value}`);
    } else {
      console.log(`❌ ${varName}: ${value ? 'Default value (needs to be changed)' : 'Missing'}`);
      allRequired = false;
      missingVars.push(varName);
    }
  });
  
  // Check optional variables
  console.log('\n📋 Optional Variables:');
  optionalVars.forEach(varName => {
    const value = process.env[varName];
    if (value && value !== 'your-' + varName.toLowerCase().replace(/_/g, '-')) {
      console.log(`✅ ${varName}: ${varName.includes('KEY') || varName.includes('SECRET') ? '***' : value}`);
    } else {
      console.log(`⚠️  ${varName}: ${value ? 'Default value' : 'Not set'}`);
    }
  });
  
  return { allRequired, missingVars };
}

function testDatabaseConfiguration() {
  console.log('\n🔄 Testing database configuration...');
  
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || '5432',
    database: process.env.DB_NAME || 'resume_db',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password'
  };
  
  console.log('📊 Database Configuration:');
  console.log(`   Host: ${dbConfig.host}`);
  console.log(`   Port: ${dbConfig.port}`);
  console.log(`   Database: ${dbConfig.database}`);
  console.log(`   User: ${dbConfig.user}`);
  console.log(`   Password: ${dbConfig.password ? '***' : 'Not set'}`);
  
  // Check if database name is correct
  if (dbConfig.database === 'resume_db') {
    console.log('✅ Database name is correct: resume_db');
  } else {
    console.log(`❌ Database name should be 'resume_db', but is: ${dbConfig.database}`);
  }
  
  return dbConfig.database === 'resume_db';
}

function testSecurityConfiguration() {
  console.log('\n🔄 Testing security configuration...');
  
  const jwtSecret = process.env.JWT_SECRET;
  const sessionSecret = process.env.SESSION_SECRET;
  const encryptionKey = process.env.ENCRYPTION_KEY;
  
  let securityIssues = [];
  
  if (!jwtSecret || jwtSecret.includes('change_this')) {
    securityIssues.push('JWT_SECRET needs to be changed from default');
  }
  
  if (!sessionSecret || sessionSecret.includes('change_this')) {
    securityIssues.push('SESSION_SECRET needs to be changed from default');
  }
  
  if (!encryptionKey || encryptionKey.includes('change_this')) {
    securityIssues.push('ENCRYPTION_KEY needs to be changed from default');
  }
  
  if (securityIssues.length === 0) {
    console.log('✅ Security configuration looks good');
  } else {
    console.log('⚠️ Security issues found:');
    securityIssues.forEach(issue => console.log(`   - ${issue}`));
  }
  
  return securityIssues.length === 0;
}

// Main test function
async function runTests() {
  console.log('🚀 Starting Environment Configuration Tests\n');
  
  const envTest = testEnvironmentVariables();
  const dbTest = testDatabaseConfiguration();
  const securityTest = testSecurityConfiguration();
  
  console.log('\n📊 Test Summary');
  console.log('═'.repeat(50));
  
  const allTestsPassed = envTest.allRequired && dbTest && securityTest;
  
  if (allTestsPassed) {
    console.log('✅ All environment tests passed!');
    console.log('\n🎉 Your environment is properly configured!');
    console.log('\n🚀 Next steps:');
    console.log('1. Start your backend server: npm start');
    console.log('2. Test the API endpoints');
    console.log('3. Connect your frontend');
  } else {
    console.log('❌ Some environment tests failed.');
    
    if (!envTest.allRequired) {
      console.log('\n🔧 Missing required variables:');
      envTest.missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
      });
    }
    
    if (!dbTest) {
      console.log('\n🔧 Database configuration issues found');
    }
    
    if (!securityTest) {
      console.log('\n🔧 Security configuration needs attention');
    }
    
    console.log('\n💡 Solutions:');
    console.log('1. Edit env.local file and update the missing/changed values');
    console.log('2. Make sure all secrets are changed from default values');
    console.log('3. Verify database name is set to "resume_db"');
    console.log('4. Check that all required services are running');
  }
  
  process.exit(allTestsPassed ? 0 : 1);
}

// Run the tests
runTests().catch(console.error);
