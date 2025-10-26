// Test script to verify frontend-backend connection
const http = require('http');

async function testBackendConnection() {
  console.log('🔍 Testing Backend Connection...\n');
  
  const backendUrl = 'http://localhost:5000';
  const endpoints = [
    '/api/health',
    '/api/dashboard/overview',
    '/api/users',
    '/api/resumes',
    '/api/jobs',
    '/api/skills/analytics',
    '/api/system/health'
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint}...`);
      
      const response = await fetch(`${backendUrl}${endpoint}`);
      const data = await response.json();
      
      if (response.ok) {
        console.log(`✅ ${endpoint} - Status: ${response.status}`);
        results.push({ endpoint, status: 'SUCCESS', statusCode: response.status });
      } else {
        console.log(`❌ ${endpoint} - Status: ${response.status}`);
        results.push({ endpoint, status: 'ERROR', statusCode: response.status });
      }
    } catch (error) {
      console.log(`❌ ${endpoint} - Error: ${error.message}`);
      results.push({ endpoint, status: 'ERROR', error: error.message });
    }
  }
  
  console.log('\n📊 Connection Test Results:');
  console.log('==========================');
  
  const successful = results.filter(r => r.status === 'SUCCESS').length;
  const failed = results.filter(r => r.status === 'ERROR').length;
  
  results.forEach(result => {
    const status = result.status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${status} ${result.endpoint} (${result.statusCode || 'ERROR'})`);
  });
  
  console.log(`\n🎯 Total: ${successful} successful, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 Backend is fully functional and ready for frontend connection!');
    console.log('\n🚀 Next steps:');
    console.log('1. Start the frontend: npm run dev');
    console.log('2. Visit http://localhost:3001 to see the connected frontend');
    console.log('3. Test the API connection at http://localhost:3001/api-test');
  } else {
    console.log('\n⚠️ Some backend endpoints are not working. Please check the backend server.');
  }
  
  return { successful, failed, results };
}

// Run the test
testBackendConnection()
  .then(({ successful, failed }) => {
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

