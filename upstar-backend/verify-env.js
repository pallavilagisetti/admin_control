#!/usr/bin/env node

/**
 * Environment Variable Verification Script
 * Verifies that env.local is being loaded correctly
 */

console.log('🔍 Verifying Environment Variable Loading...\n');

// Test 1: Load without dotenv
console.log('📋 Environment variables WITHOUT dotenv:');
console.log(`   DB_HOST: ${process.env.DB_HOST || 'undefined'}`);
console.log(`   DB_PORT: ${process.env.DB_PORT || 'undefined'}`);
console.log(`   DB_NAME: ${process.env.DB_NAME || 'undefined'}`);
console.log('');

// Test 2: Load with dotenv
console.log('📋 Loading env.local with dotenv...');
require('dotenv').config({ path: './env.local' });

console.log('📋 Environment variables WITH dotenv:');
console.log(`   DB_HOST: ${process.env.DB_HOST || 'undefined'}`);
console.log(`   DB_PORT: ${process.env.DB_PORT || 'undefined'}`);
console.log(`   DB_NAME: ${process.env.DB_NAME || 'undefined'}`);
console.log(`   DB_USER: ${process.env.DB_USER || 'undefined'}`);
console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***' : 'undefined'}`);
console.log('');

// Test 3: Verify the values
console.log('🔄 Verifying configuration...');
const expectedHost = '54.254.3.87';
const expectedPort = '5433';
const expectedDb = 'resume_db';

if (process.env.DB_HOST === expectedHost) {
  console.log(`✅ DB_HOST is correct: ${process.env.DB_HOST}`);
} else {
  console.log(`❌ DB_HOST is wrong: ${process.env.DB_HOST} (expected: ${expectedHost})`);
}

if (process.env.DB_PORT === expectedPort) {
  console.log(`✅ DB_PORT is correct: ${process.env.DB_PORT}`);
} else {
  console.log(`❌ DB_PORT is wrong: ${process.env.DB_PORT} (expected: ${expectedPort})`);
}

if (process.env.DB_NAME === expectedDb) {
  console.log(`✅ DB_NAME is correct: ${process.env.DB_NAME}`);
} else {
  console.log(`❌ DB_NAME is wrong: ${process.env.DB_NAME} (expected: ${expectedDb})`);
}

console.log('\n📊 Summary:');
console.log('If all values show as correct above, your environment is properly configured.');
console.log('If any values show as wrong or undefined, check your env.local file.');
