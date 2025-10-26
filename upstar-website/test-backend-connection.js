#!/usr/bin/env node

/**
 * Backend Connection Test Script
 * Tests the connection to the backend server and reports generation endpoint
 */

const https = require('https');
const http = require('http');

const BACKEND_URLS = [
  'http://localhost:5000',
  'http://localhost:3000',
  'http://localhost:3001'
];

async function testConnection(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    console.log(`🔍 Testing connection to ${url}...`);
    
    const req = client.get(`${url}/api/health`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            url,
            status: 'success',
            statusCode: res.statusCode,
            response: response
          });
        } catch (error) {
          resolve({
            url,
            status: 'error',
            statusCode: res.statusCode,
            error: 'Invalid JSON response',
            data: data
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        status: 'error',
        error: error.message
      });
    });
    
    req.setTimeout(5000, () => {
      req.destroy();
      resolve({
        url,
        status: 'timeout',
        error: 'Connection timeout after 5 seconds'
      });
    });
  });
}

async function testAnalyticsReport(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    
    console.log(`📊 Testing analytics report endpoint at ${url}...`);
    
    const req = client.get(`${url}/api/dashboard/analytics-report`, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            url,
            status: 'success',
            statusCode: res.statusCode,
            hasReport: !!response.report,
            reportKeys: response.report ? Object.keys(response.report) : []
          });
        } catch (error) {
          resolve({
            url,
            status: 'error',
            statusCode: res.statusCode,
            error: 'Invalid JSON response',
            data: data.substring(0, 200) + '...'
          });
        }
      });
    });
    
    req.on('error', (error) => {
      resolve({
        url,
        status: 'error',
        error: error.message
      });
    });
    
    req.setTimeout(10000, () => {
      req.destroy();
      resolve({
        url,
        status: 'timeout',
        error: 'Request timeout after 10 seconds'
      });
    });
  });
}

async function runTests() {
  console.log('🚀 Starting Backend Connection Tests\n');
  
  const results = [];
  
  for (const url of BACKEND_URLS) {
    console.log(`\n📍 Testing ${url}`);
    console.log('─'.repeat(50));
    
    // Test basic health endpoint
    const healthResult = await testConnection(url);
    results.push({ ...healthResult, test: 'health' });
    
    if (healthResult.status === 'success') {
      console.log(`✅ Health check passed (${healthResult.statusCode})`);
      
      // Test analytics report endpoint
      const reportResult = await testAnalyticsReport(url);
      results.push({ ...reportResult, test: 'analytics-report' });
      
      if (reportResult.status === 'success') {
        console.log(`✅ Analytics report endpoint working`);
        console.log(`📋 Report contains: ${reportResult.reportKeys.join(', ')}`);
      } else {
        console.log(`❌ Analytics report failed: ${reportResult.error}`);
      }
    } else {
      console.log(`❌ Health check failed: ${healthResult.error}`);
    }
  }
  
  console.log('\n📊 Test Summary');
  console.log('═'.repeat(50));
  
  const workingUrls = results.filter(r => r.status === 'success' && r.test === 'health');
  
  if (workingUrls.length > 0) {
    console.log('✅ Working backend URLs:');
    workingUrls.forEach(result => {
      console.log(`   ${result.url} (Status: ${result.statusCode})`);
    });
    
    const reportWorking = results.filter(r => r.status === 'success' && r.test === 'analytics-report');
    if (reportWorking.length > 0) {
      console.log('\n✅ Analytics report endpoint working on:');
      reportWorking.forEach(result => {
        console.log(`   ${result.url}`);
      });
    }
  } else {
    console.log('❌ No working backend URLs found');
    console.log('\n💡 Troubleshooting tips:');
    console.log('   1. Make sure the backend server is running');
    console.log('   2. Check if the backend is running on a different port');
    console.log('   3. Verify the backend server is accessible');
    console.log('   4. Check for firewall or network issues');
  }
  
  console.log('\n🔧 Frontend Configuration:');
  console.log(`   Update NEXT_PUBLIC_API_URL in your .env.local file to:`);
  if (workingUrls.length > 0) {
    console.log(`   NEXT_PUBLIC_API_URL=${workingUrls[0].url}`);
  } else {
    console.log(`   NEXT_PUBLIC_API_URL=http://localhost:5000`);
  }
}

// Run the tests
runTests().catch(console.error);
